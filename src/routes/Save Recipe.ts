import { Hono } from "hono";
import { Database } from "better-sqlite3";

type Variables = {
    database: Database;
};

export const save_recipe = new Hono<{ Variables: Variables }>();

//middleware här också
save_recipe.get("/save-recipe/:recipe_id", async (c) => {
    //const { user_id } = c.var.user;
    const id = c.req.param("recipe_id");
    const user_id = 1;

    try {
        const saved = c.var.database
            .prepare(`SELECT id FROM Saved WHERE user_id = ? AND recipe_id = ?`)
            .get(user_id, id)
            ? true
            : false;
        return c.json({ saved });
    } catch (error) {
        return c.json({ error });
    }
});

//middleware här också
save_recipe.delete("/save-recipe/:recipe_id", async (c) => {
    //const { user_id } = c.var.user;
    const id = c.req.param("recipe_id");
    const user_id = 1;

    try {
        c.var.database.prepare(`DELETE FROM Saved WHERE user_id = ? AND recipe_id = ?`).run(
            user_id,
            id
        );
        return c.json({
            message: `recipe_id: ${id} is removed from user_id: ${user_id}`,
        });
    } catch (error) {
        return c.json({ error });
    }
});

//lägg till middleware här
save_recipe.post("/save-recipe/:recipe_id", async (c) => {
    //const { user_id } = c.var.user;
    const id = c.req.param("recipe_id");
    const user_id = 1;

    try {
        c.var.database.prepare(`INSERT INTO Saved (user_id, recipe_id) VALUES (?, ?)`).run(
            user_id,
            id
        );
        return c.json({
            message: `recipe_id: ${id} is saved to user_id: ${user_id}`,
        });
    } catch (error) {
        return c.json({ error });
    }
});