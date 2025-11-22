// netlify/functions/get-matches.js

export async function handler(event, context) {
  const API_KEY = process.env.TOA_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Missing TOA_API_KEY environment variable on Netlify"
      })
    };
  }

  try {
    // All matches for Team 11254
    const url = "https://theorangealliance.org/api/team/11254/matches";

    const response = await fetch(url, {
      headers: {
        "accept": "application/json",
        "X-TOA-Key": API_KEY,
        "X-Application-Origin": "RoboRhinosWebsite"
      }
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`TOA error: ${response.status} ${response.statusText} ${text}`);
    }

    const matches = await response.json();

    // Wrap in an object so the front-end can use data.matches
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matches })
    };
  } catch (err) {
    console.error("get-matches error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message || "Unknown error" })
    };
  }
}
