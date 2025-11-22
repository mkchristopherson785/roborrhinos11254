export async function loadMatchData() {
  const endpoint = `/.netlify/functions/toa-proxy?team=11254`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("API request failed");

    const data = await response.json();
    console.log("Match Data:", data);

    const container = document.getElementById("match-results");
    container.innerHTML = "";

    data.forEach(match => {
      const div = document.createElement("div");
      div.className = "match-card";
      div.innerHTML = `
        <strong>${match.match_key}</strong><br>
        ${match.red_score} (Red) vs ${match.blue_score} (Blue)
      `;
      container.appendChild(div);
    });
  } catch (e) {
    console.error(e);
    document.getElementById("match-results").innerHTML =
      "Could not load match data.";
  }
}
