import dotenv from "dotenv";
import path from "path";
import Database, { Database as db } from "better-sqlite3";
import { Hono } from "hono";
import { secureHeaders } from 'hono/secure-headers';
import { serve } from "@hono/node-server";
import { handle } from "@hono/node-server/vercel";
import { setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { cors } from "hono/cors";
import { cookieAuth } from "./middleware/auth";
import { expiresIn, processImage } from "./utils/utils";
import {
    ready_recipes,
    recipe,
    search,
    comment,
    rate_recipe,
    user_score,
    save_recipe,
    register,
    login,
} from "./routes/Routes";

import { html, raw } from "hono/html";

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
app.use("*", secureHeaders());

//datbase can be used across the server application
app.use("*", async (c, next) => {
    c.set("database", db);
    await next();
});

//Lägg till att api key behövs för alla routes, en annan database så det blir en microservice typ
//app.use("*")

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

interface ProfileImage {
    profile_image: ArrayBuffer
}

app.get("/render-test", async (c) => {
    const { profile_image } = db.prepare("SELECT profile_image FROM User WHERE user_name = ?").get("test_user_5") as ProfileImage;
    const dataURI = await processImage(profile_image);
    return c.html(
        html` <h1>Hello! ${"username"}!</h1>
            <img src="${dataURI}" alt="Randy's balls" />`
    );
});

//auth needed make a route for all the auth ones, user centric route
//Update recipe
//Create recipe 
//Create user information end point 
app.route("/api", save_recipe); //middleware här också
app.route("/api", user_score); //lägg till middleware här
app.route("/api", rate_recipe); //middleware här med
app.route("/api", comment); //Lägg till middleware här när det är done

//user action routes
app.route("/api", login);
app.route("/api", register);

//no auth needed make one head route for the ones that don't need a auth, non user centric route
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
