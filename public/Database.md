# Database
This document explains what tables will exist, explaining what each table will do as well as give ideas and hints as how each table relates to one another. I won't explicitly type out what and who the primary- and foreign keys are 'cos some of them are a given while others will come as I design the database. There will be an [image](https://github.com/urostripunovic/share-recipes-now-backend/blob/main/public/db%20diagram.png) of how I've design the database. It's harder or easier to over/under design the database when I'm not really 100% sure what I want in the database, but everything will be come clearer as I'm creating it. 

#### Users
This table handles user registration, authentication, and user profiles. It covers the basic user-related functions. Indexing is not needed for this table as **Users** are not the star of this show.

#### Session
This table handles **User** session. I might not use this one since there are alternatives like [JWT](https://jwt.io/) but I would need to look more into it.

#### Recipes
This table manages the creation, updating, and deletion of recipes and stores details about each recipe, including title, description (Instructions), difficulty level, time, and images. The **User** can create multiple recipes and multiple **Users** can comment on a recipe as well. Multiple **Users** can also save the same recipe, **Users** can also score a recipe but tracking them isn't needed. *Index could be used here when using a search bar*.  

#### Instructions
This table enables structured step-by-step descriptions of the **Recipe**. It allows detailing how to prepare the recipe in a step-by-step manner.

#### Comments
This table enables comments on a **Recipe** and contains information about when the comment was made, who made the comment and of course what the comment contains. **Users** should be able to reply to comments creating a comment chain (how hard this will be to implement I have no clue. Might restrict it to just the owner of a recipe answering comments).

#### Recipe Ingredients
This table manages the quantity and types of the **Ingredients** needed for a **Recipe**. It's an essential part of describing how to make a recipe. Here, I link a recipe with its various ingredients as an intermediary as to not clutter the **Ingredients**-table with different quantities and types.

#### Ingredients
This table is used to list the ingredients used in **Recipes** and can be linked to **Recipe-** to specify which **-Ingredients** are included in each **Recipe**. This table will also act as a list of all currently available ingredients in the database that gets filled up as people continue to create recipes. *Index could be used here when using a search bar*.

#### Saved Recipes
This table allows **Users** to save their favorite **Recipes** and the **User** keeps track of their saved **Recipes**. It provides **Users** with a personal list of saved **Recipes**.

#### Recipe Score
This table handles the ratings that **Users** give to **Recipes** and can be used to calculate the average rating for each **Recipe**. It doesn't link ratings to **Users**, only **Recipes** to ensure that the creator of a recipe doesn't hunt down a user who left a bad score.

