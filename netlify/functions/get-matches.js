// netlify/functions/get-matches.js
import fetch from "node-fetch";

const EVENT_KEY = "2526-FIM-NOQ"; // <-- change when your event changes
const TEAM_NUMBER = 11254;        // Robo Rhinos

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

  const headers = {
    accept: "application/json",
    "X-TOA-Key": API_KEY,
    "X-Application-Origin": "RoboRhinosWebsite"
  };

  try {
    // 1) Get matches for this event
    const matchesRes = await fetch(
      `https://theorangealliance.org/api/event/${EVENT_KEY}/matches`,
      { headers }
    );

    // 2) Get participants (which teams played in which match)
    const participantsRes = await fetch(
      `https://theorangealliance.org/api/event/${EVENT_KEY}/participants`,
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

    const rawMatches = await matchesRes.json();        // array
    const rawParticipants = await participantsRes.json(); // array

    // Map: match_key -> { red: [...], blue: [...] }
    const participantsByMatch = {};
    for (const p of rawParticipants) {
      const key = p.match_key;
      if (!participantsByMatch[key]) {
        participantsByMatch[key] = { red: [], blue: [] };
      }

      // Station 11/12 = Red, 21/22 = Blue
      const color = p.station < 20 ? "red" : "blue";

      participantsByMatch[key][color].push({
        team_key: p.team_key,
        team_number: p.team?.team_number ?? null,
        team_name_short: p.team?.team_name_short ?? "",
        city: p.team?.city ?? "",
        state_prov: p.team?.state_prov ?? ""
      });
    }

    // Helper to make a nicer match name from the TOA key
    function prettyMatchName(matchKey, tournamentLevel) {
      if (!matchKey) return "Match";

      const parts = matchKey.split("-"); // [2526, FIM, NOQ, Q001, 1]
      const code = parts[3] || "";
      const gameNumPart = parts[4] || "";

      let prefix = "Match";
      if (code.startsWith("Q")) prefix = "Qual";
      else if (code.startsWith("SF")) prefix = "Semi";
      else if (code.startsWith("F")) prefix = "Final";
      else if (code.startsWith("E")) prefix = "Elim";

      const num = code.replace(/[A-Za-z]/g, "").replace(/^0+/, "") || code;

      let name = `${prefix} ${num}`;
      if (gameNumPart) name += ` – ${gameNumPart}`;
      return name;
    }

    // Build final matches list, filtered to only matches that include Robo Rhinos
    const matches = rawMatches
      .map((m) => {
        const p = participantsByMatch[m.match_key] || { red: [], blue: [] };
        const allTeams = [...p.red, ...p.blue];

        const includesUs = allTeams.some(
          (t) =>
            t.team_number === TEAM_NUMBER ||
            String(t.team_number) === String(TEAM_NUMBER) ||
            t.team_key === String(TEAM_NUMBER)
        );

        return {
          match_key: m.match_key,
          name: prettyMatchName(m.match_key, m.tournament_level),
          event_key: m.event_key,
          tournament_level: m.tournament_level,
          scheduled_time: m.scheduled_time || m.start_time || null,
          red_score: m.red_score,
          blue_score: m.blue_score,
          red_teams: p.red,
          blue_teams: p.blue,
          includes_us: includesUs
        };
      })
      .filter((m) => m.includes_us) // only show matches with Team 11254
      .sort((a, b) => (a.match_key > b.match_key ? 1 : -1));

    return {
      statusCode: 200,
      body: JSON.stringify({
        matches,
        generated_at: new Date().toISOString()
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || "Unknown error in get-matches"
      })
    };
  }
}
