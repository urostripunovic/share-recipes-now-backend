import dotenv from "dotenv";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { handle } from "@hono/node-server/vercel";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { jwt, decode, sign, verify } from "hono/jwt";
import { cors } from "hono/cors";

const app = new Hono();

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

app.post("/test", async (c) => {
    const token = await sign({ user_name: "para knas" }, process.env.SECRET);

    setCookie(c, "token", token, {
        httpOnly: true,
        maxAge: 1000, 
    });

    return c.json({ msg: "user logged in", token }, 200);
});

app.get("/test", async (c) => {
    const token = getCookie(c, "token");

    if (!token) return c.json({ msg: "unauthorized" }, 401);

    const { user_name } = await verify(token, process.env.SECRET);

    return c.json({ user_name }, 200);
});

const port = parseInt(process.env.PORT!) || 3000;
serve({
    fetch: app.fetch,
    port: parseInt(process.env.PORT!) || 3000,
});
console.log(`Running at http://localhost:${port}`);

export default app;
