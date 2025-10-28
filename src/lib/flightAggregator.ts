// lib/flightAggregator.ts
import axios from "axios";
import { searchAmadeusFlights } from "./amadeus";
import { searchFlightsWithSerpAPI, transformSerpAPIToUnified } from "./serpapi";

export interface PriceOption {
  provider: string; // "Amadeus", "Skyscanner", "Google Flights", etc.
  price: number;
  bookingUrl?: string;
  currency?: string;
}

export interface FlightSegment {
  departure_airport: { name: string; id: string; time: string };
  arrival_airport: { name: string; id: string; time: string };
  duration: string;
  airplane?: string;
  airline: string;
  airline_logo?: string;
  travel_class?: string;
  flight_number: string;
  legroom?: string;
  extensions?: string[];
}

export interface AggregatedFlight {
  id: string; // Unique ID based on flight route and times
  flights: FlightSegment[];
  total_duration: number;
  carbon_emissions: {
    this_flight: number;
    typical_for_this_route: number;
    difference_percent: number;
  };
  priceOptions: PriceOption[]; // Array of prices from different providers
  lowestPrice: number;
  airline_logo?: string;
  extensions?: string[];
  booking_token?: string;
  type: string;
}

interface AmadeusOffer {
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft: { code: string };
      operating: { carrierCode: string };
      cabin: string;
      class: string;
      isNonStop: boolean;
      duration: string;
      id: number;
      numberOfStops: number;
    }>;
  }>;
  price: {
    currency: string;
    total: string;
    base: string;
    fee: string;
    grandTotal: string;
  };
  pricingOptions: {
    fareDetailsBySegment: Array<{
      segmentId: string;
      cabin: string;
      class: string;
      includedCheckedBags: {
        weight: number;
        weightUnit: string;
      };
    }>;
  };
  validatingAirlineCodes: string[];
  travelerPricings: Array<{
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: {
      currency: string;
      total: string;
      base: string;
    };
    fareDetailsBySegment: Array<{
      segmentId: string;
      cabin: string;
      class: string;
      includedCheckedBags: {
        weight: number;
        weightUnit: string;
      };
    }>;
  }>;
}

function transformAmadeusToAggregated(amadeusResponse: { dictionaries?: Record<string, Record<string, string>>; data: AmadeusOffer[] }): AggregatedFlight[] {
  const carriers = (amadeusResponse.dictionaries?.carriers as Record<string, string>) || {};
  const aircrafts = (amadeusResponse.dictionaries?.aircraft as Record<string, string>) || {};

    return amadeusResponse.data.map((offer: AmadeusOffer) => {
    const totalPrice = parseFloat(offer.price.total);

    const allSegments: FlightSegment[] = offer.itineraries.flatMap(
      (itin: Record<string, unknown>) => {
        const segments = (itin.segments as unknown[]) || [];
        return segments.map((seg: unknown) => {
          const segment = seg as {
            departure: Record<string, unknown>;
            arrival: Record<string, unknown>;
            aircraft: Record<string, unknown>;
            stops?: Array<Record<string, unknown>>;
            id?: string;
            carrierCode?: string;
            number?: string;
            cabin?: string;
            duration?: string;
            numberOfStops?: number;
          };
          const departure = segment.departure;
          const arrival = segment.arrival;
          const aircraft = segment.aircraft;
          // Stops info
          let stops: Array<{ iataCode?: string; duration?: string; arrivalAt?: string; departureAt?: string }> = [];
          if (segment.stops && Array.isArray(segment.stops)) {
            stops = segment.stops.map((stop: Record<string, unknown>) => {
              return {
                iataCode: stop.iataCode as string | undefined,
                duration: stop.duration as string | undefined,
                arrivalAt: stop.arrivalAt as string | undefined,
                departureAt: stop.departureAt as string | undefined,
              };
            });
          }
          // Amenities, branded fares, baggage
          let includedCheckedBags = undefined;
          if (offer.travelerPricings && offer.travelerPricings.length > 0) {
            const fareDetails = offer.travelerPricings[0].fareDetailsBySegment?.find((fd: Record<string, unknown>) => {
              return fd.segmentId === segment.id;
            });
            if (fareDetails && fareDetails.includedCheckedBags) {
              includedCheckedBags = fareDetails.includedCheckedBags;
            }
          }
          return {
            departure_airport: {
              name: typeof departure.iataCode === "string" ? departure.iataCode : "",
              id: typeof departure.iataCode === "string" ? departure.iataCode : "",
              time: typeof departure.at === "string" ? departure.at : "",
              terminal: typeof departure.terminal === "string" ? departure.terminal : undefined,
            },
            arrival_airport: {
              name: typeof arrival.iataCode === "string" ? arrival.iataCode : "",
              id: typeof arrival.iataCode === "string" ? arrival.iataCode : "",
              time: typeof arrival.at === "string" ? arrival.at : "",
              terminal: typeof arrival.terminal === "string" ? arrival.terminal : undefined,
            },
            duration: typeof segment.duration === "string" ? segment.duration : "",
            airplane: typeof aircraft.code === "string" ? (aircrafts[aircraft.code] || aircraft.code) : "Unknown",
            airline: (carriers[segment.carrierCode ?? "UNKNOWN"] || segment.carrierCode) ?? "UNKNOWN",
            airline_logo: "",
            travel_class: segment.cabin,
            flight_number: `${segment.carrierCode}${segment.number}`,
            legroom: "standard",
            extensions: [],
            numberOfStops: segment.numberOfStops,
            stops,
            includedCheckedBags,
          };
        });
      }
    );

    // Create unique ID based on route and times
    const flightId = allSegments
      .map((f) => `${f.departure_airport.id}-${f.arrival_airport.id}-${f.departure_airport.time}`)
      .join("|");

    const totalDuration = offer.itineraries.reduce((sum: number, itin: Record<string, unknown>) => {
      const duration = itin.duration as string;
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
      const hours = match?.[1] ? parseInt(match[1]) : 0;
      const mins = match?.[2] ? parseInt(match[2]) : 0;
      return sum + hours * 60 + mins;
    }, 0);

    return {
      id: flightId,
      flights: allSegments,
      total_duration: totalDuration,
      carbon_emissions: {
        this_flight: 0,
        typical_for_this_route: 0,
        difference_percent: 0,
      },
      priceOptions: [
        {
          provider: "Amadeus",
          price: totalPrice,
          currency: offer.price.currency,
        },
      ],
      lowestPrice: totalPrice,
      airline_logo: "",
      extensions: [],
      booking_token: offer.id,
      type: offer.oneWay ? "oneway" : "roundtrip",
      numberOfBookableSeats: offer.numberOfBookableSeats,
      apiRaw: offer, // Attach raw API offer for modal details
    };
  });
}

async function searchSkyscannerFlights(params: {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults?: string;
}): Promise<AggregatedFlight[]> {
  try {
    // Using RapidAPI Skyscanner Free API
    const response = await axios.get("https://skyscanner-api.p.rapidapi.com/v3/flights/search-live", {
      params: {
        originSkyId: params.originLocationCode,
        destinationSkyId: params.destinationLocationCode,
        originEntityId: "27544008", // Example: Paris
        destinationEntityId: "94924863", // Example: Seoul
        date: params.departureDate.replace(/-/g, ""),
        returnDate: params.returnDate?.replace(/-/g, ""),
        adults: params.adults || "1",
        cabinClass: "economy",
        currency: "USD",
        countryCode: "US",
        marketCode: "en-US",
      },
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY || "",
        "x-rapidapi-host": "skyscanner-api.p.rapidapi.com",
      },
    });

    // Transform Skyscanner response to AggregatedFlight format
    // Note: This is a simplified example - actual transformation depends on Skyscanner API response format
    return response.data.itineraries?.map((itinerary: Record<string, unknown>) => ({
      id: itinerary.id,
      flights: (itinerary.legs as Array<Record<string, unknown>>)?.map((leg: Record<string, unknown>) => ({
        departure_airport: {
          name: ((leg.departure as Record<string, unknown>)?.airport as Record<string, unknown>)?.code as string || "",
          id: ((leg.departure as Record<string, unknown>)?.airport as Record<string, unknown>)?.code as string || "",
          time: (leg.departure as Record<string, unknown>)?.time as string || "",
        },
        arrival_airport: {
          name: ((leg.arrival as Record<string, unknown>)?.airport as Record<string, unknown>)?.code as string || "",
          id: ((leg.arrival as Record<string, unknown>)?.airport as Record<string, unknown>)?.code as string || "",
          time: (leg.arrival as Record<string, unknown>)?.time as string || "",
        },
        duration: typeof leg.durationInMinutes === "number" ? leg.durationInMinutes.toString() : "0",
        airline: Array.isArray(leg.carriers) && leg.carriers[0]?.name ? String(leg.carriers[0].name) : "",
        flight_number: typeof leg.flightNumber === "string" ? leg.flightNumber : "",
      })) || [],
      total_duration: itinerary.duration || 0,
      carbon_emissions: {
        this_flight: 0,
        typical_for_this_route: 0,
        difference_percent: 0,
      },
      priceOptions: [
        {
          provider: "Skyscanner",
          price: ((itinerary.price as Record<string, unknown>)?.amount as number) || 0,
          currency: ((itinerary.price as Record<string, unknown>)?.currency as string) || "USD",
          bookingUrl: (itinerary.deepLink as string) || "",
        },
      ],
      lowestPrice: ((itinerary.price as Record<string, unknown>)?.amount as number) || 0,
      type: "roundtrip",
    })) || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Skyscanner API Error:", errorMessage);
    return [];
  }
}

export async function aggregateFlightSearches(params: {
  // ...existing code...
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults?: string;
  children?: string;
  infants?: string;
  class?: string;
  travelClass?: string;
  type?: string;
  stops?: string;
  max?: string;
}): Promise<AggregatedFlight[]> {
  try {
    const amadeusParams: Record<string, string> = {
      originLocationCode: params.originLocationCode,
      destinationLocationCode: params.destinationLocationCode,
      departureDate: params.departureDate,
      adults: typeof params.adults === "string" ? params.adults : "1",
      max: typeof params.max === "string" ? params.max : "",
    };
    // Only include children if > 0
    if (params.children && parseInt(params.children) > 0) {
      amadeusParams.children = params.children;
    }
    // Only include infants if > 0
    if (params.infants && parseInt(params.infants) > 0) {
      amadeusParams.infants = params.infants;
    }
    // Map travelClass param from frontend to Amadeus API
    if (params.travelClass) {
      amadeusParams.travelClass = params.travelClass;
    }
    if (typeof params.returnDate === "string" && params.returnDate !== "") {
      amadeusParams.returnDate = params.returnDate;
    }
    const [amadeusFlights, skyscannerFlights, serpApiFlights] = await Promise.allSettled([
      searchAmadeusFlights(amadeusParams),
      searchSkyscannerFlights({
        originLocationCode: params.originLocationCode,
        destinationLocationCode: params.destinationLocationCode,
        departureDate: params.departureDate,
        returnDate: typeof params.returnDate === "string" ? params.returnDate : "",
        adults: typeof params.adults === "string" ? params.adults : "1",
      }),
      searchFlightsWithSerpAPI({
        departure_airport: params.originLocationCode,
        arrival_airport: params.destinationLocationCode,
        outbound_date: params.departureDate,
        return_date: typeof params.returnDate === "string" ? params.returnDate : undefined,
        adults: parseInt(params.adults || "1"),
        children: parseInt(params.children || "0"),
        infants: parseInt(params.infants || "0"),
  class: params.class as "economy" | "premium_economy" | "business" | "first" | undefined,
        // Interpret type: 1=oneway, 2=roundtrip
        ...(params.type === "2" ? { return_date: typeof params.returnDate === "string" ? params.returnDate : undefined } : {}),
      }),
    ]).then((results) => [
      results[0].status === "fulfilled" ? results[0].value : { data: [] },
      results[1].status === "fulfilled" ? results[1].value : [],
      results[2].status === "fulfilled" ? transformSerpAPIToUnified(results[2].value) : [],
    ]);

    // Transform Amadeus flights
    const amadeusAggregated = transformAmadeusToAggregated(amadeusFlights);

    // Combine all flights (do NOT force type)
    const allFlights = [...amadeusAggregated, ...serpApiFlights];

    // Merge flights with same route and times from different providers
    const mergedFlights: Map<string, AggregatedFlight> = new Map();

    for (const flight of allFlights) {
      if (mergedFlights.has(flight.id)) {
        const existing = mergedFlights.get(flight.id)!;
        existing.priceOptions = [
          ...existing.priceOptions,
          ...flight.priceOptions,
        ];
        existing.lowestPrice = Math.min(
          existing.lowestPrice,
          ...flight.priceOptions.map((p: PriceOption) => p.price)
        );
      } else {
        mergedFlights.set(flight.id, flight);
      }
    }

    // Add Skyscanner flights that don't match Amadeus flights
    for (const flight of skyscannerFlights) {
      if (!mergedFlights.has(flight.id)) {
        mergedFlights.set(flight.id, flight);
      }
    }

    // Sort by lowest price
    const sorted = Array.from(mergedFlights.values()).sort(
      (a, b) => a.lowestPrice - b.lowestPrice
    );

    return sorted;
  } catch (error) {
    console.error("Flight aggregation error:", error);
    throw error;
  }
}
