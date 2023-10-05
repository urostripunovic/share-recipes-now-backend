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
        secret: process.env.SECRET,
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
    const token = await sign({ user_name: "para knas" }, process.env.SECRET);

    setCookie(c, "token", token, {
        httpOnly: true,
        secure: true,
    });

    return c.json({ msg: "user logged in", token }, 200);
});

app.get("/test", async (c) => {
    const token = getCookie(c, "token");

    if (!token) return c.json({ msg: "unauthorized" }, 401);

    const { user_name } = await verify(token, process.env.SECRET);

    return c.json({ user_name }, 200);
});
```
If I were to change the name of our token to `token1` when getting it then the server will spit out a unauthorized message. So there was no need to add any middleware since Hono has it implemented already. I only need to add better authorization logic and if I want to add that logic to a whole route I would need to create my own middleware and also lookout as to not try and use `withCredentials` and `credentials` on wildcard routes. Hono also has their own [Custom Error Types](https://hono.dev/helpers/jwt#payload-validation) that display if anything is wrong. So how would I go with implementing my own middleware, we need to have a secure routes for when a user wants to perform something. It could look something like this:

```js
app.use("/test/*", async (c, next) => {
    const token = getCookie(c, "token");
    if (!token) return c.json({ message: "No token found" }, 404);

    try {
        const json = await verify(token, process.env.SECRET);
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
async function cookieAuth(c, next) {
    const token = getCookie(c, "token");
    if (!token) return c.json({ message: "No token found" }, 404);

    try {
        const json = await verify(token, process.env.SECRET);
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
const exp = (new Date().getTime() + 1) / 1000; //increase the amount of x seconds, x*60 minutes, x*60*60 hours, x*24*60*60 days
const iat = Math.floor(new Date().getTime() / 1000); //issued at time

const token = await sign(
    { user_id: 1, user_name: "para knas", iat: iat, exp: exp },
    process.env.SECRET
);
```
There is not need to download the jsonwebtoken npm package but I'm not gonna lie the DX was a lot better with the package. The with this code I should be able to implement access and refresh tokens but with no database there's nothing to test. I'll either try and implement this once the db is up an running on once the project is done, but we all know from how I've done things so far, I'll most likely do it. [And my future employer would be impressed with the attention to detail](https://tenor.com/sv/view/wink-wink-nudge-nudge-monty-python-wink-signal-gif-5500109).

So, to close of this Hono+auth+cookie venture I ran into an issue with the JWT not working at first with a [strong secret key](https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs) it only worked when my secret was `test` which is really weird since that was the first one I used. And I got it working by literary turning the server on and off... In summary, Hono works well, env variables work, the REST operations work, auth works as well as when trying it out in Insomnia, implementing my own middleware was new I followed the principles of Express.js and it turned out well, and looking into the abyss that is security damn... I learnt a lot and I can say I'm better off for it as well. With the basics 'done' (haven't forgotten you access and refresh token), I can now move on towards to implementing the SQLite database.

## Working with SQLite and Node.js


## API end points/routes


## Deploy a server
So I ran into the issue of trying to deploy serverless functions to netlify before and to be honest I was just lazy and didn't read up on it but now I'm even more so 'cos [Hono documentation](https://hono.dev/getting-started/netlify) tells me I need Deno, but I don't use Deno, I use Node. And [Vercel](https://vercel.com/guides/using-express-with-vercel) seems to works well with [Hono + Node](https://hono.dev/getting-started/vercel) but I would need to try this out once I start working on the backend code. And I haven't forgotten all the comments on my PS plus randomizer asking why the load time is so slow, don't worry I will upload it to a proper server that costs money when I remake the website.

## Some extra stuff
Here are some interesting reads that I haven't really referenced in the text: [How to use Postman/Insomnia](https://www.youtube.com/watch?v=n-IFlWGX1t4), [How to use HTTP headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) and [What is JWT](https://jwt.io/). 