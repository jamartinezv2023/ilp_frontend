// src/store/hooks.ts

import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";

// ✅ useDispatch tipado
export const useAppDispatch = () => useDispatch<AppDispatch>();

// ✅ useSelector tipado (SIN TypedUseSelectorHook)
export const useAppSelector = <TSelected>(
  selector: (state: RootState) => TSelected
): TSelected => useSelector(selector);
