import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Database } from "better-sqlite3";
import bcrypt from "bcrypt";
import { validateString, validateForm, processImage } from "../utils/utils";

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
register.get("/register/exists", (c) => {
    //use like statement return true or false if username is already in use
    const { user_name, e_mail } = c.req.query();
    const safeUsername = validateString(user_name);
    const safeEmail = validateString(e_mail);
    //console.log(username, e_mail) //"test1@email.com"
    const exists = c.var.database
        .prepare(
            "SELECT user_name, email FROM User WHERE user_name = ? OR email = ?"
        )
        .get(safeUsername, safeEmail) as Exist;

    const username = exists?.user_name ? true : false;
    const email = exists?.email ? true : false;

    return c.json({ username, email });
});

register.post("/register/", async (c) => {
    const db = c.var.database;
    const { user_name, password, email, image } = await c.req.parseBody();

    //Check if user name exists + sanitize
    const safeUsername = validateString(user_name as string);
    checkExistence(db, { key: "user_name", value: safeUsername });

    //Check if email is already in use + sanitize
    const safeEmail = validateString(email as string);
    checkExistence(db, { key: "email", value: safeEmail });

    //Check if email and username have the correct regex
    validateForm().validateUsername(safeUsername);
    validateForm().validateEmail(safeEmail);

    //sanitation and password validation again.
    const safePassword = validateString(password as string);
    validateForm().validatePassword(safePassword);

    //Salt and has password
    const pass_word: string = await bcrypt.hash(safePassword, salt);

    //handle image types & convert image to buffer/string
    if (image) {
        validateForm().validateFileSize(image as File);
        validateForm().validateFileType(image as File);
    }
    const image_buffer = await convertImageToBuffer(image as File);
    const profile_image = await processImage(image_buffer);

    try {
        const statement = db.prepare(
            "INSERT INTO User (email, user_name, password, profile_image) VALUES (?, ?, ?, ?)"
        );
        statement.run(safeEmail, safeUsername, pass_word, profile_image);
        return c.json({ message: `User has been created!` }, 201);
    } catch (error) {
        return c.json(
            { error: "Something went wrong from the servers end" },
            500
        );
    }
});

interface ExistenceCheck {
    key: string;
    value: string;
}

function checkExistence(db: Database, obj: ExistenceCheck): void {
    const { key, value } = obj;

    const check = db
        .prepare(`SELECT ${key} FROM User WHERE ${key} = ?`)
        .get(value);
    if (check)
        throw new HTTPException(406, { message: `${key} is already in use` });
}

async function convertImageToBuffer(image_file: Blob): Promise<ArrayBuffer> {
    //kolla om annat än array buffer
    let image: ArrayBuffer;
    if (image_file) {
        const arrayBuffer = await image_file.arrayBuffer();
        image = Buffer.from(arrayBuffer);
    } else {
        return image_file;
    }

    return image;
}
