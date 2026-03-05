import { io, Socket } from "socket.io-client";

let socket: Socket;

export const connectSocket = (): Socket => {
	if (!socket) {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://demedia-backend-production.up.railway.app";
		
		// Get token from localStorage or cookies
		const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
		
		socket = io(backendUrl, { 
			withCredentials: true,
			auth: {
				token: token
			}
		});
		
		socket.on('connect_error', (error) => {
			console.error('Socket connection error:', error.message);
		});
		
		socket.on('error', (error) => {
			console.error('Socket error:', error.message);
		});
	}
	return socket;
};

export const disconnectSocket = () => {
	if (socket) {
		socket.disconnect();
		socket = null as any;
	}
};
