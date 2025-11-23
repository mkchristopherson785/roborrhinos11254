// netlify/functions/get-matches.js

import fetch from "node-fetch";

export async function handler(event, context) {
  const API_KEY = process.env.TOA_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Missing TOA_API_KEY environment variable",
      }),
    };
  }

  try {
    // TOA uses an FTC-style team key like "ftc11254"
    const teamKey = "ftc11254";
    // Season key for 2025–26; change if needed or make dynamic later
    const seasonKey = "2526";

    const url = `https://theorangealliance.org/api/team/${teamKey}/matches/${seasonKey}`;

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-TOA-Key": API_KEY,
        "X-Application-Origin": "RoboRhinosWebsite",
      },
    });

    if (!response.ok) {
      const text = await response.text(); // helpful for debugging
      throw new Error(`TOA error: ${response.status} ${response.statusText} ${text}`);
    }

    const matches = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ matches }), // 👈 this is what your frontend expects
    };
  } catch (err) {
    console.error("get-matches error:", err);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: err.message,
      }),
    };
  }
}