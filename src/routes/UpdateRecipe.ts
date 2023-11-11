import { Hono } from "hono";
import { Database } from "better-sqlite3";
import { validateString } from "../utils/validate";

type Variables = {
    user: {
        user_id: string;
    };
    database: Database;
};

export const update_recipe = new Hono<{ Variables: Variables }>();

update_recipe.get("/update/:recipe_id", (c) => {
    const { user_id } = c.var.user;
    const recipe_id = c.req.param("recipe_id");
    try {
        const user = c.var.database.prepare(
            `SELECT R.recipe_id FROM User U 
            JOIN Recipe R ON U.user_id = R.user_id
            WHERE U.user_id = ? AND R.recipe_id = ?`).get(user_id, recipe_id)
        
        const canUpdate = user ? true : false;
        return c.json({ canUpdate }, 200);
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

//update diff, time, bio of recipe, can't with the title
update_recipe.put("/update/:recipe_id", async (c) => {
    const recipe_id = c.req.param("recipe_id");
    const json = await c.req.json();
    const updateFields = Object.keys(json).map(key => `${validateString(key)} = ?`).join(", ");
    const updateValues = Object.values(json).map(value => validateString(String(value)));
    try {
        c.var.database.prepare(`UPDATE Recipe SET ${updateFields} WHERE recipe_id = ?`).run([...updateValues, recipe_id]);
        return c.body(null, 200);
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

//update ingredient and amount
update_recipe.put("/update-ingredient/:recipe_id", async (c) => {
    const recipe_id = c.req.param("recipe_id");
    const { ingredient_id, amount } = await c.req.parseBody();

    try {
        c.var.database.prepare(
            `UPDATE RecipeIngredient 
            SET amount = ? 
            WHERE recipe_id = ? AND ingredient_id = ?`).run(validateString(String(amount)), recipe_id, ingredient_id);
        return c.body(null, 200)
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})
//update instruction as well as move around instructions
update_recipe.put("/update-instruction/:recipe_id", async (c) => {
    const recipe_id = c.req.param("recipe_id");
    const { instruction_order, instruction } = await c.req.parseBody();

    try {
        c.var.database.prepare(
            `UPDATE Instruction 
            SET instruction = ? 
            WHERE recipe_id = ? AND instruction_order = ?`).run(validateString(String(instruction)), recipe_id, instruction_order);
        return c.body(null, 200)
    } catch (error) {
        return c.json({ error: error.message }, 500)
    }
})

update_recipe.put("/update-instruction-order/:recipe_id", (c) => {
    const recipe_id = c.req.param("recipe_id");
    console.log(recipe_id)
    return c.json({}, 200)
})