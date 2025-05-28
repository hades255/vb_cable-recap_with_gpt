import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@config";
import { Message, ChatResponse, chatPrompt, Chat } from "../types";

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
  const [availableChats, setAvailableChats] = useState<Chat[]>([]);

  // Socket event handlers
  const handleConnect = useCallback(() => {
    console.log("Connected to server");
  }, []);

  const handleChatHistory = useCallback((history: Message[]) => {
    setMessages(history);
  }, []);

  const handleChatResponse = useCallback((data: ChatResponse) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: data.message,
        timestamp: data.timestamp,
      },
    ]);
  }, []);

  const handleChatPrompt = useCallback((data: chatPrompt) => {
    setMessages((prev) => [...prev, data.message]);
  }, []);

  const handleChatContentDeleted = useCallback((data: any) => {
    console.log(data);
  }, []);

  const handleChatDeleted = useCallback((data: any) => {
    console.log(data);
  }, []);

  const handleError = useCallback((error: { message: string }) => {
    console.error("Socket error:", error);
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on("connect", handleConnect);
    newSocket.on("chatHistory", handleChatHistory);
    newSocket.on("chatResponse", handleChatResponse);
    newSocket.on("chatPrompt", handleChatPrompt);
    newSocket.on("chatContentDeleted", handleChatContentDeleted);
    newSocket.on("chatDeleted", handleChatDeleted);
    newSocket.on("error", handleError);

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("chatHistory", handleChatHistory);
      newSocket.off("chatResponse", handleChatResponse);
      newSocket.off("chatPrompt", handleChatPrompt);
      newSocket.off("chatContentDeleted", handleChatContentDeleted);
      newSocket.off("chatDeleted", handleChatDeleted);
      newSocket.off("error", handleError);
      newSocket.close();
    };
  }, [
    handleConnect,
    handleChatHistory,
    handleChatResponse,
    handleChatPrompt,
    handleError,
    handleChatContentDeleted,
    handleChatDeleted,
  ]);

  const loadAvailableChats = useCallback(async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/chats`);
      const chats = await response.json();
      setAvailableChats(chats);
    } catch (error) {
      console.error("Error loading chats:", error);
    }
  }, []);

  const sendMessage = useCallback(
    (token: string, message: string) => {
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
    },
    [socket]
  );

  const connectWithToken = useCallback(
    (token: string) => {
      if (socket) {
        socket.emit("setToken", token);
        setIsConnected(true);
      }
    },
    [socket]
  );

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      messages,
      availableChats,
      loadAvailableChats,
      sendMessage,
      connectWithToken,
    }),
    [
      socket,
      isConnected,
      messages,
      availableChats,
      loadAvailableChats,
      sendMessage,
      connectWithToken,
    ]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
