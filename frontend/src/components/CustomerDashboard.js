import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert } from '@mui/material';

function CustomerDashboard() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('CustomerDashboard useEffect triggered');

    // Mock data for testing
    if (process.env.REACT_APP_MOCK_DATA === 'true') {
      setMessage('Mock Customer Dashboard loaded');
      setLoading(false);
      return;
    }

    // Placeholder for API calls
    setTimeout(() => {
      setMessage('Customer Dashboard loaded');
      setLoading(false);
    }, 1000);
  }, []);

  console.log('Rendering CustomerDashboard');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Customer Dashboard</Typography>
      {loading && <Typography>Loading...</Typography>}
      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert severity="info">{message}</Alert>}
      <Typography variant="body1">Welcome to the Customer Dashboard!</Typography>
    </Box>
  );
}

export default CustomerDashboard;
