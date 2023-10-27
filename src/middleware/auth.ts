import { Context, Next } from "hono";
import { getCookie, deleteCookie } from "hono/cookie";
import { verify } from "hono/jwt";

export async function cookieAuth(c: Context, next: Next) {
    const accessToken = getCookie(c, "accessToken");
    if (!accessToken) return c.json({ message: "No token found" }, 404);

    try {
        const user = await verify(accessToken, process.env.ACCESS_TOKEN_SECRET!);
        c.set("user", user);
        await next();
    } catch (error) {
        deleteCookie(c, "accessToken");
        return c.json({ error: error.message }, 403);
    }
}