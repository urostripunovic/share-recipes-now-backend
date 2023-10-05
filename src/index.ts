import dotenv from "dotenv";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { handle } from "@hono/node-server/vercel";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { jwt, sign, verify } from "hono/jwt";
import { cors } from "hono/cors";

type Variables = {
    user: {
        user_id: number;
        user_name: string;
    };
};

const app = new Hono<{ Variables: Variables }>();

dotenv.config();

app.use(cors());

app.use(
    "/api/*",
    jwt({
        secret: process.env.SECRET,
    })
);

app.get("/api/page", (c) => {
    const payload = c.get("jwtPayload");
    return c.json(payload); // eg: { "sub": "1234567890", "name": "John Doe", "iat": 1516239022 }
});

//app.use("/test/*", cookieAuth); //Whole route middleware

app.post("/test", async (c) => {
    const exp = (new Date().getTime() + 1) / 1000; //increase the amount of seconds, x*60 minutes, x*60*60 hours, x*24*60*60 days
    const iat = new Date().getTime() / 1000; //issued at time

    const token = await sign(
        { user_id: 1, user_name: "para knas", iat: iat, exp: exp },
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

async function cookieAuth(c, next) {
    const token = getCookie(c, "token");
    if (!token) return c.json({ message: "No token found" }, 404);

    try {
        const json = await verify(token, process.env.SECRET);
        c.set("user", json);
        await next();
    } catch (error) {
        deleteCookie(c, "token");
        return c.json({ error: error.message }, 403);
    }
}
