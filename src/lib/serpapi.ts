// lib/serpapi.ts
/**
 * SerpAPI Flight Search Integration
 * Provides flight search using Google Flights data via SerpAPI
 */

import axios from "axios";

export interface SerpAPIFlightResponse {
  flights: SerpAPIFlight[];
  search_metadata: {
    status: string;
    created_at: string;
    processed_at: string;
    total_processing_time: number;
    api_calls: number;
  };
}

export interface SerpAPIFlight {
  type: string;
  layovers: number;
  duration: number;
  departure_airport: {
    name: string;
    id: string;
    time: string;
  };
  arrival_airport: {
    name: string;
    id: string;
    time: string;
  };
  airline: string;
  airline_logo: string;
  price: number;
  extensions: string[];
  stops?: Array<{
    airport_id: string;
    name: string;
    duration: number;
  }>;
}

export interface FlightSearchParams {
  departure_airport: string;
  arrival_airport: string;
  outbound_date: string;
  return_date?: string;
  adults?: number;
  children?: number;
  infants?: number;
  class?: "economy" | "premium_economy" | "business" | "first";
  currency?: string;
}

/**
 * Search flights using SerpAPI Google Flights API
 */
export async function searchFlightsWithSerpAPI(
  params: FlightSearchParams
): Promise<SerpAPIFlightResponse> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new Error("SerpAPI key not configured");
  }

  try {
    // Map our params to SerpAPI params
    const serpApiParams = {
      api_key: apiKey,
      engine: "google_flights",
      departure_airport: params.departure_airport,
      arrival_airport: params.arrival_airport,
      outbound_date: params.outbound_date,
      return_date: params.return_date,
      adults: params.adults || 1,
      children: params.children || 0,
      infants: params.infants || 0,
      type: params.return_date ? 2 : 1, // 1 = one-way, 2 = round-trip
      class: params.class || "economy",
      currency: params.currency || "USD",
    };

    const response = await axios.get<SerpAPIFlightResponse>(
      "https://serpapi.com/search",
      {
        params: serpApiParams,
        timeout: 15000,
      }
    );

    if (!response.data || !response.data.flights) {
      return {
        flights: [],
        search_metadata: response.data?.search_metadata || {
          status: "no_results",
          created_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
          total_processing_time: 0,
          api_calls: 1,
        },
      };
    }

    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStatus = error && typeof error === 'object' && 'response' in error ? (error as { response?: { status?: number } }).response?.status : 500;
    console.error("SerpAPI Error:", errorMessage);
    throw {
      error: "Failed to fetch flights from SerpAPI",
      message: errorMessage,
      status: errorStatus || 500,
    };
  }
}

/**
 * Search round-trip flights
 */
export async function searchRoundTripFlights(params: {
  from: string;
  to: string;
  departure_date: string;
  return_date: string;
  adults?: number;
  children?: number;
  class?: "economy" | "premium_economy" | "business" | "first";
}): Promise<SerpAPIFlightResponse> {
  return searchFlightsWithSerpAPI({
    departure_airport: params.from,
    arrival_airport: params.to,
    outbound_date: params.departure_date,
    return_date: params.return_date,
    adults: params.adults || 1,
    children: params.children || 0,
    class: params.class || "economy",
  });
}

/**
 * Search one-way flights
 */
export async function searchOneWayFlights(params: {
  from: string;
  to: string;
  departure_date: string;
  adults?: number;
  children?: number;
  class?: "economy" | "premium_economy" | "business" | "first";
}): Promise<SerpAPIFlightResponse> {
  return searchFlightsWithSerpAPI({
    departure_airport: params.from,
    arrival_airport: params.to,
    outbound_date: params.departure_date,
    adults: params.adults || 1,
    children: params.children || 0,
    class: params.class || "economy",
  });
}

/**
 * Get flight price history and trends
 */
export async function getFlightTrends(params: {
  from: string;
  to: string;
  departure_date: string;
  return_date?: string;
}): Promise<SerpAPIFlightResponse> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new Error("SerpAPI key not configured");
  }

  try {
    const response = await axios.get<SerpAPIFlightResponse>("https://serpapi.com/search", {
      params: {
        api_key: apiKey,
        engine: "google_flights",
        departure_airport: params.from,
        arrival_airport: params.to,
        outbound_date: params.departure_date,
        return_date: params.return_date,
        adults: 1,
        type: params.return_date ? 2 : 1,
      },
      timeout: 15000,
    });

    // Return flight response
    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("SerpAPI Trends Error:", errorMessage);
    throw error;
  }
}

/**
 * Transform SerpAPI response to unified flight format
 */
export function transformSerpAPIToUnified(serpApiResponse: SerpAPIFlightResponse) {
  return serpApiResponse.flights.map((flight: SerpAPIFlight, index: number) => ({
    id: `serp-${index}-${flight.departure_airport.id}-${flight.arrival_airport.id}`,
    flights: [
      {
        departure_airport: flight.departure_airport,
        arrival_airport: flight.arrival_airport,
        duration: flight.duration,
        airline: flight.airline,
        airline_logo: flight.airline_logo,
        flight_number: "", // SerpAPI doesn't provide flight number
        travel_class: "ECONOMY",
        legroom: "standard",
        extensions: flight.extensions || [],
      },
    ],
    total_duration: flight.duration,
    carbon_emissions: {
      this_flight: 0,
      typical_for_this_route: 0,
      difference_percent: 0,
    },
    priceOptions: [
      {
        provider: "Google Flights",
        price: flight.price,
        currency: "USD",
        bookingUrl: "", // Would need to add from flight data
      },
    ],
    lowestPrice: flight.price,
    type: flight.type || "roundtrip",
    layovers: flight.layovers || 0,
  }));
}

