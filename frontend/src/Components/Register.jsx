import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import GoogleAuthButton from "./GoogleButton";
import { registerAction } from "../actions/register.action";
import { useDispatch } from "react-redux";

const Register = () => {
  document.title = "opticast | Register";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const submitHandler = async () => {
    try {
      const response = await dispatch(
        registerAction({ username, email, password }),
      );

      setUsername("");
      setEmail("");
      setPassword("");

      if (response?.user) {
        navigate("/dashboard");
      } else {
        console.error("Register Failed");
      }
    } catch (error) {
      console.error("Register Failed:", error);
      alert("Check Console an error occured while registering.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0E100F] flex flex-col items-center px-4">
      <h3 className="text-[#F5F5F5] font-[sfpro] text-3xl sm:text-4xl mt-12 mb-8">
        OPTICAST
      </h3>
      <div className="flex-1 w-full flex flex-col items-center">
        <div className="bg-[#171918] w-full max-w-sm sm:max-w-md md:max-w-lg rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col">
          <h4 className="text-center mb-6 text-[#ECECEC] font-[ttregular] text-xl sm:text-2xl font-semibold leading-7 sm:leading-8">
            Register to safe upload 🤟 <br />
            Welcome to Opticast
          </h4>

          <form
            className="flex flex-col"
            onSubmit={handleSubmit(submitHandler)}
          >
            <input
              type="text"
              name="username"
              placeholder="Enter your username"
              className="bg-[#202221] mb-3 px-4 py-3 font-[ttregular] text-sm sm:text-md rounded-md shadow-xl text-[#ECECEC] outline-none"
              {...register("username", { required: "Username is required" })}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {errors.username && (
              <p className="text-red-400">{errors.username.message}</p>
            )}

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              className="bg-[#202221] mb-3 px-4 py-3 font-[ttregular] text-sm sm:text-md rounded-md shadow-xl text-[#ECECEC] outline-none"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email",
                },
              })}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <p className="text-red-400">{errors.email.message}</p>
            )}

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              className="bg-[#202221] mb-4 px-4 py-3 font-[ttregular] text-sm sm:text-md rounded-md shadow-xl text-[#ECECEC] outline-none"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be 8+ characters",
                },
              })}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && (
              <p className="text-red-400">{errors.password.message}</p>
            )}

            <div className="flex justify-center gap-1 items-center mb-3 font-[ttregular]">
              <p className="text-md text-[#ececec80]">Have an account?</p>
              <Link to="/login" className="text-md text-[#D6FE50]">
                Login
              </Link>
            </div>

            <button type="submit" className="bg-[#D6FE50] cursor-pointer shadow-xl px-4 py-3 rounded-md font-[ttregular] font-semibold">
              Create account
            </button>
          </form>
          <div className="flex items-center gap-3 my-5">
            <hr className="flex-grow border-[#ececec67]" />
            <span className="text-[#ececec67] font-[ttregular] text-sm">
              OR
            </span>
            <hr className="flex-grow border-[#ececec67]" />
          </div>

          <GoogleAuthButton />
        </div>

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

export default Register;
