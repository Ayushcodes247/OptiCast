import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
      <StrictMode>
        <App />
      </StrictMode>
    </GoogleOAuthProvider>
  </BrowserRouter>,
);
