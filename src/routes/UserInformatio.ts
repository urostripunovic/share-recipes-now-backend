import { Hono } from "hono";
import { Database } from "better-sqlite3";

type Variables = {
    database: Database;
};


export const user_info = new Hono<{ Variables: Variables }>();

user_info.get("/user_info", (c) => {
    const db = c.var.database;
    return c.body(null, 204);

});
