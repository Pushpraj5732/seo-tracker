import express from "express";
import { getUser, login, register } from "../controller/authController.js";
import User from "../model/model.js";
import auth from "../middleware/authMiddle.js";

const authRoute=express.Router();

authRoute.post("/register",register)
authRoute.post("/login",login)
authRoute.get("/user",auth,getUser)
export default authRoute;