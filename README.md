# share-recipes-now-backend
Backend for the share-recipes-now. Tech stack used is [Node.js](https://nodejs.org/en) together with the [Hono.js framework](https://hono.dev/). The database in use is [SQLite](https://www.sqlite.org/index.html) and I might also use [Drizzle](https://orm.drizzle.team/) to try it out. 
## TODO
- [x] [Formulate the database](https://github.com/urostripunovic/share-recipes-now-backend/blob/main/Database.md)
- [x] Design the [database]()
    - Look up what [index](https://www.sqlitetutorial.net/sqlite-index/) is and how it might improve the performance
- [ ] Reevaluate the database
    - [ ] Test out the database [on a browser](http://sqlfiddle.com/) or on vscode
        - [ ] Create a user 
            - [ ] Different users and one with the same email/username
        - [ ] Create a session
        - [ ] Create a recipe with a couple of ingredients, instructions and score
            - [ ] Different usernames same title 
            - [ ] One user with the same title
        - [ ] Save a Recipe for a user
            - [ ] Save the same recipe for multiple users.
        - [ ] Create a comment
            - [ ] Try a comment chain
- [ ] Play around with Hono.js to understand it.
