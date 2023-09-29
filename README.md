# share-recipes-now-backend
Backend for the share-recipes-now. Tech stack used is [Node.js](https://nodejs.org/en) together with the [Hono.js framework](https://hono.dev/). The database in use is [SQLite](https://www.sqlite.org/index.html) and I might also use [Drizzle](https://orm.drizzle.team/) to try it out. 
## TODO
- [x] [Formulate the database](https://github.com/urostripunovic/share-recipes-now-backend/blob/main/public/Database.md)
- [x] Design the [database](https://github.com/urostripunovic/share-recipes-now-backend/blob/main/public/db%20diagram.png)
    - Look up what [index](https://www.sqlitetutorial.net/sqlite-index/) is and how it might improve the performance. ***Having UNIQUE, FOREIGN and Primary KEYS already help with indexing I don't need specific ones.***
- [ ] Reevaluate the database
    - [x] Test out the database [on a browser](http://sqlfiddle.com/) or on vscode
        - [x] User
        - [x] Create a recipe with a couple of ingredients, instructions and score
            - [x] Instructions: Insert, Delete, Swap
            - [x] Different usernames with same title (Will work)
            - [x] One user with the same title (Won't work)
            - [x] Score multiple recipes
        - [x] Comments: Comment, Chain, all Comments
        - [x] Recipe: multiple user save one
    - [ ] [Create a mock json for how something could look like](https://github.com/urostripunovic/share-recipes-now-backend/blob/main/public/db%20queries.md#the-json-files-would-look-like-the-following)
        - ~~User, Recipe, Top Recipes, Less than 20 min Recipes~~, Search
- [ ] ~~Update the [database image](https://github.com/urostripunovic/share-recipes-now-backend/blob/main/public/db%20diagram.png)~~ I honestly couldn't be bothered the file is in the repo, its updated.
- [ ] Play around with Hono.js to understand it.
- [ ] Create units test for the same db queries before implementing the backend.
    - [ ] Session test pronto.
