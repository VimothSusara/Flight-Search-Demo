import { PlaneIcon } from "lucide-react";
import React from "react";

const Header = () => {
  return (
    <>
      <header className="h-20 md:h-40 flex items-start justify-center gap-4 px-4 py-2 rounded-none bg-[#1E88E5] text-white">
        <div className="container flex items-center justify-start gap-3 text-white">
          <PlaneIcon size={30} />
          <h1 className="text-3xl font-bold">FlightSearch</h1>
        </div>
      </header>
    </>
  );
};

export default Header;
