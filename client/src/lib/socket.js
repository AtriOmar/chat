import { io } from "socket.io-client";

// "undefined" means the URL will be computed from the `window.location` object

const URL = import.meta.env.VITE_SOCKET_URL;
console.log(URL);
export const socket = io(URL, {
  forceNew: true,
  withCredentials: true,
  autoConnect: false,
  transports: ["websocket"],
  query: {
    // token: `Bearer ${localStorage.getItem("ELCAMBA_token")}`,
    hi: "",
  },
});

socket.on("connect", () => console.log("connecting"));
