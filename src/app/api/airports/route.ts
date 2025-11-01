/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getAmadeusLocations } from "@/lib/amadeus";

// Fallback airport data in case Amadeus API fails
const fallbackAirports = [
    { iata: "LHR", icao: "EGLL", name: "London Heathrow", city: "London", country: "United Kingdom", type: "AIRPORT" },
    { iata: "JFK", icao: "KJFK", name: "John F Kennedy International", city: "New York", country: "United States", type: "AIRPORT" },
    { iata: "CDG", icao: "LFPG", name: "Charles de Gaulle", city: "Paris", country: "France", type: "AIRPORT" },
    { iata: "AUS", icao: "KAUS", name: "Austin-Bergstrom International", city: "Austin", country: "United States", type: "AIRPORT" },
    { iata: "CMB", icao: "VCBI", name: "Colombo Bandaranaike International", city: "Colombo", country: "Sri Lanka", type: "AIRPORT" },
    { iata: "DXB", icao: "OMDB", name: "Dubai International", city: "Dubai", country: "United Arab Emirates", type: "AIRPORT" },
    { iata: "LAX", icao: "KLAX", name: "Los Angeles International", city: "Los Angeles", country: "United States", type: "AIRPORT" },
    { iata: "SIN", icao: "WSSS", name: "Singapore Changi", city: "Singapore", country: "Singapore", type: "AIRPORT" },
    { iata: "NRT", icao: "RJAA", name: "Tokyo Narita International", city: "Tokyo", country: "Japan", type: "AIRPORT" },
    { iata: "SYD", icao: "YSSY", name: "Sydney Kingsford Smith", city: "Sydney", country: "Australia", type: "AIRPORT" },
];

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get("keyword");

    if (!keyword) {
        return NextResponse.json({ error: "Missing keyword parameter" }, { status: 400 });
    }

    try {
        // First try to get data from Amadeus
        const amadeusData = await getAmadeusLocations(keyword);
        
        // Transform Amadeus response to the expected format
        const airports = amadeusData.data.map((location: any) => ({
            iata: location.iataCode,
            icao: location.icaoCode,
            name: location.name,
            city: location.address?.cityName || '',
            country: location.address?.countryName || '',
            type: location.subType
        }));

        return NextResponse.json(airports);
    } catch (error: any) {
        console.error("Amadeus API failed, falling back to static data:", error.response?.data || error.message);
        
        // Fallback to static airport data with search filtering
        const filteredAirports = fallbackAirports.filter(airport => 
            airport.name.toLowerCase().includes(keyword.toLowerCase()) ||
            airport.city.toLowerCase().includes(keyword.toLowerCase()) ||
            airport.country.toLowerCase().includes(keyword.toLowerCase()) ||
            airport.iata.toLowerCase().includes(keyword.toLowerCase()) ||
            airport.icao.toLowerCase().includes(keyword.toLowerCase())
        );

        return NextResponse.json(filteredAirports);
    }
}