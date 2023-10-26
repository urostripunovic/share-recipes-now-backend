import dotenv from "dotenv";
import path from "path";
import Database, { Database as db } from "better-sqlite3";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { handle } from "@hono/node-server/vercel";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { cors } from "hono/cors";
import { cookieAuth } from "./middleware/auth";

import { expiresIn } from "./utils/utils";
import { ready_recipes } from "./routes/Ready Recipes";
import { recipe } from "./routes/Recipe";
import { search } from "./routes/Search";
import { comment } from "./routes/Comment";
import { rate_recipe } from "./routes/Rate Recipe";
import { user_score } from "./routes/User Score";
import { save_recipe } from "./routes/Save Recipe";
import { register } from "./routes/Register";
import { login } from "./routes/Login";

dotenv.config();

const db = new Database(path.resolve("test.db") /*{ verbose: console.log }*/);
db.pragma("journal_mode = WAL");

//console.log(db.prepare(`SELECT * FROM User`).all());

type Variables = {
    database: db;
    user: {
        user_id: number;
        user_name: string;
    };
};

const app = new Hono<{ Variables: Variables }>();
app.use(cors());

//datbase can be used across the server application
app.use("*", async (c, next) => {
    c.set("database", db);
    await next();
});

//app.use("/test/*", cookieAuth); //Whole route middleware

app.post("/test", async (c) => {
    const token = await sign(
        { user_id: 1, user_name: "para knas", ...expiresIn("1min") }, //no point in catch since i'll be using try-catch
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

//auth needed
app.route("/api", save_recipe); //middleware här också
app.route("/api", user_score); //lägg till middleware här
app.route("/api", rate_recipe); //middleware här med
app.route("/api", comment); //Lägg till middleware här när det är done

//no auth needed
app.route("/api", login);
app.route("/api", register);
app.route("/api", search);
app.route("/api", recipe);
app.route("/api", ready_recipes);

const port = parseInt(process.env.PORT!) || 3000;
serve({
    fetch: app.fetch,
    port: port,
});
console.log(`Running at http://localhost:${port}`);

export default app;
