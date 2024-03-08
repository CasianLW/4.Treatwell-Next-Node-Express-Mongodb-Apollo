import { useEffect, useState, useRef } from "react";

const useWebSocket = (url: string) => {
  const [messages, setMessages] = useState<string[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log("Connected to WebSocket");
    };

    ws.current.onmessage = (event: MessageEvent) => {
      console.log("Message from server:", event.data);
      setMessages((prevMessages) => [...prevMessages, event.data]);
    };

    ws.current.onerror = (error: Event) => {
      console.error("WebSocket error:", error);
    };

    ws.current.onclose = () => {
      console.log("Disconnected from WebSocket");
    };

    // Clean up function to close the WebSocket connection when the component unmounts
    return () => {
      ws.current?.close();
    };
  }, [url]); // The hook will re-run if the URL changes

  return messages;
};

export default useWebSocket;
