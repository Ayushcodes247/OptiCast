import { configureStore } from "@reduxjs/toolkit";
import { registerReducer } from "../reducers/register.reducer";
import { loginAction } from "../actions/login.action";

export const store = configureStore({
  reducer: {
    register: registerReducer,
    login: loginAction,
  },
});
