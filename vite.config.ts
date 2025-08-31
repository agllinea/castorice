import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    base: "/castorice/",
    plugins: [react()],
    optimizeDeps: {
        exclude: ["js-big-decimal"],
    },
});
