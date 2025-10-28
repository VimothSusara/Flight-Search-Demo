import React from "react";
import { Flight } from "@/app/search/page";
import { format, parse } from "date-fns";
// import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { MessageCircleWarningIcon, DollarSign, TrendingDown } from "lucide-react";

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

const formatTime = (timeString: string) => {
  try {
    const date = parse(timeString, "yyyy-MM-dd'T'HH:mm:ss", new Date());
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
  // Type assertion for apiRaw
  const apiRaw = parent_flight.apiRaw as (typeof parent_flight.apiRaw & { travelerPricings?: unknown[] }) | undefined;
  const sortedPrices = parent_flight.priceOptions
          ? [...parent_flight.priceOptions].sort((a, b) => a.price - b.price)
    : [];

  const maxPrice = sortedPrices.length > 0 ? Math.max(...sortedPrices.map((p) => p.price)) : 0;
  const minPrice = sortedPrices.length > 0 ? Math.min(...sortedPrices.map((p) => p.price)) : 0;
  const savings = sortedPrices.length > 1 ? maxPrice - minPrice : 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-[95vw] md:max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white/90 shadow-2xl p-0">
          <DialogHeader className="p-0 m-0">
            <DialogTitle className="text-3xl font-extrabold text-center text-blue-600 py-4">
              Flight Details
            </DialogTitle>
            <DialogDescription className="text-center text-gray-500 text-lg mb-2">
              See all available prices from multiple booking agencies
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 my-4 px-6">
            {/* Flight Details Section */}
            <div className="rounded-xl bg-gradient-to-r from-blue-50 to-white shadow p-6 mb-2">
              <h3 className="text-xl font-bold text-blue-700 mb-6 text-center tracking-wide">
                Flight Route
              </h3>
              {parent_flight.flights.map((flight, index) => (
                <div key={index} className="mb-6">
                  <div className="grid grid-cols-3 gap-8 items-center text-center">
                    {/* Departure */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">Depart</span>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatTime(flight.departure_airport.time)}
                      </p>
                      <p className="text-sm font-semibold text-gray-600">
                        {flight.departure_airport.id}
                      </p>
                    </div>
                    {/* Duration & Airline */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Duration</span>
                      <p className="text-lg text-gray-600 font-semibold mb-2">
                        {formatDuration(flight.duration)}
                      </p>
                      <span className="text-xs text-blue-500 font-bold mt-2">{flight.airline}</span>
                      <span className="text-xs text-gray-400">{flight.flight_number}</span>
                    </div>
                    {/* Arrival */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">Arrive</span>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatTime(flight.arrival_airport.time)}
                      </p>
                      <p className="text-sm font-semibold text-gray-600">
                        {flight.arrival_airport.id}
                      </p>
                    </div>
                  </div>

                  {/* Flight Info */}
                  <div className="mt-4 pt-4 border-t flex justify-around text-sm text-gray-600">
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Aircraft</p>
                      <p className="font-medium">{flight.airplane || "N/A"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Class</p>
                      <p className="font-medium">
                        {/* Prefer travel class from apiRaw.travelerPricings if available */}
                        {(() => {
                          const traveler = apiRaw?.travelerPricings?.[0] as { fareDetailsBySegment?: Array<{ cabin?: string }> } | undefined;
                          return traveler?.fareDetailsBySegment?.[index]?.cabin || flight.travel_class || "Economy";
                        })()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Legroom</p>
                      <p className="font-medium">{flight.legroom || "Standard"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Layovers Warning */}
            {parent_flight.layovers && parent_flight.layovers.length > 0 && (
              <Alert className="bg-yellow-50 text-amber-600 border-amber-200">
                <MessageCircleWarningIcon className="h-4 w-4" />
                <AlertTitle>Layovers</AlertTitle>
                <AlertDescription>
                  {parent_flight.layovers.map((layover, idx) => (
                    <div key={idx} className="text-sm">
                      <p>
                        <span className="font-semibold">{layover.id}</span>: Stop for{" "}
                        {formatDuration(layover.duration.toString())}
                      </p>
                    </div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            {/* Price Comparison Section */}
            <div className="rounded-xl bg-gradient-to-r from-green-50 to-blue-50 shadow p-6 mt-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  Prices from Multiple Agencies
                </h3>
                {savings > 0 && (
                  <div className="flex items-center gap-2 text-green-600 font-bold text-lg">
                    <TrendingDown className="h-5 w-5" />
                    Save ${savings.toFixed(2)}
                  </div>
                )}
              </div>

              {sortedPrices.length > 0 ? (
                <div className="grid gap-4">
                  {sortedPrices.map((priceOption, idx) => (
                    <div
                      key={`${priceOption.provider}-${idx}`}
                      className={`p-5 rounded-xl border-2 transition-all flex flex-col md:flex-row items-center justify-between gap-4 ${
                        idx === 0
                          ? "border-green-400 bg-green-50 shadow-md"
                          : "border-blue-100 bg-white hover:border-blue-300"
                      }`}
                    >
                      <div className="flex flex-col items-start justify-center flex-1">
                        <span className="font-bold text-blue-600 text-lg">
                          {priceOption.provider}
                        </span>
                        {priceOption.bookingUrl && (
                          <span className="text-xs text-blue-500 font-bold mt-1">
                            Available for booking
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end justify-center flex-1">
                        <span className="font-bold text-3xl text-green-700">
                          ${priceOption.price.toFixed(2)}
                        </span>
                        {idx === 0 && (
                          <span className="text-sm font-semibold text-green-600 mt-1">
                            ✓ Best Price
                          </span>
                        )}
                        {idx !== 0 && (
                          <span className="text-xs text-gray-500 mt-1">
                            +${(priceOption.price - minPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={() => {
                          if (priceOption.bookingUrl) {
                            window.open(priceOption.bookingUrl, "_blank");
                          }
                        }}
                        disabled={!priceOption.bookingUrl}
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white mt-4 md:mt-0"
                        size="sm"
                      >
                        Book on {priceOption.provider}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    Price information not available
                  </p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-xl bg-blue-50 p-6 mt-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total Duration</p>
                  <p className="text-xl font-bold text-blue-700">
                    {formatDuration(parent_flight.total_duration)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Price Range</p>
                  <p className="text-xl font-bold text-blue-700">
                    ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Lowest</p>
                  <p className="text-xl font-bold text-green-600">
                    ${minPrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Providers</p>
                  <p className="text-xl font-bold text-blue-600">
                    {sortedPrices.length}
                  </p>
                </div>
              </div>
            </div>
              {/* Traveler Pricing Details from API (if available) */}
              {apiRaw && apiRaw.travelerPricings && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-md font-bold text-blue-600 mb-2">Traveler Pricing</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {apiRaw.travelerPricings.map((tp: unknown, tpIdx: number) => {
                      const traveler = tp as {
                        travelerType?: string;
                        fareOption?: string;
                        price?: { currency?: string; total?: string };
                      };
                      return (
                        <div key={tpIdx} className="mb-2 p-2 rounded bg-blue-50 flex flex-col items-center">
                          <span className="font-semibold text-blue-700 text-lg mb-1">
                            {traveler.travelerType === "ADULT"
                              ? "Adult"
                              : traveler.travelerType === "CHILD"
                              ? "Child"
                              : traveler.travelerType === "HELD_INFANT" || traveler.travelerType === "INFANT"
                              ? "Infant"
                              : traveler.travelerType}
                          </span>
                          <span className="text-xs text-gray-500 mb-2">Fare: {traveler.fareOption}</span>
                          <span className="text-sm text-gray-700 mb-2">Price: <span className="font-bold text-green-700">{traveler.price?.currency} {traveler.price?.total}</span> </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Call to Action */}
            <div className="pt-6">
              <Button
                onClick={() => {
                  if (sortedPrices[0]?.bookingUrl) {
                    window.open(sortedPrices[0].bookingUrl, "_blank");
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-6 text-xl font-extrabold rounded-xl shadow-lg"
              >
                Book Best Price: ${minPrice.toFixed(2)}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FlightDetailModal;
