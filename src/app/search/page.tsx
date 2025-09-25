"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowLeftRight,
  CalendarIcon,
  Check,
  PlaneIcon,
  PlaneLandingIcon,
  PlaneTakeoffIcon,
} from "lucide-react";
import React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import FlightCard from "@/components/FlightCard";

const airports = [
  {
    value: "LHR",
    label: "London Heathrow",
  },
  {
    value: "JFK",
    label: "John F Kennedy International",
  },
  {
    value: "CDG",
    label: "Charles",
  },
  {
    value: "AUS",
    label: "Austin",
  },
];

interface FlightSearchParams {
  departure: string;
  arrival: string;
  currency: string;
  outbound_date: string;
  return_date?: string;
  type: string;
  travel_class?: string;
  adults?: string;
  children?: string;
  infants_in_seat?: string;
  infants_on_lap?: string;
  stops?: string;
  emissions?: string;
}

export interface Flight {
  flights: {
    departure_airport: { name: string; id: string; time: string };
    arrival_airport: { name: string; id: string; time: string };
    duration: number;
    airplane: string;
    airline: string;
    airline_logo: string;
    travel_class: string;
    flight_number: string;
    ticket_also_sold_by?: string[];
    legroom: string;
    extensions: string[];
    often_delayed_by_over_30_min?: boolean;
  }[];
  layovers?: { duration: number; name: string; id: string }[];
  total_duration: number;
  carbon_emissions: {
    this_flight: number;
    typical_for_this_route: number;
    difference_percent: number;
  };
  price: number;
  type: string;
  airline_logo: string;
  extensions: string[];
  booking_token: string;
}

interface PriceInsights {
  lowest_price: number;
  price_level: string;
  typical_price_range: [number, number];
  price_history: [number, number][];
}

const FlightSearchPage = () => {
  const getTomorrow = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow;
  };

  const getDayAfterTomorrow = () => {
    const tomorrow = getTomorrow();
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(tomorrow.getDate() + 1);
    return dayAfter;
  };

  const [flights, setFlights] = React.useState<Flight[]>([]);
  const [priceInsights, setPriceInsights] =
    React.useState<PriceInsights | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchParams, setSearchParams] = React.useState<FlightSearchParams>({
    departure: "CDG",
    arrival: "AUS",
    currency: "USD",
    outbound_date: format(getTomorrow(), "yyyy-MM-dd"),
    return_date: format(getDayAfterTomorrow(), "yyyy-MM-dd"),
    type: "1",
    stops: "0",
  });
  const [departure, setDeparture] = React.useState("");
  const [arrival, setArrival] = React.useState("");
  const [outboundDate, setOutboundDate] = React.useState<Date | undefined>(
    getTomorrow()
  );
  const [returnDate, setReturnDate] = React.useState<Date | undefined>(
    getDayAfterTomorrow()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const searchFlights = async () => {
    if (!searchParams.departure || !searchParams.arrival) {
      setError("Please select departure and arrival airports.");
      return;
    }
    if (!outboundDate || outboundDate < tomorrow) {
      setError("Outbound date must be tomorrow or later.");
      return;
    }
    
    setLoading(true);
    setError(null);

    const query = new URLSearchParams({
      departure: searchParams.departure,
      arrival: searchParams.arrival,
      currency: searchParams.currency,
      outbound_date: format(outboundDate, "yyyy-MM-dd"),
      type: searchParams.type,
      ...(searchParams.return_date && {
        return_date: format(returnDate || outboundDate, "yyyy-MM-dd"),
      }),
      ...(searchParams.travel_class && {
        travel_class: searchParams.travel_class,
      }),
      ...(searchParams.adults && { adults: searchParams.adults }),
      ...(searchParams.children && { children: searchParams.children }),
      ...(searchParams.infants_in_seat && {
        infants_in_seat: searchParams.infants_in_seat,
      }),
      ...(searchParams.infants_on_lap && {
        infants_on_lap: searchParams.infants_on_lap,
      }),
      ...(searchParams.stops && { stops: searchParams.stops }),
      ...(searchParams.emissions && { emissions: searchParams.emissions }),
    }).toString();

    try {
      const res = await fetch(`/api/flights?${query}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setFlights([]);
        setPriceInsights(null);
      } else {
        setFlights(data.flights_data || []);
        setPriceInsights(data.price_insights || null);
        if (
          searchParams.type === "1" &&
          data.flights_data.every((f: Flight) => f.type === "One way")
        ) {
          setError(
            "Note: Only one-way flights returned for round-trip search."
          );
        }
      }
    } catch (err) {
      setError("Failed to fetch flights. Please try again.");
      setFlights([]);
      setPriceInsights(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="container mx-auto py-2 text-center min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-center gap-4 border-b bg-background px-4 py-2 shadow-md shadow-blue-100">
          <div className="container flex items-center justify-center gap-3 text-blue-700">
            <PlaneIcon size={30} />
            <h1 className="text-3xl font-bold">Flight Search</h1>
          </div>
        </header>

        <main className="mt-3 lg:mt-4 w-full min-h-[calc(100vh-5.5rem)] lg:w-3/4 mx-auto flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <div className="px-4 py-3 space-y-3">
              <div className="flex gap-3">
                <div className="flex gap-1 items-center justify-center">
                  <PlaneTakeoffIcon size={20} />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="">
                        {departure
                          ? airports.find(
                              (airport) => airport.value === departure
                            )?.label
                          : "Select Departure"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Command>
                        <CommandInput placeholder="Search airports..." />
                        <CommandList>
                          <CommandEmpty>No results found.</CommandEmpty>
                          <CommandGroup>
                            {airports.map((airport) => (
                              <CommandItem
                                key={airport.value}
                                value={airport.value}
                                onSelect={(currentValue) => {
                                  setDeparture(
                                    currentValue == departure
                                      ? ""
                                      : currentValue
                                  );
                                  setSearchParams({
                                    ...searchParams,
                                    departure: currentValue,
                                  });
                                }}
                              >
                                {airport.label}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    departure === airport.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowLeftRight size={20} />
                </div>
                <div className="flex gap-1 items-center justify-center">
                  <PlaneLandingIcon size={20} />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="">
                        {arrival
                          ? airports.find(
                              (airport) => airport.value === arrival
                            )?.label
                          : "Select Arrival"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Command>
                        <CommandInput placeholder="Search airports..." />
                        <CommandList>
                          <CommandEmpty>No results found.</CommandEmpty>
                          <CommandGroup>
                            {airports.map((airport) => (
                              <CommandItem
                                key={airport.value}
                                value={airport.value}
                                onSelect={(currentValue) => {
                                  setArrival(
                                    currentValue == arrival ? "" : currentValue
                                  );
                                  setSearchParams({
                                    ...searchParams,
                                    arrival: currentValue,
                                  });
                                }}
                              >
                                {airport.label}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    arrival === airport.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex gap-3">
                <div>
                  <Label className="my-2">OutBound Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        data-empty={!outboundDate}
                        className="data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal"
                      >
                        <CalendarIcon />
                        {outboundDate ? (
                          format(outboundDate, "yyyy-MM-dd")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={outboundDate}
                        onSelect={(date) => {
                          setSearchParams({
                            ...searchParams,
                            outbound_date: date
                              ? format(date, "yyyy-MM-dd")
                              : "",
                          });
                          // Reset return date if it's before the new outbound date
                          if (date && returnDate && returnDate <= date) {
                            setReturnDate(undefined);
                            setSearchParams((prev) => ({
                              ...prev,
                              return_date: undefined,
                            }));
                          }
                        }}
                        disabled={(date) => date < tomorrow}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="my-2">Return Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        data-empty={!returnDate}
                        className="data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal"
                      >
                        <CalendarIcon />
                        {returnDate ? (
                          format(returnDate, "yyyy-MM-dd")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={(date) => {
                          setReturnDate(date);
                          setSearchParams({
                            ...searchParams,
                            return_date: date
                              ? format(date, "yyyy-MM-dd")
                              : undefined,
                          });
                        }}
                        disabled={(date) =>
                          !outboundDate || date <= outboundDate
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex gap-3">
                {/* Flight Type */}
                <Select
                  //   value={searchParams.type}
                  onValueChange={(value) => {
                    setSearchParams({
                      ...searchParams,
                      type: value,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Flight Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Flight Types</SelectLabel>
                      <SelectItem value="1">Round Trip</SelectItem>
                      <SelectItem value="2">One-Way</SelectItem>
                      <SelectItem value="3">Multi-City</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* Flight Travel Class */}
                <Select
                  //   value={searchParams.travel_class}
                  onValueChange={(value) => {
                    setSearchParams({
                      ...searchParams,
                      travel_class: value,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Travel Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Travel Class</SelectLabel>
                      <SelectItem value="1">Economy</SelectItem>
                      <SelectItem value="2">Premium economy</SelectItem>
                      <SelectItem value="3">Business</SelectItem>
                      <SelectItem value="4">First</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* Flight Stops */}
                <Select
                  //   value={searchParams.stops}
                  onValueChange={(value) => {
                    setSearchParams({
                      ...searchParams,
                      stops: value,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Flight Stops" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Flight Tops</SelectLabel>
                      <SelectItem value="0">Any No. of Stops</SelectItem>
                      <SelectItem value="1">Nonstop Only</SelectItem>
                      <SelectItem value="2">1 Stop or Fewer</SelectItem>
                      <SelectItem value="3">2 Stops or Fewer</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="button"
              className="w-1/5 mx-auto cursor-pointer"
              onClick={searchFlights}
            >
              Search Flights
            </Button>
          </div>

          {priceInsights && (
            <div className="border rounded-lg p-4 bg-gray-100">
              <h2 className="text-lg font-semibold">Price Insights</h2>
              <p>
                <strong>Lowest Price:</strong> ${priceInsights.lowest_price}
              </p>
              <p>
                <strong>Price Level:</strong> {priceInsights.price_level}
              </p>
              <p>
                <strong>Typical Price Range:</strong> $
                {priceInsights.typical_price_range[0]} - $
                {priceInsights.typical_price_range[1]}
              </p>
            </div>
          )}

          {/* Search Results */}
          <div className="w-full h-full">
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && flights.length === 0 && (
              <p>No flights found</p>
            )}
            {!loading && !error && flights.length > 0 && (
              <div className="grid gap-4">
                {flights.map((flight, index) => (
                  <div key={index} className="w-full rounded-lg shadow-md px-3 py-2">
                    <FlightCard parent_flight={flight} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default FlightSearchPage;
