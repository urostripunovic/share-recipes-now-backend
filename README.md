# share-recipes-now-backend
Backend for the share-recipes-now. Tech stack used is [Node.js](https://nodejs.org/en) together with the [Hono.js framework](https://hono.dev/). The database in use is [SQLite](https://www.sqlite.org/index.html) and I might also use [Drizzle](https://orm.drizzle.team/) to try it out. 
## TODO
- [x] [Formulate the database](https://github.com/urostripunovic/share-recipes-now-backend/blob/main/public/Database.md)
- [x] Design the [database](https://github.com/urostripunovic/share-recipes-now-backend/blob/main/public/db%20diagram.png)
    - Look up what [index](https://www.sqlitetutorial.net/sqlite-index/) is and how it might improve the performance
- [ ] Reevaluate the database
    - [ ] Test out the database [on a browser](http://sqlfiddle.com/) or on vscode
        - [x] Create a user 
            - [x] Different users and one with the same email/username
        - [ ] Create a recipe with a couple of ingredients, instructions and score
            - [ ] [Create a mock json for how something could look like](https://github.com/urostripunovic/share-recipes-now-backend/blob/main/public/db%20queries#the-json-file-would-look-like-the-following.md)
            - [x] Instructions
                - [x] Insert new instructions
                - [x] Delete instructions
                - [x] Swap instructions
            - [x] Different usernames with same title (Will work)
            - [x] One user with the same title (Won't work)
            - [ ] Score multiple recipes
                - Standard
        - [ ] Save a Recipe for a user
            - [ ] Save the same recipe for multiple users.
        - [ ] Create a comment
            - [ ] Try a comment chain
            - [ ] Get comments for a recipe
- [ ] Play around with Hono.js to understand it.
- [ ] Create units test for the same db queries before implementing the backend.
    - [ ] Session test iaf.
