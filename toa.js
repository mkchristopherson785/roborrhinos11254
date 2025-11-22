// netlify/functions/toa.js

export async function handler(event, context) {
  const API_KEY = process.env.TOA_API_KEY;       // stored in Netlify
  const APP_ORIGIN = process.env.TOA_APP_ORIGIN || "roborrhinos.netlify.app";

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing TOA_API_KEY in environment" }),
    };
  }

  // read team & season from query params
  const params = event.queryStringParameters || {};
  const teamNumber = params.team || "11254";
  const season = params.season || "2526"; // adjust as needed

  // Example: get all events for a team for a season
  const url = `https://theorangealliance.org/api/team/${teamNumber}/events/${season}-FIM`;

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-TOA-Key": API_KEY,
        "X-Application-Origin": APP_ORIGIN,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "TOA API error",
          status: response.status,
          body: text,
        }),
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Request failed", details: String(err) }),
    };
  }
}
