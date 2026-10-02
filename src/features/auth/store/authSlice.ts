import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { logoutSession, refreshSession, type LoginResponse } from "../services/authApi";

interface AuthState {
  accessToken: string | null;
  email: string | null;
  mfaRequired: boolean;
  loading: boolean;
  initializing: boolean;
  error: string | null;
}

const initialState: AuthState = {
  accessToken: null,
  email: null,
  mfaRequired: false,
  loading: false,
  initializing: true,
  error: null,
};

export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (): Promise<LoginResponse> => refreshSession(),
);

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await logoutSession();
    return true;
  } catch {
    return false;
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authenticationStarted: (state) => {
      state.loading = true;
      state.error = null;
    },
    authenticationSucceeded: (state, action: PayloadAction<LoginResponse>) => {
      state.loading = false;
      state.accessToken = action.payload.accessToken;
      state.email = action.payload.email;
      state.mfaRequired = false;
      state.error = null;
    },
    authenticationRequiresMfa: (state) => {
      state.loading = false;
      state.accessToken = null;
      state.mfaRequired = true;
      state.error = null;
    },
    authenticationFailed: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.accessToken = null;
      state.email = null;
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.initializing = false;
        state.accessToken = action.payload.accessToken;
        state.email = action.payload.email;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.initializing = false;
        state.accessToken = null;
        state.email = null;
      })
      .addCase(logout.fulfilled, () => ({ ...initialState, initializing: false }))
      .addCase(logout.rejected, () => ({ ...initialState, initializing: false }));
  },
});

export const {
  authenticationStarted,
  authenticationSucceeded,
  authenticationRequiresMfa,
  authenticationFailed,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
