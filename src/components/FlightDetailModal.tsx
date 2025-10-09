import React from "react";
import { Flight } from "@/app/search/page";
import Image from "next/image";
import { format, parse } from "date-fns";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { MessageCircleWarningIcon } from "lucide-react";

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
    console.error("Error formatting time:", error);
    return timeString;
  }
};

const FlightDetailModal = ({
  parent_flight,
  isOpen,
  setOpen,
}: {
  parent_flight: Flight;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}) => {
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-[90vw] md:max-w-2xl h-screen overflow-y-auto no-scrollbar">
          <DialogHeader className="p-0 m-0">
            <DialogTitle className="text-2xl font-bold text-center text-[#42A5F5]">
              Flight Details
            </DialogTitle>
            <DialogDescription className="text-center text-[#42A5F5]">
              Detailed information about your selected flight.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 my-2 md:my-4">
            {parent_flight.flights.map((flight, index) => (
              <div
                key={index}
                className="border flex flex-row gap-2 px-3 py-2 shadow-md"
              >
                <div className="w-auto md:w-20 flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center relative">
                    {/* Top dot */}
                    <div className="w-4 h-4 border-2 border-blue-500 rounded-full"></div>

                    {/* Line */}
                    <div className="w-px h-12 bg-blue-200"></div>

                    {/* Bottom dot */}
                    <div className="w-4 h-4 border-2 border-blue-500 rounded-full"></div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col px-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">
                        {flight.arrival_airport.id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {flight.flight_number}
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-muted-foreground">
                        {formatDuration(flight.duration)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(flight.arrival_airport.time)}
                      </p>
                    </div>
                    <div className="text-xs flex flex-col gap-2 items-end justify-center">
                      <p>{flight.airplane}</p>
                      <Image
                        src={flight.airline_logo}
                        alt="flight logo"
                        width={25}
                        height={25}
                        style={{ objectFit: "contain" }}
                        unoptimized={true}
                      />
                      <p className="text-sm text-muted-foreground text-end">
                        {flight.airline}
                      </p>
                    </div>
                  </div>

                  {parent_flight.flights.length > 1 ? (
                    <Separator className="my-1" />
                  ) : (
                    <div className="my-1" />
                  )}

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">
                        {flight.departure_airport.id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {flight.flight_number}
                      </p>
                    </div>
                    <div className=""></div>
                    <div className="text-xs flex flex-col gap-2 items-end justify-center">
                      <span className="text-sm text-muted-foreground">
                        Duration
                      </span>
                      <p className="text-sm text-gray-600">
                        {formatDuration(flight.duration)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {parent_flight.layovers && parent_flight.layovers.length > 0 && (
              <div className="my-2">
                <Alert variant="default" className="bg-yellow-50 text-amber-600 border-amber-200">
                  <MessageCircleWarningIcon />
                  <AlertTitle>Heads up!</AlertTitle>
                  <AlertDescription>
                    <div className="text-sm mb-2 text-yellow-600">
                      Flight has {parent_flight.layovers.length}{" "}
                      {parent_flight.layovers.length > 1
                        ? "layovers"
                        : "layover"}
                      . Please check the details.
                    </div>

                    {parent_flight.layovers.map((layover, idx) => (
                      <div key={idx} className="text-xs text-yellow-600">
                        <p>
                          <span className="font-semibold">{layover.id}</span>:{" "}
                          {formatDuration(layover.duration)} minutes layover
                        </p>
                      </div>
                    ))}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <p className="font-semibold text-lg">
                Total Price: ${parent_flight.price}
              </p>
              <Button size="sm">Book Now</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FlightDetailModal;
