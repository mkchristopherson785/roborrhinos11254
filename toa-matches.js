// toa-matches.js
(async () => {
  const RESULTS = document.getElementById("toa-results");
  const TEAM = "11254";

  // Netlify injects env variables at build time
  const API_KEY = window.TOA_API_KEY || ""; 

  if (!API_KEY) {
    RESULTS.innerHTML = `<p class="muted">⚠️ Missing TOA API key. Set TOA_API_KEY in Netlify Environment Variables.</p>`;
    return;
  }

  try {
    const response = await fetch(`/.netlify/functions/toaProxy?team=${TEAM}`);
    if (!response.ok) throw new Error("Network error");

    const matches = await response.json();

    if (!matches.length) {
      RESULTS.innerHTML = `<p class="muted">No match results found yet.</p>`;
      return;
    }

    let html = `
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="text-align:left; border-bottom:1px solid #444;">
            <th>Match</th>
            <th>Red</th>
            <th>Blue</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const m of matches) {
      const outcome =
        m.red_score > m.blue_score
          ? "<span style='color:#ff4d4d'>Red Win</span>"
          : "<span style='color:#4dc3ff'>Blue Win</span>";

      html += `
        <tr style="border-bottom:1px solid #333;">
          <td>${m.match_name}</td>
          <td>${m.red_score}</td>
          <td>${m.blue_score}</td>
          <td>${outcome}</td>
        </tr>`;
    }

    html += "</tbody></table>";

    RESULTS.innerHTML = html;
  } catch (err) {
    RESULTS.innerHTML = `<p class="muted">Could not load match data.</p>`;
    console.error(err);
  }
})();
