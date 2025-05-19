import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const theme = useTheme();
  const navigate = useNavigate();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication - in real app, this would call your auth API
    if (email && password) {
      // Store mock token
      localStorage.setItem('token', 'mock-token-123');
      navigate('/dashboard');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4,
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Sign In
        </Typography>
        <Box component="form" onSubmit={handleSignIn}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 3 }}
          >
            Sign In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Auth; 