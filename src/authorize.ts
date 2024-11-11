import { redirect } from "react-router-dom";
import CryptoJS from "crypto-js";

// Generate a random string for code_verifier
const generateRandomString = (length: number) => {
	const possible =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const values = crypto.getRandomValues(new Uint8Array(length));
	return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

// Calculate code_challenge using crypto-js for HTTP environments
const generateCodeChallenge = async (verifier: string) => {
	const hash = CryptoJS.SHA256(verifier);
	return CryptoJS.enc.Base64.stringify(hash)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
};

const codeVerifier = generateRandomString(64);
window.localStorage.setItem("code_verifier", codeVerifier); // Store it for later use
const codeChallenge = await generateCodeChallenge(codeVerifier);

const clientId = "a88f35a8caf64ea5842cbdd3738f67a3";
const redirectUri = "http://localhost:5174";

const scope =
	"user-read-private user-read-email playlist-read-private playlist-read-collaborative";

const authUrl = new URL("https://accounts.spotify.com/authorize");

export const setCodeVerifierForAuth = () => {
	window.localStorage.setItem("code_verifier", codeVerifier);

	const params = {
		response_type: "code",
		client_id: clientId,
		scope,
		code_challenge_method: "S256",
		code_challenge,
		redirect_uri: redirectUri,
	};

	authUrl.search = new URLSearchParams(params).toString();
	window.location.href = authUrl.toString();
};

export const parse = (search: string) => {
	const params = new URLSearchParams(search);
	const code = params.get("code");
	const state = params.get("state");

	return { code, state };
};

export const getToken = async (code: string): Promise<void> => {
	const codeVerifier = window.localStorage.getItem("code_verifier");

	if (!codeVerifier) {
		throw new Error("Code verifier not found in local storage");
	}

	const payload = new URLSearchParams({
		client_id: clientId,
		grant_type: "authorization_code",
		code,
		redirect_uri: redirectUri,
		code_verifier: codeVerifier, // Ensure this matches exactly what was generated
	});

	try {
		const response = await fetch("https://accounts.spotify.com/api/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: payload.toString(),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(
				errorData.error_description || "Failed to fetch access token"
			);
		}

		const data = await response.json();

		// Store tokens and related info in localStorage
		window.localStorage.setItem("access_token", data.access_token);
		window.localStorage.setItem("refresh_token", data.refresh_token);
		window.localStorage.setItem("expires_in", data.expires_in.toString());
		window.localStorage.setItem("token_timestamp", Date.now().toString());
	} catch (error) {
		console.error("Error fetching token:", error);
		throw error;
	}
};
