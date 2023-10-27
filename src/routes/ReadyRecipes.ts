import { Hono } from "hono";
import { Database } from "better-sqlite3";
import { processImage } from "../utils/processImage";

type Variables = {
    database: Database;
};

export const ready_recipes = new Hono<{ Variables: Variables }>();

ready_recipes.get("/fast-food", async (c) => {
    
    try {
        const json = await fastOrRatedFood(c.var.database);
        return c.json(json, 200);
    } catch (error) {
        return c.json({ error }, 500);
    }
});

ready_recipes.get("/top-rated-food", async (c) => {
    try {
        const json = await fastOrRatedFood(c.var.database, true);
        return c.json(json, 200);
    } catch (error) {
        return c.json({ error }, 500);
    }
});

type Recipe = {
    user_id: number;
    user_name: string;
    recipe_id: number;
    title: string;
    description: string;
    difficulty: string;
    time: number;
    dish_image: ArrayBuffer | String | undefined;
    avg_score: number;
};

/**
 * Retrieve a list of recipes from the database.
 *
 * @param {Database} db - The SQLite database instance.
 * @param {string} [score] - Optional. The type of query to perform ("score" or "time").
 * @returns {Recipe[]} - An array of recipe objects.
 * @throws {Error} If there's an error during the database query.
 */
export async function fastOrRatedFood(db: Database): Promise<Recipe[]>;
export async function fastOrRatedFood(db: Database, score: boolean): Promise<Recipe[]>;
export async function fastOrRatedFood(db: Database, score?: boolean): Promise<Recipe[]> {
    const part_of_query = score ? "avg_score >= 4.2" : "R.time < 30";

    try {
        const json = db
            .prepare(
                `SELECT U.user_id, U.user_name, R.recipe_id,  R.title,  ROUND(AVG(S.score), 2) AS avg_score, R.difficulty, R.time, R.dish_image
            FROM Recipe AS R
            INNER JOIN User AS U ON R.user_id = U.user_id
            LEFT JOIN Score AS S ON R.recipe_id = S.recipe_id
            GROUP BY R.recipe_id
            HAVING ${part_of_query}`
            )
            .all() as Recipe[];
        
        for(const recipe of json) {
            recipe.dish_image = await processImage(recipe.dish_image as ArrayBuffer);
        }

        return json;
    } catch (error) {
        throw new Error("An error occurred while querying the database.");
    }
}