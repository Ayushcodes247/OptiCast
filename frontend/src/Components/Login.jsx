import React from "react";
import GoogleAuthButton from "./GoogleButton";
import { Link } from "react-router-dom";

const Login = () => {
  document.title = "opticast | Login";

  return (
    <div className="min-h-screen w-full bg-[#0E100F] flex flex-col items-center px-4">
      <h3 className="text-[#F5F5F5] font-[sfpro] text-3xl sm:text-4xl mt-12 mb-8">
        OPTICAST
      </h3>

      <div className="flex-1 w-full flex flex-col items-center">
        <div className="bg-[#171918] w-full max-w-sm sm:max-w-md md:max-w-lg rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col">
          <h4 className="text-center mb-6 text-[#ECECEC] font-[ttregular] text-xl sm:text-2xl font-semibold leading-7 sm:leading-8">
            Hey✌️ <br />
            Login to safe upload
          </h4>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            className="bg-[#202221] mb-3 px-4 py-3 font-[ttregular] text-sm sm:text-md rounded-md shadow-xl text-[#ECECEC] outline-none"
          />

          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            className="bg-[#202221] mb-4 px-4 py-3 font-[ttregular] text-sm sm:text-md rounded-md shadow-xl text-[#ECECEC] outline-none"
          />

          <div className="flex justify-center gap-1 items-center mb-3 font-[ttregular]">
            <p className="text-md text-[#ececec80]">Don't have an account?</p>
            <Link to="/register" className="text-md text-[#D6FE50]">
              Register
            </Link>
          </div>

          <button className="bg-[#D6FE50] cursor-pointer shadow-xl px-4 py-3 rounded-md font-[ttregular] font-semibold">
            Login Account
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <hr className="flex-grow border-[#ececec67]" />
            <span className="text-[#ececec67] font-[ttregular] text-sm">
              OR
            </span>
            <hr className="flex-grow border-[#ececec67]" />
          </div>

          <GoogleAuthButton />
        </div>

        {/* Footer links */}
        <div className="flex gap-2 mt-7 items-center">
          <p className="text-[#ececec67] underline cursor-pointer text-lg font-[ttregular]">
            Terms of use
          </p>
          <p className="text-[#ececec41] text-md cursor-pointer font-[ttregular]">
            and
          </p>
          <p className="text-[#ececec67] underline cursor-pointer text-lg font-[ttregular]">
            Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
