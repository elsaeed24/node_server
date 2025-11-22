const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Redis = require("ioredis");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const redis = new Redis(); // Redis on localhost:6379

// Subscribe to all channels
redis.psubscribe("*", (err, count) => {
    console.log("Subscribed to all Redis channels");
});

redis.on("pmessage", (pattern, channel, message) => {
    try {
        const data = JSON.parse(message);

        // Laravel sends nested message: data.data.message
        let eventName = "new-message";
        let payload = {};

        if (data.data && data.event) {
            eventName = data.event;
            payload = data.data;
        } else if (data.event) {
            eventName = data.event;
            payload = data;
        } else {
            payload = data;
        }

        io.emit(eventName, payload);
        console.log(`Event "${eventName}" emitted to clients:`, payload);
    } catch (e) {
        console.log("JSON parse error:", e, message);
    }
});

io.on("connection", (socket) => {
    console.log("Client Connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Client Disconnected:", socket.id);
    });
});

server.listen(3000, () => {
    console.log("WebSocket Server running on port 3000");
});
