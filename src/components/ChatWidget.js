import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, TextField, Button, List, ListItem, ListItemText, Typography, Divider } from '@mui/material';
import { Send } from '@mui/icons-material';

function ChatWidget({ caseId }) {
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (caseId) {
      const token = localStorage.getItem('token');
      axios.get(`/api/ai/chats?case_id=${caseId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(response => setChats(response.data.chats))
        .catch(() => setError('Error fetching chats'));
    }
  }, [caseId]);

  const handleSend = () => {
    if (!message.trim() || !caseId) {
      setError('Message and case selection required');
      return;
    }
    const token = localStorage.getItem('token');
    axios.post('/api/ai/chat', { message, case_id: caseId }, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => {
        setChats([...chats, response.data.chat]);
        setMessage('');
        setError('');
      })
      .catch(() => setError('Error sending message'));
  };

  return (
    <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 2, maxHeight: 300, overflowY: 'auto' }}>
      <Typography variant="h6">AI Chat</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <List sx={{ mb: 2 }}>
        {chats.map(chat => (
          <React.Fragment key={chat.id}>
            <ListItem>
              <ListItemText primary={`You: ${chat.message}`} secondary={new Date(chat.timestamp).toLocaleString()} />
            </ListItem>
            <ListItem>
              <ListItemText primary={`AI: ${chat.response}`} />
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask AI..."
          size="small"
        />
        <Button variant="contained" onClick={handleSend} sx={{ ml: 1 }} startIcon={<Send />}>
          Send
        </Button>
      </Box>
    </Box>
  );
}

export default ChatWidget;
