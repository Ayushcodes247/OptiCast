import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Logo404 from "../assets/404.svg";

const Page404 = () => {
  document.title = "opticast | page not found.";

  return (
    <div className="min-h-screen w-full bg-[#0E100F] flex items-center justify-center">
      <div className="max-w-4xl w-full px-6 flex flex-col items-center text-center gap-10">
        <motion.img
          src={Logo404}
          alt="404 illustration"
          className="w-full max-w-md select-none"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
        />

        <div className="flex flex-col items-center gap-4">
          <h1 className="text-[#F5F5F5] text-5xl md:text-7xl font-semibold">
            Page not found
          </h1>

          <p className="text-[#a1a1a1] text-base md:text-lg max-w-md">
            Sorry, we weren’t able to find the page you requested.
          </p>

          <Link
            to="/dashboard"
            className="mt-2 bg-[#171918] px-9 py-4 text-lg text-[#F5F5F5] shadow-xl font-[ttregular] font-semibold rounded-lg hover:opacity-80 transition"
          >
            Go back →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Page404;
