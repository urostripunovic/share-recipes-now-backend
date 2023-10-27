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

export const recipes = new Hono();
recipes.route("/", ready_recipes);
recipes.route("/", recipe);
recipes.route("/", search);

export const authTheUser = new Hono();
authTheUser.route("/", refresh);
authTheUser.route("/", login);
authTheUser.route("/", register);
//logout route

export const userAction = new Hono();
userAction.route("/", save_recipe);
userAction.route("/", user_score); 
userAction.route("/", rate_recipe); 
userAction.route("/", comment); 