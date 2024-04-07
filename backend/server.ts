import http from "http";
import express from 'express';
import {Socket, Server} from "socket.io";

const app = express();
const server = http.createServer(http);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

server.listen(8000, () => {
  console.log('listening on *:8000');
});

io.on('connection', (socket: Socket) => {
  console.log(`A user connected with socket ID ${socket.id}`);
  socket.on("disconnect", () => {
    console.log("user disconnected");
  })
});


