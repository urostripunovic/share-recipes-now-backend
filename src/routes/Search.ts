import { Hono } from "hono";
import { Database } from "better-sqlite3";
import { processImage } from "../utils/ProcessImage";

type Variables = {
    database: Database;
};

type Recipe = {
    user_id: number;
    user_name: string;
    recipe_id: number;
    title: string;
    time: number;
    dish_image: ArrayBuffer | String | undefined;
};

export const search = new Hono<{ Variables: Variables }>();

search.get("/search-recipe", async (c) => {
    const db = c.var.database;
    //?q=pasta&search_term=recipes
    const { q, search_term } = c.req.query();
    const search = search_term === "recipes" ? "R.title" : "I.name";
    //Use SQLite LIKE for each press on the key board, the search show change depending on if it's recipe or ingredient
    try {
        const recipes = db
            .prepare(
                `SELECT U.user_id, U.user_name, R.recipe_id, R.title, R.dish_image, R.time
            FROM Recipe R
            JOIN User U ON R.user_id = U.user_id
            JOIN RecipeIngredient RI ON R.recipe_id = RI.recipe_id
            JOIN Ingredient I ON RI.ingredient_id = I.ingredient_id
            WHERE ${search} LIKE ?
            GROUP BY R.recipe_id;`
            )
            .all(`%${q.trim()}%`) as Recipe[];
        
        for (const recipe of recipes) {
            recipe.dish_image = await processImage(recipe.dish_image as ArrayBuffer);
        }
        
        const results = recipes.length;
        return c.json({ recipes, results }, 200);
    } catch (error) {
        return c.json({ error }, 500);
    }

});
