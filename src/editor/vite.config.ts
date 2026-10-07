import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { screenplayEditorApi } from "./editor-api-plugin";

export default defineConfig({
	root: fileURLToPath(new URL(".", import.meta.url)),
	resolve: { alias: { "@": fileURLToPath(new URL("../", import.meta.url)) } },
	plugins: [react(), tailwindcss(), screenplayEditorApi()],
});
