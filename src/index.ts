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
import { recipes, authUserAction, userAction } from "./routes/Routes";
import fs from "node:fs";
import { html, raw } from "hono/html";

dotenv.config();

const db = new Database(path.resolve("test.db") /*{ verbose: console.log }*/);
db.pragma("journal_mode = WAL");

const someUnacceptableSize = 2 * 1024 * 1024 * 1024; // 2 gbs in bytes
setInterval(
    fs.stat.bind(null, "test.db-wal", (err, stat) => {
        if (err) {
            if (err.code !== "ENOENT") throw err;
        } else if (stat.size > someUnacceptableSize) {
            db.pragma("wal_checkpoint(RESTART)");
        }
    }),
    5000).unref();

console.log(db.prepare(`SELECT * FROM Session`).all().length);
//console.log(db.prepare(`SELECT * FROM User WHERE user_id=?`).get(8));

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
    secureHeaders()
);

//datbase can be used across the server application
app.use("*", async (c, next) => {
    c.set("database", db);
    await next();
});


interface ProfileImage {
    profile_image: ArrayBuffer;
}

app.get("/render-test", async (c) => {
    const { profile_image } = db
        .prepare("SELECT profile_image FROM User WHERE user_name = ?")
        .get("test_user_8") as ProfileImage;
    const dataURI = profile_image;
    return c.html(
        html` <h1>Hello! ${"username"}!</h1>
            <img src="${dataURI}" alt="Randy's balls" />`
    );
});

//authenticate the user
app.route("/", userAction);
//no auth needed make one head route for the ones that don't need a auth, non user centric route
app.route("/", recipes);

//app.use("/api/*", cookieAuth);
app.route("/api", authUserAction);

const port = parseInt(process.env.PORT!) || 3000;
serve({
    fetch: app.fetch,
    port: port,
});
console.log(`Running at http://localhost:${port}`);

export default handle(app);
