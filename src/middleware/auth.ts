import { MiddlewareHandler } from "hono";
import { getCookie, deleteCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";

export function cookieAuth(): MiddlewareHandler {
    return async (c, next) => {
        const accessToken = getCookie(c, "accessToken");
        if (!accessToken)
            throw new HTTPException(401, { message: "No token found" });

        try {
            const user = await verify(
                accessToken,
                process.env.ACCESS_TOKEN_SECRET!
            );
            c.set("user", user);
            await next();
        } catch (error) {
            deleteCookie(c, "accessToken");
            const { name } = error; //expired
            if (name === "JwtTokenExpired")
                throw new HTTPException(401, {
                    message: "Access token has expired",
                });

            throw new HTTPException(403, { message: "Invalid token" });
        }
    };
}