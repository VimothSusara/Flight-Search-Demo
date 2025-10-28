import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Flight } from "@/app/search/page";
import { format, parse } from "date-fns";
import { Button } from "./ui/button";
import FlightDetailModal from "./FlightDetailModal";
import { Separator } from "./ui/separator";

function formatDuration(duration: string | number) {
  if (!duration) return "";
  
  // Handle both string (ISO 8601) and numeric (minutes) formats
  if (typeof duration === "number") {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  }

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
    console.error("Error formatting time:", error);
    return timeString;
  }
};

const FlightCard = ({ parent_flight }: { parent_flight: Flight }) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Sort price options by price (ascending)
  const sortedPrices = parent_flight.priceOptions
    ? [...parent_flight.priceOptions].sort((a, b) => a.price - b.price)
    : [];


  return (
    <>
      <Card
        className="w-full py-4 px-2 m-0 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer rounded-2xl bg-white/70 backdrop-blur-lg border border-blue-100 hover:bg-white/90"
        style={{
          background: "rgba(255,255,255,0.7)",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
          border: "1px solid rgba(255,255,255,0.18)",
        }}
        onClick={(e) => {
          e.preventDefault();
          setIsModalOpen(true);
        }}
      >
        <CardContent>
          <div className="flex flex-row gap-8 items-center">
            {/* Left side: Flight Details */}
            <div className="flex-1 flex flex-col gap-2">
              {parent_flight.flights.map((flight, index) => (
                <React.Fragment key={index}>
                  <div className="flex flex-col gap-2 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-white shadow-sm">
                    <div className="grid grid-cols-4 gap-0 items-center text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">Depart</span>
                        <p className="font-semibold text-blue-600 text-lg">
                          {formatTime(flight.departure_airport.time).split(", ")[1]}
                        </p>
                        <p className="text-xs text-blue-400 font-medium">
                          {flight.departure_airport.id}
                        </p>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Duration</span>
                        <p className="text-sm text-gray-600 font-medium">
                          {formatDuration(flight.duration)}
                        </p>
                        <div className="w-8 h-0.5 bg-gray-300 my-1 mx-auto"></div>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">Arrive</span>
                        <p className="font-semibold text-blue-600 text-lg">
                          {formatTime(flight.arrival_airport.time).split(", ")[1]}
                        </p>
                        <p className="text-xs text-blue-400 font-medium">
                          {flight.arrival_airport.id}
                        </p>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">Airline</span>
                        <p className="text-xs text-gray-500 font-medium">
                          {flight.airline}
                        </p>
                        <p className="text-xs text-gray-400">{flight.flight_number}</p>
                      </div>
                    </div>
                  </div>
                  {index < parent_flight.flights.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Right side: Price Comparison from Multiple Providers */}
            <div className="hidden w-96 md:flex flex-col items-center justify-center border-l pl-8 gap-6">
              {sortedPrices.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2 text-center">
                    Prices from Multiple Agencies
                  </h3>
                  <div className="flex flex-col gap-3 max-h-40 overflow-y-auto items-center">
                    {sortedPrices.slice(0, 5).map((priceOption, idx) => (
                      <div
                        key={`${priceOption.provider}-${idx}`}
                        className={`flex flex-row items-center justify-center gap-6 w-72 p-4 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${
                          idx === 0
                            ? "bg-gradient-to-r from-blue-100 to-blue-50 border-blue-300"
                            : "bg-gray-50 border-gray-200"
                        }`}
                        style={idx === 0 ? { borderWidth: 2 } : {}}
                      >
                        <div className="flex flex-col items-start justify-center flex-1">
                          <span className="font-semibold text-blue-600 text-sm">
                            {priceOption.provider}
                          </span>
                          {priceOption.bookingUrl && (
                            <span className="text-xs text-blue-500 font-bold">
                              Book Now →
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end justify-center flex-1">
                          <span className="font-bold text-xl text-blue-700">
                            ${priceOption.price.toFixed(2)}
                          </span>
                          {idx === 0 && (
                            <span className="text-xs text-green-600 font-semibold animate-pulse mt-1">
                              Cheapest
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {sortedPrices.length > 5 && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      +{sortedPrices.length - 5} more options
                    </p>
                  )}

                  <Button
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    Compare All Prices
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4">
                  <p className="font-semibold text-lg text-gray-700">
                    ${parent_flight.lowestPrice.toFixed(2)}
                  </p>
                  <Button
                    className="mt-3 w-full"
                    variant="secondary"
                    size="sm"
                  >
                    View Details
                  </Button>
                </div>
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
