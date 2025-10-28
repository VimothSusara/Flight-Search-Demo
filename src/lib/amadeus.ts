// lib/amadeus.ts
import axios from "axios";

const AMADEUS_API = process.env.AMADEUS_API_URL || "https://test.api.amadeus.com";

export async function getAccessToken() {
  const { data } = await axios.post(
    `${AMADEUS_API}/v1/security/oauth2/token`,
    new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.AMADEUS_CLIENT_ID!,
      client_secret: process.env.AMADEUS_CLIENT_SECRET!,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return data.access_token as string;
}

export async function searchAmadeusFlights(params: Record<string, string>) {
  const token = await getAccessToken();
 
  try {
    const { data } = await axios.get(`${AMADEUS_API}/v2/shopping/flight-offers`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Amadeus API error:", error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error("Amadeus API error:", error.message);
    } else {
      console.error("Amadeus API error:", error);
    }
    throw error;
  }
}