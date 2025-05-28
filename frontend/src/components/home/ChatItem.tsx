import React, { useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  ListItem,
  ListItemText,
  ListItemButton,
  Button,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { DeleteOutline } from "@mui/icons-material";
import { SOCKET_URL } from "@config";
import { Chat } from "../../types";

interface ChatItemProps {
  chat: Chat;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleChatSelect = useCallback(() => {
    navigate(`/chat/${chat.token}`, { state: { token: chat.token } });
  }, [chat, navigate]);

  const handleDelete = useCallback(
    async (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        if (
          window.confirm(
            "Would you really delete this chat? Once click yes, you cannot use this again"
          )
        ) {
          const response = await fetch(`${SOCKET_URL}/chats/${chat.token}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            await response.json();
          }
        }
      } catch (error) {
        console.log("Failed to delete chat", error);
      }
    },
    [chat]
  );

  const buttonStyles = useMemo(
    () => ({
      p: 0,
      minWidth: "auto",
      transition: "all 0.2s ease-in-out",
      "&:hover": {
        transform: "scale(1.05)",
      },
      backgroundColor: "background.paper",
      color: "text.primary",
      opacity: 0.7,
    }),
    []
  );

  return (
    <ListItem
      disablePadding
      sx={{
        mb: 1,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
        },
      }}
    >
      <ListItemButton onClick={handleChatSelect}>
        <ListItemText
          primary={
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 0.5,
              }}
            >
              <Typography component="div" variant="subtitle1">
                Chat Token: {chat.token}
              </Typography>
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
              >
                {new Date(chat.timestamp).toLocaleString()}
                <Button variant="text" sx={buttonStyles} onClick={handleDelete}>
                  <DeleteOutline fontSize="medium" />
                </Button>
              </Typography>
            </Box>
          }
          secondary={
            <Typography
              component="span"
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {chat.lastMessage}
            </Typography>
          }
        />
      </ListItemButton>
    </ListItem>
  );
};

export default ChatItem;
