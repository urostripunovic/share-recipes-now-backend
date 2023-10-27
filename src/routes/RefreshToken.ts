import { Hono } from "hono";
import { getCookie, deleteCookie, setCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { expiresIn } from "../utils/utils";
import { Database } from "better-sqlite3";

type Variables = {
    database: Database;
};

interface Session {
    user_id: number;
    refresh_token: string;
}

export const refresh = new Hono<{ Variables: Variables }>();

refresh.get("/refresh", async (c) => {
    const refreshToken = getCookie(c, "refreshToken");
    if (!refreshToken)
        return c.json({ message: "No token found, please log in again" }, 401);
    deleteCookie(c, "refreshToken");
    
    const sessionInfo = c.var.database
        .prepare(
            "SELECT user_id, refresh_token FROM Session WHERE refresh_token = ?"
        )
        .get(refreshToken) as Session;

    const userId = sessionInfo?.user_id;
    //console.log(userId, refresh_token);
    //Remove all tokens related to the hacked user_id if attempt of reuse happens
    if (!userId) {
        try {
            const { user_id } = await verify(
                sessionInfo?.refresh_token,
                process.env.REFRESH_TOKEN_SECRET!
            );
            c.var.database
                .prepare("DELETE FROM Session WHERE user_id = ?")
                .run(user_id);
        } catch (error) {
            return c.json({ error: error.message }, 403);
        }
    }

    try {
        const { user_id, user_name } = await verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET!
        );

        if (userId !== user_id)
            return c.json({ message: "No token connected to this user" }, 403);

        const accessToken = await sign(
            {
                user_id,
                user_name,
                ...expiresIn("15min"), //"15min"
            },
            process.env.ACCESS_TOKEN_SECRET!
        );

        setCookie(c, "accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 15 * 60 * 1000,
            path: "/",
        });

        const newRefreshToken = await sign(
            {
                user_id,
                user_name,
                ...expiresIn("4days"), //"15min"
            },
            process.env.REFRESH_TOKEN_SECRET!
        );

        setCookie(c, "refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 4 * 60 * 60 * 1000,
            path: "/",
        });

        const transaction = c.var.database.transaction((db) => {
            db.prepare("DELETE FROM Session WHERE refresh_token = ?").run(refreshToken);
            db.prepare("INSERT INTO Session (user_id, refresh_token) VALUES (?, ?)").run(user_id, newRefreshToken);
            return c.json({ message: "New access token and refresh token has rotated" }, 200)
        })

        return transaction(c.var.database);
    } catch (error) {
        //If the verification throws an error remove it from the database
        c.var.database.prepare("DELETE FROM Session WHERE refresh_token = ?").run(refreshToken);
        return c.json({ error: error.message }, 403);
    }
});

