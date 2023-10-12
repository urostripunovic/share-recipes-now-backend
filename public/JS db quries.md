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

Insert Recipes to the db is the same:
```js
const insert = db.prepare('INSERT INTO Recipe (user_id, title, description, difficulty, time, dish_image) VALUES (?, ?, ?, ?, ?, ?)');
insert.run('1', 'Delicious Pasta', 'A recipe for pasta', 3, 50, null);
```

To Insert a bunch of Ingredients this query was used:
```js
const insert = db.prepare(`INSERT or IGNORE INTO Ingredient (name) VALUES (@name)`);
    
const insertMany = db.transaction((ingredients) => {
    for (const ingredient of ingredients) insert.run(ingredient);
});
    
insertMany([
    { name: "Pasta"},
    { name: "Tomato Sauce"},
    { name: "Ground Beef"},
]);
```

Insert recipe Ingredients for the first creation:
```js
const insert = db.prepare(`INSERT INTO RecipeIngredient (recipe_id, ingredient_id, amount) VALUES (@recipe_id, @ingredient_id, @amount)`);
    
const insertMany = db.transaction((recipe_ingredients) => {
    for (const recipe_ingredient of recipe_ingredients) insert.run(recipe_ingredient);
});
    
insertMany([
    { recipe_id: 1, ingredient_id: 1, amount: "200g"},
    { recipe_id: 1, ingredient_id: 2, amount: "1 can"},
    { recipe_id: 1, ingredient_id: 3, amount: "250g"},
]);
```

Insert instructions to recipe:
```js
const insert = db.prepare(`INSERT INTO Instruction (recipe_id, instruction_order, instruction) VALUES (?, ?, ?)`);

const maxOrder = db.prepare("SELECT COALESCE(MAX(instruction_order), -1) as max_order FROM Instruction WHERE recipe_id = ?");

const insertMany = db.transaction((instructions) => {
    for (const instruction of instructions) {
        const { max_order } = maxOrder.get(instruction.recipe_id);
        insert.run(instruction.recipe_id, max_order + 1, instruction.instruction);
    }
});

insertMany([
    { recipe_id: 1, instruction: 'Boil pasta for 10 minutes.' },
    { recipe_id: 1, instruction: 'Heat tomato sauce in a separate pan.' },
    { recipe_id: 1, instruction: 'Combine pasta and tomato sauce.' },
    { recipe_id: 1, instruction: 'Serve with some basil and then enjoy :)' },
]);
```
the maxOrder one is very important I tried putting the query as a string lol. And if I want to delete and instruction I would need to do the following if I also want to update the instruction list order:
```js
const deleteAndUpdate = db.transaction((recipe_id, instruction_order) => {
    db.prepare(`DELETE FROM Instruction WHERE recipe_id = ? AND instruction_order = ?`).run(recipe_id, instruction_order);
    db.prepare("UPDATE Instruction SET instruction_order = instruction_order - 1 WHERE recipe_id = ? AND instruction_order > ?").run(recipe_id, instruction_order);
});
deleteAndUpdate(1, 4);
```


```js
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
```