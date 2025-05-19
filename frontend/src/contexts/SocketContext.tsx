import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../config";
import { Message, ChatResponse, chatPrompt } from "../types";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  messages: Message[];
  availableChats: Array<{
    token: string;
    lastMessage: string;
    timestamp: string;
  }>;
  loadAvailableChats: () => Promise<void>;
  sendMessage: (token: string, message: string) => void;
  connectWithToken: (token: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [availableChats, setAvailableChats] = useState<
    Array<{ token: string; lastMessage: string; timestamp: string }>
  >([]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server");
    });

    newSocket.on("chatHistory", (history: Message[]) => {
      console.log("a");
      setMessages(history);
    });

    newSocket.on("chatResponse", (data: ChatResponse) => {
      console.log("b");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          timestamp: data.timestamp,
        },
      ]);
    });

    newSocket.on("chatPrompt", (data: chatPrompt) => {
      console.log("c");
      setMessages((prev) => [...prev, data.message]);
    });

    newSocket.on("error", (error: { message: string }) => {
      console.error("Socket error:", error);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const loadAvailableChats = useCallback(async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/chats`);
      const chats = await response.json();
      setAvailableChats(chats);
    } catch (error) {
      console.error("Error loading chats:", error);
    }
  }, []);

  const sendMessage = (token: string, message: string) => {
    console.log("d");
    if (socket && message.trim()) {
      socket.emit("chatMessage", { token, message });
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: message,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const connectWithToken = (token: string) => {
    if (socket) {
      socket.emit("setToken", token);
      setIsConnected(true);
    }
  };

  const value = {
    socket,
    isConnected,
    messages,
    availableChats,
    loadAvailableChats,
    sendMessage,
    connectWithToken,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
