const WebSocket = require("ws");

const ws = new WebSocket("ws://localhost:4000/graphql");

ws.on("open", function () {
  console.log("Connected to WebSocket server");
  // You can send a message to the server here if needed
});

ws.on("message", function (data) {
  console.log("Received message from server:", data);
});

ws.on("error", function (error) {
  console.error("WebSocket Error:", error);
});

ws.on("close", function () {
  console.log("Disconnected from WebSocket server");
});
