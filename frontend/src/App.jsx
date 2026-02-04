import React from "react";
import { Route, Routes } from "react-router-dom";
import Register from "./Components/Register";
import Login from "./Components/Login";
import UserDashBoard from "./Components/UserDashBoard";
import UserSec from "./Components/UserSec";

const App = () => {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={
        <UserSec>
          <UserDashBoard/>
        </UserSec>
      }/>
    </Routes>
  );
};

export default App;
