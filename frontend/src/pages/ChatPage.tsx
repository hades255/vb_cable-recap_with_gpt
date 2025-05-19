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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Theme } from "@mui/material/styles";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import ChatContent from "@home/ChatContent";
import TokenInput from "@home/TokenInput";
import { useSocket } from "@contexts/SocketContext";
import { SOCKET_URL } from "@config";

interface ChatPageProps {
  theme: Theme;
  ThemeToggle: React.FC;
}

const ChatPage: React.FC<ChatPageProps> = ({ theme, ThemeToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const chatToken = location.state?.token;
  const { isConnected, messages, sendMessage, connectWithToken, availableChats, loadAvailableChats } = useSocket();
  const [inputMessage, setInputMessage] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [showChatSelector, setShowChatSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadPrompt, setUploadPrompt] = useState("");
  const [uploadResponse, setUploadResponse] = useState("");

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

  const handleDownloadHistory = () => {
    const chatData = {
      token: chatToken,
      messages: messages,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${chatToken}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSelectChat = (token: string) => {
    navigate(`/chat/${token}`, { state: { token } });
    setShowChatSelector(false);
  };

  const handleUploadSubmit = async () => {
    if (!chatToken || !uploadPrompt.trim() || !uploadResponse.trim()) return;

    try {
      const response = await fetch(`${SOCKET_URL}/upload-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: chatToken,
          prompt: uploadPrompt,
          response: uploadResponse,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowUploadDialog(false);
        setUploadPrompt("");
        setUploadResponse("");
      }
    } catch (error) {
      console.error("Error uploading chat:", error);
    }
  };

  if (!isConnected) {
    return (
      <TokenInput
        token={chatToken || ""}
        setToken={() => {}}
        handleConnect={() => chatToken && connectWithToken(chatToken)}
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
            <Tooltip title="Upload Chat">
              <IconButton
                color="primary"
                onClick={() => setShowUploadDialog(true)}
              >
                <UploadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download Chat History">
              <IconButton
                color="primary"
                onClick={handleDownloadHistory}
                sx={{ mr: 1 }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
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
            sx={{ position: "absolute", bottom: 24, right: 24, minWidth: 0 }}
          >
            <SendIcon />
          </Button>
        </Box>

        {/* Upload Dialog */}
        <Dialog
          open={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Upload Chat</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <TextField
                label="Prompt"
                multiline
                rows={4}
                value={uploadPrompt}
                onChange={(e) => setUploadPrompt(e.target.value)}
                fullWidth
              />
              <TextField
                label="Response"
                multiline
                rows={4}
                value={uploadResponse}
                onChange={(e) => setUploadResponse(e.target.value)}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowUploadDialog(false)}>Cancel</Button>
            <Button
              onClick={handleUploadSubmit}
              variant="contained"
              disabled={!uploadPrompt.trim() || !uploadResponse.trim()}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default ChatPage;
