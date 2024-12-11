import { Track } from "spotify-web-sdk";
import { QRCodeType } from "./Container";

type CardProps = {
	track: Track;
	qrCode?: QRCodeType[];
	side: "front" | "back";
};

const Card = ({ track, qrCode, side }: CardProps) => (
	// <section className="border-[20px] border-red-900 m-2 w-[700px] h-[450px] flex flex-col  p-4 bg-[repeating-linear-gradient(45deg,_theme(colors.red.900)_0px,_theme(colors.red.900)_40px,_theme(colors.green.900)_40px,_theme(colors.green.900)_70px)]">
	<section className="border-[20px] border-red-900 m-2 w-[700px] h-[450px] flex flex-col bg-red-800">
		{side === "back" ? (
			<div className="flex items-center justify-center h-full">
				<img
					className="size-52"
					src={
						qrCode?.find((code) => code.id === track.id)?.qrCode ||
						""
					}
				/>
			</div>
		) : (
			<section className="flex flex-col justify-between gap-4 h-full">
				<h1 className="font-bold text-3xl text-green-600">
					{track.name}
				</h1>
				<div
					className="font-bold text-green-600"
					style={{ fontSize: "10rem" }}
				>
					{track.releaseYear}
				</div>
				<small className="text-3xl italic text-green-600">
					{track.artists[0].name}
				</small>
			</section>
		)}
	</section>
);

export default Card;
