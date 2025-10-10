"use client";

import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  Check,
  ChevronDownIcon,
  InfoIcon,
  PlaneIcon,
  RefreshCwIcon,
  Search,
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import FlightCard from "@/components/FlightCard";
import Header from "@/components/Header";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

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
  travel_offices?: { name: string; code: string; price: number }[];
}

interface PriceInsights {
  lowest_price: number;
  price_level: string;
  typical_price_range: [number, number];
  price_history: [number, number][];
}

const FlightCardSkeleton = () => (
  <div className="w-full">
    <div className="border rounded-lg shadow-sm p-4 flex justify-between items-center animate-pulse bg-white">
      {/* Left side */}
      <div className="flex flex-1 justify-between items-center">
        {/* Departure */}
        <div className="flex flex-col items-center space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>

        {/* Middle: line with dots */}
        <div className="flex flex-col items-center justify-center">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-8 w-px my-1" />
          <Skeleton className="h-3 w-3 rounded-full" />
        </div>

        {/* Arrival */}
        <div className="flex flex-col items-center space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-3 w-8" />
        </div>

        {/* Airline */}
        <div className="flex flex-col items-end space-y-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Right side (price & button) */}
      <div className="hidden md:flex flex-col items-center justify-center pl-4 w-32 space-y-3">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  </div>
);

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
  const [selectedAirlines, setSelectedAirlines] = React.useState<string[]>([]);
  const [selectedDepartureAirports, setSelectedDepartureAirports] =
    React.useState<string[]>([]);
  const [selectedArrivalAirports, setSelectedArrivalAirports] = React.useState<
    string[]
  >([]);
  const [selectedFlightType, setSelectedFlightType] = React.useState<number>(1);
  const [selectedTravelClass, setSelectedTravelClass] =
    React.useState<number>(1);
  const [selectedFlightStops, setSelectedFlightStops] =
    React.useState<number>(0);
  const [selectedTravelOffices, setSelectedTravelOffices] = React.useState<
    string[]
  >([]);

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

        // if (data.flights_data) {
        //   // Auto-select airlines
        //   const airlines = new Set<string>();
        //   const departureAirports = new Set<string>();
        //   const arrivalAirports = new Set<string>();

        //   data.flights_data.forEach((f: Flight) =>
        //     f.flights.forEach((ff) => {
        //       airlines.add(ff.airline);
        //       departureAirports.add(ff.departure_airport.name);
        //       arrivalAirports.add(ff.arrival_airport.name);
        //     })
        //   );

        //   setSelectedAirlines(Array.from(airlines));
        //   setSelectedDepartureAirports(Array.from(departureAirports));
        //   setSelectedArrivalAirports(Array.from(arrivalAirports));
        // }

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

  const availableAirlines = React.useMemo(() => {
    const airlineSet = new Set<string>();
    flights.forEach((f) =>
      f.flights.forEach((ff) => airlineSet.add(ff.airline))
    );
    return Array.from(airlineSet);
  }, [flights]);

  const availableDepartureAirports = React.useMemo(() => {
    const set = new Set<string>();
    flights.forEach((f) =>
      f.flights.forEach((ff) => set.add(ff.departure_airport.name))
    );
    return Array.from(set);
  }, [flights]);

  const availableArrivalAirports = React.useMemo(() => {
    const set = new Set<string>();
    flights.forEach((f) =>
      f.flights.forEach((ff) => set.add(ff.arrival_airport.name))
    );
    return Array.from(set);
  }, [flights]);

  const availableTravelOffices = React.useMemo(() => {
    const set = new Set<string>();
    flights.forEach((f) => {
      if (f.travel_offices) {
        f.travel_offices.forEach((office) => set.add(office.name));
      }
    });
    return Array.from(set);
  }, [flights]);

  return (
    <>
      <div className="min-h-screen bg-gray-50" style={{}}>
        <Header />

        <main className="w-full mx-auto flex flex-col gap-4">
          {/* search section */}
          <div
            className="flex flex-col w-full lg:w-4/5 mx-auto gap-1 rounded-none bg-white shadow-md"
            style={{
              marginTop: "-5.5rem",
              zIndex: 40,
              position: "relative",
              background: "transparent",
            }}
          >
            <div className="flex">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-[#1E88E5] hover:text-gray-100 transition-colors duration-200 cursor-pointer"
                  >
                    {selectedFlightType === 1
                      ? "Round Trip"
                      : selectedFlightType === 2
                      ? "One Way"
                      : ""}
                    <ChevronDownIcon size={20} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="w-full max-w-md">
                    <FieldGroup>
                      <FieldSet>
                        <FieldLabel className="text-gray-500">
                          Flight Type
                        </FieldLabel>
                        <RadioGroup
                          defaultValue="1"
                          onValueChange={(value) => {
                            setSelectedFlightType(parseInt(value));
                          }}
                        >
                          <FieldLabel htmlFor="round_trip-r2h">
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle className="text-blue-500">
                                  Round Trip
                                </FieldTitle>
                              </FieldContent>
                              <RadioGroupItem value="1" id="round_trip-r2h" />
                            </Field>
                          </FieldLabel>
                          <FieldLabel htmlFor="one_way-ow">
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle className="text-blue-500">
                                  One Way
                                </FieldTitle>
                              </FieldContent>
                              <RadioGroupItem value="2" id="one_way-ow" />
                            </Field>
                          </FieldLabel>
                        </RadioGroup>
                      </FieldSet>
                    </FieldGroup>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-[#1E88E5] hover:text-gray-100 transition-colors duration-200 cursor-pointer"
                  >
                    {selectedTravelClass === 1
                      ? "Economy"
                      : selectedTravelClass === 2
                      ? "Premium Economy"
                      : selectedTravelClass === 3
                      ? "Business"
                      : selectedTravelClass === 4
                      ? "First"
                      : ""}
                    <ChevronDownIcon size={20} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="w-full max-w-md">
                    <FieldGroup>
                      <FieldSet>
                        <FieldLabel className="text-gray-500">
                          Travel Class
                        </FieldLabel>
                        <RadioGroup
                          defaultValue="1"
                          onValueChange={(value) => {
                            setSelectedTravelClass(parseInt(value));
                          }}
                        >
                          <FieldLabel htmlFor="economy-r2h">
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle className="text-blue-500">
                                  Economy
                                </FieldTitle>
                              </FieldContent>
                              <RadioGroupItem value="1" id="economy-r2h" />
                            </Field>
                          </FieldLabel>
                          <FieldLabel htmlFor="premium-economy-ow">
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle className="text-blue-500">
                                  Premium Economy
                                </FieldTitle>
                              </FieldContent>
                              <RadioGroupItem
                                value="2"
                                id="premium-economy-ow"
                              />
                            </Field>
                          </FieldLabel>
                          <FieldLabel htmlFor="business-ow">
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle className="text-blue-500">
                                  Business
                                </FieldTitle>
                              </FieldContent>
                              <RadioGroupItem value="3" id="business-ow" />
                            </Field>
                          </FieldLabel>
                          <FieldLabel htmlFor="first-ow">
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle className="text-blue-500">
                                  First
                                </FieldTitle>
                              </FieldContent>
                              <RadioGroupItem value="4" id="first-ow" />
                            </Field>
                          </FieldLabel>
                        </RadioGroup>
                      </FieldSet>
                    </FieldGroup>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-[#1E88E5] hover:text-gray-100 transition-colors duration-200 cursor-pointer"
                  >
                    Travelers
                    <ChevronDownIcon size={20} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="w-full max-w-md flex flex-col gap-4">
                    {/* Adults */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-blue-600">Adults</p>
                        <p className="text-sm text-gray-300">Age 12+</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setSearchParams((prev) => ({
                              ...prev,
                              adults: String(
                                Math.max(0, Number(prev.adults || "1") - 1)
                              ),
                            }))
                          }
                          className="text-blue-600 hover:bg-blue-500 hover:text-white"
                        >
                          -
                        </Button>
                        <span className="w-4 text-center">
                          {searchParams.adults || "1"}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setSearchParams((prev) => ({
                              ...prev,
                              adults: String(Number(prev.adults || "1") + 1),
                            }))
                          }
                          className="text-blue-600 hover:bg-blue-500 hover:text-white"
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-blue-600">Children</p>
                        <p className="text-sm text-gray-300">Age 2–11</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setSearchParams((prev) => ({
                              ...prev,
                              children: String(
                                Math.max(0, Number(prev.children || "0") - 1)
                              ),
                            }))
                          }
                          className="text-blue-600 hover:bg-blue-500 hover:text-white"
                        >
                          -
                        </Button>
                        <span className="w-4 text-center">
                          {searchParams.children || "0"}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setSearchParams((prev) => ({
                              ...prev,
                              children: String(
                                Number(prev.children || "0") + 1
                              ),
                            }))
                          }
                          className="text-blue-600 hover:bg-blue-500 hover:text-white"
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    {/* Infants */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-blue-600">Infants</p>
                        <p className="text-sm text-gray-300">Age 0–23</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setSearchParams((prev) => ({
                              ...prev,
                              infants_on_lap: String(
                                Math.max(
                                  0,
                                  Number(prev.infants_on_lap || "0") - 1
                                )
                              ),
                            }))
                          }
                          className="text-blue-600 hover:bg-blue-500 hover:text-white"
                        >
                          -
                        </Button>
                        <span className="w-4 text-center">
                          {searchParams.infants_on_lap || "0"}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setSearchParams((prev) => ({
                              ...prev,
                              infants_on_lap: String(
                                Number(prev.infants_on_lap || "0") + 1
                              ),
                            }))
                          }
                          className="text-blue-600 hover:bg-blue-500 hover:text-white"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-[#1E88E5] hover:text-gray-100 transition-colors duration-200 cursor-pointer"
                  >
                    {selectedFlightStops === 0
                      ? "Any Stops"
                      : selectedFlightStops === 1
                      ? "Nonstop Only"
                      : selectedFlightStops === 2
                      ? "1 Stop or Fewer"
                      : selectedFlightStops === 3
                      ? "2 Stops or Fewer"
                      : ""}
                    <ChevronDownIcon size={20} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="w-full max-w-md">
                    <FieldGroup>
                      <FieldSet>
                        <FieldLabel className="text-gray-500">
                          Flight Stops
                        </FieldLabel>
                        <RadioGroup
                          defaultValue="0"
                          onValueChange={(value) => {
                            setSelectedFlightStops(parseInt(value));
                          }}
                        >
                          <FieldLabel htmlFor="any_stops-r2h">
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle className="text-blue-500">
                                  Any No. of Stops
                                </FieldTitle>
                              </FieldContent>
                              <RadioGroupItem value="0" id="any_stops-r2h" />
                            </Field>
                          </FieldLabel>
                          <FieldLabel htmlFor="nonstop-ow">
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle className="text-blue-500">
                                  Nonstop Only
                                </FieldTitle>
                              </FieldContent>
                              <RadioGroupItem value="1" id="nonstop-ow" />
                            </Field>
                          </FieldLabel>
                          <FieldLabel htmlFor="1_stop-ow">
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle className="text-blue-500">
                                  1 Stop or Fewer
                                </FieldTitle>
                              </FieldContent>
                              <RadioGroupItem value="2" id="1_stop-ow" />
                            </Field>
                          </FieldLabel>
                          <FieldLabel htmlFor="2_stop-ow">
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle className="text-blue-500">
                                  2 Stops or Fewer
                                </FieldTitle>
                              </FieldContent>
                              <RadioGroupItem value="3" id="2_stop-ow" />
                            </Field>
                          </FieldLabel>
                        </RadioGroup>
                      </FieldSet>
                    </FieldGroup>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-4">
                <div className="col-span-2 lg:col-span-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        role="combobox"
                        className="w-full text-blue-500 font-semibold hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                      >
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
                <div className="col-span-2 lg:col-span-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        role="combobox"
                        className="w-full text-blue-500 font-semibold hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                      >
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
                <div className="col-span-2 lg:col-span-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        data-empty={!outboundDate}
                        className="data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal w-full"
                        size="lg"
                      >
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="text-blue-500" size={18} />
                          <span>
                            {outboundDate
                              ? format(outboundDate, "EEE, MMM d")
                              : "Depart"}
                          </span>
                        </div>
                        <ChevronDownIcon className="text-gray-400" size={18} />
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
                <div className="col-span-2 lg:col-span-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        data-empty={!returnDate}
                        className="data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal w-full"
                        size="lg"
                      >
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="text-blue-500" size={18} />
                          <span>
                            {returnDate
                              ? format(returnDate, "EEE, MMM d")
                              : "Return"}
                          </span>
                        </div>
                        <ChevronDownIcon className="text-gray-400" size={18} />
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
            </div>
            <Button
              type="button"
              className="w-full md:w-1/6 mx-auto cursor-pointer my-2 bg-blue-50 text-blue-600 border border-blue-300 hover:bg-blue-500 hover:text-white transition-colors duration-300 rounded-sm"
              onClick={searchFlights}
            >
              <Search className="mr-2" />
              Search Flights
            </Button>
          </div>

          {/* {priceInsights && (
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
          )} */}

          {/* Search Results */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full md:w-4/5 h-full mx-auto">
            <div className="hidden md:col-span-1 border shadow md:flex flex-col h-[calc(100vh-7rem)] overflow-y-auto sticky top-5 no-scrollbar px-2 py-4">
              <div className="h-16 border-b flex justify-between items-center">
                <Label
                  htmlFor="sort"
                  className=" font-semibold text-muted-foreground px-2"
                >
                  Sort by
                </Label>

                <Select>
                  <SelectTrigger
                    className="w-32 mr-2 mt-2 mb-2"
                    size="sm"
                    defaultValue="1"
                  >
                    <SelectValue
                      placeholder="Select..."
                      className="bg-transparent"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Top Flights</SelectItem>
                    <SelectItem value="2">Price</SelectItem>
                    <SelectItem value="3">Departure Time</SelectItem>
                    <SelectItem value="4">Arrival Time</SelectItem>
                    <SelectItem value="5">Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="" />

              <div className="flex justify-between px-2 my-3">
                <Label className="text-muted-foreground">Filters</Label>

                <Label className="cursor-pointer text-xs font-normal">
                  {flights.length} results
                </Label>
              </div>

              <Separator className="" />

              <div className="flex flex-col px-2 mt-3 gap-2">
                <div className="flex flex-start">
                  <Label className="text-muted-foreground">
                    Travel Offices
                  </Label>
                </div>

                <div className="flex flex-col space-y-4 my-3">
                  {availableTravelOffices.length > 0 ? (
                    availableTravelOffices.map((office, index) => (
                      <div
                        key={office}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <Checkbox
                          className=""
                          checked={selectedTravelOffices.includes(office)}
                          onCheckedChange={(checked) => {
                            setSelectedTravelOffices((prev) =>
                              checked
                                ? [...prev, office]
                                : prev.filter((o) => o !== office)
                            );
                          }}
                          id={`office-${index}`}
                        />
                        <Label
                          htmlFor={`office-${index}`}
                          className="cursor-pointer text-gray-600"
                        >
                          {office}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No travel offices available
                    </p>
                  )}
                </div>
              </div>

              <Separator className="" />

              <div className="flex flex-col px-2 mt-3 gap-2">
                <div className="flex flex-start">
                  <Label className="text-muted-foreground">Airlines</Label>
                </div>

                <div className="flex flex-col space-y-4 my-3">
                  {availableAirlines.length > 0 ? (
                    availableAirlines.map((airline, index) => (
                      <div
                        key={airline}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <Checkbox
                          className=""
                          checked={selectedAirlines.includes(airline)}
                          onCheckedChange={(checked) => {
                            setSelectedAirlines((prev) =>
                              checked
                                ? [...prev, airline]
                                : prev.filter((a) => a !== airline)
                            );
                          }}
                          id={`airline-${index}`}
                        />
                        <Label
                          htmlFor={`airline-${index}`}
                          className="cursor-pointer text-gray-600"
                        >
                          {airline}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No airlines available
                    </p>
                  )}
                </div>
              </div>

              <Separator className="" />

              <div className="flex flex-col px-2 mt-3 gap-2">
                <div className="flex flex-start">
                  <Label className="text-muted-foreground">
                    Departure Airports
                  </Label>
                </div>

                <div className="flex flex-col space-y-4 my-3">
                  {availableDepartureAirports.length > 0 ? (
                    availableDepartureAirports.map((airport, index) => (
                      <div
                        key={airport}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <Checkbox
                          className=""
                          checked={selectedDepartureAirports.includes(airport)}
                          onCheckedChange={(checked) => {
                            setSelectedDepartureAirports((prev) =>
                              checked
                                ? [...prev, airport]
                                : prev.filter((a) => a !== airport)
                            );
                          }}
                          id={`airport-${index}`}
                        />
                        <Label
                          htmlFor={`airport-${index}`}
                          className="cursor-pointer text-gray-600"
                        >
                          {airport}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No airports available
                    </p>
                  )}
                </div>
              </div>

              <Separator className="" />

              <div className="flex flex-col px-2 mt-3 gap-2">
                <div className="flex flex-start">
                  <Label className="text-muted-foreground">
                    Arrival Airports
                  </Label>
                </div>

                <div className="flex flex-col space-y-4 my-3">
                  {availableArrivalAirports.length > 0 ? (
                    availableArrivalAirports.map((airport, index) => (
                      <div
                        key={airport}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <Checkbox
                          className=""
                          checked={selectedArrivalAirports.includes(airport)}
                          onCheckedChange={(checked) => {
                            setSelectedArrivalAirports((prev) =>
                              checked
                                ? [...prev, airport]
                                : prev.filter((a) => a !== airport)
                            );
                          }}
                          id={`airport-${index}`}
                        />
                        <Label
                          htmlFor={`airport-${index}`}
                          className="cursor-pointer text-gray-600"
                        >
                          {airport}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No airports available
                    </p>
                  )}
                </div>
              </div>

              <Separator className="" />
            </div>
            <div className="col-span-1 md:col-span-3 border-none">
              {loading && (
                <div className="grid gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <FlightCardSkeleton key={i} />
                  ))}
                </div>
              )}
              {error && <p className="text-red-500">{error}</p>}
              {!loading && !error && flights.length === 0 && (
                <div className="items-center">
                  <Empty className="from-muted/50 to-background h-full bg-gradient-to-b from-30%">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" className="text-blue-300">
                        <PlaneIcon />
                      </EmptyMedia>
                      <EmptyTitle className="text-blue-400">
                        No Flights Found
                      </EmptyTitle>
                      <EmptyDescription className="text-muted-foreground text-xs">
                        We couldn&apos;t find any flights matching your
                        criteria.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-white text-blue-400 hover:bg-blue-400 hover:text-white"
                        onClick={searchFlights}
                      >
                        <RefreshCwIcon />
                        Refresh
                      </Button>
                    </EmptyContent>
                  </Empty>
                </div>
              )}
              {!loading && !error && flights.length > 0 && (
                <div className="grid gap-4">
                  {flights
                    .filter((flight) => {
                      // Airline filter
                      const matchesAirline =
                        selectedAirlines.length === 0 ||
                        flight.flights.some((f) =>
                          selectedAirlines.includes(f.airline)
                        );

                      // Departure airport filter
                      const matchesDeparture =
                        selectedDepartureAirports.length === 0 ||
                        flight.flights.some((f) =>
                          selectedDepartureAirports.includes(
                            f.departure_airport.name
                          )
                        );

                      // Arrival airport filter
                      const matchesArrival =
                        selectedArrivalAirports.length === 0 ||
                        flight.flights.some((f) =>
                          selectedArrivalAirports.includes(
                            f.arrival_airport.name
                          )
                        );

                      return (
                        matchesAirline && matchesDeparture && matchesArrival
                      );
                    })
                    .map((flight, index) => (
                      <div key={index} className="w-full px-3 py-2">
                        <FlightCard parent_flight={flight} />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default FlightSearchPage;
