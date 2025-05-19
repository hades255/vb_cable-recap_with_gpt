import React, { useState, useEffect, useRef, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Container,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { Message, ChatResponse, chatPrompt } from "./types";
import { lightTheme, darkTheme } from "./theme";
import ChatContent from "./components/home/ChatContent";
import { SOCKET_URL } from "./config";
import TokenInput from "./components/home/TokenInput";

function App() {
  const [token, setToken] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showChatSelector, setShowChatSelector] = useState<boolean>(false);
  const [availableChats, setAvailableChats] = useState<
    Array<{ token: string; lastMessage: string; timestamp: string }>
  >([]);
  const [mode, setMode] = useState<"light" | "dark">("light");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  // Initialize theme based on system preference
  useEffect(() => {
    setMode(prefersDarkMode ? "dark" : "light");
  }, [prefersDarkMode]);

  const theme = useMemo(
    () => createTheme(mode === "light" ? lightTheme : darkTheme),
    [mode]
  );

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server");
    });

    newSocket.on("chatHistory", (history: Message[]) => {
      setMessages(history);
    });

    newSocket.on("chatResponse", (data: ChatResponse) => {
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
      setMessages((prev) => [...prev, data.message]);
    });

    newSocket.on("error", (error: { message: string }) => {
      console.error("Socket error:", error);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadAvailableChats = async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/chats`);
      const chats = await response.json();
      setAvailableChats(chats);
    } catch (error) {
      console.error("Error loading chats:", error);
    }
  };

  const handleConnect = () => {
    if (token && socket) {
      socket.emit("setToken", token);
      setIsConnected(true);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && socket && token) {
      socket.emit("chatMessage", { token, message: inputMessage });
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: inputMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
      setInputMessage("");
    }
  };

  const handleSelectChat = async (selectedToken: string) => {
    setToken(selectedToken);
    setShowChatSelector(false);
    if (socket) {
      socket.emit("setToken", selectedToken);
      setIsConnected(true);
    }
  };

  const ThemeToggle = () => (
    <IconButton onClick={toggleColorMode} color="inherit">
      {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
    </IconButton>
  );

  if (!isConnected) {
    return (
      <TokenInput
        token={token}
        setToken={setToken}
        handleConnect={handleConnect}
        loadAvailableChats={loadAvailableChats}
        showChatSelector={showChatSelector}
        setShowChatSelector={setShowChatSelector}
        availableChats={availableChats}
        handleSelectChat={handleSelectChat}
        theme={theme}
        ThemeToggle={ThemeToggle}
      />
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container
        maxWidth="md"
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          py: 2,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              p: 2,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Chat Token: {token}</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <ThemeToggle />
              <Button
                variant="outlined"
                onClick={() => {
                  setIsConnected(false);
                  setMessages([]);
                }}
              >
                New Chat
              </Button>
            </Box>
          </Box>
          <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
            {messages.map((message, index) => (
              <ChatContent key={index} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </Box>
          <Box
            component="form"
            onSubmit={handleSendMessage}
            sx={{ p: 2, borderTop: 1, borderColor: "divider" }}
          >
            <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
              <TextField
                fullWidth
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                variant="outlined"
                size="small"
                multiline
                minRows={2}
                maxRows={6}
                sx={{
                  "& .MuiInputBase-root": {
                    backgroundColor: "background.paper",
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!inputMessage.trim()}
                sx={{ alignSelf: "flex-end" }}
              >
                Send
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;
