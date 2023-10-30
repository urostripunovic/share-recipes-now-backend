import { Hono } from "hono";
import { Database } from "better-sqlite3";
import { deleteCookie, getCookie } from "hono/cookie";

type Variables = {
    database: Database;
};

interface Session {
    refresh_token: string;
}

export const logout = new Hono<{ Variables: Variables }>();

logout.get("/logout", (c) => {
    const db = c.var.database;
    //delete refresh token and access tokens
    deleteCookie(c, "accessToken");
    const token = getCookie(c, "refreshToken");
    if (!token) return c.body(null, 204);
    
    //is refresh token in database?
    try {
        const sessionInfo = db
            .prepare(
                "SELECT refresh_token FROM Session WHERE refresh_token = ?"
            )
            .get(token) as Session;
            
        //If there is no token in the db then just delete it from the browser
        if (!sessionInfo?.refresh_token) {
            deleteCookie(c, "refreshToken");
            return c.body(null, 204);
        }

        //if there is a token in the db then delete the one the browser provided
        db.prepare("DELETE FROM Session WHERE refresh_token = ?").run(token);
        deleteCookie(c, "refreshToken");
        return c.body(null, 204);
    } catch (error) {
        return c.json({ error: error.message });
    }
});
