import { Next } from "hono";

export async function rateLimit(next: Next) {
    console.log("hej funkar detta")
    await next();
}