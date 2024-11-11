import { useEffect, useRef, useState } from "react";
import { ensureValidToken } from "./authorize";
import QRCode from "qrcode";
import jsQR from "jsqr"; // Import jsQR for scanning
import Card from "./Card";
import * as spotify from "spotify-web-sdk";
import type { PlaylistTrack } from "spotify-web-sdk";
import { useNavigate } from "react-router-dom";

export type QRCodeType = {
	id: string;
	qrCode: string | null;
};

const getPlaylist = async () => {
	const token = await ensureValidToken();

	spotify.init({ token: token || "" });
	const res = await spotify.getPlaylist("37i9dQZF1DX0Yxoavh5qJV");

	return res;
};

const generateCodes = async (
	playlist: PlaylistTrack[]
): Promise<QRCodeType[]> => {
	const qrCodes = await Promise.all(
		playlist.map(async (item) => {
			const qrCode = await generateQR(item.track.id);
			return { id: item.track.id, qrCode };
		})
	);

	return qrCodes;
};

const generateQR = async (text: string) => {
	try {
		return QRCode.toDataURL(text);
	} catch (err) {
		console.error(err);
		return null;
	}
};

const playTrackById = async (trackId: string) => {
	const token = await ensureValidToken();

	const trackUri = `spotify:track:${trackId}`;
	await fetch(`https://api.spotify.com/v1/me/player/play`, {
		method: "PUT",
		body: JSON.stringify({ uris: [trackUri] }),
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	});
};

const Container = () => {
	const [playlist, setPlaylist] = useState<PlaylistTrack[]>([]);
	const [qrCode, setQrCode] = useState<QRCodeType[]>([]);
	const refreshToken = window.localStorage.getItem("refresh_token");
	const navigate = useNavigate();
	const videoRef = useRef<HTMLVideoElement>(null);
	const [error, setError] = useState<string | null>(null);

	// Redirect if no refresh token is found
	useEffect(() => {
		if (!refreshToken) {
			console.log("No refresh token found, redirecting to login");
			navigate("/");
		}
	}, [refreshToken, navigate]);

	// Fetch Spotify playlist and generate QR codes
	useEffect(() => {
		const fetchPlaylist = async () => {
			const playlist = await getPlaylist();
			setPlaylist(playlist.tracks.items);
		};
		fetchPlaylist();
	}, []);

	useEffect(() => {
		const generateQRCodes = async () => {
			setQrCode(await generateCodes(playlist));
		};

		if (playlist.length > 0) {
			generateQRCodes();
		}
	}, [playlist]);

	// Access and start camera for QR code scanning
	useEffect(() => {
		const startCamera = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: "environment" },
				});
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
					videoRef.current.play();
				}

				console.log("Camera started");
			} catch (err) {
				console.error(err);
				setError("Could not access camera");
			}
		};

		startCamera();

		return () => {
			if (videoRef.current?.srcObject) {
				const stream = videoRef.current.srcObject as MediaStream;
				stream.getTracks().forEach((track) => track.stop());
			}
		};
	}, []);

	// Continuously scan the camera feed for QR codes
	useEffect(() => {
		const scanQRCode = () => {
			if (!videoRef.current) return;

			const video = videoRef.current;
			const canvas = document.createElement("canvas");
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			const context = canvas.getContext("2d");

			if (context) {
				context.drawImage(video, 0, 0, canvas.width, canvas.height);
				const imageData = context.getImageData(
					0,
					0,
					canvas.width,
					canvas.height
				);
				const code = jsQR(imageData.data, canvas.width, canvas.height);

				if (code) {
					console.log("Scanned QR Code:", code.data);
					// Perform any action with the scanned code data, e.g., navigate or process it
				}
			}

			requestAnimationFrame(scanQRCode);
		};

		if (videoRef.current) {
			videoRef.current.addEventListener("loadedmetadata", scanQRCode);
		}
	}, []);

	return (
		<div>
			{error ? (
				<p className="text-red-600">{error}</p>
			) : (
				<video ref={videoRef} style={{ width: "100%" }} />
			)}
			{playlist.map((item) => (
				<Card
					key={item.track.id}
					track={item.track}
					qrCode={qrCode}
					side="back"
				/>
			))}
		</div>
	);
};

export default Container;
