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
//console.log(db);
//const recipe = db.prepare(`SELECT * FROM Recipe`).all();
//console.log(recipe);

type Variables = {
    user: {
        user_id: number;
        user_name: string;
    };
};

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

//middleware här med
app.post("/api/rate-recipe/:id", async (c) => {
    const recipe_id = c.req.param("id");
    const { score } = await c.req.parseBody();
    //const { user_id } = c.var.user;
    //kolla på ngt som heter upsert
    return c.json({recipe_id, score})
})

//Lägg till middleware här när det är done
app.post("/api/comment-on-recipe/:id", async (c) => {
    const recipe_id = c.req.param("id");
    const { user_id, message, parent_id, timestamp } = await c.req.parseBody();
    //const { user_id } = c.var.user;
    const null_if = parent_id || null;

    try {
        db.prepare(
            `INSERT INTO Comments (recipe_id, user_id, message, parent_id, timestamp) VALUES (?, ?, ?, ?, ?)`
        ).run(recipe_id, user_id, message, null_if, timestamp);
        return c.json({ message: `comment has been posted to recipe: ${recipe_id}` }, 201);
    } catch (error) { return c.json({ error }) }
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

    return c.json(transactions());
});

app.get("/api/recipe/:id", async (c) => {
    //hämta all info för recept med :id
    const id = c.req.param("id");
    try {
        const recipe = db.transaction(() => {
            const recipe = getRecipe(db, id);
            const recipe_ingredients = getRecipeIngredients(db, id);
            const instructions = getInstructions(db, id);
            const comments = getComments(db, id);
            //const user_specific_score = db.prepare(`SELECT score FROM Score WHERE user_id = ? and recipe_id = ?`).get(1, id)
            return { recipe, recipe_ingredients, instructions, comments };
        });

        return c.json(recipe());
    } catch (error) {
        return c.json({ error }, 500);
    }
});

app.get("/api/fast-food", (c) => {
    try {
        const json = fastOrRatedFood(db);
        return c.json(json);
    } catch (error) {
        return c.json({ error }, 500);
    }
});

app.get("/api/top-rated-food", async (c) => {
    try {
        const json = fastOrRatedFood(db, true);
        return c.json(json);
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
