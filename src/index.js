import React from 'react';
import ReactDOM from "react-dom/client";
import "./css/global.css";
import "./css/main.css";
import "./css/components.css";
import { App } from "./app";
import { ConfigProvider, theme } from "antd";
import { themeConfig } from "./ant.config";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store } from "./context/store";
import {
    BrowserRouter,
    Route,
    Router,
    Routes,
    useLocation,
    useNavigate,
    useParams,
    useSearchParams
} from "react-router-dom";

const queryClient = new QueryClient()
const root = ReactDOM.createRoot(document.getElementById("root"));

const BProvider = () =>{
    const {params} = useParams();
    return (
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <ConfigProvider
                    theme={{
                        algorithm: theme.darkAlgorithm,
                        token: themeConfig.token,
                        components: themeConfig.components,
                    }}>
                    <App params={params} props={params} params/>
                </ConfigProvider>
            </QueryClientProvider>
        </Provider>
    )
}
const NotFound = () => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
        }}>
            <h1>404</h1>
            <span>Page not found</span>
        </div>
    );
};
root.render(
    <BrowserRouter>
    <Routes>
        <Route path={"/event/:id"} element={
            <BProvider/>
        }/>
        <Route path="*" element={<NotFound/>}/>
    </Routes>
    </BrowserRouter>
);

