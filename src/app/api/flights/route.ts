import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const departure_id = searchParams.get("departure");
    const arrival_id = searchParams.get("arrival");
    const outbound_date = searchParams.get("outbound_date");
    const return_date = searchParams.get("return_date");
    const currency = searchParams.get("currency") || "USD";
    const type = searchParams.get("type") || "1"; // Default to round-trip (2), as per SerpApi convention
    const engine = searchParams.get("engine") || "google_flights";
    const hl = searchParams.get("hl") || "en";
    const gl = searchParams.get("gl") || "us";

    // Optional parameters
    const travel_class = searchParams.get("travel_class");
    const adults = searchParams.get("adults");
    const children = searchParams.get("children");
    const infants_in_seat = searchParams.get("infants_in_seat");
    const infants_on_lap = searchParams.get("infants_on_lap");
    const stops = searchParams.get("stops");
    const emissions = searchParams.get("emissions");

    if (!departure_id || !arrival_id) {
        return NextResponse.json({ error: "Missing departure or arrival" }, { status: 400 });
    }
    if (!outbound_date) {
        return NextResponse.json({ error: "Missing outbound date" }, { status: 400 });
    }
    if (type === "1" && !return_date) {
        return NextResponse.json({ error: "Missing return date for round-trip" }, { status: 400 });
    }

    const api_key = process.env.SERPAPI_KEY;
    if (!api_key) {
        return NextResponse.json({ error: "API key not found" }, { status: 500 });
    }

    const params = new URLSearchParams({
        api_key,
        engine,
        hl,
        gl,
        departure_id,
        arrival_id,
        outbound_date,
        currency,
    });

    if (return_date) params.append("return_date", return_date);
    if (type) params.append("type", type);
    if (travel_class) params.append("travel_class", travel_class);
    if (adults) params.append("adults", adults);
    if (children) params.append("children", children);
    if (infants_in_seat) params.append("infants_in_seat", infants_in_seat);
    if (infants_on_lap) params.append("infants_on_lap", infants_on_lap);
    if (stops) params.append("stops", stops);
    if (emissions) params.append("emissions", emissions);

    const url = process.env.SERPAPI_URL

    try {
        const response = await fetch(`${url}?${params}`)

        const data = await response.json()

        if (data.error) {
            return NextResponse.json({ error: data.error }, { status: 400 })
        }

        const flights_data = [
            ...(data.best_flights || []),
            ...(data.other_flights || []),
        ];

        return NextResponse.json({
            flights_data,
            metadata: data.search_metadata,
            search_parameters: data.search_parameters,
            price_insights: data.price_insights,
            airports: data.airports,
        })
    } catch (err) {
        return NextResponse.json({ error: err || 'Something went wrong' }, { status: 500 })
    }

}