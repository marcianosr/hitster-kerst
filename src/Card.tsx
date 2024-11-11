import { Track } from "spotify-web-sdk";
import { QRCodeType } from "./Container";

type CardProps = {
	track: Track;
	qrCode?: QRCodeType[];
	side: "front" | "back";
};

const Card = ({ track, qrCode, side }: CardProps) => (
	<section className="border-[1px] border-red-500 w-[400px] p-4">
		{side === "front" ? (
			<div className="flex justify-center">
				<img
					src={qrCode?.find((code) => code.id === track.id)?.qrCode}
				/>
			</div>
		) : (
			<section className="flex flex-col gap-4">
				<h1 className="font-bold text-xl">{track.name}</h1>
				<div className="text-5xl font-bold">{track.releaseYear}</div>
				<small className="text-lg italic">
					{track.artists[0].name}
				</small>
			</section>
		)}
	</section>
);

export default Card;
