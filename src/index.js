import React from 'react';
import ReactDOM from "react-dom/client";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import App from "./app";
import "./css/vars.css";
import "./css/global.css";
import "./css/main.scss";
import "./css/components.css";

const queryClient = new QueryClient()
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
