import useWebSocket from "@/hooks/useWebSocket";
import React from "react";

const WebSocketComponent: React.FC = () => {
  const messages = useWebSocket("ws://localhost:4000/graphql");

  return (
    <div>
      <h2>WebSocket Messages</h2>
      <ul>
        {messages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
    </div>
  );
};

export default WebSocketComponent;
