import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

//  Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//  Socket connection
io.on("connection", (socket) => {
  console.log(" User connected:", socket.id);

  // Listen for messages
  socket.on("message", (data) => {
    console.log(" Message:", data);

    // Send to all except sender
    socket.broadcast.emit("message", data);

    // OR to everyone:
    // io.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log(" User disconnected:", socket.id);
  });
});

// ✅ Basic route
app.get("/", (req, res) => {
  res.send(" Backend is running");
});

// ✅ Start server ONLY ONCE
const PORT = 5000;
server.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});