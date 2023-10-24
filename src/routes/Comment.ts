import { Hono } from "hono";
import { Database } from "better-sqlite3";

type Variables = {
    database: Database;
};

export const comment = new Hono<{ Variables: Variables }>();

comment.post("/comment-on-recipe/:recipe_id", async (c) => {
    const db = c.var.database;
    const recipe_id = c.req.param("recipe_id");
    const { message, parent_id, timestamp } = await c.req.parseBody();
    //const { user_id } = c.var.user;
    const user_id = 1; //remove later when cookie auth is added

    try {
        db.prepare(
            `INSERT INTO Comments (recipe_id, user_id, message, parent_id, timestamp) VALUES (?, ?, ?, NULLIF(?, ''), ?)`
        ).run(recipe_id, user_id, message, parent_id, timestamp);
        return c.json(
            { message: `comment has been posted to recipe: ${recipe_id}` },
            201
        );
    } catch (error) {
        return c.json({ error });
    }
});
