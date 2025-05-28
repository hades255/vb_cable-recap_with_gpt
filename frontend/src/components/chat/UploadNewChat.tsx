import React, { useCallback, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { SOCKET_URL } from "@config";

interface UploadNewChatProps {
  open: boolean;
  chatToken: String;
  onClose: () => void;
}

const UploadNewChat: React.FC<UploadNewChatProps> = ({
  open,
  chatToken,
  onClose,
}) => {
  const [uploadPrompt, setUploadPrompt] = useState("");
  const [uploadResponse, setUploadResponse] = useState("");

  const handleUploadSubmit = useCallback(async () => {
    if (!chatToken || !uploadPrompt.trim() || !uploadResponse.trim()) return;

    try {
      const response = await fetch(`${SOCKET_URL}/upload-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: chatToken,
          prompt: uploadPrompt,
          response: uploadResponse,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        await response.json();
        setUploadPrompt("");
        setUploadResponse("");
        onClose();
      }
    } catch (error) {
      console.error("Error uploading chat:", error);
    }
  }, [onClose, chatToken, uploadPrompt, uploadResponse]);

  const handleUploadPromptChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUploadPrompt(e.target.value);
    },
    []
  );

  const handleUploadResponseChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUploadResponse(e.target.value);
    },
    []
  );

  const handleCloseUploadDialog = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleCloseUploadDialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Upload Chat</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Prompt"
          multiline
          rows={4}
          value={uploadPrompt}
          onChange={handleUploadPromptChange}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Response"
          multiline
          rows={4}
          value={uploadResponse}
          onChange={handleUploadResponseChange}
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseUploadDialog}>Cancel</Button>
        <Button
          onClick={handleUploadSubmit}
          variant="contained"
          disabled={!uploadPrompt.trim() || !uploadResponse.trim()}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadNewChat;
