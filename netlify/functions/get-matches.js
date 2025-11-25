// netlify/functions/get-matches.js

export async function handler(event, context) {
  const API_KEY = process.env.TOA_API_KEY;

  // 1) Guard: make it VERY obvious if Netlify env var isn't set
  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Missing TOA_API_KEY environment variable on Netlify.",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  try {
    // 2) Use the FTC-style team key
    const url = "https://theorangealliance.org/api/team/ftc11254/matches";

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-TOA-Key": API_KEY,
        "X-Application-Origin": "RoboRhinosWebsite",
      },
    });

    // For debugging, we return TOA's body + status if it fails
    const text = await response.text();

    if (!response.ok) {
      console.error("TOA error:", response.status, text);
      return {
        statusCode: response.status,
        body: text, // pass TOA's JSON straight through so you can see it
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

    // 3) When OK, parse JSON & wrap as { matches: [...] }
    const matches = JSON.parse(text);

    return {
      statusCode: 200,
      body: JSON.stringify({ matches }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
}
