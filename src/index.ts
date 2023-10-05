import dotenv from "dotenv";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { handle } from "@hono/node-server/vercel";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { cors } from "hono/cors";
import { cookieAuth } from "./middleware/auth";
import { expiresIn } from "./utils/jwtExpires";

type Variables = {
    user: {
        user_id: number;
        user_name: string;
    };
};

const app = new Hono<{ Variables: Variables }>();

dotenv.config();

app.use(cors());

//app.use("/test/*", cookieAuth); //Whole route middleware

app.post("/test", async (c) => {
    //const iat = Math.floor(new Date().getTime() / 1000); //issued at time
    //const exp = iat + 30 * 24 * 60 * 60; //increase the amount of seconds, x*60 minutes, x*60*60 hours, x*24*60*60 days

    const token = await sign(
        { user_id: 1, user_name: "para knas", ...expiresIn("1h") }, //no point in catch since i'll be using try-catch
        process.env.SECRET
    );
    setCookie(c, "token", token, {
        httpOnly: true,
        secure: true,
    });

    return c.json({ msg: "user logged in", token }, 200);
});

app.get("/test", cookieAuth, async (c) => {
    try {
        const { user_id, user_name } = c.get("user");
        return c.json({ user_id, user_name }, 200);
    } catch (error) {
        return c.json({ error: "Internal Server Error" }, 500);
    }
});

const port = parseInt(process.env.PORT!) || 3000;
serve({
    fetch: app.fetch,
    port: parseInt(process.env.PORT!) || 3000,
});
console.log(`Running at http://localhost:${port}`);

export default app;
