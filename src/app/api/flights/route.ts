/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { aggregateFlightSearches } from "@/lib/flightAggregator";
import mockData from './mockData.json';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    // Accept Amadeus-style param names from frontend
    const origin = searchParams.get("originLocationCode") || searchParams.get("departure");
    const destination = searchParams.get("destinationLocationCode") || searchParams.get("arrival");
    const outbound_date = searchParams.get("departureDate") || searchParams.get("outbound_date");
    const return_date = searchParams.get("returnDate") || searchParams.get("return_date");
    const adults = searchParams.get("adults") || "1";
    const children = searchParams.get("children") || "0";
    const infants = searchParams.get("infants") || "0";
    // Accept 'travel_class' param from frontend, fallback to 'class'
    const flight_class = searchParams.get("travel_class") || searchParams.get("class") || "economy";
    // Accept Amadeus 'travelClass' param from frontend
    const travelClass = searchParams.get("travelClass");
    // Accept 'type' as 'oneway' or 'roundtrip' from frontend
    let flight_type = searchParams.get("type") || "any";
    if (flight_type === "1") flight_type = "roundtrip";
    if (flight_type === "2") flight_type = "oneway";
    const stops = searchParams.get("stops");
    const max_results = searchParams.get("max") || "50";

    // Validate airport codes (IATA: 3 letters)
    const iataRegex = /^[A-Z]{3}$/i;
    if (!origin || !destination || !outbound_date) {
        return NextResponse.json({ error: "Missing required params" }, { status: 400 });
    }
    if (!iataRegex.test(origin) || !iataRegex.test(destination)) {
        return NextResponse.json({ error: "Invalid airport code(s)" }, { status: 400 });
    }
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(outbound_date) || (return_date && !dateRegex.test(return_date))) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    let aggregatedFlights: import("@/lib/flightAggregator").AggregatedFlight[] = [];
    let errors: Record<string, string> = {};
    let sources: string[] = [];
    try {
        // Only send type param if return_date is present
        const aggregatorParams: any = {
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate: outbound_date,
            adults: adults,
            children: children,
            infants: infants,
            class: flight_class,
            travelClass: travelClass,
            stops: stops || undefined,
            max: max_results,
        };
        if (return_date && return_date !== "") {
            aggregatorParams.returnDate = return_date;
            aggregatorParams.type = flight_type;
        }
        aggregatedFlights = await aggregateFlightSearches(aggregatorParams);
        sources = ["amadeus", "skyscanner", "serpapi"];
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        errors["aggregator"] = errorMessage;
        console.error("Flight search error:", errorMessage);
    }

    // Deduplicate and merge flights with same route/times
    const seenIds = new Set();
    let flights_data: import("@/lib/flightAggregator").AggregatedFlight[] = aggregatedFlights
        .sort((a, b) => a.lowestPrice - b.lowestPrice)
        .filter(f => {
            if (seenIds.has(f.id)) return false;
            seenIds.add(f.id);
            return true;
        });

    // Only apply flight type filter for roundtrip searches
    if (flight_type === "roundtrip") {
        const filtered = flights_data.filter(f => {
            return f.type === "roundtrip" || (f as any).oneWay === false;
        });
        // Only apply filter if it doesn't exclude all results
        if (filtered.length > 0) flights_data = filtered;
    }
    // Filter by flight class
    if (flight_class) {
        const filtered = flights_data.filter(f =>
            f.flights.some(seg => seg.travel_class?.toLowerCase() === flight_class.toLowerCase())
        );
        if (filtered.length > 0) flights_data = filtered;
    }
    // Filter by stops
    if (stops !== undefined && stops !== null && stops !== "") {
        const stopsNum = parseInt(stops);
        const filtered = flights_data.filter(f => {
            // Count stops in all segments
            const totalStops = f.flights.reduce((sum, seg) => {
                if (typeof (seg as any).numberOfStops === "number") {
                    return sum + (seg as any).numberOfStops;
                }
                if ((seg as any).layovers && Array.isArray((seg as any).layovers)) {
                    return sum + (seg as any).layovers.length;
                }
                return sum;
            }, 0);
            // If stopsNum is 0, allow any number of stops
            if (stopsNum === 0) return true;
            return totalStops === stopsNum;
        });
        if (filtered.length > 0) flights_data = filtered;
    }
    // Filter by travelers (adults, children, infants)
    if (adults) {
        const filtered = flights_data.filter(f => {
            return typeof (f as any).numberOfBookableSeats === "undefined" || (f as any).numberOfBookableSeats >= parseInt(adults);
        });
        if (filtered.length > 0) flights_data = filtered;
    }
    flights_data = flights_data.slice(0, parseInt(max_results));

    // Add warning if only one-way flights are returned for round-trip search
    let warnings: string[] = [];
    if (flight_type === "roundtrip" && flights_data.every(f => f.type === "oneway")) {
        warnings.push("Note: Only one-way flights returned for round-trip search.");
    }

    // Enrich price options with provenance
    flights_data.forEach(flight => {
        flight.priceOptions = flight.priceOptions.map((opt: import("@/lib/flightAggregator").PriceOption) => ({
            ...opt,
            provenance: opt.provider
        }));
    });

    // Collect unique airports from all flights
    const airportMap: Record<string, { id: string; name: string }> = {};
    flights_data.forEach(flight => {
        flight.flights.forEach(segment => {
            const dep = segment.departure_airport;
            const arr = segment.arrival_airport;
            if (dep.id && !airportMap[dep.id]) {
                airportMap[dep.id] = { id: dep.id, name: dep.name };
            }
            if (arr.id && !airportMap[arr.id]) {
                airportMap[arr.id] = { id: arr.id, name: arr.name };
            }
        });
    });
    const airports = Object.values(airportMap);

    return NextResponse.json({
        flights_data,
        metadata: {
            source: "aggregated",
            sources,
            totalResults: aggregatedFlights.length,
            errors,
            warnings,
        },
        price_insights: null,
        airports,
    });
}