// netlify/functions/get-matches.js

// Simple in-memory cache to avoid TOA 429 rate limits
let cache = {
  timestamp: 0,
  data: null,
};

const CACHE_TTL_MS = 60 * 1000; // 1 minute

export async function handler(event, context) {
  const API_KEY = process.env.TOA_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Missing TOA_API_KEY environment variable",
      }),
    };
  }

  // ✅ Serve cached data if it's still fresh
  const now = Date.now();
  if (cache.data && now - cache.timestamp < CACHE_TTL_MS) {
    return {
      statusCode: 200,
      body: JSON.stringify(cache.data),
    };
  }

  // 🔧 UPDATE THIS when you move to a new event
  const EVENT_KEY = "2526-FIM-NOQ";

  const baseHeaders = {
    accept: "application/json",
    "X-TOA-Key": API_KEY,
    "X-Application-Origin": "RoboRhinosWebsite",
  };

  try {
    // 1) Get all matches for this event
    const matchesRes = await fetch(
      `https://theorangealliance.org/api/event/${EVENT_KEY}/matches`,
      { headers: baseHeaders }
    );

    if (!matchesRes.ok) {
      const text = await matchesRes.text();
      // If TOA rate-limits (429) or errors, pass a helpful message to the frontend
      return {
        statusCode: matchesRes.status,
        body: JSON.stringify({
          error: "TOA matches error",
          status: matchesRes.status,
          body: text,
        }),
      };
    }

    const allMatches = await matchesRes.json();

    // Sort newest first (by scheduled_time, fallback to match_key) and keep only top 5
    const matches = allMatches
      .slice()
      .sort((a, b) => {
        const ta = a.scheduled_time || a.match_key || "";
        const tb = b.scheduled_time || b.match_key || "";
        return tb.localeCompare(ta);
      })
      .slice(0, 5);

    // 2) Helper to get participants for ONE match
    async function fetchParticipantsForMatch(matchKey) {
      const url = `https://theorangealliance.org/api/match/${matchKey}/participants`;
      const res = await fetch(url, { headers: baseHeaders });

      if (!res.ok) {
        // Don't kill the whole function if this fails; just return no alliances
        return { red: [], blue: [] };
      }

      const participants = await res.json();
      const red = [];
      const blue = [];

      // station 11, 12 = Red alliance
      // station 21, 22 = Blue alliance
      participants.forEach((p) => {
        if (!p.team) return;
        const label = `${p.team.team_number} ${p.team.team_name_short}`;
        if (p.station === 11 || p.station === 12) {
          red.push(label);
        } else if (p.station === 21 || p.station === 22) {
          blue.push(label);
        }
      });

      return { red, blue };
    }

    // 3) Enrich matches with alliance info (try/catch per match to avoid 429 issues)
    const enriched = [];
    for (const m of matches) {
      let alliances = { red: [], blue: [] };

      try {
        alliances = await fetchParticipantsForMatch(m.match_key);
      } catch (e) {
        alliances = { red: [], blue: [] };
      }

      enriched.push({
        ...m,
        red_alliance: alliances.red,
        blue_alliance: alliances.blue,
      });
    }

    // 4) Include a generated_at timestamp and cache the result
    const payload = {
      matches: enriched,
      generated_at: new Date().toISOString(),
    };

    cache.data = payload;
    cache.timestamp = Date.now();

    return {
      statusCode: 200,
      body: JSON.stringify(payload),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || "Unknown error",
      }),
    };
  }
}
