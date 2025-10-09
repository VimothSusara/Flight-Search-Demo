import { PlaneIcon, User2 } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";

const Header = () => {
  return (
    <>
      <header className="h-20 md:h-40 flex items-start justify-center gap-4 px-4 py-2 rounded-none bg-[#1E88E5] text-white">
        <div className="flex justify-between w-full md:w-7/8 mt-1 md:mt-3">
          <div className="container flex items-center justify-start gap-3 text-white">
            <PlaneIcon size={30} />
            <h1 className="text-3xl font-bold">FlightSearch</h1>
          </div>
          <div className="flex items-center gap-2">

            <Button className="bg-white text-[#1E88E5] hover:bg-[#1E88E5] hover:text-white px-4 py-2 rounded-md">
              Sign In
            </Button>
            <Button className="bg-white text-[#1E88E5] hover:bg-[#1E88E5] hover:text-white  px-4 py-2 rounded-md">
              Sign Up
            </Button>
            <User2 size={30} />
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
