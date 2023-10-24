import dotenv from "dotenv";
import path from "path";
import Database from "better-sqlite3";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { handle } from "@hono/node-server/vercel";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { cors } from "hono/cors";
import { cookieAuth } from "./middleware/auth";

import {
    expiresIn,
    fastOrRatedFood,
    getRecipe,
    getRecipeIngredients,
    getInstructions,
    getComments,
} from "./utils/utils";

dotenv.config();

const db = new Database(path.resolve("test.db") /*{ verbose: console.log }*/);
db.pragma("journal_mode = WAL");
//console.log(db);
//const recipe = db.prepare(`SELECT * FROM Recipe`).all();
//console.log(recipe);

console.log(db.prepare(`SELECT * FROM Saved WHERE user_id = 1`).all())

type Variables = {
    user: {
        user_id: number;
        user_name: string;
    };
};

interface Exist {
    user_name?: string;
    email?: string,
}

const app = new Hono<{ Variables: Variables }>();
app.use(cors());

//app.use("/test/*", cookieAuth); //Whole route middleware

app.post("/test", async (c) => {
    const token = await sign(
        { user_id: 1, user_name: "para knas", ...expiresIn("1h") }, //no point in catch since i'll be using try-catch
        process.env.SECRET!
    );
    setCookie(c, "__session", token, {
        httpOnly: true,
        secure: true,
        path: "/",
    });

    return c.json({ msg: "user logged in", token }, 200);
});

app.get("/test", cookieAuth, async (c) => {
    try {
        const { user_id, user_name } = c.var.user;
        return c.json({ user_id, user_name }, 200);
    } catch (error) {
        return c.json({ error: "Internal Server Error" }, 500);
    }
});


app.get("/api/register/exists", (c) => {
    //use like statement return true or false if username is already in use
    const { user_name, e_mail } = c.req.query();
    //console.log(username, e_mail) //"test1@email.com"
    const exists = db.prepare("SELECT user_name, email FROM User WHERE user_name = ? OR email = ?").get(user_name, e_mail) as unknown as Exist;

    const username = exists?.user_name ? true : false;
    const email = exists?.email ? true : false;

    return c.json({ username, email });
})

app.post("/api/register/", (c) => {
    //Check if user name exists this requires another api end point, done
    //Check if email is already in use this requires another api end point, done
    //Check if password is strong enough done on the frontend, regex?
    //Change image to blob
    

    return c.json({ message: `User has been created!` });
})

//middleware här också
app.get("/api/save-recipe/:recipe_id", async (c) => {
    //const { user_id } = c.var.user;
    const id = c.req.param('recipe_id');
    const user_id = 1;

    try {
        const saved = db.prepare(`SELECT id FROM Saved WHERE user_id = ? AND recipe_id = ?`).get(user_id, id) ? true : false;
        return c.json({ saved });
    } catch (error) { return c.json({ error }); }
});


//middleware här också
app.delete("/api/save-recipe/:recipe_id", async (c) => {
    //const { user_id } = c.var.user;
    const id = c.req.param('recipe_id');
    const user_id = 1;

    try {
        db.prepare(`DELETE FROM Saved WHERE user_id = ? AND recipe_id = ?`).run(user_id, id);
        return c.json({ message: `recipe_id: ${id} is removed from user_id: ${user_id}` });
    } catch (error) { return c.json({ error }); }
});

//lägg till middleware här
app.post("/api/save-recipe/:recipe_id", async (c) => {
    //const { user_id } = c.var.user;
    const id = c.req.param('recipe_id');
    const user_id = 1;

    try {
        db.prepare(`INSERT INTO Saved (user_id, recipe_id) VALUES (?, ?)`).run(user_id, id);
        return c.json({ message: `recipe_id: ${id} is saved to user_id: ${user_id}` });
    } catch (error) { return c.json({ error }); }
});

//lägg till middleware här
app.get("/api/get-user-score/:recipe_id", async (c) => {
    const recipe_id = c.req.param("recipe_id");
    //const { user_id } = c.var.user; //get user_id from cookieAuth
    try {
        const score = db
            .prepare(
                `SELECT score FROM Score WHERE user_id = ? AND recipe_id = ?`
            )
            .get(3, recipe_id) || { score: null };
        return c.json(score, 200);
    } catch (error) {
        return c.json({ error }, 500);
    }
});


//middleware här med
app.post("/api/rate-recipe/:recipe_id", async (c) => {
    const recipe_id = c.req.param("recipe_id");
    const score = Number(c.req.query("score"));
    //const { user_id } = c.var.user; //get user_id from cookieAuth
    //kolla på ngt som heter upsert
    try {
        db.prepare(
            `INSERT OR REPLACE INTO Score (user_id, recipe_id, score) VALUES (?, ?, ?)
            ON CONFLICT (user_id, recipe_id) DO UPDATE SET score=${score}
            `
        ).run(1, recipe_id, score);

        return c.json({ ok: true }, 201);
    } catch (error) {
        return c.json({ error }, 500);
    }
});

//Lägg till middleware här när det är done
app.post("/api/comment-on-recipe/:recipe_id", async (c) => {
    const recipe_id = c.req.param("recipe_id");
    const { message, parent_id, timestamp } = await c.req.parseBody();
    //const { user_id } = c.var.user;
    const user_id = 1; //remove later when cookie auth is added

    try {
        db.prepare(
            `INSERT INTO Comments (recipe_id, user_id, message, parent_id, timestamp) VALUES (?, ?, ?, NULLIF(?, ''), ?)`
        ).run(recipe_id, user_id, message, parent_id, timestamp);
        return c.json(
            { message: `comment has been posted to recipe: ${recipe_id}` },
            201
        );
    } catch (error) {
        return c.json({ error });
    }
});

app.get("/api/search-recipe", (c) => {
    //?q=pasta&search_term=recipes
    const { q, search_term } = c.req.query();
    const search = search_term === "recipes" ? "R.title" : "I.name";
    //Use SQLite LIKE for each press on the key board, the search show change depending on if it's recipe or ingredient
    const transactions = db.transaction(() => {
        try {
            const recipes = db
                .prepare(
                    `SELECT U.user_id, U.user_name, R.recipe_id, R.title, R.dish_image, R.time
                FROM Recipe R
                JOIN User U ON R.user_id = U.user_id
                JOIN RecipeIngredient RI ON R.recipe_id = RI.recipe_id
                JOIN Ingredient I ON RI.ingredient_id = I.ingredient_id
                WHERE ${search} LIKE ?
                GROUP BY R.recipe_id;`
                )
                .all(`%${q.trim()}%`);

            const results = recipes.length;
            return { recipes, results };
        } catch (error) {
            return c.json({ error }, 500);
        }
    });

    return c.json(transactions(), 200);
});

app.get("/api/recipe/:recipe_id", async (c) => {
    //hämta all info för recept med :id
    const id = c.req.param("recipe_id");
    try {
        const recipe = db.transaction(() => {
            const recipe = getRecipe(db, id);
            //spara denna tills vidare kolla i recipeUtils efter några scores finns
            const score = db
                .prepare(
                    `SELECT ROUND(AVG(score), 2) AS avg_score, COUNT(user_id) AS votes FROM Score WHERE recipe_id = ?`
                )
                .get(id);
            const recipe_ingredients = getRecipeIngredients(db, id);
            const instructions = getInstructions(db, id);
            const comments = getComments(db, id);
            return {
                recipe,
                score,
                recipe_ingredients,
                instructions,
                comments,
            };
        });

        return c.json(recipe(), 200);
    } catch (error) {
        return c.json({ error }, 500);
    }
});

app.get("/api/fast-food", (c) => {
    try {
        const json = fastOrRatedFood(db);
        return c.json(json, 200);
    } catch (error) {
        return c.json({ error }, 500);
    }
});

app.get("/api/top-rated-food", async (c) => {
    try {
        const json = fastOrRatedFood(db, true);
        return c.json(json, 200);
    } catch (error) {
        return c.json({ error }, 500);
    }
});

const port = parseInt(process.env.PORT!) || 3000;
serve({
    fetch: app.fetch,
    port: port,
});
console.log(`Running at http://localhost:${port}`);

export default app;
