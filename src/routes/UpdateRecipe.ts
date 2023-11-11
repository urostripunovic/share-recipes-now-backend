import { Hono } from "hono";
import { Database } from "better-sqlite3";
import {
    validateString,
    uploadToBucket,
    removeFromBucket,
} from "../utils/utils";

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
        const user = c.var.database
            .prepare(
                `SELECT R.recipe_id FROM User U 
            JOIN Recipe R ON U.user_id = R.user_id
            WHERE U.user_id = ? AND R.recipe_id = ?`
            )
            .get(user_id, recipe_id);

        const canUpdate = user ? true : false;
        return c.json({ canUpdate }, 200);
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

//update diff, time, bio of recipe, can't with the title
update_recipe.put("/update/:recipe_id", async (c) => {
    const recipe_id = c.req.param("recipe_id");
    const json = await c.req.json();
    const updateFields = Object.keys(json)
        .map((key) => `${validateString(key)} = ?`)
        .join(", ");
    const updateValues = Object.values(json).map((value) =>
        validateString(String(value))
    );
    try {
        c.var.database
            .prepare(`UPDATE Recipe SET ${updateFields} WHERE recipe_id = ?`)
            .run([...updateValues, recipe_id]);
        return c.body(null, 200);
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

//can only update the image
update_recipe.put("/update-image/:recipe_id", async (c) => {
    const recipe_id = c.req.param("recipe_id");
    const { image } = await c.req.parseBody();
    const new_image = await uploadToBucket(image as Blob);
    try {
        const update = c.var.database.transaction(() => {
            //@ts-ignore
            const { dish_image } = c.var.database
                .prepare("SELECT dish_image FROM Recipe WHERE recipe_id = ?")
                .get(recipe_id);
            c.var.database
                .prepare(`UPDATE Recipe SET dish_image = ? WHERE recipe_id = ?`)
                .run(new_image, recipe_id);
            return dish_image ? dish_image.split(".com/")[1] : "";
        });
        const old_image = update();
        await removeFromBucket(old_image);
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
        c.var.database
            .prepare(
                `UPDATE RecipeIngredient 
            SET amount = ? 
            WHERE recipe_id = ? AND ingredient_id = ?`
            )
            .run(validateString(String(amount)), recipe_id, ingredient_id);
        return c.body(null, 200);
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});
//update instruction as well as move around instructions
update_recipe.put("/update-instruction/:recipe_id", async (c) => {
    const recipe_id = c.req.param("recipe_id");
    const { instruction_order, instruction } = await c.req.parseBody();

    try {
        c.var.database
            .prepare(
                `UPDATE Instruction 
            SET instruction = ? 
            WHERE recipe_id = ? AND instruction_order = ?`
            )
            .run(
                validateString(String(instruction)),
                recipe_id,
                instruction_order
            );
        return c.body(null, 200);
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

update_recipe.put("/update-instruction-order/:recipe_id", async (c) => {
    const recipe_id = c.req.param("recipe_id");
    const { to, from } = c.req.query();
    
    if (isNaN(Number(from)) || isNaN(Number(to))) return c.body("Not a number", 400);

    try {
        const update = c.var.database.transaction(() => {
            try {
                const to_value = c.var.database
                    .prepare(
                        `SELECT instruction 
                    FROM Instruction 
                    WHERE instruction_order = ? AND recipe_id = ?`
                    )
                    .get(to, recipe_id);

                const from_value = c.var.database
                    .prepare(
                        `SELECT instruction 
                    FROM Instruction 
                    WHERE instruction_order = ? AND recipe_id = ?`
                    )
                    .get(from, recipe_id);

                c.var.database
                    .prepare(
                        `UPDATE Instruction
                    SET instruction = ?
                    WHERE instruction_order = ? AND recipe_id = ?`
                    )
                    //@ts-ignore
                    .run(from_value.instruction, to, recipe_id);

                c.var.database
                    .prepare(
                        `UPDATE Instruction
                    SET instruction = ?
                    WHERE instruction_order = ? AND recipe_id = ?`
                    )
                    //@ts-ignore
                    .run(to_value.instruction, from, recipe_id);
            } catch (error) {
                throw error;
            }
        });
        update();
        return c.body(null, 204);
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});
