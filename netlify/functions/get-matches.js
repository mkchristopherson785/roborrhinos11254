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
    // Current event key (update as needed)
    const EVENT_KEY = "2526-FIM-NOQ";

    const url = `https://theorangealliance.org/api/event/${EVENT_KEY}/matches`;

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-TOA-Key": API_KEY,
        "X-Application-Origin": "RoboRhinosWebsite"
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "TOA error",
          status: response.status,
          body: text
        })
      };
    }

    const matches = await response.json();

    // Timestamp when we fetched from TOA
    const fetched_at = new Date().toISOString();

    // Wrap so your front-end can read { matches, fetched_at }
    return {
      statusCode: 200,
      body: JSON.stringify({ matches, fetched_at })
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
