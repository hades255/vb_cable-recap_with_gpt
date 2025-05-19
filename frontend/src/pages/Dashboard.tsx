import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  AppBar,
  Toolbar,
  Button,
  useTheme,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { availableChats, loadAvailableChats } = useSocket();
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newToken, setNewToken] = useState("");
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      loadAvailableChats();
      isFirstLoad.current = false;
    }
  }, [loadAvailableChats]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  const handleChatSelect = (token: string) => {
    navigate(`/chat/${token}`, { state: { token } });
  };

  const handleNewChat = () => {
    setShowNewChatDialog(true);
  };

  const handleCreateNewChat = () => {
    if (newToken.trim()) {
      setShowNewChatDialog(false);
      setNewToken("");
      navigate(`/chat/${newToken}`, { state: { token: newToken } });
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Interview Recap Dashboard
          </Typography>
          <Button
            color="inherit"
            variant="outlined"
            onClick={handleNewChat}
            sx={{ mr: 2 }}
          >
            New Chat
          </Button>
          <Button color="inherit" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h5" component="div" gutterBottom>
                Recent Interviews
              </Typography>
              <List>
                {availableChats.map((chat) => (
                  <ListItem
                    key={chat.token}
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
                    <ListItemButton
                      onClick={() => handleChatSelect(chat.token)}
                    >
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
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* New Chat Dialog */}
      <Dialog
        open={showNewChatDialog}
        onClose={() => setShowNewChatDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Start New Chat</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Enter Token"
            type="text"
            fullWidth
            value={newToken}
            onChange={(e) => setNewToken(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewChatDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateNewChat}
            variant="contained"
            disabled={!newToken.trim()}
          >
            Start Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
