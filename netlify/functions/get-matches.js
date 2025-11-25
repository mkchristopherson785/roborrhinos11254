// netlify/functions/get-matches.js
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

  try {
    // Your current event key
    const EVENT_KEY = "2526-FIM-NOQ";

    const headers = {
      accept: "application/json",
      "X-TOA-Key": API_KEY,
      "X-Application-Origin": "RoboRhinosWebsite"
    };

    // 1) Get matches (scores, etc.)
    const matchesRes = await fetch(
      `https://theorangealliance.org/api/event/${EVENT_KEY}/matches`,
      { headers }
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

    const matches = await matchesRes.json();

    // 2) Get participants (who was in each match)
    const participantsRes = await fetch(
      `https://theorangealliance.org/api/event/${EVENT_KEY}/matches/participants`,
      { headers }
    );

    if (!participantsRes.ok) {
      const text = await participantsRes.text();
      return {
        statusCode: participantsRes.status,
        body: JSON.stringify({
          error: "TOA participants error",
          status: participantsRes.status,
          body: text
        })
      };
    }

    // This should look like the JSON you pasted (array of participant rows)
    const participants = await participantsRes.json();

    // 3) Group participants by match_key and split red vs blue
    const alliancesByMatch = {};

    participants.forEach((p) => {
      const key = p.match_key;
      if (!alliancesByMatch[key]) {
        alliancesByMatch[key] = { red: [], blue: [] };
      }

      // station 11–13 => Red alliance, 21–23 => Blue alliance
      const side = p.station >= 20 ? "blue" : "red";

      alliancesByMatch[key][side].push({
        team_key: p.team_key,
        team_number: p.team?.team_number,
        team_name_short: p.team?.team_name_short,
        city: p.team?.city,
        state_prov: p.team?.state_prov
      });
    });

    // 4) Merge alliances into the matches array
    const enrichedMatches = matches.map((m) => {
      const alliances = alliancesByMatch[m.match_key] || {
        red: [],
        blue: []
      };
      return {
        ...m,
        red_alliance: alliances.red,
        blue_alliance: alliances.blue
      };
    });

    // 5) Wrap in { matches } so your HTML stays compatible
    return {
      statusCode: 200,
      body: JSON.stringify({ matches: enrichedMatches })
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
