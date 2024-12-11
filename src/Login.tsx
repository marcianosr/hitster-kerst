import { useEffect, useState } from "react";
import "./App.css";
import { getToken, parse, setCodeVerifierForAuth } from "./authorize";
import { useNavigate } from "react-router-dom";

// playlist/37i9dQZF1DX0Yxoavh5qJV
// playlist/7l4sdtYsHVypensTVz8rb3

// Authorization token that must have been created previously. See : https://developer.spotify.com/documentation/web-api/concepts/authorization
// const token =
// "BQB79my1qT_PwjR98ABPAfyBShGhd9ZW2zfR0LcF1rMdutnTipzXwSYovXCzZtBttv5YHE1lis9sIejqNZR1jkPMfkJo_6aKQ6S9HWrg_JM_rJ2FHWe9id4uMdwlEt6ueQ8v5p3Z0BRrvys8CTsr_9_tufPAeJJVx4YXDGrK55lRU42ACiyJ9bs0trHlC9Y-NXT7VzjWKufhwKzjwosv2X5jpovMWQT3_Ed9L1IgaGgCqZOL_Bh_q18VnyXj2wABU5QbUcs6k2F4";

const LoginButton: React.FC = () => {
	const handleLogin = async () => {
		try {
			setCodeVerifierForAuth();
		} catch (error) {
			console.error("Error during authentication:", error);
		}
	};

	return (
		<button onClick={handleLogin}>
			<img
				src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_CMYK_Black.png"
				alt="Spotify Logo"
				style={{ width: "20px", marginRight: "8px" }}
			/>
			Login with Spotify
		</button>
	);
};

const Login = () => {
	const [loggedIn, setLoggedIn] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		const authenticate = async () => {
			const { code } = parse(window.location.search);

			if (!code) {
				console.error("Authorization code not found");
				return;
			}

			try {
				await getToken(code);
				setLoggedIn(true);
				navigate("/game");
				// Redirect to the main app or desired route after successful authentication
			} catch (error) {
				console.error("Authentication failed:", error);
				// Optionally, redirect to an error page or show a message
			}
		};

		authenticate();
	}, [navigate]);

	return (
		<section>
			<h1>Login {loggedIn}</h1>
			<LoginButton />
		</section>
	);
};

export default Login;
