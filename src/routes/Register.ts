import { Hono } from "hono";
import { Database } from "better-sqlite3";
import bcrypt from "bcrypt";

const salt = bcrypt.genSaltSync(10);

type Variables = {
    database: Database;
};

interface Exist {
    user_name?: string;
    email?: string;
}

export const register = new Hono<{ Variables: Variables }>();

//middleware här också
register.get("/api/register/exists", (c) => {
    //use like statement return true or false if username is already in use
    const { user_name, e_mail } = c.req.query();
    //console.log(username, e_mail) //"test1@email.com"
    const exists = c.var.database
        .prepare(
            "SELECT user_name, email FROM User WHERE user_name = ? OR email = ?"
        )
        .get(user_name, e_mail) as unknown as Exist;

    const username = exists?.user_name ? true : false;
    const email = exists?.email ? true : false;

    return c.json({ username, email });
});

register.post("/api/register/", async (c) => {
    const db = c.var.database;
    const { user_name, password, email, image } = await c.req.parseBody();
    //Check if user name exists this also requires another api end point, done
    const username = db
        .prepare("SELECT user_name FROM User WHERE user_name = ?")
        .get(user_name);
    if (username) {
        return c.json({ message: `${user_name} already exists` });
    }
    //Check if email is already in use this requires another api end point, done
    const e_mail = db
        .prepare("SELECT email FROM User WHERE email = ?")
        .get(email);
    if (e_mail) {
        return c.json({ message: `${email} is already in use` });
    }

    /**
     * Minimum eight characters, maximum sixteen characters,
     * At least one uppercase letter, one lowercase letter, one number and one special character
     */
    const regex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
    if (!regex.test(password as string)) {
        return c.json({ message: "Password is to weak" });
    }

    //Salt and has password
    const pass_word: string = await bcrypt.hash(password, salt);

    //convert image to buffer & handle image types
    //write some code to ensure that only valid images can be uploaded to the database
    const validateFileType = (image: File): boolean => {
        const extension = image?.name.split(".").pop();
        return ["png", "gif", "jpeg", "pjp", "jpg", "pjpeg", "jfif", "webp"].includes(extension!);
    };

    if (image && !validateFileType(image as File)) {
        return c.json({ message: "Wrong file type" }, 406);
    }

    let profile_image: any = image;
    if (profile_image) {
        const arrayBuffer = await (image as Blob).arrayBuffer();
        profile_image = Buffer.from(arrayBuffer);
    }

    try {
        const statement = db.prepare(
            "INSERT INTO User (email, user_name, password, profile_image) VALUES (?, ?, ?, ?)"
        );
        statement.run(email, user_name, pass_word, profile_image);
        return c.json({ message: `User has been created!` }, 201);
    } catch (error) {
        return c.json(
            { error: "Something went wrong from the servers end" },
            500
        );
    }
});
