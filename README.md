# share-recipes-now-backend
Backend for the share-recipes-now. Tech stack used is [Node.js](https://nodejs.org/en) together with the [Hono.js framework](https://hono.dev/). The database in use is [SQLite](https://www.sqlite.org/index.html). This backend supports complete CRUD operations when it comes to create users, recipes, comments, update them, delete them as well as read them. There will be documentation for how the database was formed, created and tested as well as documentation how the Node.js backend server is set up along with an explanation for each REST API end point.
## TODO
- [ ] Look into how update would work together with backend (UPDATE).
- [ ] Start setting up CRUD operation as well as unit tests.
- [ ] Look into SQLite and how to implement in with Hono.
    - Apparently there are npm packages of how to use SQLite: [sqLite,(and/or?) sqlite3](https://www.npmjs.com/package/sqlite) and [better-sqlite3](https://www.npmjs.com/package/better-sqlite3). I would need to read up on how to use it.
- [x] Play around with Hono.js to understand it.
    - Refresh and Access tokens. ✅
    - Research middleware for cookie solution. ✅
    - JWT with either cookies or local storage. ✅
    - Simple get, post, put, patch and delete. ✅
- [x] Reevaluate the JSON files and sql queries. 
- [x] Update the [database image](https://github.com/urostripunovic/share-recipes-now-backend/blob/main/public/db%20diagram.png) ~~I honestly couldn't be bothered.~~ I could be bothered
- [x] [Create a mock json for how something could look like](https://github.com/urostripunovic/share-recipes-now-backend/blob/main/public/db%20queries.md#the-json-files-would-look-like-the-following)
- [x] Test out the database [on a browser](http://sqlfiddle.com/) or on vscode
    - [x] User
    - [x] Create a recipe with a couple of ingredients, instructions and score
        - [x] Instructions: Insert, Delete, Swap
        - [x] Different usernames with same title
        - [x] One user with the same title
        - [x] Score multiple recipes
    - [x] Comments: Comment, Chain, all Comments
    - [x] Recipe: multiple user save one
- [x] [Formulate the database](https://github.com/urostripunovic/share-recipes-now-backend/blob/main/public/Database.md)
- [x] Design the [database](https://github.com/urostripunovic/share-recipes-now-backend/blob/main/public/db%20diagram.png)
    - Look up what [index](https://www.sqlitetutorial.net/sqlite-index/) is and how it might improve the performance. ***Having UNIQUE, FOREIGN and Primary KEYS already help with indexing I don't need specific ones.***
