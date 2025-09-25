import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Flight } from "@/app/search/page";
import Image from "next/image";
import { format, parse } from "date-fns";

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const formatTime = (timeString: string) => {
  try {
    const date = parse(timeString, "yyyy-MM-dd HH:mm", new Date());
    return format(date, "h:mm a");
  } catch (error) {
    return timeString;
  }
};

const FlightCard = ({ parent_flight }: { parent_flight: Flight }) => {
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex gap-4">Departure</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 p-1">
            {parent_flight.flights.map((flight, index) => (
              <div
                key={index}
                className="w-full flex gap-2 items-center justify-between space-y-4 bg-gray-100 px-3 py-1 rounded-md"
              >
                <div className="flex gap-2 items-center justify-center space-x-3">
                  <img
                    src={flight.airline_logo}
                    alt="flight logo"
                    width={34}
                    height={34}
                  />
                  <div className="flex flex-col gap-1 text-start">
                    <p className="text-sm">
                      {formatTime(flight.departure_airport.time)} -{" "}
                      {flight.departure_airport.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDuration(flight.duration)}
                    </p>
                    <p className="text-sm">
                      {formatTime(flight.arrival_airport.time)} -{" "}
                      {flight.arrival_airport.name}
                    </p>
                    <p className="text-xs">
                      {flight.airline} - {flight.flight_number} (
                      {flight.airplane})
                    </p>
                    <p className="text-xs">Class: {flight.travel_class}</p>
                    {flight.legroom && (
                      <p className="text-xs">Legroom: {flight.legroom}</p>
                    )}
                    {flight.often_delayed_by_over_30_min && (
                      <p className="text-xs text-yellow-600">
                        Warning: Often delayed by over 30 minutes
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-end">
                  {flight.legroom && (
                    <p className="text-xs text-muted-foreground"></p>
                  )}
                  {flight.extensions.map((extension, index) => (
                    <p key={index} className="text-xs text-muted-foreground">
                      {extension}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {parent_flight.layovers && parent_flight.layovers.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold">Layovers</h3>
                {parent_flight.layovers.map((layover, index) => (
                  <p key={index} className="text-xs">
                    {layover.name} ({layover.id}) for{" "}
                    {formatDuration(layover.duration)}
                  </p>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default FlightCard;
