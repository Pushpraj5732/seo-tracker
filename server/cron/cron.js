import cron from "node-cron"
import keywordTracking from "../model/keywordTracker.js";
import { keywordTrackingService } from "../services/keywordTrackingServices.js";

export function rankTrackingDaily(){
    cron.schedule("0 6 * * *", async () => {
        console.log("Starting Daily rank checking ......")
        try {
            const activeTracking=await keywordTracking.find({active:true})
            for (const track of activeTracking) {
                track.status="checking"
                await track.save();
                const result = await keywordTrackingService(track)
                //delay btw to avoid rate limit so we use the promise
                await new Promise(res=>setTimeout(res,10000+Math.random()*5000));
            }
        } catch (error) {
            console.log("Error in daily rank tracking",error.message)
        }
    })
    console.log("Rank tracking by cron is scheduled")
}