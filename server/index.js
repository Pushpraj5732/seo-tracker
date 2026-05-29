import express from 'express';
import cors from 'cors';
import "dotenv/config";
import connectDB from './config/db.js';
import authRoute from './rotute/authRoute.js';
import rankRouter from './rotute/routeRanking.js';
import analysisRouter from './rotute/analysisRoute.js';
import { rankTrackingDaily } from './cron/cron.js';
const app=express();

connectDB();    
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://seo-tracker-frontend-j6ilw51mb-raj5732s-projects.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  })
);
app.use(express.json());
app.use("/api/auth",authRoute)
app.use("/api/rank",rankRouter)
app.use("/api/analysis",analysisRouter)

app.get('/',(req,res)=>{
    res.send("hello world")
})
rankTrackingDaily();
const Port=process.env.PORT   ||5000;
app.listen(Port,()=>{
    console.log(`server listen ${Port}`)
})
