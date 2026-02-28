import React from "react";
import { BiLogOutCircle } from "react-icons/bi";

const Logout = () => {
  return (
    <div className="text-[#f5f5f5] px-12 py-4 flex items-center text-xl font-semibold rounded-lg shadow-2xl gap-2 bg-red-600">
      <BiLogOutCircle/>
      <h2>Logout</h2>
    </div>
  );
};

export default Logout;
