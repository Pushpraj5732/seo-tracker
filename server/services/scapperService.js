import * as cheerio from "cheerio";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// ─── 1. HTML Scraper ────────────────────────────────────────────────
export async function scrapeUrl(url) {
    const start = Date.now();
    

    const response = await fetch(url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const loadTime = Date.now() - start;
    const pageSize = Buffer.byteLength(html, "utf8");
    const statusCode = response.status;

    const $ = cheerio.load(html);

    // Remove script/style/noscript so they don't pollute text
    $("script, style, noscript").remove();

    // ── Meta data ──
    const metaData = {
        title: $("title").first().text().trim() || "",
        description: $('meta[name="description"]').attr("content") || "",
        canonical: $('link[rel="canonical"]').attr("href") || "",
        robots: $('meta[name="robots"]').attr("content") || "",
        ogTitle: $('meta[property="og:title"]').attr("content") || "",
        ogDescription: $('meta[property="og:description"]').attr("content") || "",
        ogImage: $('meta[property="og:image"]').attr("content") || "",
        twitterCard: $('meta[name="twitter:card"]').attr("content") || "",
        viewport: $('meta[name="viewport"]').attr("content") || "",
        charset:
            $("meta[charset]").attr("charset") ||
            $('meta[http-equiv="Content-Type"]').attr("content") ||
            "",
    };

    // ── Headings ──
    const headings = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0, h1Texts: [] };
    for (const tag of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
        const els = $(tag);
        headings[tag] = els.length;
        if (tag === "h1") {
            els.each((_, el) => {
                const text = $(el).text().trim();
                if (text) headings.h1Texts.push(text);
            });
        }
    }

    // ── Links ──
    const parsedUrl = new URL(url);
    let internal = 0,
        external = 0;
    $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) return;
        try {
            const linkUrl = new URL(href, url);
            if (linkUrl.hostname === parsedUrl.hostname) internal++;
            else external++;
        } catch {
            internal++; // relative links
        }
    });

    const links = { internal, external, total: internal + external };

    // ── Images ──
    let totalImages = 0,
        missingAlt = 0,
        withAlt = 0;
    $("img").each((_, el) => {
        totalImages++;
        const alt = $(el).attr("alt");
        if (alt && alt.trim().length > 0) withAlt++;
        else missingAlt++;
    });
    const images = { total: totalImages, missingAlt, withAlt };

    // ── Body text (first 3000 chars for AI) ──
    const bodyText = $("body").text().replace(/\s+/g, " ").trim().substring(0, 3000);

    // ── Word count ──
    const wordCount = bodyText
        .split(/\s+/)
        .filter((w) => w.length > 0).length;

    return {
        url,
        statusCode,
        loadTime,
        pageSize,
        metaData,
        headings,
        links,
        images,
        bodyText,
        wordCount,
    };
}

// ─── 2. Gemini AI Analysis ──────────────────────────────────────────
// Response schema for Gemini structured output (matches gemini-assets.ts)
const seoAnalysisSchema = {
    type: SchemaType.OBJECT,
    properties: {
        overallScore: { type: SchemaType.INTEGER },
        categories: {
            type: SchemaType.OBJECT,
            properties: {
                seo: { type: SchemaType.INTEGER },
                performance: { type: SchemaType.INTEGER },
                accessibility: { type: SchemaType.INTEGER },
                bestPractices: { type: SchemaType.INTEGER },
            },
            required: ["seo", "performance", "accessibility", "bestPractices"],
        },
        keywords: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    word: { type: SchemaType.STRING },
                    count: { type: SchemaType.INTEGER },
                    density: { type: SchemaType.NUMBER },
                },
                required: ["word", "count", "density"],
            },
        },
        issues: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    severity: {
                        type: SchemaType.STRING,
                        enum: ["critical", "warning", "info"],
                    },
                    category: { type: SchemaType.STRING },
                    message: { type: SchemaType.STRING },
                    recommendation: { type: SchemaType.STRING },
                },
                required: ["severity", "category", "message", "recommendation"],
            },
        },
    },
    required: ["overallScore", "categories", "keywords", "issues"],
};

function buildPrompt(scrapedData) {
    return `You are an expert SEO analyst. Analyze the following website data and provide a comprehensive SEO audit.

Website URL: ${scrapedData.url}
Load Time: ${scrapedData.loadTime}ms
Status Code: ${scrapedData.statusCode}
Page Size: ${Math.round(scrapedData.pageSize / 1024)}KB
Word Count: ${scrapedData.wordCount}

META DATA:
- Title: "${scrapedData.metaData.title}" (${scrapedData.metaData.title.length} chars)
- Description: "${scrapedData.metaData.description}" (${scrapedData.metaData.description.length} chars)
- Canonical: "${scrapedData.metaData.canonical}"
- Robots: "${scrapedData.metaData.robots}"
- OG Title: "${scrapedData.metaData.ogTitle}"
- OG Description: "${scrapedData.metaData.ogDescription}"
- OG Image: "${scrapedData.metaData.ogImage}"
- Twitter Card: "${scrapedData.metaData.twitterCard}"
- Viewport: "${scrapedData.metaData.viewport}"
- Charset: "${scrapedData.metaData.charset}"

HEADINGS:
- H1: ${scrapedData.headings.h1} (texts: ${JSON.stringify(scrapedData.headings.h1Texts)})
- H2: ${scrapedData.headings.h2}
- H3: ${scrapedData.headings.h3}
- H4: ${scrapedData.headings.h4}
- H5: ${scrapedData.headings.h5}
- H6: ${scrapedData.headings.h6}

LINKS:
- Internal: ${scrapedData.links.internal}
- External: ${scrapedData.links.external}
- Total: ${scrapedData.links.total}

IMAGES:
- Total: ${scrapedData.images.total}
- Missing Alt Text: ${scrapedData.images.missingAlt}
- With Alt Text: ${scrapedData.images.withAlt}

PAGE CONTENT (first 3000 chars):
${scrapedData.bodyText}

Scoring guidelines:
- Title: 50-60 chars optimal, must exist
- Description: 150-160 chars optimal, must exist
- H1: exactly 1 is ideal
- Images: all should have alt text
- Load time: <3s good, <5s ok, >5s poor
- Page size: <3MB good
- Must have viewport meta, charset, canonical
- OG tags and Twitter cards are important
- Internal linking is good for SEO
- Word count: >300 words for content pages
- Check heading hierarchy

Severity levels must be exactly one of: "critical", "warning", or "info".
Provide 5-15 issues sorted by severity (critical first). Be specific and actionable with recommendations.
Extract top 10 keywords by frequency from the page content.`;
}

export async function analyzeWithAI(scrapedData) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set in the environment variables.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: seoAnalysisSchema,
        },
    });

    const prompt = buildPrompt(scrapedData);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
}

// ─── 3. Full Pipeline: scrape → AI → update DB ─────────────────────
export async function runAnalysis(analysis) {
    try {
        // Step 1: Scrape the URL
        console.log(`[scapperService] Scraping ${analysis.url} ...`);
        const scrapedData = await scrapeUrl(analysis.url);

        // Step 2: Send to Gemini AI
        console.log(`[scapperService] Sending to Gemini AI ...`);
        const aiResult = await analyzeWithAI(scrapedData);

        // Step 3: Merge scraped data + AI scores into the Analysis document
        analysis.title = scrapedData.metaData.title;
        analysis.overallScore = aiResult.overallScore ?? 0;
        analysis.categories = aiResult.categories ?? { seo: 0, performance: 0, accessibility: 0, bestPractices: 0 };
        analysis.metaData = scrapedData.metaData;
        analysis.headings = scrapedData.headings;
        analysis.links = scrapedData.links;
        analysis.images = scrapedData.images;
        analysis.keywords = (aiResult.keywords ?? []).slice(0, 10);
        analysis.issues = (aiResult.issues ?? []).map((i) => ({
            severity: i.severity,
            category: i.category || "",
            message: i.message || "",
            recomendation: i.recommendation || "",
            code: "",
        }));
        analysis.loadTime = scrapedData.loadTime;
        analysis.pageSize = scrapedData.pageSize;
        analysis.wordCount = scrapedData.wordCount;
        analysis.status = "completed";

        await analysis.save();
        console.log(`[scapperService] Analysis completed for ${analysis.url}`);
        return { success: true };
    } catch (error) {
        console.error(`[scapperService] Analysis failed for ${analysis.url}:`, error.message);
        analysis.status = "failed";
        await analysis.save().catch(() => {});
        return { success: false, error: error.message };
    }
}
