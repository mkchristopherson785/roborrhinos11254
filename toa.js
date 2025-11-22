// toa.js
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("match-results");

  if (!container) return; // No match-results section on this page

  container.innerHTML = "<p>Loading match data…</p>";

  fetch("/.netlify/functions/toa-matches")
    .then((res) => {
      if (!res.ok) {
        throw new Error("Network response was not ok: " + res.status);
      }
      return res.json();
    })
    .then((matches) => {
      if (!Array.isArray(matches) || matches.length === 0) {
        container.innerHTML = "<p>No match results found yet.</p>";
        return;
      }

      // Simple table output
      const rows = matches
        .map((m) => {
          const eventName = m.event_key || m.event_name || "Event";
          const matchKey = m.match_key || `${m.match_number || ""}`;
          const alliance = m.alliance || m.team_color || "";
          const result = m.result || m.winner || "";
          const redScore = m.red_score ?? "";
          const blueScore = m.blue_score ?? "";

          return `
            <tr>
              <td>${eventName}</td>
              <td>${matchKey}</td>
              <td>${alliance}</td>
              <td>${result}</td>
              <td>${redScore}</td>
              <td>${blueScore}</td>
            </tr>
          `;
        })
        .join("");

      container.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
          <thead>
            <tr>
              <th style="text-align:left;border-bottom:1px solid rgba(255,255,255,0.1);padding:0.4rem;">Event</th>
              <th style="text-align:left;border-bottom:1px solid rgba(255,255,255,0.1);padding:0.4rem;">Match</th>
              <th style="text-align:left;border-bottom:1px solid rgba(255,255,255,0.1);padding:0.4rem;">Alliance</th>
              <th style="text-align:left;border-bottom:1px solid rgba(255,255,255,0.1);padding:0.4rem;">Result</th>
              <th style="text-align:left;border-bottom:1px solid rgba(255,255,255,0.1);padding:0.4rem;">Red</th>
              <th style="text-align:left;border-bottom:1px solid rgba(255,255,255,0.1);padding:0.4rem;">Blue</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    })
    .catch((err) => {
      console.error("Match load error:", err);
      container.innerHTML = `<p>Could not load match data.</p>`;
    });
});
