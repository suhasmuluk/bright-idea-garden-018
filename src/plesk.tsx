import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

// Reuse all existing pages, loaders and guards; only the document shell differs.
const router = getRouter();
const container = document.getElementById("root");
if (!container) throw new Error("Application root is missing");
createRoot(container).render(<StrictMode><RouterProvider router={router} /></StrictMode>);