import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import UiGallery from "./UiGallery";

const isUiGallery = window.location.pathname === "/ui" || window.location.pathname === "/ui/";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		{isUiGallery ? <UiGallery /> : <App />}
	</StrictMode>,
);
