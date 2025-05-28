import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Alert, Grid, TextField } from '@mui/material';
import { BarChart, AutoFixHigh } from '@mui/icons-material';

function LawyerDashboard() {
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredDocuments = documents.filter(doc => doc.toLowerCase().includes(searchQuery.toLowerCase()));
  const documentCount = documents.length;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Lawyer Dashboard</Typography>
      {message && <Alert severity="info">{message}</Alert>}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Documents</Typography>
              <Typography variant="h4">{documentCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">AI Processed</Typography>
              <Typography variant="h4">0</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6">Document Overview</Typography>
          <BarChart
            xAxis={[{ scaleType: 'band', data: ['Documents'] }]}
            series={[{ data: [documentCount] }]}
            width={500}
            height={300}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6">Documents</Typography>
          <TextField
            label="Search Documents"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDocuments.map(doc => (
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
