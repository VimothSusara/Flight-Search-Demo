import React from "react";
import { getAmadeusLocations } from "./amadeus";

const airportsList = [
    { value: "LHR", label: "London Heathrow" },
    { value: "JFK", label: "John F Kennedy International" },
    { value: "CDG", label: "Charles de Gaulle" },
    { value: "AUS", label: "Austin" },
    { value: "CMB", label: "Colombo Bandaranaike" },
    { value: "DXB", label: "Dubai International" },
];

export const useAirportSearch = () => {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [airports, setAirports] = React.useState<{ value: string; label: string }[]>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (!searchTerm || searchTerm.length < 2) {
            setLoading(false);
            return;
        }

        const fetchAirports = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/airports?keyword=${encodeURIComponent(searchTerm)}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) {
                    throw new Error('Failed to fetch airports');
                }

                const data = await res.json();
                console.log("API Response:", data);
                const mapped = data.map((a: {
                    iata: string;
                    icao: string;
                    name: string;
                    city: string;
                    country: string;
                    type: string;
                },) => ({
                    value: a.iata || a.icao,
                    label: `${a.name} (${a.iata || a.icao}) - ${a.city}, ${a.country}`,
                })).filter((airport: { value: string; label: string }) => airport.value); // Only include airports with valid codes

                console.log("Mapped airports:", mapped);
                setAirports(mapped);
            } catch (err) {
                console.error("Airport search error:", err);
                // Fallback to static list on error
                const filtered = airportsList.filter(
                    (a) =>
                        a.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.value.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setAirports(filtered);
            } finally {
                setLoading(false);
            }
        };

        const delay = setTimeout(fetchAirports, 400); // debounce
        return () => clearTimeout(delay);
    }, [searchTerm]);

    // React.useEffect(() => {
    //     setLoading(true);
    //     const delay = setTimeout(() => {
    //         if (!searchTerm) {
    //             setAirports(airportsList);
    //         } else {
    //             const filtered = airportsList.filter(
    //                 (a) =>
    //                     a.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //                     a.value.toLowerCase().includes(searchTerm.toLowerCase())
    //             );
    //             setAirports(filtered);
    //         }
    //         setLoading(false);
    //     }, 200); // debounce 200ms

    //     return () => clearTimeout(delay);
    // }, [searchTerm]);

    return { searchTerm, setSearchTerm, airports, loading };
}