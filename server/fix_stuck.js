import connectDB from './config/db.js';
import keywordTracking from './model/keywordTracker.js';

(async () => {
    await connectDB();
    const stuck = await keywordTracking.find({status: 'checking'});
    console.log('Stuck records:', stuck.length);
    if(stuck.length > 0) {
        await keywordTracking.updateMany({status: 'checking'}, {"$set": {status: 'completed'}});
        console.log('Fixed stuck records!');
    }
    process.exit(0);
})();
