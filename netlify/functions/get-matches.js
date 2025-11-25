// netlify/functions/get-matches.js
import fetch from "node-fetch";

// Simple in-memory cache for this function instance
let cache = {
  timestamp: 0,
  data: null
};

export async function handler(event, context) {
  const API_KEY = process.env.TOA_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Missing TOA_API_KEY environment variable"
      })
    };
  }

  // 60-second cache to avoid hammering TOA
  const now = Date.now();
  const CACHE_MS = 60 * 1000;

  if (cache.data && now - cache.timestamp < CACHE_MS) {
    return {
      statusCode: 200,
      body: JSON.stringify(cache.data)
    };
  }

  try {
    // Current event key (this is the one that worked for you)
    const EVENT_KEY = "2526-FIM-NOQ";

    const url = `https://theorangealliance.org/api/event/${EVENT_KEY}/matches`;

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-TOA-Key": API_KEY,
        "X-Application-Origin": "RoboRhinosWebsite"
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "TOA matches error",
          status: response.status,
          body: text
        })
      };
    }

    const matches = await response.json();

    const payload = {
      event_key: EVENT_KEY,
      matches,
      generated_at: new Date().toISOString()
    };

    // Save to cache
    cache = {
      timestamp: now,
      data: payload
    };

    return {
      statusCode: 200,
      body: JSON.stringify(payload)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || "Unknown error"
      })
    };
  }
}
