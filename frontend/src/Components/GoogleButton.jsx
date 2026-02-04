import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import iconImage from "../assets/google-logo.webp";

const GoogleAuthButton = () => {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const token = tokenResponse.access_token;

      const { data } = await axios.post(
        `${import.meta.env.VITE_BASE_URL}google`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      localStorage.setItem("Opticast token", data.token);
      console.log("Response:", data);
    },
    onError: () => {
      console.log("Google Login Failed");
    },
  });

  return (
    <button
      onClick={() => login()}
      className="flex items-center cursor-pointer shadow-xl justify-center gap-4 py-4 text-md rounded-xl font-semibold text-[#F7F9F8] bg-[#202221]"
    >
      <img src={iconImage} className="h-6" />
      <span className="text-md font-semibold font-[ttregular]">
        Continue with Google
      </span>
    </button>
  );
};

export default GoogleAuthButton;
