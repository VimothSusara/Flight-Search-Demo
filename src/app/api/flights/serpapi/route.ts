// app/api/flights/serpapi/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchFlightsWithSerpAPI, transformSerpAPIToUnified } from "@/lib/serpapi";

/**
 * GET /api/flights/serpapi
 * Search flights using SerpAPI (Google Flights)
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const departure = searchParams.get("departure");
    const arrival = searchParams.get("arrival");
    const outbound_date = searchParams.get("outbound_date");
    const return_date = searchParams.get("return_date");
    const adults = searchParams.get("adults") || "1";
    const children = searchParams.get("children") || "0";
    const flight_class = searchParams.get("class") || "economy";

    if (!departure || !arrival || !outbound_date) {
        return NextResponse.json(
            { error: "Missing required parameters: departure, arrival, outbound_date" },
            { status: 400 }
        );
    }

    try {
        const serpApiResponse = await searchFlightsWithSerpAPI({
            departure_airport: departure,
            arrival_airport: arrival,
            outbound_date: outbound_date,
            return_date: return_date || undefined,
            adults: parseInt(adults),
            children: parseInt(children),
            class: flight_class as "economy" | "premium_economy" | "business" | "first",
        });

        // Transform to unified format
        const transformedFlights = transformSerpAPIToUnified(serpApiResponse);

        return NextResponse.json({
            flights_data: transformedFlights,
            metadata: {
                source: "serpapi",
                provider: "Google Flights",
                search_status: serpApiResponse.search_metadata?.status,
                processed_at: serpApiResponse.search_metadata?.processed_at,
                total_processing_time: serpApiResponse.search_metadata?.total_processing_time,
            },
            summary: {
                total_results: transformedFlights.length,
                cheapest_price: transformedFlights.length > 0 ? Math.min(...transformedFlights.map(f => f.lowestPrice)) : 0,
                most_expensive: transformedFlights.length > 0 ? Math.max(...transformedFlights.map(f => f.lowestPrice)) : 0,
            }
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errorStatus = error && typeof error === 'object' && 'status' in error ? (error as { status: number }).status : 500;
        console.error("SerpAPI Error:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch flights from SerpAPI",
                message: errorMessage,
                details: error && typeof error === 'object' && 'error' in error ? (error as { error: unknown }).error : null,
            },
            { status: errorStatus }
        );
    }
}
