Insert users into the database, many won't be inserted this way though, not sure yet. A use should be able to add a profile_image and a bio, not sure yet how the frontend will work but the backend allows for images and profile bios. 
```js
const insert = db.prepare(
    `INSERT INTO User (email, user_name, password) -- display_name, profile_image, bio, auth_method
        VALUES (@email, @user_name, @password)` //@display_name, @profile_image, @bio, @auth_method
);

const insertMany = db.transaction((users) => {
    for (const user of users) insert.run(user);
});

insertMany([
    { email: "test1@email.com", user_name: "test_user_1", password: "test1"},
    { email: "test2@email.com", user_name: "test_user_2", password: "test2" },
    { email: "test3@email.com", user_name: "test_user_3", password: "test3" },
]);
```
A single insert would look like this:
```js
const insert = db.prepare('INSERT INTO User (email, user_name, password) VALUES (?, ?, ?)');
insert.run('user@example.com', 'username', 'password123');

```

Insert Recipes to the 