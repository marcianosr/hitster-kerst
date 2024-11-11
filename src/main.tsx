import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./Login.tsx";
import Container from "./Container.tsx";
import "./App.css";

// playlist/37i9dQZF1DX0Yxoavh5qJV
// playlist/7l4sdtYsHVypensTVz8rb3

const router = createBrowserRouter([
	{
		path: "/",
		element: <Login />,
	},
	{
		path: "/game",
		element: <Container />,
	},
]);

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>
);
