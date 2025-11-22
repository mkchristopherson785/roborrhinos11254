// netlify/functions/get-matches.js

import fetch from "node-fetch";

export async function handler(event, context) {
  const API_KEY = process.env.TOA_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing TOA_API_KEY environment variable." })
    };
  }

  try {
    const res = await fetch("https://theorangealliance.org/api/team/11254/matches", {
      headers: {
        "Content-Type": "application/json",
        "X-TOA-Key": API_KEY,
        "X-Application-Origin": "Robo-Rhinos-Website"
      }
    });

    const data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
