import React from 'react';
import ReactDOM from "react-dom/client";
import "./css/global.css";
import "./css/main.css";
import "./css/components.css";
import { App } from "./app";
import { ConfigProvider, theme } from "antd";
import { themeConfig } from "./ant.config";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

const queryClient = new QueryClient()
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <QueryClientProvider client={queryClient}>
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: themeConfig.token,
                components: themeConfig.components,
            }}>
            <App />
        </ConfigProvider>
    </QueryClientProvider>
);

