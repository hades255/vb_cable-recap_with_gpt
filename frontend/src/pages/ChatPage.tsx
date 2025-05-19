import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Container,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Theme } from "@mui/material/styles";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import ChatContent from "../components/home/ChatContent";
import TokenInput from "../components/home/TokenInput";
import { useSocket } from "../contexts/SocketContext";

interface ChatPageProps {
  theme: Theme;
  ThemeToggle: React.FC;
}

const ChatPage: React.FC<ChatPageProps> = ({ theme, ThemeToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const chatToken = location.state?.token;
  const { isConnected, messages, sendMessage, connectWithToken } = useSocket();
  const [inputMessage, setInputMessage] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      if (chatToken) {
        connectWithToken(chatToken);
      }
      isFirstLoad.current = false;
    }
  }, [chatToken, connectWithToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCopyToken = async () => {
    if (chatToken) {
      try {
        await navigator.clipboard.writeText(chatToken);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error("Failed to copy token:", err);
      }
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && chatToken) {
      sendMessage(chatToken, inputMessage);
      setInputMessage("");
    }
  };

  if (!isConnected) {
    return (
      <TokenInput
        token={chatToken || ""}
        setToken={() => {}}
        handleConnect={() => chatToken && connectWithToken(chatToken)}
        showChatSelector={false}
        setShowChatSelector={() => {}}
        availableChats={[]}
        handleSelectChat={() => {}}
        theme={theme}
        ThemeToggle={ThemeToggle}
      />
    );
  }

  return (
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" component="div">
              Chat Token:{" "}
              <Box
                component="span"
                sx={{
                  color: "primary.main",
                  fontWeight: "bold",
                  cursor: "pointer",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
                onClick={handleCopyToken}
              >
                {chatToken}
              </Box>
            </Typography>
            <Tooltip title={copySuccess ? "Copied!" : "Copy token"}>
              <IconButton
                size="small"
                onClick={handleCopyToken}
                sx={{
                  color: copySuccess ? "success.main" : "primary.main",
                  transition: "color 0.2s",
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <ThemeToggle />
            <Button
              variant="outlined"
              onClick={() => {
                navigate("/dashboard");
              }}
              startIcon={<ArrowBackIcon />}
              sx={{ minWidth: "auto", px: 2 }}
            >
              Back
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
          sx={{
            position: "relative",
            p: 2,
          }}
        >
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
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!inputMessage.trim()}
            sx={{ position: "absolute", bottom: 24, right: 48, minWidth: 0 }}
          >
            <SendIcon />
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ChatPage;
