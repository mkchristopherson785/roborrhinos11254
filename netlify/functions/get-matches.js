import fetch from "node-fetch";

export async function handler(event, context) {
  const API_KEY = process.env.TOA_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing TOA_API_KEY environment variable" })
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
      body: JSON.stringify(matches)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
