// netlify/functions/get-matches.js

// Netlify Functions (Node 18+) have global fetch built-in
exports.handler = async function (event, context) {
  const API_KEY = process.env.TOA_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing TOA_API_KEY environment variable" }),
      headers: { "Content-Type": "application/json" }
    };
  }

  try {
    const url = "https://theorangealliance.org/api/team/11254/matches";

    const response = await fetch(url, {
      headers: {
        "accept": "application/json",
        "X-TOA-Key": API_KEY,
        "X-Application-Origin": "RoboRhinosWebsite"
      }
    });

    if (!response.ok) {
      throw new Error(`TOA error: ${response.status} ${response.statusText}`);
    }

    const matches = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(matches),
      headers: { "Content-Type": "application/json" }
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
      headers: { "Content-Type": "application/json" }
    };
  }
};
