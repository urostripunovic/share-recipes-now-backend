import { Context, Hono } from "hono";
import { Database } from "better-sqlite3";

type Variables = {
    user: {
        user_id: string;
    };
    database: Database;
};

export const create_recipe = new Hono<{ Variables: Variables }>();

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

/**
[
  { ingredient_id: 1, name: 'Pasta' },       
  { ingredient_id: 2, name: 'Tomato Sauce' },
  { ingredient_id: 3, name: 'Ground Beef' }, 
  { ingredient_id: 21, name: 'lentils' }     
]
*/

type Recipe = {
    recipe: {
        title: string,
        desc: string,
        difficulty: number,
        time: number,
        image: Blob
    }
    ingredients: [string, string] //tuple
    instructions: string
}

create_recipe.post("/create-recipe/recipe", async (c) => {
    //const { user_id } = c.var.user;
    const user_id = 1;
    const form = await c.req.parseBody();
    //return a recipe id to the frontend for the next steps
    return c.json({}, 202)
})

create_recipe.post("/create-recipe/recipe-ingredient", async (c) => {
    //const { user_id } = c.var.user;
    const user_id = 1;
    //if recipe endpoint is successful then use that recipe_id to add recipe ingredients from the tuple input
    const form = await c.req.parseBody();
    return c.json({}, 202);
})

create_recipe.post("/create-recipe/instruction", async (c) => {
    //const { user_id } = c.var.user;
    const user_id = 1;
    //if recipe and recipe-ingredient endpoint are successful then use that recipe_id to add recipe instructions
    const form = await c.req.parseBody();
    return c.json({}, 202);
})