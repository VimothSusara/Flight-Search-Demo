import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Flight } from "@/app/search/page";
import Image from "next/image";
import { format, parse } from "date-fns";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import FlightDetailModal from "./FlightDetailModal";
import { Separator } from "./ui/separator";

function formatDuration(duration: string) {
  if (!duration) return "";
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  const hours = match?.[1] ? `${match[1]}h` : "";
  const minutes = match?.[2] ? ` ${match[2]}m` : "";
  return `${hours}${minutes}`.trim();
}

// 2025-10-31T12:30:00 -> 2025-10-31, 12:30 PM
const formatTime = (timeString: string) => {
  try {
    const date = parse(timeString, "yyyy-MM-dd'T'HH:mm:ss", new Date());
    return format(date, "yyyy-MM-dd, h:mm a");
  } catch (error) {
    return timeString;
  }
};

const FlightCard = ({ parent_flight }: { parent_flight: Flight }) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const sortedOffices =
    parent_flight.travel_offices && parent_flight.travel_offices.length > 0
      ? [...parent_flight.travel_offices]
          .sort((a, b) => a.price - b.price)
          .slice(0, 3)
      : [];

  return (
    <>
      <Card
        className="w-full py-2 m-0 shadow-sm hover:shadow-lg transition-shadow"
        onClick={(e) => {
          setIsModalOpen(true);
        }}
      >
        <CardContent>
          <div className="flex flex-row gap-4">
            {/* Left side: wider */}
            <div className="flex-1 flex flex-col gap-1">
              {parent_flight.flights.map((flight, index) => (
                <>
                  <div key={index} className="flex flex-col gap-2 p-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <p className="flex flex-col gap-2 justify-center items-center">
                          <span className="font-semibold text-blue-600">
                            {formatTime(flight.departure_airport.time)}
                          </span>
                          <span className="text-blue-300">
                            {flight.departure_airport.id}
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <p className="text-muted-foreground">
                          {formatDuration(flight.duration.toString())}
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <p className="flex flex-col gap-2 justify-center items-center">
                          <span className="font-semibold text-blue-600">
                            {formatTime(flight.arrival_airport.time)}
                          </span>
                          <span className="text-blue-300">
                            {flight.arrival_airport.id}
                          </span>
                        </p>
                      </div>
                      {/* <div className="flex flex-col items-center">
                        <Image
                          src={flight.airline_logo}
                          alt="flight logo"
                          width={24}
                          height={24}
                          style={{ objectFit: "contain" }}
                          unoptimized={true}
                        />
                        <span className="text-gray-600 font-semibold text-sm">
                          {flight.airline}
                        </span>
                      </div> */}
                    </div>
                  </div>
                  {index < parent_flight.flights.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </>
              ))}
            </div>

            {/* Right side: narrower */}
            <div className="hidden w-32 md:flex flex-col items-center justify-center border-l text-center">
              {sortedOffices.length > 0 ? (
                <>
                  {sortedOffices.map((office, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center space-y-1 mb-2"
                    >
                      <Label>
                        <span className="font-semibold text-center text-blue-400">
                          {office.name}
                        </span>
                      </Label>
                      <p className="text-sm text-gray-500 font-semibold">
                        ${office.price.toFixed(2)}
                      </p>
                      {idx < sortedOffices.length - 1 && (
                        <Separator className="my-1" />
                      )}
                    </div>
                  ))}

                  {parent_flight.travel_offices &&
                    parent_flight.travel_offices.length > 3 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +{parent_flight.travel_offices.length - 3} more options
                      </p>
                    )}
                </>
              ) : (
                <>
                  <Label>
                    <span className="font-semibold text-xl text-gray-600">
                      ${parent_flight.price}
                    </span>
                  </Label>
                  <Button className="mt-4 w-full" variant="secondary" size="sm">
                    View Details
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <FlightDetailModal
          parent_flight={parent_flight}
          isOpen={isModalOpen}
          setOpen={setIsModalOpen}
        />
      )}
    </>
  );
};

export default FlightCard;
