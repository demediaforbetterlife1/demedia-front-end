import { io, Socket } from "socket.io-client";

let socket: Socket;

export const connectSocket = (): Socket => {
	if (!socket) {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL || ""; // same-origin if empty
		socket = io(backendUrl, { withCredentials: true });
	}
	return socket;
};
