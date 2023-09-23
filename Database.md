# Database
This markdown explains what tables will exist, explaining what each table will do as well as give ideas and hints as how each table relates to one another. I won't explicitly type out what who the primary- and foreign keys are 'cos some of them are a given. I will though provide a [image]() of how I've design the database, since it's harder to over/under design the database when I'm not really 100% sure what I want in the database by the time I'm typing this document out. 

#### Users
This table handles user registration, authentication, and user profiles. It covers the basic user-related functions.

#### Session
This table handles user session.

#### Recipes
This table manages the creation, updating, and deletion of recipes and stores details about each recipe, including title, description (Instructions), difficulty level, time, and images. The connection to users who have created the recipes is important to track the owner of the comment.

#### Instructions
This table enables structured step-by-step descriptions of the recipe. It allows detailing how to prepare the recipe in a step-by-step manner.

#### Comments
This table enables comments on recipes and contains information about when the comment was made. The connection to specific recipes and users is necessary to correctly associate comments.

#### Recipe Ingredients
This table manages the quantity and types of ingredients needed for each recipe. It is an essential part of describing how to make a recipe. Here, we link a recipe with its various ingredients as an intermediary.

#### Ingredients
This table is used to list and detail the ingredients used in recipes and can be linked to recipes to specify which ingredients are included in each recipe.

#### Saved Recipes
This table allows users to save their favorite recipes and keeps track of which users have saved which recipes. It provides users with a personal list of saved recipes.

#### Recipe Score
This table handles the ratings that users give to recipes and can be used to calculate the average rating for each recipe. It links ratings to both users and recipes to track who has given what rating.

