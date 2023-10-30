import { Hono } from "hono";
import { Database } from "better-sqlite3";

type Variables = {
    user: {
        user_id: string;
    }
    database: Database;
};

export const user_score = new Hono<{ Variables: Variables }>();

user_score.get("/get-user-score/:recipe_id", async (c) => {
    const db = c.var.database;
    const recipe_id = c.req.param("recipe_id");
    const { user_id } = c.var.user; //get user_id from cookieAuth
    try {
        const score = db
            .prepare(
                `SELECT score FROM Score WHERE user_id = ? AND recipe_id = ?`
            )
            .get(user_id, recipe_id) || { score: null };
        return c.json(score, 200);
    } catch (error) {
        return c.json({ error }, 500);
    }
});