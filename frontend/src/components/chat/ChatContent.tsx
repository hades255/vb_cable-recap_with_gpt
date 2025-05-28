import React, { useState, useCallback, useMemo } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Message } from "../../types";
import { DeleteOutline } from "@mui/icons-material";
import { SOCKET_URL } from "@config";

interface ChatContentProps {
  token: String;
  message: Message;
  deleted: boolean;
  onDelete: (param: string) => void;
}

const ChatContent: React.FC<ChatContentProps> = ({
  token,
  message,
  deleted,
  onDelete,
}) => {
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

  const handleDelete = useCallback(async () => {
    try {
      if (
        window.confirm(
          "Would you really delete this content? Once click yes, you cannot use this again"
        )
      ) {
        const response = await fetch(`${SOCKET_URL}/chats/${token}/content`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: message.timestamp,
          }),
        });

        if (response.ok) {
          await response.json();
          onDelete(message.timestamp);
        }
      }
    } catch (error) {
      console.log("Failed to delete content", error);
    }
  }, [onDelete, token, message]);

  const messageStyles = useMemo(
    () => ({
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
      textDecorationLine: deleted ? "line-through" : "none",
    }),
    [isUser, show, deleted]
  );

  const buttonStyles = useMemo(
    () => ({
      p: 0,
      minWidth: "auto",
      transition: "all 0.2s ease-in-out",
      "&:hover": {
        transform: "scale(1.05)",
      },
      backgroundColor: isUser ? "primary.main" : "background.paper",
      color: isUser ? "primary.contrastText" : "text.primary",
      opacity: 0.7,
    }),
    [isUser]
  );

  const copyButtonStyles = useMemo(
    () => ({
      ...buttonStyles,
      color: copied ? "#e44" : isUser ? "primary.contrastText" : "text.primary",
    }),
    [buttonStyles, copied, isUser]
  );

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
          pb: 1,
          maxWidth: isUser ? "70%" : "100%",
          backgroundColor: isUser ? "primary.main" : "background.paper",
          color: isUser ? "primary.contrastText" : "text.primary",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        <Typography sx={messageStyles}>{message.content}</Typography>
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
              <Button variant="text" sx={buttonStyles} onClick={handleShow}>
                {show ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </Button>
            )}
            <Button variant="text" sx={copyButtonStyles} onClick={handleCopy}>
              <ContentCopyIcon fontSize="small" />
            </Button>
            <Button variant="text" sx={buttonStyles} onClick={handleDelete}>
              <DeleteOutline fontSize="medium" />
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatContent;
