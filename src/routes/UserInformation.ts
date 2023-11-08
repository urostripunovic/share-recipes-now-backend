import { Hono } from "hono";
import { Database } from "better-sqlite3";

type Variables = {
    user: {
        user_id: string;
    };
    database: Database;
};

export const user_info = new Hono<{ Variables: Variables }>();

user_info.get("/user_info", (c) => {
    const db = c.var.database;
    const { user_id } = c.var.user;
    try {
        const info = db.transaction(() => {
            const user_info = getUserInfo(user_id, db);
            const recipes = getUserRecipes(user_id, db);
            const saved_recipes = getSavedUserRecipes(user_id, db);
            const comments = getUserComments(user_id, db);
    
            return { user_info, recipes, saved_recipes, comments };
        });
        //hämta allt
        return c.json({ ...info() }, 202); 
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

type UserInfo = {
    user_id: string;
    email: string;
    user_name: string;
    display_name: string;
    profile_image: ArrayBuffer | String | undefined;
    bio: string;
};

function getUserInfo(user_id: string, db: Database): UserInfo {
    return db
            .prepare(
                `SELECT user_id, email, user_name, display_name, profile_image, bio FROM User WHERE user_id = ?`)
            .get(user_id) as UserInfo;    


}

type Recipe = {
    user_id: number;
    recipe_id: number;
    title: string;
    avg_score: number;
}

function getUserRecipes(user_id: string, db: Database): Recipe[] {
    return db
            .prepare(
                `SELECT U.user_id, R.recipe_id, R.title, ROUND(AVG(score), 2) AS avg_score 
                FROM User U
                JOIN Recipe R ON U.user_id = R.user_id
                LEFT JOIN Score S ON R.recipe_id = S.recipe_id
                WHERE U.user_id = ?`)
            .all(user_id) as Recipe[];   
}

type Saved = {
    recipe_id: number;
    title: string;
}

function getSavedUserRecipes(user_id: string, db: Database): Saved[] {
    return db
            .prepare(
                `SELECT S.recipe_id, R.title 
                FROM Saved S 
                LEFT JOIN Recipe R ON S.recipe_id = R.recipe_id
                WHERE S.user_id = ?`)
            .all(user_id) as Saved[];
}

type Comment = {
    comment_id: string;
    title: string;
    recipe_id: string;
    message: string;
    timestamp: Date;
}

function getUserComments(user_id: string, db: Database): Comment[] {
    return db
            .prepare(`SELECT C.comment_id, R.title, R.recipe_id, C.message, C.timestamp
                FROM Comments C
                JOIN Recipe R ON C.recipe_id = R.recipe_id
                JOIN User U ON C.user_id = u.user_id
                WHERE U.user_id = ?`)
            .all(user_id) as Comment[];
}