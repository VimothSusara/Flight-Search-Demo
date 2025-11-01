import React from "react";

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

    // React.useEffect(() => {
    //     if (!searchTerm) return;
    //     const fetchAirports = async () => {
    //         setLoading(true);
    //         try {
    //             const res = await fetch(
    //                 `https://api.api-ninjas.com/v1/airports?name=${encodeURIComponent(searchTerm)}`,
    //                 {
    //                     headers: {
    //                         "X-Api-Key": process.env.NEXT_PUBLIC_API_NINJAS_KEY!,
    //                     },
    //                 }
    //             );
    //             const data = await res.json();
    //             const mapped = data.map((a: {
    //                 iata: string;
    //                 icao: string;
    //                 name: string;
    //                 city: string;
    //                 country: string;
    //             }) => ({
    //                 value: a.iata,
    //                 label: `${a.name} (${a.iata || a.icao}) - ${a.city}, ${a.country}`,
    //             }));
    //             setAirports(mapped);
    //         } catch (err) {
    //             console.error("Airport search error:", err);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };
    //     const delay = setTimeout(fetchAirports, 400); // debounce
    //     return () => clearTimeout(delay);
    // }, [searchTerm]);

    React.useEffect(() => {
        setLoading(true);
        const delay = setTimeout(() => {
            if (!searchTerm) {
                setAirports(airportsList);
            } else {
                const filtered = airportsList.filter(
                    (a) =>
                        a.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.value.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setAirports(filtered);
            }
            setLoading(false);
        }, 200); // debounce 200ms

        return () => clearTimeout(delay);
    }, [searchTerm]);

    return { searchTerm, setSearchTerm, airports, loading };
}