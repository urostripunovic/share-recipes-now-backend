# Hono framework + Node.js runtime
This document is here to write out my thoughts and prayers like with the db queries document. I'll share some of my problems as well as how I solved them. I'll also write up a API document but that will have to wait.

## Basics of Hono
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

So I'm trying to get JWT to work with a [strong secret key](https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs) but nothing works unless my secret it called `test` which is really weird. And I got it working but I still wouldn't be able to tell you why it does. I honestly turned the server on and off and then it worked lol. As is well I have a strong secret that will be used for the JWT token creations. So with the basics done I can now more towards to implementing the SQLite database.
## Working with SQLite and Node.js


## API end points/routes


## Deploy a server
So I ran into the issue of trying to deploy serverless functions to netlify before and to be honest I was just lazy and didn't read up on it but now I'm even more so 'cos [Hono documentation](https://hono.dev/getting-started/netlify) tells me I need Deno, but I don't use Deno, I use Node. And [Vercel](https://vercel.com/guides/using-express-with-vercel) seems to works well with [Hono + Node](https://hono.dev/getting-started/vercel) but I would need to try this out once I start working on the backend code. And I haven't forgotten all the comments on my PS plus randomizer asking why the load time is so slow, don't worry I will upload it to a proper server that costs money when I remake the website.

## Some extra stuff
Here are some interesting reads that I haven't really referenced in the text: [How to use Postman/Insomnia](https://www.youtube.com/watch?v=n-IFlWGX1t4), [How to use HTTP headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) and [What is JWT](https://jwt.io/). 