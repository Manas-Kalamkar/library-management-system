import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router";
import "./index.css";
import { App } from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { ToastProvider } from "./components/ui/Toast";
import { queryClient } from "./lib/queryClient";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <ToastProvider>
                    <BrowserRouter>
                        <AuthProvider>
                            <App />
                        </AuthProvider>
                    </BrowserRouter>
                </ToastProvider>
            </QueryClientProvider>
        </ThemeProvider>
    </StrictMode>,
);
