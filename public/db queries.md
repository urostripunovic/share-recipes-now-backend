# Queries to try out

## Insert a New User:
INSERT INTO User (email, user_name, password, display_name, profile_image, bio, auth_method)
VALUES ('example@email.com', 'username', 'password123', 'John Doe', NULL, 'A short bio', 'email');

INSERT INTO User (email, user_name, password, display_name, profile_image, bio, auth_method)
VALUES ('example1@email.com', 'username1', 'password123', 'John1 Doe', NULL, 'A short bio', 'email');

SELECT user_name, display_name FROM User WHERE email = 'example1@email.com';

## Insert a New Recipe with ingredients and steps:
INSERT INTO Recipe (user_id, title, description, difficulty, dish_image)
VALUES (1, 'Delicious Pasta', 'A recipe for pasta', 3, NULL);

INSERT INTO Ingredient (name) VALUES ('Pasta');
INSERT INTO Ingredient (name) VALUES ('Tomato Sauce');

INSERT INTO RecipeIngredient (recipe_id, ingredient_id, amount)
VALUES (1, 1, '200g'), (1, 2, '1 cup');

INSERT INTO Instruction (recipe_id, instruction_order, instruction)
VALUES (
    1,
    COALESCE((SELECT MAX(instruction_order) FROM Instruction WHERE recipe_id = 1), -1) + 1, 
    'Boil pasta for 10 minutes.'
);

INSERT INTO Instruction (recipe_id, instruction_order, instruction)
VALUES (
    1,
    COALESCE((SELECT MAX(instruction_order) FROM Instruction WHERE recipe_id = 1), -1) + 1, 
    'Heat tomato sauce in a separate pan.'
);

INSERT INTO Instruction (recipe_id, instruction_order, instruction)
VALUES (
    1,
    COALESCE((SELECT MAX(instruction_order) FROM Instruction WHERE recipe_id = 1), -1) + 1, 
    'Combine pasta and tomato sauce.'
);

SELECT
    R.recipe_id,
    R.user_id,
    R.title,
    R.description,
    R.difficulty
FROM
    User U
JOIN
    Recipe R ON U.user_id = R.user_id
WHERE
    U.user_name = 'username';

SELECT
    R.recipe_id,
    I.name AS ingredient_name,
    RI.amount
FROM
    User U
JOIN
    Recipe R ON R.user_id = U.user_id
JOIN
    RecipeIngredient RI ON R.recipe_id = RI.recipe_id
JOIN
    Ingredient I ON RI.ingredient_id = I.ingredient_id
WHERE
    U.user_name = 'username';

SELECT
    R.recipe_id,
    I.instruction_order,
    I.instruction
FROM
    User U
JOIN
    Recipe R ON U.user_id = R.user_id
JOIN
    Instruction I ON R.recipe_id = I.recipe_id
WHERE
    U.user_name = 'username' ORDER BY instruction_order;

The JSON file would look like the following:
{
    "user_id",
    "user_name",
    "recipes": [
        "recipe_id",
        "title",
        "description",
        "difficulty",
        "ingredients": [],
        "instructions": []
    ]
}

## Manipulate the Instructions of a recipe:
This would most likely be the hardest part of updating the recipe since the others just requires one to either take away an ingredient, remove a recipe or just remove a step.

*I need a way to insert instructions in an incremental manner as well as pair each step with a recipe as to not clutter the database with a bunch of instructions that are loosely coupled and increment in different manners and this is only the insertion part.*
INSERT INTO Instruction (recipe_id, instruction_order, instruction) -- Insert to the table in increments start from 0
VALUES (
    1,
    COALESCE((SELECT MAX(instruction_order) FROM Instruction WHERE recipe_id = 1), -1) + 1, -- The auto increment without primary key constraint
    'Instruction text'
);

*Nothing note worthy other than the fact that the instruction will be edited*
UPDATE Instruction SET instruction = 'Your new instruction text' WHERE recipe_id = 1 AND instruction_order = 1;

*This is for when a user wants to delete a instruction and the instructions list updated accordingly*
DELETE FROM Instruction WHERE recipe_id = y AND instruction_order = x; -- x, y are the changeable variables, y comes from the url and x the index
UPDATE Instruction -- Update the step order once the 
SET instruction_order = instruction_order - 1
WHERE recipe_id = y AND instruction_order > x;

*This is for when a user switches the orders of instructions. Is it needed? no but I would look really cool when presenting it to future employers and ps: fuck my life this was hard to do. Why was it hard to do? Well since I've haven't touched SQL in more than 3 years I forgot the fact that when working with **KEY/UNIQUE CONSTRAINTS** you have to avoid violations so I spent 5 hours just trying to understand why I just couldn't change the pair when I could before, and when was before? That was when `instruction_order` didn't have a constraint before I decided to change the table to have UNIQUE pairs. When thinking about it this isn't really that hard to do, delete the two `instruction_orders` in question and the just insert them normally but my thick head wanted to solve this in a more eloquent way. As I'm typing this after looking into how to solve this problem for 5 hours I regret trying to solve it in a more fancy way but once I've cooled of I'll be happy that I know of this as a future reference.*
UPDATE Instruction -- 1 and 3 are the index of our instructions and thus changeable now
    SET instruction_order = (CASE WHEN instruction_order = 1 THEN -3 ELSE -1 END)
    WHERE instruction_order in (1, 3);

UPDATE Instruction -- To fix the **KEY/UNIQUE CONSTRAINTS**
    SET instruction_order = - instruction_order
    WHERE instruction_order < 0;

SELECT * FROM Instruction WHERE recipe_id = 1 ORDER BY instruction_order;

## Manipulate the Recipe:
When I delete a recipe I want the following instructions, recipe ingredients and comments to be deleted as well.