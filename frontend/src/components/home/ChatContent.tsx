import React, { useState, useCallback, useMemo } from "react";
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

  const isUser = useMemo(() => message.role === "user", [message.role]);

  const handleShow = useCallback(() => {
    setShow((prev) => !prev);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  }, [message.content]);

  const messageStyles = useMemo(() => ({
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
  }), [isUser, show]);

  const buttonStyles = useMemo(() => ({
    p: 0,
    minWidth: "auto",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      transform: "scale(1.05)",
    },
    backgroundColor: isUser ? "primary.main" : "background.paper",
    color: isUser ? "primary.contrastText" : "text.primary",
    opacity: 0.7,
  }), [isUser]);

  const copyButtonStyles = useMemo(() => ({
    ...buttonStyles,
    color: copied ? "#e44" : isUser ? "primary.contrastText" : "text.primary",
  }), [buttonStyles, copied, isUser]);

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
        <Typography sx={messageStyles}>
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
                sx={buttonStyles}
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
              sx={copyButtonStyles}
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
