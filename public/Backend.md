# Hono framework + Node.js runtime
This document is here to write out my thoughts and prayers like with the db queries document. I'll share some of my problems as well as how I solved them. I'll also write up a API document but that will have to wait.

## Basics of Hono and authorization
Well it works which is nice, but this is the first time i'm learning how to actually try out my APIs other than a simple get. I used [Insomnia](https://insomnia.rest/) to try out the API end points of get, post, put and delete. One could also use [Postman](https://www.postman.com/) but I'm sticking with Insomnia for now. All HTTP methods work as intended.

Hono some other cool features like authentication from the server instead of of the frontend which lessens the amount of code in the browser. I tried out Basic Auth which seems to be good when working with an admin page but as a user getting a pop up isn't that appealing maybe I could authorize it in some other way for a user to access their own page and edit page. And there is it's called [Bearer Auth](https://swagger.io/docs/specification/authentication/bearer-authentication/) where the user has a token and with that token a user is able to access certain resources but the question is then how do I create this token and how do I send one for each user that has a session? Well when it comes to creating the token it's just a **plain string** meaning anyone can crack it so this token needs to be sent over a secure site and is generated on the server so the string could be a [JWT token](https://hono.dev/middleware/builtin/jwt) and I would need to send it to a user with the [cookie header](https://blog.logrocket.com/jwt-authentication-best-practices/), where the token is then used as authorization to fetch resources from the users payload data. I will be using a JWT token instead of a row in the database because it's faster and hopefully more secure than me implementing security measures since I can only think of so much. The JWT payload data would look something likes this:

```JSON
{
    "user_id",
    "user_name",
    "expires_in"
}
```
From researching about Hono I found out that they are all about bundle size. So I would need to import [JWT helpers](https://hono.dev/helpers/jwt) and [Cookie helpers](https://hono.dev/helpers/cookie) for authentication. And after reading these articles briefly, I would need to set the cookie when a user logs in, authenticate that cookie to ensure that only logged in users can perform certain actions as well as only the indented users can edit their recipe as well as view their profile. So I'm just spitballing some ideas here, if the cookie payload's `user_id`/`user_name` or both together fit with the url params then a user can edit the page. If a user wants to comment or save a recipe they would need to be logged in i.e have a cookie. If a user wants to rate a recipe they can do so but it will only register if they have a cookie. 

### Working with cookies
To be honest I don't know how to auth with a cookie so a little research is in order. The way I understood it is when I make a login request and if I succeed a cookie will be sent back from the server this cookie is then put in my cookie jar at the document level so when I perform request from here on out it would be validated or not, and example of this is mentioned in this [stackoverflow link talking about axios](https://stackoverflow.com/questions/43002444/make-axios-send-cookies-in-its-requests-automatically) and I need to make sure that my middleware of `cors()` isn't set to wildcard, but is a comment from 2017 if things go wrong I would know why. If you don't want to bloat the code base with more code there is a lightweight version of axios called [redaxios](https://www.npmjs.com/package/redaxios). What If I don't want use axios, would I need to implement my own logic for how I retrieve the cookie? Here are some moore code examples, [the first one being axios and the second one plain old fetch](https://stackoverflow.com/questions/66892622/get-cookie-on-front-end):
```JS
try {
    await axios.get("some url", {
        withCredentials: true,
    });
} catch (error) {
    console.log(error);
}
```
```JS
fetch("some url", {
  method: "GET", 
  headers: {
    'Content-Type': 'application/json' 
  },
  credentials: 'include'
});
```
Apparently one could implement their logic of retrieving cookies but that is if one would want fine crumb control over it. And the example could look like the following:
```JS
localStorage.setItem('token', token); //get the token from the fetch or axios.
localStorage.removeItem('token'); //the token could also be removed during a sign out for instance.

fetch("some url", {
  method: "GET", 
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`
  },
});

//The server code
app.use(
    "/api/*",
    jwt({
        secret: process.env.ACCESS_TOKEN_SECRET,
    })
);

app.get("/api/page", (c) => {
    const payload = c.get("jwtPayload");
    return c.json(payload); // eg: { "sub": "1234567890", "name": "John Doe", "iat": 1516239022 }
});

```
I got this example to work with Insomnia but not the other two, Some more testing is in order. The reason for the two not working is that I would need to add a [cookie-parser](https://www.npmjs.com/package/cookie-parser) middleware to the server (Express.js) and then have some authorization logic to validate the token. And I'm kind of in a pinch, from a [article](https://coolgk.medium.com/localstorage-vs-cookie-for-jwt-access-token-war-in-short-943fb23239ca) I read local storage is a solution for phone users as well while cookies only work for the browser but are more secure and less prone to XSS attacks. And then there is another [article](https://www.socialmediatoday.com/content/cookies-mobile-do-they-exist) that says that cookies are possible if they use the A browser meaning that a cookie isn't cross dimensional for phone users. But working with cookies then allows for CSRF attacks but I know that Svelte has implement counter measures against this thankfully and the app I'm creating doesn't really have XSS entry points since svelte sanitizes the inputs as well unless I'm using the `@html`-tag. So then the question remains... what would I need to add to Hono so that I can use cookies on the server instead? Hono has their own support for jwt and cookies so I might not need to download anymore packages.

```JS
app.post("/test", async (c) => {
    const token = await sign({ user_name: "para knas" }, process.env.ACCESS_TOKEN_SECRET);

    setCookie(c, "token", token, {
        httpOnly: true,
        secure: true,
    });

    return c.json({ msg: "user logged in", token }, 200);
});

app.get("/test", async (c) => {
    const token = getCookie(c, "token");

    if (!token) return c.json({ msg: "unauthorized" }, 401);

    const { user_name } = await verify(token, process.env.ACCESS_TOKEN_SECRET);

    return c.json({ user_name }, 200);
});
```
If I were to change the name of our token to `token1` when getting it then the server will spit out a unauthorized message. So there was no need to add any middleware since Hono has it implemented already. I only need to add better authorization logic and if I want to add that logic to a whole route I would need to create my own middleware and also lookout as to not try and use `withCredentials` and `credentials` on wildcard routes. Hono also has their own [Custom Error Types](https://hono.dev/helpers/jwt#payload-validation) that display if anything is wrong. So how would I go with implementing my own middleware, we need to have a secure routes for when a user wants to perform something. It could look something like this:

```js
app.use("/test/*", async (c, next) => {
    const token = getCookie(c, "token");
    if (!token) return c.json({ message: "No token found" }, 404);

    try {
        const json = await verify(token, process.env.ACCESS_TOKEN_SECRET);
        c.set('user', json)
        await next();
    } catch (error) {
        deleteCookie(c, "token");
        return c.json({ success: false, msg: error.message }, 403);
    }
});
```
This is the middleware it worked for everything in this route and since I'm using TypeScript it won't like `c.req.user` since it doesn't exist in Hono, maybe they have a better way of doing this I don't know but if they do I'll update my code accordingly. But this is the wildcard approach and as we established using `credentials` and `withCredentials` can pose some issues and I need to make sure that the route that gives out a cookie isn't under that authed route. I also wrote the middleware as a function as well if I wanted to add them to only specified CRUD routes:
```js
async function cookieAuth(c: Context, next: Next) {
    const token = getCookie(c, "token");
    if (!token) return c.json({ message: "No token found" }, 404);

    try {
        const json = await verify(token, process.env.ACCESS_TOKEN_SECRET);
        c.set('user', json)
        await next();
    } catch (error) {
        deleteCookie(c, "token");
        return c.json({ success: false, msg: error.message }, 403);
    }
}
```
One thing to keep in mind is that my custom middleware is async so I would need to update my get route to the following so that TypeScript doesn't complain:
```js
app.get("/test", cookieAuth, async (c) => {
    try {
        const { user_name } = c.get("user");
        return c.json({ user_name }, 200);
    } catch (error) {
        return c.json({ error: "Internal Server Error" }, 500);
    }
});
```
I could also add a proper try catch block to handle if `c.req.user` doesn't exists but the documentation has [getters and setters](https://hono.dev/api/context#set-get) that can be passed from the middleware. I read about them when researching but applied Express.js knowledge so I just ignored them, I guess that's inexperience for ya.

I decided to look into access tokens and refresh tokens. Before I can try refresh tokens I first need to setup SQLite. If one wants to work with refresh tokens they also need a access token, this access token can not be accessed via JavaScript so it's `httpOnly` (like we did earlier) and the refresh token is stored in a database. The access token has a short ttl while the refresh one has a longer ttl. ***So for every API end point call the access token is checked, if it's valid proceed, if not check if the refresh token is valid and then provide a new access token, if the refresh token is not valid then require the user to login again and delete all tokens related to that user in the database to ensure better security. The access token is sent like the examples above. The refresh token is stored in a database.*** I feel like this wouldn't really be an issue to implement but the support for cookies from Hono isn't really that optimal, my token has an expiration date of 1 month. So what I'm going to do is code like i initial wanted, storing the "refresh" token (long ttl) as a cookie, I have the Session table set up and most of the code is also finished, all that is left is implementing the text highlighted in this section. But the major issue is the expire date on on jwt token, I can set a expire date on a cookie but that would require some logic to implement but the date I want to check is the jwt token not the cookie. What I could do is import the [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) npm package and use it's `expiresIn` method to add access and refresh token, but that seems like a really unnecessary band aid fix and it could also be that Hono isn't really the backend framework I need when looking at other frameworks like [ElysiaJS](https://elysiajs.com/plugins/jwt.html#jwt-sign) they have expiration support. And I was able to add an expiration date the logic wasn't that hard to do other than the fact that my numbers were a tiny bit to high for JWT, I thought JWT used milliseconds but they used seconds... the exp and iat times were years ahead which was kinda funny. But here is the code:
```js
const iat = new Date().getTime() / 1000; //issued at time
const exp = iat + 1; //increase the amount of x seconds, x*60 minutes, x*60*60 hours, x*24*60*60 days

const token = await sign(
    { user_id: 1, user_name: "para knas", iat, exp },
    process.env.ACCESS_TOKEN_SECRET
);
```
There is not need to download the jsonwebtoken npm package but I'm not gonna lie the DX was a lot better with the package. The with this code I should be able to implement access and refresh tokens but with no database there's nothing to test. I'll either try and implement this once the db is up an running on once the project is done, but we all know from how I've done things so far, I'll most likely do it. [And my future employer would be impressed with the attention to detail](https://tenor.com/sv/view/wink-wink-nudge-nudge-monty-python-wink-signal-gif-5500109). You know what... [I implemented my own `expiresIn`](https://github.com/urostripunovic/share-recipes-now-backend/blob/main/src/utils/jwtExpires.ts), LOL, it's not as good as the npm package but good enough for me since I won't need to rewrite the exp variable constantly. Why did I do it? Well I was watching Asoka, the first 10s and then I thought of just solving this 'cos I honestly wanted an expiresIn, [I became the meme I was laughing at a couple of weeks ago...](https://miro.medium.com/v2/resize:fit:720/format:webp/1*6Oyig2ACF-unC3R-CXT8jw.jpeg). 

So, to close of this Hono+auth+cookie venture I ran into an issue with the JWT not working at first with a [strong secret key](https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs) it only worked when my secret was `test` which is really weird since that was the first one I used. And I got it working by literary turning the server on and off... In summary, Hono works well, env variables work, the REST operations work, auth works as well as when trying it out in Insomnia, implementing my own middleware was new I followed the principles of Express.js and it turned out well, and looking into the abyss that is security damn... I learnt a lot and I can say I'm better off for it as well. With the basics 'done' (haven't forgotten you access and refresh token), I can now move on towards to implementing the SQLite database.

## Working with SQLite and Node.js
Well researching about SQLite for node gave a couple of results, apparently there are two SQLite npm packages that do the job, [sqlite3](https://www.npmjs.com/package/sqlite3) and [better-sqlite3](https://www.npmjs.com/package/better-sqlite3). One would think that the one name better is better? And indeed it is is, where is the issue where the author [explains it](https://github.com/WiseLibs/better-sqlite3/issues/262) but to explain it beefily, better DX, that's it, I'm not gonna test sqlite3 when there is a better option out there.

My database file didn't work so I had to follow this [tutorial](https://www.guru99.com/sqlite-database.html) so that it would work... a little bit annoying that one can't just have a sql- or db file to get it working but it seems like sqlite files are encrypted or something, idk but it works at least. This is the code for setting up the database nothing really out of the ordinary:
```js
import Database from "better-sqlite3";
import path from 'path';

const db = new Database(path.resolve('test.db'), { verbose: console.log });
const stmt = db.prepare("INSERT INTO User (email, user_name, password) VALUES (?, ?, ?)");
stmt.run('user@example.com', 'username', 'password123');
const user = db.prepare('SELECT * FROM User WHERE user_id = ?').get(1);
console.log(user);
```
One thing to keep in mind though is that you can drop tables with SQLite, you'd need to delete the whole database to be able to do that. While developing I'll use a test db as to not clutter the whole thing. But I'm already prepared for one thing... and that is the shit show that will ensue if i decide to change any of the  table in the database... But now to the fun part of populating a bunch of tables and then joining them to get a proper JSON object. It's a good thing that I've already done the heavy work in the documentation of [db quires](https://github.com/urostripunovic/share-recipes-now-backend/blob/main/public/db%20queries.md), this will be a cake walk. 

I've noticed something when I want to create a recipe, I need a `recipe_id` before I can add the Instructions and RecipeIngredients so a recipe would first need to be created before instructions and RecipeIngredients can be added. I also had the trouble of how I could add ingredients that already exist since I do want my database to be robust and be able to remember all ingredients and it was easy all I needed was something called `IGNORE` which I found on [stackoverflow](https://stackoverflow.com/questions/64053514/sqlite-insert-or-ignore-doesnt-ignore-duplicates). Meaning that users are able to insert duplicates but the database will ignore them.

I also found on issue with how I would add recipe ingredients with only the ingredient id, having only the name could lead to spelling errors and new ingredients cluttering the table. So I thought of the idea that when one first creates a recipe there will be two fields one for amount and the other ingredient, the Ingredients table will be queried to see if the ingredient exits and if it does it will provide an ingredient_id that will be stored in an array the same size of the recipe ingredient list so far. If the ingredient doesn't exist it will first insert the ingredients and then return their ids and in this way I can then fill up the RecipeIngredient table for a recipe of a user but what about combinations? let's say some ingredients exist and others don't? I don't know yet how I would solve it. The best thing to do would be to fill up the Ingredients table with ingredients and in that way avoid this hassle but we'll see how it solve this.

Other than that the connection to the database is done, I can put and add what every all that is left setting up the code with better-sqlite3 which isn't that hard to do. The next step would be how to implement and design the api end points.
## API end points/routes
UX would look something like this: 
- a user creates a recipe, this gives a `recipe_id` a score of zero is also created, 
- The user has a search field for an ingredient that queries the database if the ingredient doesn't exist then though luck but if a user wants to add a ingredient then they can do so using a route post route more on that later. And then a user just adds the specified `amount` for each `ingredient_id` that the database has put out. 
- Last step is to provide a list of instructions. The user can add a new one for each click 


These are the routes that will be roughly implemented some will be in steps while others is one API call. 
- Implement the api.ts file or not see how easy it is. Implement all the types and import them where needed
- Implement a rate limit for login, there is a [npm package for it using redis](https://github.com/upstash/ratelimit#install) or [create my own rate limit using redis](https://medium.com/@elangoram1998/create-a-rate-limiter-using-node-js-express-js-and-redis-cache-b5a0f7debf2b)
- Redo the comment table to ensure that the comments reset for each post and that they have a unique key with their recipe, test it out as well
- Change all end points to routes with their corresponding database calls to functions for readability and testing.
- One for the user to update their recipes, RecipeIngredient, Instruction and Recipe
- One to create the recipe of a user_id with title, description, difficulty, dish_image
    The next step are the following to fill up the recipe:
    - One to add the RecipeIngredient/Ingredient (Ingredient will autocomplete if it doesn't exist it will insert or else just insert into RecipeIngredient)
        Make sure to also when inserting that Ingredient query runs first and then RecipeIngredient query.
    - Instructions 

### Create a recipe

### AWS Bucket
Well I stopped upload pictures to the database, now they're in a bucket. And to be honest I liked my solution better although some npm packages were required it felt like a pretty good solution honestly but this is a more scalable approach, a scale I'll never achieve with this website + the aws documentation is trash. 

### Access user information
Easy as pie, works great with the auth as well, the auth is also type safe using Honos examples from github, basically I did what they did when creating their middleware.

### Increased security and performance
I came across this reddit thread where someone asked if they could [roast their express server](https://www.reddit.com/r/node/comments/17eg2m5/roast_my_serverts_code_of_express_and_what_to/). And in this thread I could see my own node server being roasted, no security headers like [helmet.js](https://helmetjs.github.io/), but Hono has their own version of it, or api rate limits to stop brute force attacks, well I thought of implementing it but Hono doesn't have a rate limit implementation so I'm required to implement one myself which will be insightful. If I want to increase [performance](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/performance.md) I would need to enable WAL mode for concurrent reads as well as look out for checkpoint starvation of when the database becomes to big, for this project it's unnecessary since I won't have a large user base but trying it out doesn't hurt. So at what size do I consider a database to be large? Well 2gbs sounds pretty big right? And if we do the math of having a profile pic being 2mbs and a recipe image being 6mb. If we only upload pictures then the db can store 1024 profile pictures, if a were to only have recipe images that would be 341 recipe pictures. If I want a 50/50 split between profile pics and recipe pics that would be around 256 users, where each user is only allowed to create one recipe which is stupid, but since this is a hobby project storing a bunch of image should be acceptable right? Yes and no, I know that you shouldn't store images in the database and the optimal solution is to store them in something like AWS S3, but that requires a credit card and currently I'm poor, like really poor and if some schmuck decides to attack me it could ruin my already non existent financial situation. So this is the end when comes to storing images the correct way... Well not really 'cos apparently they accept pre paid credit cards for some reason, I went to my local gas market and asked if they could sell me a pre paid credit card, the cashier looked at me and said, there is no point in buying these 'cos they are discontinued as to avoid money laundering, mfer thought I was a criminal. I went to another gas market, asked the same thing and they told me no we don't sell them anymore, as the looked at me all suspicious. And then I went to the third gas market same franchise and saw that they had them on the wall I took it and asked if I can buy one, the cashier looked at me said yes, I paid and ask about how to activate it and she just activate it online don't worry you don't need any ID to validate that its you buying it... So now I can store images probably in the cloud without bloating the database. But there was one thing bothering me, how large is a large database then? Well it depends again on what type of data you have in there but somewhere above 50gbs so what I tried to do was optimizing my database for 2gbs because I read somewhere that concurrency isn't that great with SQLite especially as it becomes larger... I will never achieve those heights but at least I know that when and where to look when it comes to optimizing SQLite databases. 

### Login / Logout
Not gonna lie having to perform some good security checks when working with jwt and cookies was a lot harder than I expected. For starters you need a access token that is short lived and than a refresh token that isn't. The refresh token is stored both on the browser and the database, on the browser it's http only and in the database it's not... The access token is stored in the browser but the more you read about access token the more confusing it gets, it stored on the browser and it might or might not be okay for it to be accessed via JavaScript, so which is it? Idk really but I think having it be httpOnly is the best course of action and more secure that way. The implementation of rotation tokens wasn't that hard to do, it required some thought put into it, like if they have a forged token with a user_id it is best to delete the tokens related to that user, the next step would be to then issue out new access tokens each time they expire, for security reasons you know, and while we're at it it's also better to then rotate the refresh tokens for even more security so the only times a refresh token expires is if the user hasn't been logged in for a while. This doesn't eliminate the security risks but it does mitigate them a lot more. Then the question became how would I in the frontend know when to use the refresh token api end point? And well of course [stackoverflow](https://stackoverflow.com/questions/67957291/when-should-we-refresh-access-token-in-frontend) has asked the question, what I need to do is to on the frontend wait for a 401 response and then try and issue a new access token, if the refresh token has expired then it's a redirect to the log in page again but this is for when the frontend is working with the api end points.

Logout is always the easiest part when it comes to API endpoint implementation, delete the cookie from the browser and database and call it a day.

### Creating separate routes + rendering images from buffers
Honestly at this point the code had close to 400 lines of code. I need to clean it up, it was getting hard to read. There are a bunch of files but at least the code is no more readable and not a complete mess.

Rendering the image as a buffer was so much harder to do 'cos I didn't actually read or understand what it was I sent into the database. What I'm sending in to a database is a buffer that only the computer can understand which is binary, I then need to translate that buffer so that the html can understand it as a string so that it renders properly, which can be done in a number of ways. Normally when working with images you need to pass in a url, be it a file path or an url image from a server, so the first approach was to pass in a url and how would one do that? Well you get the url from the window of [course](https://www.youtube.com/watch?v=Zt-Ql9ZE2XI), it didn't work 'cos I'm on a server... Yeah I'll leave it there. The next approach is to then instead send in a [data URI scheme](https://en.wikipedia.org/wiki/Data_URI_scheme), the syntax is simple:

```html
<img src="data:content/type;base64," alt="Randy's balls"/>
```
So first we tell the src that we have a url/uri of type data, next we need to specify what type of media type will be embedded on the browser here you can use what ever like `.png` or `.webp` doesn't matter but the general idea is to display the type. Then you tell it that the image is binary data and after the trailing comma you add the image as a base64 string! Also I didn't know how to get the mime type without forcing a webp compression but there is a npm package out there called [file-type](https://www.npmjs.com/package/file-type) so there is that. Ngl I actually wanted to create my own file-type reader for files like `.pjp` and other weird ones but instead I'll just reprocess them as webp even though there will be a loss in quality. But the general idea is to process the image on the server by bringing less javascript to the browser, there might also be some server side rendered html as well to lessen the javascript even more. 

So after a day of thinking about this an researching this further even thought it wasn't really necessary, I came to the conclusion that the general consensus when working with images is to **not** store them in the database, 'cos of "performance" reasons, there is a little bit more to it but this is the main reason. I could use a cloud service provider to store my images and then store the image url in the database but that costs money, money that I don't have. So my brilliant idea was to approach this in two different ways. The first one was with data uri as explained above but the question becomes do I store the BLOB in the database or the base64 string? There is less characters in the database when storing a BLOB but when querying arrays would require a extra loop to process the images, for a small project that is fine since I won't have 700 recipes that need to have their image processed and I also have to prevent people form uploading 10gb images... yeah that is also something to keep track of. So since I'm poor and I want to have a scalable solution changing it to a base64 string seems to be the happy middle ground, but still not the optimal solution, the best course of action would be to store the images on the cloud with a proper url string. But with the middle ground solution I don't have to worry about looping through 700 recipes and changing their values to a base64 string. Oh An remember the performance boost I wanted to try out by working with WAL Mode and check point starvation? Yeah I can chuck that shit out of the window.

### Register user
Very easy to implement ~~only that needed to be done was change the image file to a blob type.~~ and files are already Blobs since it's inherited. Small checks were done for when two users want to create a user with the same username/email or both and with this a race condition was prevented. I've also created a another api end point to check the usernames or emails while typing the form instead of having to submit the form for validation. I also forgot to ensure that only the right image types can be uploaded to the database, imagine the dangers if I forgot... And well I forgot a lot more like the server needs to act as the last line of defense so extra validation is needed. I didn't think of the security risks of people performing xss attacks or sql injections. better-sqlite3 protects against sql-injections by using prepare statements and I didn't implement anything against xss attacks because I figured that any framework will prevent it but I performed it using Insomnia so security measures were implemented like validation of files, usernames, emails and passwords as well as sanitation of strings to ensure no malicious code is added to the database.

As we all know working with javascript requires one to install a thousand packages one of them being bcrypt for password hashing. Node has their own hashing algo called crypto but using that for password hashing isn't good, why? 'cos its to weak but using crypto for other things like api keys would be preferable and I might do just that for better security but I'm not sure that using bcrypt for hashing would be that necessary.

### Save recipe
This one was easy as well but I also noticed that a user can save the same recipe multiple times which isn't optimal so I would need to update my Saved table to have unique constraint of (user_id, recipe_id). The next question becomes how would I remove the saved well it's the same as the rate recipe one, get if the user has saved the recipe and insert or delete if the user doesn't want to save it anymore, this though can't use UPSERT so two api end points are in order, maybe it's not but this seems to be the easiest way to do it.

### Rate recipe
This one was a bit harder to implement not because the code is hard but rather the api end point design and how to interact with the database. The idea is to have the user update if they already have an existing score and insert if they don't. How would the backend know this? The initial idea is to have three API end points, one that get's the current score if there is one so a GET `/api/get-user-score/` end point would be needed, if the score is null an POST `/api/set-score/:recipe_id?score=5` end point and if score is not null then a `/api/update-score/:recipe_id?score=5` is in order. Requires some code to be written but that isn't the issue but rather SQLite has something called [UPSERT](https://www.sqlite.org/lang_upsert.html) where a user can either insert or update their score which requires a key constraint in order to work which I have. So what's the issue well reading up on it using UPSERT take a little performance hit but provides a better DX and I also want to provide the frontend with the score if they'd like to use it while I'm at it why not implement the two other API end points. But in all honesty why make it harder when SQLite has provided a solution to it? Might as well use it and provide the score end point as well. Funny thing is even though UPSERT exists `INSERT OR REPLACE` also exists, shocker, but this solution isn't really that optimal because I would lose the row when in fact I want to update it, but since I'm just adding and removing score values of each user for a recipe this isn't really much of an issue. But UPSERT gives me more control and is a overall better design choice I think. 

### Insert comment to a recipe
Was kinda tricky to implement especially when I had `IS NULL` when performing the get recipe route and what do I mean by that? Well when I insert a comment I need to be null in-order to perform the proper recursive sql query but I wasn't sure if I do the null check in the server or the query call. Because the checker would be something like this in typescript:

```js
const null_if = parent_id || null;
```
I could also to it with SQL using this [tutorial](https://www.sqlitetutorial.net/sqlite-functions/sqlite-nullif/) but that seems like a lot more work than needed, I'm not really sure that the benefits are if I'm being honest or if there are any at all.

### Search by ingredient or recipe
Was extremely easy to implement, worked the same as top and less than routes, I even go to learn about how to work with url queries which was pretty neat and easy to implement, The json return all the recipes as well as the length of the result. The idea is to show the first 3 recipes and then have a button that will redirect to another page with all of the recipes that have not been displayed on the search result, this seems to be a bit more frontend oriented so goal of this route is to provide the frontend with all of the data from each query.

### View Recipe by id
Getting the information for each recipe after clicking a thumbnail or of the similar wasn't that hard to implement but printing out the hierarchy of a comment was a lot harder than expected. I had the table down and most of the SQL code done as well but I wasn't really sure how I would tie nested comments together, the idea was that each comment will have an array which would result in a bunch of nested arrays which would be really ugly and I thing a nightmare the work on in the frontend. So instead I opted for a path like system that shows how each comment chain looks like i.e their path, there is a small drawback of this being that the path can be too long and thus lead to an end but at that point the users can talk to each on whatsapp or something. As well as having really long paths with no way of resetting them for each post can lead to the varchar limit filling up really fast. A way to solve this is by having a unique key for each recipe where the `comment_id`'s "reset" for each recipe and in that way ensure that every post can have comment chains. But If I ***really*** wanted to fix the hierarchy [Closure tables](https://nehajirafe.medium.com/data-modeling-designing-facebook-style-comments-with-sql-4cf9e81eb164) could be a solution but I'm pretty happy with solving this as it is now. At best I can either reflect on the how I could fix this backend issue or I'll just do it, not sure yet.

### Route for top recipes
Easy as well but this one had almost he same code as less than 30 min so a utility function was created to minsize the code duplication.

### Route for than 30 min recipes
Easy nothing to worry about as long as there are recipes for that, this will also take into account all the recipes that do not have a score yet i.e null
## Deploy a server
So I ran into the issue of trying to deploy serverless functions to netlify before and to be honest I was just lazy and didn't read up on it but now I'm even more so 'cos [Hono documentation](https://hono.dev/getting-started/netlify) tells me I need Deno, but I don't use Deno, I use Node. And [Vercel](https://vercel.com/guides/using-express-with-vercel) seems to works well with [Hono + Node](https://hono.dev/getting-started/vercel) but I would need to try this out once I start working on the backend code. And I haven't forgotten all the comments on my PS plus randomizer asking why the load time is so slow, don't worry I will upload it to a proper server that costs money when I remake the website.

## Some extra stuff
Here are some interesting reads that I haven't really referenced in the text: [How to use Postman/Insomnia](https://www.youtube.com/watch?v=n-IFlWGX1t4), [How to use HTTP headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) and [What is JWT](https://jwt.io/). 