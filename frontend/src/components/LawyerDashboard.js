import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Alert } from '@mui/material';
import { AutoFixHigh } from '@mui/icons-material';

function LawyerDashboard() {
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('/api/documents')
      .then(response => setDocuments(response.data.documents))
      .catch(error => setMessage('Error fetching documents'));
  }, []);

  const handleAIProcess = (doc) => {
    axios.post('/api/ai/process', { document: doc })
      .then(response => setMessage(response.data.message))
      .catch(error => setMessage('Error processing document'));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Lawyer Dashboard</Typography>
      {message && <Alert severity="info">{message}</Alert>}
      <Card>
        <CardContent>
          <Typography variant="h6">Documents</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map(doc => (
                  <TableRow key={doc}>
                    <TableCell>{doc}</TableCell>
                    <TableCell>
                      <Button
                        variant="text"
                        startIcon={<AutoFixHigh />}
                        onClick={() => handleAIProcess(doc)}
                      >
                        Process with AI
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

export default LawyerDashboard;
