# Queries to try out

This document tries out the database as well as provide a mockup of how the potential `JSON` files could look like. In this section I will also type out my new findings of how I've changed the database design to better align with what I want to achieve.

## Insert a New User:

```sql
INSERT INTO User (email, user_name, password, display_name, profile_image, bio, auth_method)
VALUES ('example@email.com', 'username', 'password123', 'John Doe', NULL, 'A short bio', 'email');

INSERT INTO User (email, user_name, password, display_name, profile_image, bio, auth_method)
VALUES ('example1@email.com', 'username1', 'password123', 'John1 Doe', NULL, 'A short bio', 'email');

SELECT user_name, display_name FROM User WHERE email = 'example1@email.com';
```

## Insert a New Recipe with ingredients and steps:
A simple insertion of the recipes.
```sql
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
```
## Manipulate the Instructions of a recipe:
This would most likely be the hardest part of updating the recipe since the others just requires one to either take away an ingredient, remove a recipe or just remove a step.

I need a way to insert instructions in an incremental manner as well as pair each step with a recipe as to not clutter the database with a bunch of instructions that are loosely coupled and increment in different manners and this is only the insertion part.

```sql
INSERT INTO Instruction (recipe_id, instruction_order, instruction) -- Insert to the table in increments start from 0
VALUES (
    1,
    COALESCE((SELECT MAX(instruction_order) FROM Instruction WHERE recipe_id = 1), -1) + 1, -- The auto increment without primary key constraint
    'Instruction text'
);
```

Nothing note worthy other than the fact that the instruction will be edited
```sql
UPDATE Instruction
SET instruction = 'Your new instruction text'
WHERE recipe_id = 1 AND instruction_order = 1;
```

This is for when a user wants to delete a instruction and the instructions list updated accordingly
```sql
DELETE FROM Instruction WHERE recipe_id = y AND instruction_order = x; -- x, y are the changeable variables, y comes from the url and x the index

UPDATE Instruction -- Update the step order once the
SET instruction_order = instruction_order - 1
WHERE recipe_id = y AND instruction_order > x;
```

This is for when a user switches the orders of instructions. Is it needed? no but I would look really cool when presenting it to future employers and ps: fuck my life this was hard to do. Why was it hard to do? Well since I've haven't touched SQL in more than 3 years I forgot the fact that when working with **KEY/UNIQUE CONSTRAINTS** you have to avoid violations so I spent 5 hours just trying to understand why I just couldn't change the pair when I could before, and when was before? That was when `instruction_order` didn't have a constraint before I decided to change the table to have UNIQUE pairs. When thinking about it this isn't really that hard to do, delete the two `instruction_orders` in question and then just insert them normally, or create a temp table holding the one value to be swapped in question, but my thick head wanted to solve this in a more eloquent way. As I'm typing this after looking into how to solve this problem for 5 hours I regret trying to solve it in a more fancy way but once I've cooled of I'll be happy that I know of this as a future reference.
```sql
UPDATE Instruction -- 1 and 3 are the index of our instructions and thus changeable now
    SET instruction_order = (CASE WHEN instruction_order = 1 THEN -3 ELSE -1 END)
    WHERE instruction_order in (1, 3);

UPDATE Instruction -- To fix the **KEY/UNIQUE CONSTRAINTS**
    SET instruction_order = - instruction_order
    WHERE instruction_order < 0;

SELECT * FROM Instruction WHERE recipe_id = 1 ORDER BY instruction_order;
```

And I was right letting it [cook](https://preview.redd.it/improving-236-with-a-single-panel-v0-z6qojjzbv2qb1.png?width=850&format=png&auto=webp&s=4c84b14a3df31b347b682c8075abc11e9ad06880) for a little, since I actually managed to solve what it is I want to achieve. So in other words my original idea was that I wanted to do but instead I needed to over complicate things. What I did instead was to store the instruction I want to move in a temp table, so when I write over whatever instruction position that new value won't just be copied over. And what do I mean by that? Well lets look at it likes this:

| recipe_id | instruction_order | instruction                             |
| --------- | ----------------- | --------------------------------------- |
| 1         | 0                 | Boil pasta for 10 minutes.              |
| 1         | 1                 | Your new instruction text               |
| 1         | 2                 | Combine pasta and tomato sauce.         |
| 1         | 3                 | Serve with some basil and then enjoy :) |

If were to swap the instruction_order's 1 and 3 using the following code
```sql
UPDATE Instruction
SET instruction = (
  SELECT instruction
  FROM Instruction
  WHERE instruction_order = 1
)
WHERE instruction_order = 3;

UPDATE Instruction
SET instruction = (
  SELECT instruction
  FROM Instruction
  WHERE instruction_order = 3
)
WHERE instruction_order = 1;
```

We would get the following table:
| recipe_id | instruction_order | instruction                        |
| --------- | ----------------- | ---------------------------------- |
| 1         | 0                 | Boil pasta for 10 minutes.         |
| 1         | 1                 | Your new instruction text          |
| 1         | 2                 | Combine pasta and tomato sauce.    |
| 1         | 3                 | Your new instruction text          |

What happened here is that when we write over a instruction with another value that value would then also be used to swap the old value so despite wanting to solve it eloquently the use of a temp table was needed either way so deleting a value or just updating is more inline with what I want to achieve when swapping instruction_orders, **your gonna love the feature for the frontend**
```sql
-- temp table for value in order 3
CREATE TEMP TABLE TempInstruction AS
SELECT instruction
FROM Instruction
WHERE instruction_order = 3;

-- swap order 3 with 1
UPDATE Instruction
SET instruction = (
  SELECT instruction
  FROM Instruction
  WHERE instruction_order = 1
)
WHERE instruction_order = 3;

-- swap order 1 with temp
UPDATE Instruction
SET instruction = (
  SELECT instruction
  FROM TempInstruction
)
WHERE instruction_order = 1;

-- Drop temp table
DROP TABLE TempInstruction;
```

Although this way of solving it fits more with what I want to do, learning how to do it in multiple ways as well as understanding key constraints better was a good learning opportunity and will help me get to where I want to be.
## Add a score to the recipe
[I don't even need to code anything in the backend or frontend (WARNING: LOUD)](https://www.youtube.com/watch?v=7ayDBOAH2HQ). 
```sql
INSERT INTO Score (recipe_id, score) VALUES (1,3);
INSERT INTO Score (recipe_id, score) VALUES (1,2);
INSERT INTO Score (recipe_id, score) VALUES (1,4);
INSERT INTO Score (recipe_id, score) VALUES (2,4);

SELECT AVG(score) FROM Score WHERE recipe_id = 1;
```
## Add comments to a recipe as well as chain it
When a person comments they comment with their username and not their id, since usernames are unique I would need to change this in the [database image](https://github.com/urostripunovic/share-recipes-now-backend/blob/main/public/db%20diagram.png) as well. There are no difficulties trying to add a comment.
```sql
INSERT INTO Comments (recipe_id, user_id, message, parent_id, timestamp) 
VALUES (1, 1, 'This tasted 😋', NULL, '2023-09-28 11:31');

SELECT * FROM Comments WHERE recipe_id = 1;
```

What I want is for the comments to all load in with the page which can be performed with the select statement above, but I don't really see how I could lay that out on the frontend. An idea is that after I've loaded in all the comments I would then like to load in all the replies or comment chains that exist for each `comment_id`. The idea is to first fetch the all the comments and then fetch all the comments that don't have a `parent_id` and then perform another query for all the reply comments like this for example:

```
This was 😋!
load comments...
```
But how would I be able to do that? Well this code does this and a little more. 
```sql
WITH RECURSIVE CommentHierarchy AS (
    SELECT
        comment_id, user_name, message, parent_id
    FROM Comments WHERE comment_id = 1
    UNION ALL
    SELECT
        c.comment_id,
        c.user_name,
        c.message,
        c.parent_id
    FROM
        CommentHierarchy AS ch
    JOIN
        Comments AS c
    ON
        c.parent_id = ch.comment_id
)
SELECT
    comment_id,
    user_name,
    message,
    parent_id
FROM
```
With this I would get a proper comment chain for each `comment_id` even if there are no replies for that comment, the code taken from [stackoverflow](https://stackoverflow.com/questions/39435348/select-comments-and-its-replies-sql-server). Kinda cool that me and the poster had the same table design. So with this code I'm able to display every single chain or non chain that exist with this query. With this recursive code I'm also able to create page where the discussion can be taken to another page as to not clutter the recipe page with comments. But using this query as a `load comments` function sounds like a good idea but could be expensive, I could also just load all the comments with a simple `SELECT` and then just write some backend code to match the corresponding `parent_id` to `comment_id` creating a `children: []`. Processing is required in either the backend or frontend no matter how I twist and turn it!

So if I'd like to reply to someone I would first need to get their comment id and then insert my reply to the database so the JSON file would need contain the following:
```JSON
{
    "comments": [
        {
            "comment_id",
            "recipe_id",
            "user_name",
            "message",
            "parent_id",
            "timestamp",
            "children": []
        }
    ]
}
```  
## Let users save a recipe to their account
Nothing weird at all. I wanted the save the the recipe to a specific `user_name` but what would happen if a user changes their username? Well all the info would be lost so tying everything to an id the for the better. I know typing this out probably makes me look stupid but hey, everyone learns differently! I say that as I've then also changed the Comments table to use user_name instead of user_id, well not that is back as well.
```sql
INSERT INTO Saved (user_id, recipe_id) 
VALUES (1, 1);

INSERT INTO Saved (user_id, recipe_id) 
VALUES (2, 1);

SELECT * FROM Saved
```

## Extra update stuff:
This is the easiest part of the Database just update whatever and call it a day. Users are able to change their name as long as it isn't taken, Recipe can change whatever as well same goes for instructions as I've already established. Delete entries from each table is also possible without any issues as well, I think it won't try it out since it's just a simple delete operation. Although what I want to try out is deleting a recipe and the following information gets deleted as well. And it's pretty easy one line of SQL code and everything is gone.
```sql
DELETE FROM Recipe WHERE recipe_id = 1;
```

But some things are in order, one would need to add the following to the tables and database to ensure that everything is deleted one a reference key is gone.
```sql
PRAGMA foreign_keys = ON; -- idk why this is here other than stackoverflow telling me that it needs to be here
ON DELETE CASCADE -- for each foreign key reference
```
## The JSON files would look like the following:
After implementing and testing the database I would also like the following tables to result in some nice `JSON` files
### A Users recipe
Data representation for the recipe- and the edit page for a user. To access the page the user would have to click on a thumbnail that has the corresponding data: `title, user_id, user_name` and `recipe_id` this will then fetch all the data needed for display, the same page can be edited only by authorized users if their user_id matches from the session token. If a user wants to create recipe that recipe will be added to the DB as usual.

```sql
-- A Recipe of a user.
SELECT
    U.user_id,
    U.user_name,
    R.recipe_id,
    R.title,
    R.description,
    R.difficulty,
    R.time,
    R.dish_image,
    AVG(S.score) AS average_score
FROM
    User U
JOIN
    Recipe R ON U.user_id = R.user_id
LEFT JOIN
    Score S ON R.recipe_id = S.recipe_id
WHERE
    U.user_id = 1 -- This comes from clicked thumbnail
    AND R.title = 'Delicious Pasta'; -- This would from the title we want to update

-- Ingredients
SELECT
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
    U.user_id = 1; -- clicked thumbnail

-- Instructions
SELECT
    I.instruction_order,
    I.instruction
FROM
    User U
JOIN
    Recipe R ON U.user_id = R.user_id
JOIN
    Instruction I ON R.recipe_id = I.recipe_id
WHERE
    U.user_id = 1; -- clicked thumbnail

-- Comments
CREATE TEMP TABLE TempRecipeId AS -- Work in progress with how I'm fetching the comments of a user_id with a recipe title
SELECT r.recipe_id
FROM Recipe r
JOIN User AS u ON r.user_id = u.user_id
WHERE r.title = 'Delicious Pasta' AND (SELECT user_id FROM User WHERE user_name='username'); -- user_name is changeable

SELECT
    C.comment_id,
    U.user_name,
    C.message,
    C.parent_id,
    C.timestamp
FROM
    Comments C
JOIN
    Recipe R ON C.recipe_id = R.recipe_id
JOIN
    User U ON C.user_id = u.user_id
WHERE
    R.recipe_id = (SELECT recipe_id FROM TempRecipeId);

DROP TABLE TempRecipeId;
```
The `JSON` file could look like the following:
```JSON
{
    "recipes": [
        {
            "user_id",
            "user_name",
            "recipe_id",
            "title",
            "description",
            "difficulty",
            "score",
            "ingredients": [
                {
                    "ingredient_name",
                    "amount"
                }
            ],
            "instructions": [
                {
                    "instruction_order",
                    "instruction"
                }
            ],
            "comments": [
                {
                    "comment_id",
                    "user_name",
                    "message",
                    "parent_id",
                    "timestamp",
                    "children": []
                }
            ]
        }
    ]
}
```
One thing to keep in mind though is that `"children": []` will be implemented in the backend, I wrote more about it [here](ttps://github.com/urostripunovic/share-recipes-now-backend/blob/main/public/db%20queries.md#add-comments-to-a-recipe-as-well-as-chain-it).

### User JSON
This file will display the information related to the user that are authorized to see their edit page i.e the **session**. This will display their recipes and saved recipes as well as the comments they've posted and if they want to create a new recipe the user_id from the session will be used.
```sql
-- User info
SELECT user_id, email, user_name, display_name, profile_image, bio, auth_method FROM User WHERE user_id = 1;

-- The users own recipes
SELECT
    U.user_id,
    R.recipe_id,
    R.title,
    AVG(S.score) AS score
FROM
    User U
JOIN
    Recipe R ON U.user_id = R.user_id
LEFT JOIN
    Score S ON R.recipe_id = S.recipe_id
WHERE U.user_id = 1;

--Saved recipes the user has
SELECT 
    S.user_id,
    S.recipe_id,
    R.title
FROM Saved S
LEFT JOIN
    Recipe R ON S.recipe_id = R.recipe_id
WHERE S.user_id = 1;

-- Comments posted by the user
SELECT
    C.comment_id,
    R.title,
    R.recipe_id,
    C.message,
    C.timestamp
FROM
    Comments C
JOIN
    Recipe R ON C.recipe_id = R.recipe_id
JOIN
    User U ON C.user_id = u.user_id
WHERE U.user_id = 1;
```
With the following `JSON` file:
```JSON
{
    "user_id",
    "email",
    "user_name",
    "display_name",
    "profile_image",
    "bio",
    "auth_method",
    "recipes": [
        {
            "user_id",
            "recipe_id",
            "title",
            "score"
        }
    ],
    "saved": [
        {
            "user_id",
            "recipe_id",
            "title",
            "score"
        }
    ],
    "comments": [
        {
            "comment_id",
            "title",
            "recipe_id"
            "message",
            "timestamp"
        }
    ]
}
```

### Search JSON
This file will return the ingredients in the database that were used to create a recipe. Clicking on the ingredient will take you to another page with all the recipes that used this ingredient. There is a key word in SQL called `LIKE` together with `%%`
```sql
SELECT name FROM Ingredient WHERE name LIKE '%Tomato%';
```
And the JSON would look like the following:
```JSON
{
    "ingredients": [
        "name"
    ]
}
```
If by change there are no matches ingredients then there are no recipes with that ingredient but if you instead want to search for a recipe you could do that as well using the following sql. But I'm not really sure if I want to implement this but it would be easy to do because the database is built up in a good way that enables this, I would then get multiple recipes of the same name but solving the duplication of things is the least of my worries. Nonetheless the feature can be implemented without any issues. 
```sql
SELECT U.user_id, U.user_name, R.recipe_id, R.title, R.dish_image, R.time 
FROM Recipe R
JOIN User U ON R.user_id = U.user_id
WHERE title LIKE '%pasta%';
```
And the JSON would look like the following:
```JSON
{
    "recipe": [
        {
            "user_id",
            "user_name"
            "recipe_id",
            "title",
            "dish_image",
            "time",
        },
    ]
}
```

### Search page JSON
When the ingredient has been clicked we would like to the get all the recipes that use this ingredient.
```sql
SELECT
  U.user_id,
  U.user_name,
  R.recipe_id,
  R.title,
  R.difficulty,
  R.time,
  R.dish_image,
  AVG(S.score) AS score
FROM
  Recipe AS R
JOIN
  RecipeIngredient AS RI ON R.recipe_id = RI.recipe_id
JOIN
  User AS U ON R.user_id = U.user_id
JOIN
  Ingredient AS I ON I.ingredient_id = RI.ingredient_id
LEFT JOIN
  Score AS S ON R.recipe_id = S.recipe_id
WHERE
  I.ingredient_id = 2
GROUP BY
  R.recipe_id;
```
And the JSON would look like the following:
```JSON
{
    "recipes": [
        {
            "user_id",
            "user_name",
            "recipe_id",
            "title",
            "score",
            "difficulty",
            "time",
            "dish_image"
        }
    ]
}
```
### Top Recipes JSON
This file will return the top rated recipes for the site, a rating above 4.2 I think... Yeah that's good enough.
```sql
SELECT 
    U.user_id,
    U.user_name,
    R.recipe_id, 
    R.title, 
    AVG(S.score) AS score,
    R.difficulty,
    R.time,
    R.dish_image
FROM Recipe AS R
INNER JOIN Score AS S ON R.recipe_id = S.recipe_id
INNER JOIN User AS U ON R.user_id = U.user_id
GROUP BY 
    R.recipe_id
HAVING average_score >= 4.2;
```
The following JSON file contains:
```JSON
{
    "recipes": [
        {
            "user_id",
            "user_name",
            "recipe_id",
            "title",
            "score",
            "difficulty",
            "time",
            "dish_image"
        }
    ]
}
```
### Less Than 30 min Recipes JSON
This file will return recipes that take less than 30 min to cook. The funny thing is that the SQL code is exactly the same so there will be only one part in the backend where I change the code as to avoid duplicate code, it's duplicate now just to display that it is, mostly for my own purposes.
```sql
SELECT 
    U.user_id,
    U.user_name,
    R.recipe_id, 
    R.title, 
    AVG(S.score) AS score,
    R.difficulty,
    R.time,
    R.dish_image
FROM Recipe AS R
INNER JOIN Score AS S ON R.recipe_id = S.recipe_id
INNER JOIN User AS U ON R.user_id = U.user_id
GROUP BY 
    R.recipe_id,
HAVING R.time < 30;
```
The following JSON file is also exactly the same:
```JSON
{
    "recipes": [
        {
            "user_id",
            "user_name",
            "recipe_id",
            "title",
            "score",
            "difficulty",
            "time",
            "dish_image"
        }
    ]
}
```
So yeah... Ff you've made it to the end of the page then [nice](https://www.youtube.com/watch?v=3WAOxKOmR90), Hopefully my grammar isn't that broken but what's important is if you understood my code. I haven't touched SQL in years so if you have any ideas on how I could improve it don't hesitate to create a pull request. To goal of this project is to learn!