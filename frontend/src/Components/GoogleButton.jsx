import React from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const GoogleButton = () => {
  const navigate = useNavigate();

  const handler = async (response) => {
    const { name , email } = jwtDecode(response.credential);
    console.log("Name:",name);
    console.log("Email:",email);
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

      <GoogleLogin
        onSuccess={handler}
        onError={(error) => {
          console.error("User error:", error);
        }}
      />
    </div>
  );
};

export default GoogleButton;
