import { Hono } from "hono";
import { Database } from "better-sqlite3";
import bcrypt from "bcrypt";
import {
    validateString,
    validateForm,
    uploadToBucket,
    fileSize,
} from "../utils/utils";

const salt = bcrypt.genSaltSync(10);

type Variables = {
    database: Database;
};

interface Exist {
    user_name?: string;
    email?: string;
}

export const register = new Hono<{ Variables: Variables }>();

//Middleware to ensure that the image upload isn't bigger than 6mb
//register.use();

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
    const form = validateForm();
    //Check if user name exists + sanitize
    const safeUsername = validateString(user_name as string);
    if(checkExistence(db, { key: "user_name", value: safeUsername })) 
        return c.body("Username is already in use", 406)
    

    //Check if email is already in use + sanitize
    const safeEmail = validateString(email as string);
    if(checkExistence(db, { key: "email", value: safeEmail })) 
        return c.body("Email is already in use", 406)
    
    //Check if email and username have the correct regex
    if (!form.validateUsername(safeUsername)) 
        return c.body("Wrong username format", 406);
    else if (!form.validateEmail(safeEmail))  
        return c.body("Wrong email format", 406);

    //sanitation and password validation again.
    const safePassword = validateString(password as string);
    if (!form.validatePassword(safePassword)) 
        return c.body("Password is to weak", 406);
    //Salt and has password
    const pass_word: string = await bcrypt.hash(safePassword, salt);

    //handle image types
    if (image) {
        if (!form.validateFileType(image as File)) {
            return c.body("Wrong file type", 406);
        } else if (!form.validateFileSize(image as File)) {
            return c.body(`File size is ${fileSize(image as File)}MB, keep it to ${form.getValidLimitFileSize()}MB`, 406);
        }
    }
    const profile_image = await uploadToBucket(image as Blob);

    try {
        const statement = db.prepare(
            "INSERT INTO User (email, user_name, password, profile_image) VALUES (?, ?, ?, ?)"
        );
        statement.run(safeEmail, safeUsername, pass_word, profile_image);
        return c.json(
            { message: `User has been created!` },
            201
        );
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

function checkExistence(db: Database, obj: ExistenceCheck): boolean {
    const { key, value } = obj;
    const check = db.prepare(`SELECT ${key} FROM User WHERE ${key} = ?`).get(value);    
    return check ? true : false;
}