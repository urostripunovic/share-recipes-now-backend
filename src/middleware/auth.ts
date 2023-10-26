import { Context, Next } from "hono";
import { getCookie, deleteCookie } from "hono/cookie";
import { verify } from "hono/jwt";

export async function cookieAuth(c: Context, next: Next) {
    const refresh_token = getCookie(c, "__session");
    if (!refresh_token) return c.json({ message: "No token found" }, 404);
    
    const access_token = ""; //hämta från databasen
    try {
        const user = await verify(refresh_token, process.env.SECRET!);
        c.set("user", user);
        await next();
    } catch (error) {
        deleteCookie(c, "__session");
        return c.json({ error: error.message }, 403);
    }
}