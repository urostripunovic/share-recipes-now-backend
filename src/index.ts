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

app.get("/api/recipe/:id", async (c) => {
    //hämta all info för recept med :id
    const id = c.req.param("id");
    try {
        const recipe = db.transaction(() => {
            const recipe = getRecipe(db, id);
            const recipe_ingredients = getRecipeIngredients(db, id);
            const instructions = getInstructions(db, id);
            const comments = getComments(db, id);
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
    port: parseInt(process.env.PORT!) || 3000,
});
console.log(`Running at http://localhost:${port}`);

export default app;
