# Queries to try out
This document tries out the database as well as provide a mockup of how the potential `JSON` files could look like. In this section I will also type out my new findings of how I've changed the database design to better align with what I want to achieve.

When it comes to updating a recipe page I would like the have each section separate, what do I mean by this? So if the Recipe table is updated then a query will only be sent to that table, if the Recipe Ingredient table so on and so forth. I'm not 100% sure yet how I would deal with this.
## Insert a New User:
Standard procedure, inserting a user into the database. I tried doing duplicates and it doesn't work!

```sql
INSERT INTO User (email, user_name, password, display_name, profile_image, bio, auth_method)
VALUES ('example@email.com', 'username', 'password123', 'John Doe', NULL, 'A short bio', 'email');

INSERT INTO User (email, user_name, password, display_name, profile_image, bio, auth_method)
VALUES ('example1@email.com', 'username1', 'password123', 'John1 Doe', NULL, 'A short bio', 'email');

SELECT user_name, display_name FROM User WHERE email = 'example1@email.com';
```
## Insert a New Recipe with ingredients and steps:
A simple insertion of the recipes, ingredients, specific ingredient amounts for a recipe as well as instructions.
```sql
INSERT INTO Recipe (user_id, title, description, difficulty, dish_image)
VALUES (1, 'Delicious Pasta', 'A recipe for pasta', 3, NULL);

INSERT INTO Ingredient (name) VALUES ('Pasta'); --insert into the db if it exist just ignore the insert
INSERT INTO Ingredient (name) VALUES ('Tomato Sauce');

INSERT INTO RecipeIngredient (recipe_id, ingredient_id, amount) -- Specific recipe ingredient amount 
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
This would most likely be the hardest part of updating the recipe since the others just requires one to either take away a recipe ingredient, remove a recipe or just remove a step.

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

This is for when a user switches the orders of instructions. Is it needed? no but I would look really cool when presenting it to future employers and ps: fuck my life this was hard to do. Why was it hard to do? Well since I've haven't touched SQL in more than 3 years I forgot the fact that when working with **KEY/UNIQUE CONSTRAINTS** you have to avoid violations so I spent 5 hours just trying to understand why I just couldn't change the pair when I could before, and when was before? That was when `instruction_order` didn't have a constraint and forgot that I changed it to be a UNIQUE pairs along with recipe_id. When thinking about solving constraints it isn't really that hard to solve I could remove the constraint, delete the two `instruction_orders` I want to swap and then insert them normally with the desired index, or create a temp table holding the one value to be swapped, but my thick head wanted to solve this in a more eloquent way. And that being this:
```sql
UPDATE Instruction -- 1 and 3 are the index of our instructions and thus changeable now
    SET instruction_order = (CASE WHEN instruction_order = 1 THEN -3 ELSE -1 END)
    WHERE instruction_order in (1, 3);

UPDATE Instruction -- To fix the **KEY/UNIQUE CONSTRAINTS**
    SET instruction_order = - instruction_order
    WHERE instruction_order < 0;

SELECT * FROM Instruction WHERE recipe_id = 1 ORDER BY instruction_order;
```
And here I'm just swapping the two but now I have the problem of the instructions being out of order and that was solved by just adding the `ORDER BY` key word, but this wasn't really what I wanted, because why would I want to re-order it every time I swap the instructions? The only thing that changed is the text contents. So I slept on it and let it cook. And I was right in letting it [cook](https://preview.redd.it/improving-236-with-a-single-panel-v0-z6qojjzbv2qb1.png?width=850&format=png&auto=webp&s=4c84b14a3df31b347b682c8075abc11e9ad06880), since I actually had an idea of how to solve what I wanted. In other words my original idea of using a temp was the right path forward but instead I needed to over complicate things. So what I did and wanted to was to store the instruction I want to move in a temp table, so when I write over whatever instruction position that new value won't just be copied over when "swapping" them. And what do I mean by that? Well lets look at it like this:

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

Although this way of solving it fits more with what I want to do, learning how to do it in multiple ways is never wrong. I also gained a better understanding of key constraints.
## Add a score to the recipe
[I don't even need to code anything in the backend or frontend (WARNING: LOUD)](https://www.youtube.com/watch?v=7ayDBOAH2HQ). 
```sql
INSERT INTO Score (recipe_id, score) VALUES (1,3);
INSERT INTO Score (recipe_id, score) VALUES (1,2);
INSERT INTO Score (recipe_id, score) VALUES (1,4);
INSERT INTO Score (recipe_id, score) VALUES (2,4);

SELECT AVG(score) FROM Score WHERE recipe_id = 1;
```
There was a couple of use cases I didn't think for, for instance if a score isn't tied to a user then a user can review bomb a recipe which isn't desirable so I tied the `user_id` to a specific `recipe_id` a `UNIQUE` key. Now only authenticated users can rate as well as if the user's score is not null then I would just need to update the table instead oh and i also inserted the round function as to avoid long `REAL` values. Here is the SQL code:
```sql
INSERT INTO Score (user_id,recipe_id, score) VALUES (1,1,3);
INSERT INTO Score (user_id,recipe_id, score) VALUES (2,1,2);
INSERT INTO Score (user_id,recipe_id, score) VALUES (1,2,4.2);
SELECT ROUND(AVG(score), 2) AS avg_score, COUNT(user_id) AS votes FROM Score WHERE recipe_id = 1;
UPDATE Score SET score = 1 WHERE user_id = 1 AND recipe_id = 1;
SELECT ROUND(AVG(score), 2) AS avg_score, COUNT(user_id) AS votes FROM Score WHERE recipe_id = 1;
```
And this is how one would get the score a user has already put on a recipe:
```sql
SELECT score from Score WHERE user_id = 1 AND recipe_id = 1;
```
The idea is, if a user already has a score for a recipe, they can't add a new one put instead update it. I could remove the old row and then insert a new one, which would be easier but I think updating it would be better for obvious reasons.

## Add comments to a recipe as well as chain it
There are no difficulties trying to add a comment but creating a comment chain/thread will maybe.
```sql
INSERT INTO Comments (recipe_id, user_id, message, parent_id, timestamp) 
VALUES (1, 1, 'This tasted 😋', NULL, '2023-09-28 11:31');

SELECT * FROM Comments WHERE recipe_id = 1;
```

What I want is for the comments to all load in with the recipe page which can be performed with the select statement above (some tweaks are need though), but I don't really see how I could play out on the frontend side of things. An idea is that after I've loaded in all the comments without a `parent_id` and I would then load in all the replies that have a `parent_id` value, something like this for example:

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
FROM CommentHierarchy;
```
With this I would get a proper comment chain for each `comment_id` even if there are no replies for that comment, the code taken from [stackoverflow](https://stackoverflow.com/questions/39435348/select-comments-and-its-replies-sql-server). Kinda cool that me and the poster had the same table design. So with this code I'm able to display every single chain or non chain that exist with this query. With this recursive code I can load in all the comment. An idea is to limit the recipe page to three comments per chain as to not clutter the page and then have a "continue this discussion on another page" button with that `comment_id` on a new page and if that page isn't enough I would just continue that in another url. I could also not load them in and only do so having a `load comments` button that loads in the replies. I could also just load all the comments with a simple `SELECT` and then just write some backend code to match the corresponding `parent_id` to `comment_id` creating a `children: []` and then use them in the two ideas presented above. Nonetheless processing is required either in the backend, frontend or database no matter how I twist and turn!

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
Nothing issues when saving a recipe for multiple users. I wanted the save the the recipe to a specific `user_name` but what would happen if a user changes their username? Well all the info would be lost or moved to the next person taking that username so tying everything to an id the for the better. I know typing this out probably makes me look stupid but hey, I gotta learn sooner or later!

```sql
INSERT INTO Saved (user_id, recipe_id) VALUES (1, 1);

INSERT INTO Saved (user_id, recipe_id) VALUES (2, 1);

SELECT * FROM Saved
```
## Extra update stuff:
This is the easiest part of the Database just update whatever and call it a day. Users are able to change their username as long as it isn't taken, Recipe can change whatever as well same goes for instructions as I've already established, I'm not sure if I want a bulk change or a section change when editing a recipe page. Delete entries from each table is also possible without any issues as well, after some research. At first I wanted to delete every table that has a `recipe_id` but that would take too long because it should be possible to perform a query likes this that would delete all entries that have a reference to this `recipe_id`.
```sql
DELETE FROM Recipe WHERE recipe_id = 1;
```

And it's possible by adding the following keyword `ON DELETE CASCADE` to each reference that you want it to collapse on, every table that has a `recipe_id` or `user_id` as a foreign key would be deleted when either of these to are. And one thing to note is that SQLite is a little bit weird in the sense that one would need to enable foreign key references. Why? idk really. 
```sql
PRAGMA foreign_keys = ON; -- idk why this is here other than stackoverflow telling me that it needs to be here
ON DELETE CASCADE -- for each foreign key reference
```
# The JSON files would look like the following:
After implementing and testing the database I would also like the following tables to result in some nice `JSON` files to improve my own frontend experience. 
## A Users recipe
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
    AVG(S.score) AS avg_score
FROM
    User U
JOIN
    Recipe R ON U.user_id = R.user_id
LEFT JOIN
    Score S ON R.recipe_id = S.recipe_id
WHERE
    U.user_id = 1 -- This comes from clicked thumbnail
    AND R.recipe_id = 1; -- This would from the title we want to update

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
WHERE r.id = 1 AND (SELECT user_id FROM User WHERE user_name='username'); -- user_name is changeable

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
    "recipe": 
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
}
```
One thing to keep in mind though is that `"children": []` will be implemented in the backend, as I already mentioned [here](https://github.com/urostripunovic/share-recipes-now-backend/blob/main/public/db%20queries.md#add-comments-to-a-recipe-as-well-as-chain-it).

## User JSON
This file will display the information related to the user that are authorized to see their edit page i.e the **session**. This will display their recipes and saved recipes as well as the comments they've posted and if they want to create a new recipe the user_id from the session will be used. I'm not sure if I want the user to be taken to de "edit" page or "view" page when clicking on their own recipes, a design decision for later. 
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

## Search Field JSON
This query will return the ingredients in the database that were used to create a recipe. I would like the user to click on all of its results to see where this ingredient has been used. To work with search query SQL has a key word called `LIKE` together with `%%`.
```sql
SELECT name FROM Ingredient WHERE name LIKE '%tomato%';
```
And the JSON would look like the following if I only wanted the filter the ingredients:
```JSON
{
    "ingredients": [
        "name"
    ]
}
```
If by chance there are no ingredients when searching then there are no recipes with that ingredient, but if you instead want to search for a recipe you should be able to do that as well. I wasn't sure with how I would implement this but it would be easy to do because the database is built up in a good way that enables this, but my problem was how I would solve this in the frontend while still providing a good UX. So this is my idea: adding two search results that a user can alternate between, one for when searching an ingredient and another for when searching the title of a recipe so a toggle button in the search field. The user should be able type in whatever and the search results should give a couple of recipes from either the recipe title or ingredient it contains. ***I need to keep in mind how the API end point would look like as to avoid DRY***. **Also I need to look after whitespace so that it doesn't mess with the search results**. Or I could just enable both when typing in the search bar. The recipe query would look something like this and frontend would for example show the first three uniquely named recipes, when clicking will take the user to a "view" page, then at the bottom of a recipes a button for view all results of the typed string/query. 
```sql
SELECT U.user_id, U.user_name, R.recipe_id, R.title, R.dish_image, R.time 
FROM Recipe R
JOIN User U ON R.user_id = U.user_id
JOIN RecipeIngredient RI ON R.recipe_id = RI.recipe_id
JOIN Ingredient I ON RI.ingredient_id = I.ingredient_id
WHERE I.name LIKE '%pear%' -- OR R.title LIKE '%pasta%', both or alternate 
GROUP BY R.recipe_id;
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
## Search page JSON
If a the user instead clicks on show results, they would be sent to a new page of all the recipes of their search result. And when looking at both of these queries they are pretty much the same and the only thing that's different is that I'm adding a score... So when push comes to show I'll see how I can avoid DRY when passing data between routes. 

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
  I.name LIKE '%pasta%' -- OR R.title LIKE '%pasta%', both or alternate 
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
## Top Recipes JSON
This file will return the top rated recipes for the site, a rating above 4.2 I think... Yeah that's good enough.
```sql
SELECT 
    U.user_id,
    U.user_name,
    R.recipe_id, 
    R.title, 
    ROUND(AVG(score), 2) AS avg_score,
    R.difficulty,
    R.time,
    R.dish_image
FROM Recipe AS R
LEFT JOIN Score AS S ON R.recipe_id = S.recipe_id
INNER JOIN User AS U ON R.user_id = U.user_id
GROUP BY 
    R.recipe_id
HAVING avg_score >= 4.2;
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
## Less Than 30 min Recipes JSON
This file will return recipes that take less than 30 min to cook. The funny thing is that the SQL code is exactly the same so there will be only one part in the backend where I change the code as to avoid duplicate code, it's duplicate now just to display that it is, mostly for my own purposes.
```sql
SELECT 
    U.user_id,
    U.user_name,
    R.recipe_id, 
    R.title, 
    ROUND(AVG(score), 2) AS avg_score,
    R.difficulty,
    R.time,
    R.dish_image
FROM Recipe AS R
LEFT JOIN Score AS S ON R.recipe_id = S.recipe_id
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
So yeah... If you've made it to the end of the page then [nice](https://www.youtube.com/watch?v=3WAOxKOmR90), Hopefully my grammar isn't that broken but what's important is that you understood my code. I haven't touched SQL in years so if you have any ideas on how I could improve it don't hesitate to create a pull request or message me. To goal of this project is to learn!