import express, { Request, Response } from "express";
import { createServer } from "http";
import path from "path";
import { Server, Socket } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

let msgCounter = 0;

type Player = {
  name: string;
  socket: Socket;
};
const Players: Map<string, Player> = new Map();

app.use(express.static(path.join(__dirname, "../public")));

app.get("/api", (req, res) => {
  res.send({ message: "Hello from Server" });
});

app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

io.on("connection", (socket) => {
  const name = socket.handshake.query.name;
  if (!name || typeof name !== "string") {
    socket.disconnect();
    return;
  }
  Players.set(socket.id, { name, socket });
  socket.emit("init", socket.id);

  socket.on("message", (msg: string) => {
    msgCounter += 1;
    io.emit("message", {
      id: msgCounter,
      sender: Players.get(socket.id)?.name,
      senderId: socket.id,
      content: msg,
    });
  });

  socket.on("disconnect", () => {
    Players.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server is up and running on Port: ", PORT);
});
