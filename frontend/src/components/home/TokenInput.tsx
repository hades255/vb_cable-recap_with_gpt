import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Theme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface TokenInputProps {
  token: string;
  setToken: (token: string) => void;
  handleConnect: () => void;
  showChatSelector: boolean;
  setShowChatSelector: (show: boolean) => void;
  availableChats: Array<{
    token: string;
    lastMessage: string;
    timestamp: string;
  }>;
  handleSelectChat: (token: string) => void;
  loadAvailableChats: () => Promise<void>;
  ThemeToggle: React.FC;
}

const TokenInput: React.FC<TokenInputProps> = ({
  token,
  setToken,
  handleConnect,
  showChatSelector,
  setShowChatSelector,
  availableChats,
  handleSelectChat,
  loadAvailableChats,
  ThemeToggle,
}) => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h5">Enter Token to Start</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <ThemeToggle />{" "}
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
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleConnect();
          }}
        >
          <TextField
            fullWidth
            label="Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            margin="normal"
          />
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleConnect}
            sx={{ mt: 2 }}
          >
            Continue
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              loadAvailableChats();
              setShowChatSelector(true);
            }}
            sx={{ mt: 1 }}
          >
            Load Another Chat
          </Button>
        </Box>
      </Paper>

      <Dialog
        open={showChatSelector}
        onClose={() => setShowChatSelector(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: "60vh",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle>Select Previous Chat</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <List
            sx={{
              maxHeight: "50vh",
              overflowY: "auto",
              p: 2,
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: "4px",
              },
            }}
          >
            {availableChats.map((chat) => (
              <ListItem
                key={chat.token}
                onClick={() => handleSelectChat(chat.token)}
                sx={{
                  cursor: "pointer",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  mb: 1,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {chat.token}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {new Date(chat.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
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
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions
          sx={{ p: 2, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}
        >
          <Button onClick={() => setShowChatSelector(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TokenInput;
