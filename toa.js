const TEAM = "11254";
const API_KEY = "o4CwTLVtJ0VW87efhY8Tn1z9ZU591rSfrpKuvbu/1aA=";

async function loadMatches() {
  const response = await fetch(`https://theorangealliance.org/api/team/${TEAM}/matches`, {
    headers: { "X-TOA-Key": API_KEY, "accept": "application/json" }
  });

  const matches = await response.json();

  console.log(matches);
}

loadMatches();
