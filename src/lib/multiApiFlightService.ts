// lib/multiApiFlightService.ts
/**
 * Multi-API Flight Service
 * Provides abstraction for fetching flight data from multiple sources
 * Supports: Amadeus, Skyscanner (RapidAPI), Google Flights (unofficial), etc.
 */

import axios from "axios";
import { searchAmadeusFlights } from "./amadeus";

export interface FlightData {
  source: string;
  flights: unknown[];
  timestamp: number;
  error?: string;
}

/**
 * Fetch flights from Amadeus API
 */
export async function fetchAmadeusFlights(params: {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults?: string;
  max?: string;
}): Promise<FlightData> {
  try {
    const data = await searchAmadeusFlights(params);
    return {
      source: "amadeus",
      flights: (data.data as unknown[]) || [],
      timestamp: Date.now(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Amadeus API Error:", errorMessage);
    return {
      source: "amadeus",
      flights: [],
      timestamp: Date.now(),
      error: errorMessage,
    };
  }
}

/**
 * Fetch flights from Google Flights (using unofficial scraper)
 * Note: This is a fallback for demo purposes
 */
export async function fetchGoogleFlights(params: {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
}): Promise<FlightData> {
  try {
    // Using a public flight search API or unofficial scraper
    // You can integrate: SerpAPI, Bright Data, or other scraping services
    const response = await axios.get("https://serpapi.com/search?engine=google_flights", {
      params: {
        departure_airport: params.originLocationCode,
        arrival_airport: params.destinationLocationCode,
        departure_date: params.departureDate,
        return_date: params.returnDate,
      },
      timeout: 10000,
    });

    return {
      source: "google_flights",
      flights: (response.data as unknown[]) || [],
      timestamp: Date.now(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Google Flights fetch error:", errorMessage);
    return {
      source: "google_flights",
      flights: [],
      timestamp: Date.now(),
      error: errorMessage,
    };
  }
}

/**
 * Fetch flights from Kayak/KAYAK using public endpoints
 */
export async function fetchKayakFlights(params: {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
}): Promise<FlightData> {
  try {
    // Kayak public API endpoint (if available)
    // Or you could use RapidAPI to access Kayak data
    const response = await axios.get("https://www.kayak.com/api/flights/search", {
      params: {
        from: params.originLocationCode,
        to: params.destinationLocationCode,
        outbound: params.departureDate,
        inbound: params.returnDate,
      },
      timeout: 10000,
    });

    return {
      source: "kayak",
      flights: (response.data?.flights as unknown[]) || [],
      timestamp: Date.now(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Kayak fetch error:", errorMessage);
    return {
      source: "kayak",
      flights: [],
      timestamp: Date.now(),
      error: errorMessage,
    };
  }
}

/**
 * Fetch flights from OneWayFares API
 */
export async function fetchOneWayFaresFlights(params: {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
}): Promise<FlightData> {
  try {
    const apiKey = process.env.ONEWAYFARES_API_KEY;
    if (!apiKey) {
      return {
        source: "onewayfares",
        flights: [],
        timestamp: Date.now(),
        error: "API key not configured",
      };
    }

    const response = await axios.get("https://api.onewayfares.com/flights/search", {
      params: {
        departure: params.originLocationCode,
        arrival: params.destinationLocationCode,
        departure_date: params.departureDate,
        return_date: params.returnDate,
      },
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 10000,
    });

    return {
      source: "onewayfares",
      flights: (response.data as unknown[]) || [],
      timestamp: Date.now(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("OneWayFares fetch error:", errorMessage);
    return {
      source: "onewayfares",
      flights: [],
      timestamp: Date.now(),
      error: errorMessage,
    };
  }
}

/**
 * Parallel fetch from multiple APIs
 */
export async function fetchFromMultipleAPIs(params: {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults?: string;
  sources?: string[]; // Specify which APIs to query
}): Promise<FlightData[]> {
  const defaultSources = params.sources || ["amadeus"];

  const fetchPromises: Promise<FlightData>[] = [];

  if (defaultSources.includes("amadeus")) {
    fetchPromises.push(fetchAmadeusFlights(params));
  }

  if (defaultSources.includes("google_flights")) {
    fetchPromises.push(fetchGoogleFlights(params));
  }

  if (defaultSources.includes("kayak")) {
    fetchPromises.push(fetchKayakFlights(params));
  }

  if (defaultSources.includes("onewayfares")) {
    fetchPromises.push(fetchOneWayFaresFlights(params));
  }

  try {
    const results = await Promise.allSettled(fetchPromises);
    return results
      .map((result) => (result.status === "fulfilled" ? result.value : null))
      .filter((data): data is FlightData => data !== null);
  } catch (error) {
    console.error("Error fetching from multiple APIs:", error);
    return [];
  }
}

/**
 * Get a list of available flight search providers
 */
export function getAvailableProviders(): string[] {
  return [
    "amadeus",
    "skyscanner",
    "google_flights",
    "kayak",
    "onewayfares",
  ];
}
