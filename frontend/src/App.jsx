import React from "react";
import { Route, Routes } from "react-router-dom";
import Register from "./Components/Register";
import Login from "./Components/Login";
import UserDashBoard from "./Components/UserDashBoard";

const App = () => {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<UserDashBoard/>}/>
    </Routes>
  );
};

export default App;
