import { rankTracking } from "./rankTrackingServices.js";

export async function keywordTrackingService(tracking) {
    try {
        let result;

        // Try up to 2 times
        for (let i = 1; i <= 2; i++) {
            result = await rankTracking(tracking.keyword, tracking.domain);
            if (result.success && result.data && result.data.totalResultsScanned > 0) break;
            if (i < 2) await new Promise((r) => setTimeout(r, result.success ? 3000 : 5000));
        }

        // If the service failed completely (network error, CAPTCHA, etc.)
        if (!result.success) {
            tracking.status = "failed";
            await tracking.save().catch(() => {});
            return result;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const prev = tracking.currentPosition;
        const pos = result.data.position; // could be null if not ranked

        // Always update these fields regardless of whether ranked or not
        tracking.currentPosition = pos;
        tracking.currentPage = result.data.page || null;
        tracking.competitors = result.data.competitors || [];
        tracking.lastChecked = new Date();
        tracking.status = "completed";

        // Position change vs previous check
        tracking.positoinChange = prev && pos ? prev - pos : 0;

        // Update best position only if we have a position and it's better
        if (pos && (!tracking.bestPosition || pos < tracking.bestPosition)) {
            tracking.bestPosition = pos;
        }

        // Always push history entry (whether ranked or not)
        const history = {
            date: today,
            position: pos,
            page: result.data.page || null,
            title: result.data.title || "",
            snippet: result.data.snippet || "",
        };

        const idx = tracking.rankHistory.findIndex(
            (h) => h.date.toDateString() === today.toDateString()
        );
        if (idx >= 0) tracking.rankHistory[idx] = history;
        else tracking.rankHistory.push(history);

        await tracking.save();
        return result;

    } catch (error) {
        console.log("ranked update fail", error.message);
        tracking.status = "failed";
        await tracking.save().catch(() => {});
        return { success: false, message: error.message };
    }
}