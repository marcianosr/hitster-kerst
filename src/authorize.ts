const generateRandomString = (length: number) => {
	const possible =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const values = crypto.getRandomValues(new Uint8Array(length));
	return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain: string) => {
	const encoder = new TextEncoder();
	const data = encoder.encode(plain);
	return window.crypto.subtle.digest("SHA-256", data);
};

const base64encode = (input: ArrayBuffer) => {
	return btoa(String.fromCharCode(...new Uint8Array(input)))
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");
};

const clientId = "a88f35a8caf64ea5842cbdd3738f67a3";
const redirectUri = "https://localhost:5174";

const scope =
	"user-read-private user-read-email playlist-read-private playlist-read-collaborative";

const authUrl = new URL("https://accounts.spotify.com/authorize");

// generated in the previous step
export const setCodeVerifierForAuth = async () => {
	const codeVerifier = generateRandomString(64);
	const hashed = await sha256(codeVerifier);
	const codeChallenge = base64encode(hashed);

	window.localStorage.setItem("code_verifier", codeVerifier);

	const params = {
		response_type: "code",
		client_id: clientId,
		scope,
		code_challenge_method: "S256",
		code_challenge: codeChallenge,
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

	// Replace with your actual Client ID
	const redirectUri = "https://localhost:5174"; // Ensure this matches your Spotify app settings

	const payload = new URLSearchParams({
		client_id: clientId,
		grant_type: "authorization_code",
		code: code,
		redirect_uri: redirectUri,
		code_verifier: codeVerifier,
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

		console.log(data);

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

export const refreshToken = async () => {
	const refreshToken = window.localStorage.getItem("refresh_token");

	if (!refreshToken) {
		throw new Error("Refresh token not found in local storage");
	}

	const payload = new URLSearchParams({
		client_id: clientId,
		grant_type: "refresh_token",
		refresh_token: refreshToken,
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
				errorData.error_description || "Failed to refresh token"
			);
		}

		const data = await response.json();

		// Update the new access token and expiration time in local storage
		window.localStorage.setItem("access_token", data.access_token);
		window.localStorage.setItem("expires_in", data.expires_in.toString());
		window.localStorage.setItem("token_timestamp", Date.now().toString());
	} catch (error) {
		console.error("Error refreshing token:", error);
		throw error;
	}
};

export const isTokenExpired = () => {
	const expiresIn = window.localStorage.getItem("expires_in");
	const tokenTimestamp = window.localStorage.getItem("token_timestamp");

	if (!expiresIn || !tokenTimestamp) return true;

	const currentTime = Date.now();
	const expirationTime =
		parseInt(tokenTimestamp) + parseInt(expiresIn) * 1000;

	return currentTime > expirationTime;
};

export const ensureValidToken = async () => {
	if (isTokenExpired()) {
		await refreshToken();
	}

	return window.localStorage.getItem("access_token");
};
