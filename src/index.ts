import { serve } from "@hono/node-server";
import { handle } from "@hono/node-server/vercel";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { jwt } from "hono/jwt";
import { cors } from "hono/cors";

const app = new Hono();

app.use(cors());

app.get("/", (c) => {
    return new Response("Good morning!");
});

const token = "honoiscool";
app.use("/api/*", bearerAuth({ token })); //Denna kräver att hela route behöver en bearer token for att komma åt den

app.get("/api/page", (c) => {
    return c.json({ message: "Read posts" });
}); //Bearer honoiscool

app.post("/api/page", bearerAuth({ token }), (c) => {
    return c.json({ message: "Created post!" }, 201);
});

app.use(
    "/auth/*",
    jwt({
        secret: "test",
    })
);

app.get("/auth/page", (c) => {
    const payload = c.get("jwtPayload");
    return c.json(payload); // eg: { "sub": "1234567890", "name": "John Doe", "iat": 1516239022 }
});

serve({
    fetch: app.fetch,
    port: process.env.PORT || 3000,
});

export default app;
