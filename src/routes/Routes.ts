import { ready_recipes } from "./ReadyRecipes";
import { recipe } from "./Recipe";
import { search } from "./Search";
import { comment } from "./Comment";
import { rate_recipe } from "./RateRecipe";
import { user_score } from "./UserScore";
import { save_recipe } from "./SaveRecipe";
import { register } from "./Register";
import { login } from "./Login";
import { refresh } from "./refreshToken";
import { Hono } from "hono";

export const nonAuth = new Hono();
nonAuth.route("/", refresh);
nonAuth.route("/", ready_recipes);
nonAuth.route("/", recipe);
nonAuth.route("/", search);

export const action = new Hono();
action.route("/", login);
action.route("/", register);
//logout route

export const userAction = new Hono();
userAction.route("/", save_recipe);
userAction.route("/", user_score); 
userAction.route("/", rate_recipe); 
userAction.route("/", comment); 