import express from "express";
import auth from "../middleware/authMiddle.js"
import {addKeyword,
    getKeyword,
    getKeywordById,
    refreshKeyword,
    deleteKeyword,
    toggleTracking} from "../controller/rankController.js"
let rankRouter=express.Router();

rankRouter.post("/add",auth,addKeyword)
rankRouter.get("/list",auth,getKeyword)
rankRouter.get("/:id",auth,getKeywordById)
rankRouter.post("/:id/refresh",auth,refreshKeyword)
rankRouter.put("/:id/toggle",auth,toggleTracking)
rankRouter.delete("/:id",auth,deleteKeyword)
export default rankRouter;