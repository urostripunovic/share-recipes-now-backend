import { Hono } from "hono";
import { Database } from "better-sqlite3";

type Variables = {
    database: Database;
};

export const recipe = new Hono<{ Variables: Variables }>();

recipe.get("recipe/:recipe_id", async (c) => {
    const db = c.var.database;
    //hämta all info för recept med :id
    const id = c.req.param("recipe_id");
    try {
        const recipe = db.transaction(() => {
            const recipe = getRecipe(db, id);
            //spara denna tills vidare kolla i recipeUtils efter några scores finns
            const score = db
                .prepare(
                    `SELECT ROUND(AVG(score), 2) AS avg_score, COUNT(user_id) AS votes FROM Score WHERE recipe_id = ?`
                )
                .get(id);
            const recipe_ingredients = getRecipeIngredients(db, id);
            const instructions = getInstructions(db, id);
            const comments = getComments(db, id);
            return {
                recipe,
                score,
                recipe_ingredients,
                instructions,
                comments,
            };
        });

        if (!recipe().recipe) return c.json({ message: "No recipe sorry" }, 404)

        return c.json(recipe(), 200);
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
    dish_image: string;
    avg_score: number;
};


export function getRecipe(db: Database, id: string): Recipe {
    return db
        .prepare( //, COUNT(U.user_id) AS votes
        `SELECT U.user_id, U.user_name, R.recipe_id, R.title, R.description, R.difficulty, R.time, R.dish_image
        FROM User U
        JOIN Recipe R ON U.user_id = R.user_id
        WHERE R.recipe_id = ?`).get(id) as Recipe;
}

type RecipeIngredient = {
    ingredient_name: string;
    amount: string;
};

export function getRecipeIngredients(db: Database, id: string): RecipeIngredient[] {
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
    return db.prepare(`SELECT instruction_order, instruction FROM Instruction WHERE recipe_id = ?`).all(id) as Instruction[];
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