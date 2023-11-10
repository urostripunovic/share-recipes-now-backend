import { Hono } from "hono";
import { Database } from "better-sqlite3";

type Variables = {
    user: {
        user_id: string;
    };
    database: Database;
};

export const update_recipe = new Hono<{ Variables: Variables }>();