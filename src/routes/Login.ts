import { Hono } from "hono";
import { Database } from "better-sqlite3";
import { sign } from "hono/jwt";
import { setCookie } from "hono/cookie";
import bcrypt from "bcrypt";
import { expiresIn } from "../utils/utils";


type Variables = {
    database: Database;
};


export const login = new Hono<{ Variables: Variables }>();

interface User {
    user_id: number;
    user_name: string;
    password: string;
}

login.post("/login", async (c) => {
    const db = c.var.database;
    const { username, password } = await c.req.parseBody();

    try {
        const user = db
            .prepare(
                "SELECT user_id, user_name, password FROM User WHERE user_name = ?"
            )
            .get(username) as User;

        console.log(username, password, user?.password);

        if (!user?.password) {
            return c.json({ message: `${username} doesn't exist` }, 404);
        }

        const compare = await bcrypt.compare(password, user.password);

        if (!compare) {
            return c.json({ message: "Wrong password try again" });
        }

        const token = await sign(
            {
                user_id: user?.user_id,
                user_name: user?.user_name,
                ...expiresIn("1h"),
            },
            process.env.SECRET!
        );

        setCookie(c, "__session", token, {
            httpOnly: true,
            secure: true,
            path: "/",
        });

        return c.json({ message: "Login successful" }, 200);
    } catch (error) {
        return c.json({ error });
    }
});

