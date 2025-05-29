import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert } from '@mui/material';

function ParalegalDashboard() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/paralegal', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (response.ok) {
          setMessage(data.message);
        } else {
          setError(data.error || 'Failed to load data');
        }
      } catch (err) {
        setError('Server error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Paralegal Dashboard</Typography>
      {loading && <Typography>Loading...</Typography>}
      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert severity="info">{message}</Alert>}
      <Typography variant="body1">Welcome to the Paralegal Dashboard!</Typography>
    </Box>
  );
}

export default ParalegalDashboard;
