export async function rankTracking(keyword, targetDomain) {
    try {
        const apiKey = process.env.SERPER_API_KEY;
        if (!apiKey) {
            throw new Error("SERPER_API_KEY is not set in the environment variables.");
        }

        const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                q: keyword,
                num: 50 // Fetch top 50 results to mimic 5 pages of 10 results
            })
        });

        if (!response.ok) {
            throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const organic = result.organic || [];
        const cleanTarget = targetDomain.replace("www.", "").toLowerCase();

        let found = null;
        let allResult = [];

        for (const item of organic) {
            if (!item.link) continue;

            const urlObj = new URL(item.link);
            const domain = urlObj.hostname.replace("www.", "");
            const r = {
                url: item.link,
                domain: domain,
                title: item.title || "",
                snippet: item.snippet || "",
                position: item.position || allResult.length + 1
            };

            allResult.push(r);

            // Stop looking for target once we find it the first time
            if (!found && (domain.toLowerCase() === cleanTarget || domain.toLowerCase().includes(cleanTarget))) {
                found = { ...r, page: Math.ceil(r.position / 10) };
                break; // Stop parsing more results once we find our target
            }
        }

        // Get up to 10 competitors (organic results that are NOT the target domain)
        let competitors = allResult
            .filter((r) => r.domain.toLowerCase() !== cleanTarget && !r.domain.toLowerCase().includes(cleanTarget))
            .slice(0, 10);

        return {
            success: true,
            data: {
                keyword,
                targetDomain,
                position: found?.position || null,
                page: found?.page || null,
                title: found?.title || "",
                snippet: found?.snippet || "",
                competitors,
                totalResultsScanned: allResult.length
            }
        };

    } catch (error) {
        console.log("rank check error ", error.message);
        return { success: false, error: error.message };
    }
}