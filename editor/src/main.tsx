import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";
import "./index.css";
import App from "./App";

const theme = createTheme({
	primaryColor: "blue",
	primaryShade: 7,
	defaultRadius: "sm",
	focusRing: "auto",
	fontFamily: 'Inter, "Microsoft YaHei", "PingFang SC", system-ui, sans-serif',
	headings: { fontFamily: 'Inter, "Microsoft YaHei", "PingFang SC", system-ui, sans-serif', fontWeight: "600" },
	components: {
		Button: { defaultProps: { radius: "sm" } },
		ActionIcon: { defaultProps: { radius: "sm" } },
		TextInput: { defaultProps: { radius: "sm" } },
		Select: { defaultProps: { radius: "sm" } },
	},
});

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MantineProvider theme={theme} defaultColorScheme="light">
			<App />
		</MantineProvider>
	</StrictMode>,
);
