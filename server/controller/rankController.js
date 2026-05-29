import keywordTracking from "../model/keywordTracker.js";
import { keywordTrackingService } from "../services/keywordTrackingServices.js";

// ADD KEYWORD
const addKeyword = async (req, res) => {
    try {

        const { keyword, url } = req.body;

        if (!keyword || !url) {
            return res.status(400).json({
                success: false,
                message: "Keyword and URL are required"
            });
        }

        let domain;

        try {
            const urlObj = new URL(
                url.startsWith("http") ? url : `https://${url}`
            );

            domain = urlObj.hostname.replace("www.", "");

        } catch (error) {

            return res.status(400).json({
                success: false,
                message: "Invalid URL format"
            });
        }

        // CHECK EXISTING
        const existing = await keywordTracking.findOne({
            userId: req.userId,
            keyword: keyword.toLowerCase().trim(),
            domain
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Already tracking this keyword"
            });
        }

        // CREATE TRACKING
        const tracking = await keywordTracking.create({
            userId: req.userId,
            keyword: keyword.toLowerCase().trim(),
            url,
            domain,
            status: "checking"
        });

        // START SERVICE
        // START SERVICE (non‑blocking)
        keywordTrackingService(tracking);


        return res.status(201).json({
            success: true,
            message: "Keyword tracking started",
            tracking
        });

    } catch (error) {

        console.error("Add Keyword Error:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Already tracking this keyword"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// GET ALL KEYWORDS
const getKeyword = async (req, res) => {

    try {

        const tracking = await keywordTracking
            .find({ userId: req.userId })
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            tracking
        });

    } catch (error) {

        console.error("Get Keyword Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// GET SINGLE KEYWORD
const getKeywordById = async (req, res) => {
    try {
        const tracking = await keywordTracking.findOne({
            _id: req.params.id,
            userId: req.userId
        });
        if (!tracking) {
            return res.status(404).json({ success: false, message: "Not found" });
        }
        return res.json({ success: true, tracking });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// REFRESH KEYWORD
const refreshKeyword = async (req, res) => {

    try {

        const tracking = await keywordTracking.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!tracking) {
            return res.status(404).json({
                success: false,
                message: "Tracking not found"
            });
        }

        tracking.status = "checking";

        await tracking.save();

        await keywordTrackingService(tracking);

        return res.json({
            success: true,
            message: "Rank check started"
        });

    } catch (error) {

        console.error("Refresh Keyword Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// DELETE KEYWORD
const deleteKeyword = async (req, res) => {

    try {

        const tracking = await keywordTracking.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!tracking) {
            return res.status(404).json({
                success: false,
                message: "Tracking not found"
            });
        }

        return res.json({
            success: true,
            message: "Keyword tracking deleted"
        });

    } catch (error) {

        console.error("Delete Keyword Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// TOGGLE TRACKING
const toggleTracking = async (req, res) => {

    try {

        const tracking = await keywordTracking.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!tracking) {
            return res.status(404).json({
                success: false,
                message: "Tracking not found"
            });
        }

        tracking.active = !tracking.active;

        await tracking.save();

        return res.json({
            success: true,
            tracking
        });

    } catch (error) {

        console.error("Toggle Tracking Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

export {
    addKeyword,
    getKeyword,
    getKeywordById,
    refreshKeyword,
    deleteKeyword,
    toggleTracking
};