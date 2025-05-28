import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  List,
  AppBar,
  Toolbar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@contexts/SocketContext";
import ChatItem from "@home/ChatItem";

interface DashboardProps {
  ThemeToggle: React.FC;
}

const Dashboard: React.FC<DashboardProps> = ({ ThemeToggle }) => {
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
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Recap
          </Typography>
          <ThemeToggle />
          <Button color="inherit" variant="outlined" onClick={handleNewChat}>
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
                Recent
              </Typography>
              <List>
                {availableChats.map((chat) => (
                  <ChatItem key={chat.token} chat={chat} />
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
