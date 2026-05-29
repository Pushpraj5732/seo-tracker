import Analysis from "../model/Analaysis.js";
import { main } from "../services/geminiService.js";
import { scrapeUrl } from "../services/scapperService.js";

export const analyzeUrl=async(req,res)=>{

    try {
        
        const url=req.body.url;
        if(!url){
            return res.status(400).json({success:false,message:"URL is required"});
        }
       let validUrl;
       try {
        validUrl=new URL(url.startsWith("http")?url:`https://${url}`);
       } catch (error) {
        return res.status(400).json({success:false,message:"Invalid URL"});
       }
       
       const analysis=await Analysis.create({userId:req.userId,url:validUrl.href,status:"processing"});
       res.json({success:true,analysis,message:"Analysis started successfully",analysisId:analysis._id})
       
       try {
            //get scapper data
        const scrapper=await scrapeUrl(validUrl.href);
        if(!scrapper){
            analysis.status = "failed";
            await analysis.save();
            return;
        }
            //analyse with ai 
           const aiResult=await main(scrapper)
           if(!aiResult.success){
            analysis.status = "failed";
            await analysis.save();
            return;
        }
        analysis.status = "completed";
        analysis.overallScore=aiResult.data.overallScore || 0;
        analysis.categories=aiResult.data.categories ||{};
        analysis.keywords=aiResult.data.keywords ||[];
        analysis.issues=aiResult.data.issues ||[];
        analysis.loadTime=scrapper.loadTime || 0;
        analysis.pageSize=scrapper.pageSize || 0;
        analysis.wordCount=scrapper.wordCount || 0;
        analysis.metaData=scrapper.metaData || {};
        analysis.headings=scrapper.headings || {};
        analysis.links=scrapper.links || {};
        analysis.images=scrapper.images || {};
        analysis.status="completed";
        await analysis.save();
       } catch (error) {
        analysis.status="failed";
        await analysis.save();
        console.error("Error in analysis",error);
       }


    } catch (error) {
          return res.status(500).json({success:false,message:"Internal server error",error:error.message})
    }
}
export const getAnalysis=async(req,res)=>{
    try {
        const analysis=await Analysis.findOne({_id:req.params.id,userId:req.userId});
        if(!analysis){
            return res.status(404).json({success:false,message:"Analysis not found"});
        }
        return res.json({success:true,analysis});
    } catch (error) {
        return res.status(500).json({success:false,message:"Internal server error",error:error.message})
    }
    
}
export const getAnalyses=async(req,res)=>{
    try {
        const page=parseInt(req.query.page) || 1;
        const limit =parseInt(req.query.limit) || 10;
        const skip =( page-1)*limit;
        const analysis=await Analysis.find({userId:req.userId}).sort({createdAt:-1}).skip(skip).limit(limit).select("-issue -keywords");
        if(!analysis){
            return res.status(404).json({success:false,message:"Analysis not found"});
        }

        const total=await Analysis.countDocuments({userId:req.userId})
        
        
        return res.json({success:true,analysis,pagination:{page,limit,total,pages:Math.ceil(total/limit)  }
    });

        
    } catch (error) {
        return res.status(500).json({success:false,message:"Internal server error",error:error.message})
    }
}
export const deleteAnalysis=async(req,res)=>{
    try {
        const analysis=await Analysis.findOneAndDelete({_id:req.params.id,userId:req.userId});
        return res.json({success:true,message:"Analysis deleted successfully"});
    } catch (error) {
        return res.status(500).json({success:false,message:"Internal server error",error:error.message})
    }
}
