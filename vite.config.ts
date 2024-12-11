import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	base: "/hitster-kerst/", // Use your GitHub repository name
	server: {
		port: 5174,
		https: {
			key: fs.readFileSync("./localhost-key.pem"),
			cert: fs.readFileSync("./localhost.pem"),
		},
	},
});
