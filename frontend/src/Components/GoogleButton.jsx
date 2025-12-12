import React from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";

const GoogleButton = () => {
  const handler = async () => {
    const response = await axios.get(
      `${import.meta.env.VITE_BASE_URL}google/auth/google/callback`
    );
    console.log(response.data);
  };

  return (
    <div>
      <h1>OAuth with Google</h1>
      {/* <Link
        onClick={handler}
        to={`${import.meta.env.VITE_BASE_URL}google/auth/google`}
        className="px-10 py-2 rounded-lg bg-black/90 text-white"
      >
        Login with google
      </Link> */}

      <GoogleLogin onSuccess={(response) => {
        console.log("User response:",response);
      }} onError={(error) => {
        console.error("User error:",error);
      }}/>
    </div>
  );
};

export default GoogleButton;
