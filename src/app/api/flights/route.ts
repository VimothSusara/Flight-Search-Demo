import { NextRequest, NextResponse } from 'next/server';
import { searchAmadeusFlights } from "@/lib/amadeus";

function transformAmadeusToSerpSchema(amadeusResponse: any) {
    const carriers = amadeusResponse.dictionaries.carriers;
    const aircrafts = amadeusResponse.dictionaries.aircraft;

    return amadeusResponse.data.map((offer: any) => {
        const airlineCode = offer.validatingAirlineCodes[0];
        const airlineName = carriers[airlineCode];
        const totalPrice = parseFloat(offer.price.total);

        const allSegments = offer.itineraries.flatMap((itin: any) =>
            itin.segments.map((seg: any) => ({
                departure_airport: {
                    name: seg.departure.iataCode,
                    id: seg.departure.iataCode,
                    time: seg.departure.at,
                },
                arrival_airport: {
                    name: seg.arrival.iataCode,
                    id: seg.arrival.iataCode,
                    time: seg.arrival.at,
                },
                duration: seg.duration,
                airplane: aircrafts[seg.aircraft.code],
                airline: carriers[seg.carrierCode],
                airline_logo: "", // Optional: you can map to airline logos later
                travel_class: seg.cabin,
                flight_number: `${seg.carrierCode}${seg.number}`,
                legroom: "standard",
                extensions: [],
            }))
        );

        return {
            flights: allSegments,
            total_duration: offer.itineraries.reduce((sum: number, itin: any) => {
                const match = itin.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
                const hours = match?.[1] ? parseInt(match[1]) : 0;
                const mins = match?.[2] ? parseInt(match[2]) : 0;
                return sum + hours * 60 + mins;
            }, 0),
            carbon_emissions: {
                this_flight: 0,
                typical_for_this_route: 0,
                difference_percent: 0,
            },
            price: totalPrice,
            type: "amadeus",
            airline_logo: "",
            extensions: [],
            booking_token: offer.id,
        };
    });
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get("departure");
    const destination = searchParams.get("arrival");
    const outbound_date = searchParams.get("outbound_date");
    const return_date = searchParams.get("return_date");
    const currency = searchParams.get("currency") || "USD";
    const adults = searchParams.get("adults") || "1";
    const travel_class = searchParams.get("travel_class") || "ECONOMY";

    if (!origin || !destination || !outbound_date) {
        return NextResponse.json({ error: "Missing required params" }, { status: 400 });
    }

    const api_key = process.env.SERPAPI_KEY;
    if (!api_key) {
        return NextResponse.json({ error: "API key not found" }, { status: 500 });
    }

    try {
        const amadeusData = await searchAmadeusFlights({
            originLocationCode: 'PAR',
            destinationLocationCode: 'ICN',
            departureDate: '2025-10-31',
            returnDate: '2025-11-14',
            adults: '2',
            max: "5",
            
        });

        const flights_data = transformAmadeusToSerpSchema(amadeusData);

        return NextResponse.json({
            flights_data,
            metadata: { source: "amadeus" },
            price_insights: null,
            airports: [],
        });
    } catch (err: any) {
        console.error("Amadeus error:", err.response?.data || err.message);
        return NextResponse.json(
            { error: "Failed to fetch flights" },
            { status: 500 }
        );
    }

}