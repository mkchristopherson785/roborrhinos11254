import fetch from "node-fetch";

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

  // 🔧 UPDATE THIS when you move to a new event
  const EVENT_KEY = "2526-FIM-NOQ";

  const baseHeaders = {
    accept: "application/json",
    "X-TOA-Key": API_KEY,
    "X-Application-Origin": "RoboRhinosWebsite"
  };

  try {
    // 1) Get all matches for this event
    const matchesRes = await fetch(
      `https://theorangealliance.org/api/event/${EVENT_KEY}/matches`,
      { headers: baseHeaders }
    );

    if (!matchesRes.ok) {
      const text = await matchesRes.text();
      return {
        statusCode: matchesRes.status,
        body: JSON.stringify({
          error: "TOA matches error",
          status: matchesRes.status,
          body: text
        })
      };
    }

    const allMatches = await matchesRes.json();

    // ➜ Keep this small to avoid hitting rate limits:
    //    sort newest first, then take top 5
    const matches = allMatches
      .slice() // copy
      .sort((a, b) => {
        // Fall back to match_key if no scheduled time
        const ta = a.scheduled_time || a.match_key;
        const tb = b.scheduled_time || b.match_key;
        return (tb || "").localeCompare(ta || "");
      })
      .slice(0, 5);

    // 2) Helper to get participants for ONE match
    async function fetchParticipantsForMatch(matchKey) {
      const url = `https://theorangealliance.org/api/match/${matchKey}/participants`;
      const res = await fetch(url, { headers: baseHeaders });

      if (!res.ok) {
        // Don't blow up the whole request; just return empty
        return { red: [], blue: [] };
      }

      const participants = await res.json();

      const red = [];
      const blue = [];

      // Example from your JSON:
      // station 11, 12 = Red alliance teams
      // station 21, 22 = Blue alliance teams
      participants.forEach(p => {
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

    // 3) Enrich matches with alliance team info (with rate-limit safety)
    const enriched = [];
    for (const m of matches) {
      let alliances = { red: [], blue: [] };

      try {
        alliances = await fetchParticipantsForMatch(m.match_key);
      } catch (e) {
        // If TOA rate-limits or errors, just leave alliances empty
        alliances = { red: [], blue: [] };
      }

      enriched.push({
        ...m,
        red_alliance: alliances.red,
        blue_alliance: alliances.blue
      });
    }

    // 4) Return matches + timestamp
    return {
      statusCode: 200,
      body: JSON.stringify({
        matches: enriched,
        generated_at: new Date().toISOString()
      })
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
