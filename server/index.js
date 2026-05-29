import express from 'express';
import cors from 'cors';
import "dotenv/config";
import connectDB from './config/db.js';
import authRoute from './rotute/authROute.js';
import rankRouter from './rotute/routeRanking.js';
import analysisRouter from './rotute/analysisRoute.js';
import { rankTrackingDaily } from './cron/cron.js';
const app=express();

connectDB();    
app.use(cors());
app.use(express.json());
app.use("/api/auth",authRoute)
app.use("/api/rank",rankRouter)
app.use("/api/analysis",analysisRouter)

app.get('/',(req,res)=>{
    res.send("hello world")
})
rankTrackingDaily();
const Port=process.env.Port  ||5000;
app.listen(Port,()=>{
    console.log(`server listen ${Port}`)
})