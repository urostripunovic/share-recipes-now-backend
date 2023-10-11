import dotenv from "dotenv";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { handle } from "@hono/node-server/vercel";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { cors } from "hono/cors";
import { cookieAuth } from "./middleware/auth";
import { expiresIn } from "./utils/jwtExpires";
import Database from "better-sqlite3";
import path from "path";

dotenv.config();

const db = new Database(path.resolve("test.db"), { verbose: console.log });
//console.log(db);


const allUsers = db.prepare("SELECT * FROM User").all();
console.log(allUsers);

const recipe = db.prepare("SELECT * FROM Recipe WHERE user_id=?").get(1);
console.log(recipe);

const ingredients = db.prepare("SELECT name FROM Ingredient").all();
console.log(ingredients);

const recipe_ingredient = db
    .prepare(
        "SELECT i.name, ri.amount FROM RecipeIngredient ri JOIN Ingredient AS i ON i.ingredient_id = ri.ingredient_id"
    )
    .all();
console.log(recipe_ingredient);

const instructions = db
    .prepare("SELECT * FROM Instruction WHERE recipe_id=?")
    .all(1);
console.log(instructions);





type Variables = {
    user: {
        user_id: number;
        user_name: string;
    };
};

const app = new Hono<{ Variables: Variables }>();
app.use(cors());

//app.use("/test/*", cookieAuth); //Whole route middleware

app.post("/test", async (c) => {
    const token = await sign(
        { user_id: 1, user_name: "para knas", ...expiresIn("1h") }, //no point in catch since i'll be using try-catch
        process.env.SECRET!
    );
    setCookie(c, "__session", token, {
        httpOnly: true,
        secure: true,
        path: "/",
    });

    return c.json({ msg: "user logged in", token }, 200);
});

app.get("/test", cookieAuth, async (c) => {
    try {
        const { user_id, user_name } = c.var.user;
        return c.json({ user_id, user_name }, 200);
    } catch (error) {
        return c.json({ error: "Internal Server Error" }, 500);
    }
});

const port = parseInt(process.env.PORT!) || 3000;
serve({
    fetch: app.fetch,
    port: parseInt(process.env.PORT!) || 3000,
});
console.log(`Running at http://localhost:${port}`);

export default app;
