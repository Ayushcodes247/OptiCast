import React from "react";
import SideBar from "./SideBar";

const UserDashBoard = () => {
  document.title = "opticast | User-dashboard";

  return <div className="h-screen w-screen bg-[#0E100F]">
    <SideBar/>
  </div>;
};

export default UserDashBoard;
