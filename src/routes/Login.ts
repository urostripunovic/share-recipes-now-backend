import { Hono } from "hono";
import { Database } from "better-sqlite3";
import { sign } from "hono/jwt";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
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

//add a rate limit for brute force attacks
/*login.use("/login", async (_, next) => {
    console.log("hej funkar detta")
    await next();
})*/

login.post("/login", async (c) => {
    const refreshToken = getCookie(c, "refreshToken");
    const db = c.var.database;
    const { username, password } = await c.req.parseBody();

    try {
        const user = db
            .prepare(
                "SELECT user_id, user_name, password FROM User WHERE user_name = ?"
            )
            .get(username) as User;
        //console.log(username, password, user?.password);

        if (!user?.password) {
            return c.json({ message: `${username} doesn't exist` }, 404);
        }

        const compare = await bcrypt.compare(password, user.password);
        if (!compare) {
            return c.json({ message: "Wrong password try again" });
        }

        //This one is used on the browser for access
        const accessToken = await sign(
            {
                user_id: user?.user_id,
                user_name: user?.user_name,
                ...expiresIn("15min"), //"15min"
            },
            process.env.ACCESS_TOKEN_SECRET!
        );

        setCookie(c, "accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 15 * 60 * 1000,
        });

        //This one is sent to the database for each browser
        const newRefreshToken = await sign(
            {
                user_id: user?.user_id,
                user_name: user?.user_name,
                ...expiresIn("4days"), //4days
            },
            process.env.REFRESH_TOKEN_SECRET!
        );

        const userToken = c.var.database
            .prepare("SELECT user_id, refresh_token FROM Session WHERE refresh_token = ?")
            .get(refreshToken) as any;

        //User doesn't log out and the cookie is stolen
        if (!userToken?.refresh_token) {
            c.var.database
                .prepare("DELETE FROM Session WHERE refresh_token = ?")
                .run(refreshToken);
        }
        deleteCookie(c, "refreshToken");
            
        setCookie(c, "refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge:  4 * 24 * 60 * 60 * 1000,
        });

        db.prepare(
            "INSERT OR IGNORE INTO Session (user_id, refresh_token) VALUES (?, ?)"
        ).run(user?.user_id, newRefreshToken);

        return c.json({ message: "Login successful" }, 200);
    } catch (error) {
        return c.json({ error });
    }
});
