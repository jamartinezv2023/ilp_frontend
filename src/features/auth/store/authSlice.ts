import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: number;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  password: string;
  mfaRequired: boolean;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  email: string | null;
  password: string | null;
  mfaRequired: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  email: null,
  password: null,
  mfaRequired: false,
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (credentials: LoginRequest): Promise<LoginResponse> => {
    const validEmail = credentials.email === "admin@demo.com";
    const validPassword =
      credentials.password === "Admin123*" ||
      credentials.password === "password";

    if (!validEmail || !validPassword) {
      throw new Error("Invalid MVP-21A local credentials");
    }

    return {
      accessToken: "mvp21a-local-access-token",
      refreshToken: "mvp21a-local-refresh-token",
      email: credentials.email,
      password: credentials.password,
      mfaRequired: false,
    };
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.email = null;
      state.password = null;
      state.mfaRequired = false;
      state.error = null;
    },
    clearError: (state) => {
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
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.email = action.payload.email;
        state.password = action.payload.password;
        state.mfaRequired = action.payload.mfaRequired;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state) => {
        state.loading = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.email = null;
        state.password = null;
        state.mfaRequired = false;
        state.error = "Login failed";
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

