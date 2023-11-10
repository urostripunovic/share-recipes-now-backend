import { Hono } from "hono";
import { Database } from "better-sqlite3";

type Variables = {
    user: {
        user_id: string;
    };
    database: Database;
};

export const update_recipe = new Hono<{ Variables: Variables }>();

//update diff, time, bio of recipe, can't with the title
//update ingredient and amount
//update instruction as well as move around instructions

