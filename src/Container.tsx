import { useEffect, useRef, useState } from "react";
import { ensureValidToken } from "./authorize";
import QRCode from "qrcode";
import jsQR from "jsqr"; // Import jsQR for scanning
import Card from "./Card";
import * as spotify from "spotify-web-sdk";
import type { PlaylistTrack } from "spotify-web-sdk";
import { useNavigate } from "react-router-dom";
// import { usePDF } from "react-to-pdf";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type QRCodeType = {
	id: string;
	qrCode: string | null;
};

const getPlaylist = async (id: string) => {
	const token = await ensureValidToken();

	spotify.init({ token: token || "" });
	const res = await spotify.getPlaylist(id);

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

// const playTrackById = async (trackId: string) => {
// 	const token = await ensureValidToken();

// 	const trackUri = `spotify:track:${trackId}`;
// 	await fetch(`https://api.spotify.com/v1/me/player/play`, {
// 		method: "PUT",
// 		body: JSON.stringify({ uris: [trackUri] }),
// 		headers: {
// 			Authorization: `Bearer ${token}`,
// 			"Content-Type": "application/json",
// 		},
// 	});
// };

const Container = () => {
	const [playlist, setPlaylist] = useState<PlaylistTrack[]>([]);
	const [qrCode, setQrCode] = useState<QRCodeType[]>([]);
	const refreshToken = window.localStorage.getItem("refresh_token");
	const navigate = useNavigate();
	const videoRef = useRef<HTMLVideoElement>(null);
	const [error, setError] = useState<string | null>(null);
	const targetRef = useRef(null);
	const [cameraActive, setCameraActive] = useState<boolean>(false);

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
			// const playlist1 = await getPlaylist("37i9dQZF1DX0Yxoavh5qJV");
			const playlist2 = await getPlaylist("7l4sdtYsHVypensTVz8rb3");
			const playlist = [
				// ...playlist1.tracks.items,
				...playlist2.tracks.items,
			];

			const filterDups = playlist.filter(
				(item, index, self) =>
					index ===
					self.findIndex((t) => t.track.id === item.track.id)
			);

			setPlaylist(filterDups);
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

	const startCamera = async () => {
		try {
			if (
				!navigator.mediaDevices ||
				!navigator.mediaDevices.getUserMedia
			) {
				setError("Your browser does not support camera access.");
				return;
			}
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "environment" },
			});

			console.log("Camera stream obtained", stream);

			console.log("Camera stream obtained", stream);
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				videoRef.current.play();

				console.log("Camera stream started");
			}
			setCameraActive(true);
			console.log("Camera started");
		} catch (err) {
			console.error("Error accessing camera:", err);
			if (err === "NotAllowedError") {
				setError(
					"Camera access denied. Please grant camera permissions."
				);
			} else {
				setError("An error occurred while accessing the camera.");
			}

			console.error(err);
			setError("Could not access camera");
		}
	};

	const stopCamera = () => {
		if (videoRef.current?.srcObject) {
			const stream = videoRef.current.srcObject as MediaStream;
			stream.getTracks().forEach((track) => track.stop());
		}
		setCameraActive(false);
	};

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

		if (videoRef.current && cameraActive) {
			videoRef.current.addEventListener("loadedmetadata", scanQRCode);
		}
	}, [cameraActive]);

	const generatePDF = async () => {
		const pdf = new jsPDF();
		const cardsPerPage = 4; // Adjust based on card size and layout
		const pageWidth = pdf.internal.pageSize.getWidth();
		const pageHeight = pdf.internal.pageSize.getHeight();

		for (let i = 0; i < playlist.length; i += cardsPerPage) {
			// Temporarily render only the cards for the current page
			const pageCards = playlist.slice(i, i + cardsPerPage);

			// Create a container div to hold these cards
			const pageContainer = document.createElement("div");
			pageContainer.style.width = `${pageWidth}px`;
			pageContainer.style.height = `${pageHeight}px`;

			// Render each card in the container
			pageCards.forEach((card) => {
				const cardElement = document.getElementById(
					`card-${card.track.id}`
				);
				if (cardElement) {
					const clonedCard = cardElement.cloneNode(true); // Clone to keep the original intact
					pageContainer.appendChild(clonedCard);
				}
			});

			// Append the container temporarily to the document for rendering
			document.body.appendChild(pageContainer);

			// Capture the page container as an image
			const canvas = await html2canvas(pageContainer);
			const imgData = canvas.toDataURL("image/png");

			// Add the image to the PDF
			pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);

			// Remove the container after capturing
			document.body.removeChild(pageContainer);

			// Add a new page if there are more cards to process
			if (i + cardsPerPage < playlist.length) {
				pdf.addPage();
			}
		}

		pdf.save("cards.pdf");
	};

	return playlist.length > 0 ? (
		<div ref={targetRef}>
			{error && <div className="error text-red-500">{error}</div>}
			<button onClick={generatePDF}>Generate PDF</button>
			<button
				onClick={() => {
					console.log("OnClick: Start Camera");
					startCamera();
				}}
				className="p-4"
			>
				Start Camera
			</button>
			<button onClick={stopCamera}>Stop Camera</button>
			{playlist.map((item) => (
				<div className="flex" key={item.track.id}>
					<Card track={item.track} qrCode={qrCode} side="front" />
					<Card track={item.track} qrCode={qrCode} side="back" />
				</div>
			))}
		</div>
	) : (
		<>Loading</>
	);
};

export default Container;
