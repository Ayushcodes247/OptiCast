import React from "react";
import { FaShieldHalved } from "react-icons/fa6";
import { NavLink } from "react-router-dom";
import { ImHome } from "react-icons/im";
import { BsCollectionPlayFill } from "react-icons/bs";
import { MdAccountCircle } from "react-icons/md";
import { CgPlayButtonO } from "react-icons/cg";
import { TbWindowMinimize } from "react-icons/tb";
import Logout from "./Logout";

const SideBar = () => {
  const linkBaseStyle =
    "flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium transition-all duration-200";

  return (
    <div className="h-screen w-64 bg-[#171918] shadow-xl flex flex-col justify-between p-4">
      {/* Top Section */}
      <div>
        <TbWindowMinimize className="absolute right-4 top-4 bg-[#D4FB54] text-2xl text-[#202221] rounded-xl cursor-pointer p-1" />

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-12 mt-10">
          <FaShieldHalved className="text-[#F5F5F5] text-2xl" />
          <h1 className="text-2xl text-[#F5F5F5] uppercase font-light tracking-wider">
            opticast
          </h1>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-4">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${linkBaseStyle} ${
                isActive
                  ? "bg-[#D4FB54] text-[#202221]"
                  : "text-[#F5F5F5] hover:bg-[#202221]"
              }`
            }
          >
            <ImHome />
            Home
          </NavLink>

          <NavLink
            to="/media/collection"
            className={({ isActive }) =>
              `${linkBaseStyle} ${
                isActive
                  ? "bg-[#D4FB54] text-[#202221]"
                  : "text-[#F5F5F5] hover:bg-[#202221]"
              }`
            }
          >
            <BsCollectionPlayFill />
            Media Collection
          </NavLink>

          <NavLink
            to="/stream"
            className={({ isActive }) =>
              `${linkBaseStyle} ${
                isActive
                  ? "bg-[#D4FB54] text-[#202221]"
                  : "text-[#F5F5F5] hover:bg-[#202221]"
              }`
            }
          >
            <CgPlayButtonO />
            Stream
          </NavLink>

          <NavLink
            to="/account"
            className={({ isActive }) =>
              `${linkBaseStyle} ${
                isActive
                  ? "bg-[#D4FB54] text-[#202221]"
                  : "text-[#F5F5F5] hover:bg-[#202221]"
              }`
            }
          >
            <MdAccountCircle />
            Account
          </NavLink>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mb-6">
        <Logout />
      </div>
    </div>
  );
};

export default SideBar;
