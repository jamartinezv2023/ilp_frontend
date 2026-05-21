import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: number;
}

interface LoginResponse {
  accessToken: string | null;
  refreshToken: string | null;
  mfaRequired: boolean;
}

interface AuthState {
  loading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  mfaRequired: boolean;
  email: string | null;
  password: string | null;
}

const initialState: AuthState = {
  loading: false,
  error: null,
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  mfaRequired: false,
  email: null,
  password: null,
};

const API_BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL;
const TENANT_ID = import.meta.env.VITE_TENANT_ID;

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (credentials: LoginRequest) => {
    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/auth/login`,
      credentials,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": TENANT_ID,
        },
      }
    );

    return {
      ...response.data,
      email: credentials.email,
      password: credentials.password,
    };
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.mfaRequired = false;
      state.email = null;
      state.password = null;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.mfaRequired = action.payload.mfaRequired;

        if (action.payload.mfaRequired) {
          state.email = action.payload.email;
          state.password = action.payload.password;
          return;
        }

        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.email = null;
        state.password = null;

        if (action.payload.accessToken) {
          localStorage.setItem("accessToken", action.payload.accessToken);
        }

        if (action.payload.refreshToken) {
          localStorage.setItem("refreshToken", action.payload.refreshToken);
        }
      })
      .addCase(loginThunk.rejected, (state) => {
        state.loading = false;
        state.error = "Login failed";
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
