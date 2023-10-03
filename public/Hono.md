# Hono framework + Node.js runtime
This document is here to write out my thoughts and prayers like with the db queries document. I'll share some of my problems as well as how I solved them. I'll also write up a API document but that will have to wait.

## Basics of Hono
Well it works which is nice, but this is the first time i'm learning how to actually try out my APIs other than a simple get. I used [Insomnia](https://insomnia.rest/) to try out the API end points of get, post, put and delete. One could also use [Postman](https://www.postman.com/) but I'm sticking with Insomnia for now. All HTTP methods work as intended.

Hono some other cool features like authentication from the server instead of of the frontend which lessens the amount of code in the browser. I tried out Basic Auth which seems to be good when working with an admin page but as a user getting a pop up isn't that appealing maybe I could authorize it in some other way for a user to access their own page and edit page. And there is it's called [Bearer Auth](https://swagger.io/docs/specification/authentication/bearer-authentication/) where the user has a token and with that token a user is able to access certain resources but the question is then how do I create this token and how do I send one for each user that has a session? Well when it comes to creating the token it's just a **plain string** meaning anyone can guess it so this token needs to be sent over a secure site and is generated on the server so the string could be a JWT token ([article](https://hono.dev/middleware/builtin/jwt)) and to send it over http with either the body, ***cookie*** or some other header and then use that token as authorization from there use the payload data to access certain recourses. I will be using a JWT token just for the fact that I need a users id and username when for validation since the user logs in and has a unique id, that id is then used to access certain resources like their own table content. So the JWT payload data would look something likes this:

```JSON
{
    "user_id",
    "user_name",
    "expires_in"
}
```
Here are some interesting reads that I haven't really referenced in the text: [How to use Postman/Insomnia](https://www.youtube.com/watch?v=n-IFlWGX1t4), [How to use HTTP headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization), [What is JWT](https://jwt.io/) and [JWT best practices](https://blog.logrocket.com/jwt-authentication-best-practices/)

And with the basics done I can now more onward to implementing the SQLite database but one thing I didn't cover was how to actually receive and send the JWT from the server, but [this article](https://hono.dev/helpers/jwt) by Hono has it covered. I just need to get a secret and it will be easy from there... famous last words...

## Working with SQLite and Node.js


## Deploy a server
So I ran into the issue of trying to deploy serverless functions to netlify before and to be honest I was just lazy and didn't read up on it but now I'm even more so 'cos [Hono documentation](https://hono.dev/getting-started/netlify) tells me I need Deno, but I don't use Deno I just Node. And well [Vercel](https://vercel.com/guides/using-express-with-vercel) works well with [Hono + Node](https://hono.dev/getting-started/vercel) but I would need to try this out once I start working on the backend code.