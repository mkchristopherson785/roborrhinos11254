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
    // Hard-code the event for now (update this to your current event)
    // Example: 2526-FIM-NOQ
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

    // Wrap in { matches } so the HTML code you already have keeps working
    return {
      statusCode: 200,
      body: JSON.stringify({ matches })
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
