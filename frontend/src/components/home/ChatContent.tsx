import React, { useState } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Message } from "../../types";

interface ChatContentProps {
  message: Message;
}

const ChatContent: React.FC<ChatContentProps> = ({ message }) => {
  const [show, setShow] = useState<Boolean>(false);
  const [copied, setCopied] = useState<Boolean>(false);

  const isUser = message.role === "user";

  const handleShow = () => {
    setShow(!show);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        mb: 2,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: isUser ? "70%" : "100%",
          backgroundColor: isUser ? "primary.main" : "background.paper",
          color: isUser ? "primary.contrastText" : "text.primary",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        <Typography
          sx={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: isUser && !show ? 2 : "unset",
            WebkitBoxOrient: "vertical",
            lineHeight: 1.5,
            transition: "all 0.3s ease-in-out",
            transform: isUser && !show ? "scale(0.99)" : "scale(1)",
            opacity: isUser && !show ? 0.9 : 1,
          }}
        >
          {message.content}
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 1,
            alignItems: "center",
          }}
        >
          <Typography variant="caption" sx={{ display: "block" }}>
            {message.timestamp && (
              <>{new Date(message.timestamp).toLocaleTimeString()}</>
            )}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {isUser && (
              <Button
                variant="text"
                sx={{
                  p: 0,
                  minWidth: "auto",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                  backgroundColor: isUser ? "primary.main" : "background.paper",
                  color: isUser ? "primary.contrastText" : "text.primary",
                  opacity: 0.7,
                }}
                onClick={handleShow}
              >
                {show ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </Button>
            )}
            <Button
              variant="text"
              sx={{
                p: 0,
                minWidth: "auto",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "scale(1.05)",
                },
                backgroundColor: isUser ? "primary.main" : "background.paper",
                color: copied
                  ? "#e44"
                  : isUser
                  ? "primary.contrastText"
                  : "text.primary",
                opacity: 0.7,
              }}
              onClick={handleCopy}
            >
              <ContentCopyIcon fontSize="small" />
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatContent;
