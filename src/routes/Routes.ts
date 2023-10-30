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
import { logout } from "./Logout";

export const recipes = new Hono();
recipes.route("/", ready_recipes);
recipes.route("/", recipe);
recipes.route("/", search);

export const userAction = new Hono();
userAction.route("/", refresh);
userAction.route("/", login);
userAction.route("/", register);
userAction.route("/", logout);

export const authUserAction = new Hono();
authUserAction.route("/", save_recipe);
authUserAction.route("/", user_score); 
authUserAction.route("/", rate_recipe); 
authUserAction.route("/", comment);
//Update recipe
//Create recipe
//Create get user information end point