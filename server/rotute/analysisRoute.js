import express from "express";
import { getAnalysis, analyzeUrl, getAnalyses, deleteAnalysis } from "../controller/analysisController.js";
import auth from "../middleware/authMiddle.js";

const analysisRouter = express.Router();

analysisRouter.post("/analyze", auth, analyzeUrl);
analysisRouter.get("/list", auth, getAnalyses);
analysisRouter.get("/:id", auth, getAnalysis);
analysisRouter.delete("/:id", auth, deleteAnalysis);

export default analysisRouter;