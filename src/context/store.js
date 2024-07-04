import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { reTimer } from "./timer";

export const store = configureStore({
  reducer: combineReducers({
    time: reTimer,
  }),
});
