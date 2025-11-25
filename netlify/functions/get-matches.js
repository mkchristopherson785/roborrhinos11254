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

  // Update to your current event when needed
  const EVENT_KEY = "2526-FIM-NOQ";

  const HEADERS = {
    accept: "application/json",
    "X-TOA-Key": API_KEY,
    "X-Application-Origin": "RoboRhinosWebsite"
  };

  try {
    // 1) Get all matches for the event
    const matchesRes = await fetch(
      `https://theorangealliance.org/api/event/${EVENT_KEY}/matches`,
      { headers: HEADERS }
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

    const rawMatches = await matchesRes.json();

    // 2) For each match, try to load participants (teams)
    const enrichedMatches = await Promise.all(
      rawMatches.map(async (m) => {
        let redTeams = [];
        let blueTeams = [];

        try {
          const partRes = await fetch(
            `https://theorangealliance.org/api/match/${m.match_key}/participants`,
            { headers: HEADERS }
          );

          if (partRes.ok) {
            const participants = await partRes.json();

            // station 11/12/13 = Red, 21/22/23 = Blue
            redTeams = participants
              .filter((p) => p.station === 11 || p.station === 12 || p.station === 13)
              .map((p) => ({
                team_key: p.team_key,
                team_number: p.team?.team_number ?? null,
                team_name_short: p.team?.team_name_short ?? null
              }));

            blueTeams = participants
              .filter((p) => p.station === 21 || p.station === 22 || p.station === 23)
              .map((p) => ({
                team_key: p.team_key,
                team_number: p.team?.team_number ?? null,
                team_name_short: p.team?.team_name_short ?? null
              }));
          }
        } catch (err) {
          // If participants fail, we still return the match with empty team lists
          console.error("Participant fetch error for match", m.match_key, err);
        }

        return {
          match_key: m.match_key,
          match_name: m.match_name || m.match_key,
          tournament_level: m.tournament_level,
          match_number: m.match_number,
          scheduled_time: m.start_time ?? m.scheduled_time ?? null,
          red_score: m.red_score,
          blue_score: m.blue_score,
          red_teams,
          blue_teams
        };
      })
    );

    // Sort newest → oldest by match_number (fallback to key)
    enrichedMatches.sort((a, b) => {
      const aNum = a.match_number ?? 0;
      const bNum = b.match_number ?? 0;
      return bNum - aNum;
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        matches: enrichedMatches,
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
