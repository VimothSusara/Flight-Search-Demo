import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Flight } from "@/app/search/page";
import Image from "next/image";
import { format, parse } from "date-fns";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import FlightDetailModal from "./FlightDetailModal";
import { Separator } from "./ui/separator";

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
  const [isModalOpen, setIsModalOpen] = React.useState(false);


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
                          <span className="font-semibold">
                            {formatTime(flight.departure_airport.time)}
                          </span>
                          <span className="text-muted-foreground">
                            {flight.departure_airport.id}
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <p className="text-muted-foreground">
                          {formatDuration(flight.duration)}
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <p className="flex flex-col gap-2 justify-center items-center">
                          <span className="font-semibold">
                            {formatTime(flight.arrival_airport.time)}
                          </span>
                          <span className="text-muted-foreground">
                            {flight.arrival_airport.id}
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <Image
                          src={flight.airline_logo}
                          alt="flight logo"
                          width={34}
                          height={34}
                          style={{ objectFit: "contain" }}
                          unoptimized={true}
                        />
                        <span className="text-gray-600 font-semibold">
                          {flight.airline}
                        </span>
                      </div>
                    </div>
                  </div>

                  {index < parent_flight.flights.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </>
              ))}
            </div>

            {/* Right side: narrower */}
            <div className="hidden w-32 md:flex flex-col items-center justify-center p-2 border-l">
              <Label>
                <span className="font-semibold text-xl text-gray-600">
                  ${parent_flight.price}
                </span>
              </Label>
              <Button className="mt-4 w-full" variant="secondary" size="sm">
                View Details
              </Button>
              {/* You can add more layover details here */}
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
