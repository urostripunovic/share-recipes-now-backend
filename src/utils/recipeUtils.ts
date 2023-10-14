import { Database } from "better-sqlite3";

type Recipe = {
    user_id: number;
    user_name: string;
    recipe_id: number;
    title: string;
    description: string;
    difficulty: string;
    time: number;
    dish_image: string;
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
export function fastOrRatedFood(db: Database): Recipe[];
export function fastOrRatedFood(db: Database, score: boolean): Recipe[];
export function fastOrRatedFood(db: Database, score?: boolean): Recipe[] {
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
            .all();
        return json as Recipe[];
    } catch (error) {
        throw new Error("An error occurred while querying the database.");
    }
}

export function getRecipe(db: Database, id: string): Recipe {
    return db
        .prepare(
        `SELECT U.user_id, U.user_name, R.recipe_id, R.title, R.description, R.difficulty, R.time, R.dish_image, AVG(S.score) AS avg_score
        FROM User U
        JOIN Recipe R ON U.user_id = R.user_id
        LEFT JOIN Score S ON R.recipe_id = S.recipe_id
        WHERE R.recipe_id = ?`).get(id) as Recipe;
}

type RecipeIngredient = {
    ingredient_name: string;
    amount: string;
};

export function getRecipeIngredients(
    db: Database,
    id: string
): RecipeIngredient[] {
    return db
        .prepare(`
        SELECT I.name AS ingredient_name, RI.amount
        FROM RecipeIngredient RI
        JOIN Ingredient I ON RI.ingredient_id = I.ingredient_id
        WHERE RI.recipe_id = ?`)
        .all(id) as RecipeIngredient[];
}

type Instruction = {
    instruction_order: number;
    instruction: string;
};

export function getInstructions(db: Database, id: string): Instruction[] {
    return db.prepare(` SELECT instruction_order, instruction FROM Instruction WHERE recipe_id = ?`).all(id) as Instruction[];
}

type Comment = {
    comment_id: number;
    user_name: string;
    message: string;
    parent_id: number;
    timestamp: Date;
    path: string;
};

export function getComments(db: Database, id: string): Comment[] {
    const comment_hierarchy = db
        .prepare(
        `WITH RECURSIVE CommentHierarchy AS (
        SELECT comment_id, user_id, message, parent_id, '' AS path
        FROM Comments WHERE recipe_id = ? AND parent_id IS NULL
        UNION ALL
        SELECT c.comment_id, c.user_id, c.message, c.parent_id, ch.path || '/' || c.parent_id AS path
        FROM CommentHierarchy AS ch
        JOIN Comments AS c
        ON c.parent_id = ch.comment_id)
        SELECT ch.path, ch.comment_id, ch.message, ch.user_id, u.user_name
        FROM CommentHierarchy ch JOIN User u ON ch.user_id = u.user_id`).all(id) as Comment[];

    return comment_hierarchy;
}