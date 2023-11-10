import { Hono } from "hono";
import { Database } from "better-sqlite3";
import BadWords from "bad-words";
import { uploadToBucket, validateString } from "../utils/utils";

import dotenv from "dotenv";
dotenv.config();

type Variables = {
    user: {
        user_id: string;
    };
    database: Database;
};

interface Exist {
    title?: string;
    recipe_id?: number
}

export const create_recipe = new Hono<{ Variables: Variables }>();
const filter = new BadWords();
//recipe input as normal
//ingr is an array input, search param for ingredient input another endpoint
//instr is also an array input. nothing just add and delete,
//db transaction

/**
 * Auto complete form fill with ingredients along with their id for post
 */
create_recipe.get("/create-recipe", (c) => {
    //hämta från query vad
    const { ingredient } = c.req.query();
    try {
        const ingredients = c.var.database
            .prepare(
                "SELECT name, ingredient_id FROM Ingredient WHERE name LIKE ?"
            )
            .all(`%${ingredient.trim()}%`);

        return c.json({ ingredients }, 200);
    } catch (error) {
        return c.json({ error }, 500);
    }
});


create_recipe.get("/create-recipe/title", (c) => {
    //hämta från query vad
    const { title } = c.req.query();
    try {
        const recipe = c.var.database
            .prepare(
                "SELECT title FROM Recipe WHERE title = ?"
            )
            .all(title.trim()) as Exist;
        
        const recipeTitle = recipe?.title ? true : false;    
        return c.json({ recipeTitle }, 200);
    } catch (error) {
        return c.json({ error }, 500);
    }
});


create_recipe.post("/create-recipe/recipe", async (c) => {
    //const { user_id } = c.var.user;
    const user_id = 1;
    const { title, difficulty, time, dish_image, description } = await c.req.parseBody();
    
    if (filter.isProfane(title) || filter.isProfane(description)) return c.json({msg: "Watch your profanity"}, 406);
    
    const sanitizedTitle = validateString(title as string);
    const sanitizedDescription = validateString(description as string);
    const image = await uploadToBucket(dish_image as Blob, process.env.DEFAULT_DISH_PIC!);
    
    //when done set a variable of the recipe id to be used
    try {
        const insert = c.var.database.transaction(() => {
            c.var.database.prepare(`
            INSERT INTO Recipe (user_id, title, description, difficulty, time, dish_image) 
            VALUES (?, NULLIF(?, ''), ?, ?, NULLIF(?, ''), ?)`).run(user_id, sanitizedTitle, sanitizedDescription, difficulty, time, image);
            
            const recipe = c.var.database.prepare("SELECT recipe_id FROM Recipe WHERE user_id = ? AND title = ?").get(user_id, sanitizedTitle) as Exist;
            
            return recipe.recipe_id;
        })
        //return a recipe id to the frontend for the next steps
        const recipe_id = insert(); 
        return c.json({ recipe_id, created: true }, 201)
    } catch (error) {
        return c.json({ error: error.message }, 406)
    }
})

create_recipe.post("/create-recipe/ingredient", async (c) => {
    //if recipe endpoint is successful then use that recipe_id to add recipe ingredients from the tuple input
    const { ingredient_id, amount, recipe_id } = await c.req.parseBody();
    console.log(ingredient_id, amount, recipe_id)
    try {
        c.var.database.prepare(`
            INSERT INTO RecipeIngredient (recipe_id, ingredient_id, amount) 
            VALUES (?, ?, NULLIF(?, ''))`)
            .run(recipe_id, ingredient_id, amount)
    
        return c.json({ created: true }, 201); 
    } catch (error) {
        return c.json({error: error.message}, 406);
    }
})

create_recipe.delete("/create-recipe/ingredient", (c) => {
    const { recipe_id, ingredient_id } = c.req.query();
    try {
        c.var.database.prepare("DELETE RecipeIngredient WHERE recipe_id = ? AND ingredient_id = ?").run(recipe_id, ingredient_id)
        return c.body(null, 200);
    } catch (error) {
        return c.body(null, 304);
    }
})

type Order = {
    max_order: number;
};

create_recipe.post("/create-recipe/instruction", async (c) => {
    //if recipe and recipe-ingredient endpoint are successful then use that recipe_id to add recipe instructions
    const { instruction, recipe_id } = await c.req.parseBody();
    const sanitizedInstruction = validateString(instruction as string);
    try {
        const statement = c.var.database.prepare(`INSERT INTO Instruction (recipe_id, instruction_order, instruction) VALUES (?, ?, ?)`);
        const maxOrder = c.var.database.prepare("SELECT COALESCE(MAX(instruction_order), -1) as max_order FROM Instruction WHERE recipe_id = ?");
        const insert = c.var.database.transaction(() => {
            const { max_order } = maxOrder.get(recipe_id) as Order;
            statement.run(recipe_id,max_order + 1, sanitizedInstruction);
        });

        insert();
        return c.json({ created: true }, 201);
    } catch (error) {
        return c.json({ error: error.message }, 406)
    }
})

create_recipe.delete("/create-recipe/instruction", (c) => {
    const { recipe_id, instruction_order } = c.req.query();
    try {
        const removeInstruction = c.var.database.transaction(() => {
            c.var.database.prepare(
                "DELETE FROM Instruction WHERE recipe_id = ? AND instruction_order = ?")
                .run(recipe_id, instruction_order);
            c.var.database.prepare(
                `UPDATE Instruction 
                SET instruction_order = instruction_order - 1
                WHERE recipe_id = ? AND instruction_order > ?`)
                .run(recipe_id, instruction_order);
        });
        removeInstruction();
        return c.body(null, 200);
    } catch (error) {
        return c.body(null, 304);
    }
})