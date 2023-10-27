import dotenv from "dotenv";
import path from "path";
import Database, { Database as db } from "better-sqlite3";
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { serve } from "@hono/node-server";
import { handle } from "@hono/node-server/vercel";
import { setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { cors } from "hono/cors";
import { cookieAuth } from "./middleware/auth";
import { expiresIn, processImage } from "./utils/utils";
import { nonAuth, action, userAction } from "./routes/Routes";

import { html, raw } from "hono/html";

dotenv.config();

const db = new Database(path.resolve("test.db") /*{ verbose: console.log }*/);
db.pragma("journal_mode = WAL");

console.log(db.prepare(`SELECT * FROM Session`).all().length);
//console.log(db.prepare(`DELETE FROM Session WHERE user_id=?`).run(5));

type Variables = {
    database: db;
    user: {
        user_id: number;
        user_name: string;
    };
};

const app = new Hono<{ Variables: Variables }>();
app.use(
    "*",
    cors({
        //SITE is the frontend website and localhost is the vite dev server
        origin: process.env.SITE! || "http://localhost:5173",
        credentials: true,
    })
);

app.use(
    "*",
    secureHeaders({
        xXssProtection: false,
    })
);

//datbase can be used across the server application
app.use("*", async (c, next) => {
    c.set("database", db);
    await next();
});

app.post("/test", async (c) => {
    const token = await sign(
        { user_id: 1, user_name: "para knas", ...expiresIn("1min") }, //no point in catch since i'll be using try-catch
        process.env.ACCESS_TOKEN_SECRET!
    );
    setCookie(c, "__session", token, {
        httpOnly: true,
        secure: true,
        path: "/",
    });

    return c.json({ msg: "User logged in", token }, 200);
});

app.get("/test", cookieAuth, async (c) => {
    try {
        const user = c.var.user;
        return c.json(user, 200);
    } catch (error) {
        return c.json({ error: "Internal Server Error" }, 500);
    }
});

interface ProfileImage {
    profile_image: ArrayBuffer;
}

app.get("/render-test", async (c) => {
    const { profile_image } = db
        .prepare("SELECT profile_image FROM User WHERE user_name = ?")
        .get("test_user_5") as ProfileImage;
    const dataURI = await processImage(profile_image);
    return c.html(
        html` <h1>Hello! ${"username"}!</h1>
            <img src="${dataURI}" alt="Randy's balls" />`
    );
});

//user action routes
app.route("/", action);
//no auth needed make one head route for the ones that don't need a auth, non user centric route
app.route("/", nonAuth);

//auth needed make a route for all the auth ones, user centric route
//Update recipe
//Create recipe
//Create user information end point
app.use("/api/*", cookieAuth);
app.route("/api", userAction); //Lägg till middleware här när det är done

const port = parseInt(process.env.PORT!) || 3000;
serve({
    fetch: app.fetch,
    port: port,
});
console.log(`Running at http://localhost:${port}`);

export default handle(app);
