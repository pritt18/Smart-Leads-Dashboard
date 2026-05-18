import { createSlice } from "@reduxjs/toolkit";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
}

const storedUser = localStorage.getItem(
  "user"
);

const initialState: AuthState = {
  token: localStorage.getItem("token"),

  user: storedUser
    ? JSON.parse(storedUser)
    : null,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    setCredentials: (
      state,
      action
    ) => {
      state.token =
        action.payload.token;

      state.user =
        action.payload.user;

      localStorage.setItem(
        "token",
        action.payload.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(
          action.payload.user
        )
      );
    },

    logout: (state) => {
      state.token = null;

      state.user = null;

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );
    },
  },
});

export const {
  setCredentials,
  logout,
} = authSlice.actions;

export default authSlice.reducer;