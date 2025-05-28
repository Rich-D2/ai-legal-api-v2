import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Alert } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

function ParalegalDashboard() {
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('/api/documents')
      .then(response => setDocuments(response.data.documents))
      .catch(error => setMessage('Error fetching documents'));
    axios.get('/api/tasks')
      .then(response => setTasks(response.data.tasks))
      .catch(error => setMessage('Error fetching tasks'));
  }, []);

  const handleCompleteTask = (taskId) => {
    setMessage(`Task ${taskId} marked as completed (placeholder)`);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Paralegal Dashboard</Typography>
      {message && <Alert severity="info">{message}</Alert>}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6">Customer Tasks</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map(task => (
                  <TableRow key={task.id}>
                    <TableCell>{task.document}</TableCell>
                    <TableCell>{task.description}</TableCell>
                    <TableCell>{task.status}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => handleCompleteTask(task.id)}
                      >
                        Complete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6">Documents</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map(doc => (
                  <TableRow key={doc}>
                    <TableCell>{doc}</TableCell>
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

export default ParalegalDashboard;
