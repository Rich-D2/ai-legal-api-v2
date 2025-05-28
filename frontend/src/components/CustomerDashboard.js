import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Box, Card, CardContent, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import { UploadFile, AddTask } from '@mui/icons-material';

function CustomerDashboard() {
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedDocument, setSelectedDocument] = useState('');
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    jwtDecode(token);

    axios.get('/api/documents', { headers: { Authorization: `Bearer ${token}` } })
      .then(response => setDocuments(response.data.documents))
      .catch(error => setMessage('Error fetching documents'));

    axios.get('/api/tasks', { headers: { Authorization: `Bearer ${token}` } })
      .then(response => setTasks(response.data.tasks))
      .catch(error => setMessage('Error fetching tasks'));
  }, [navigate]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) {
      setMessage('Please select a file');
      return;
    }
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    axios.post('/api/documents', formData, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => {
        setMessage(response.data.message);
        setDocuments([...documents, response.data.filename]);
        setFile(null);
      })
      .catch(error => setMessage('Error uploading document'));
  };

  const handleTaskSubmit = () => {
    if (!selectedDocument || !taskDescription) {
      setMessage('Please select a document and enter a description');
      return;
    }
    const token = localStorage.getItem('token');
    axios.post('/api/tasks', { document: selectedDocument, description: taskDescription }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        setMessage(response.data.message);
        setTasks([...tasks, response.data.task]);
        setTaskDescription('');
        setSelectedDocument('');
        setOpenDialog(false);
      })
      .catch(error => setMessage('Error submitting task'));
  };

  const handleAIProcess = (doc) => {
    const token = localStorage.getItem('token');
    axios.post('/api/ai/process', { document: doc }, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => setMessage(response.data.message))
      .catch(error => setMessage('Error processing with AI'));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Customer Dashboard</Typography>
      {message && <Alert severity="info">{message}</Alert>}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6">Upload Document</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <TextField type="file" onChange={handleFileChange} />
            <Button variant="contained" startIcon={<UploadFile />} onClick={handleUpload} sx={{ ml: 2 }}>
              Upload
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6">Submit Task</Typography>
          <Button variant="outlined" startIcon={<AddTask />} onClick={() => setOpenDialog(true)} sx={{ mt: 2 }}>
            Create Task
          </Button>
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
            <DialogTitle>Create Task</DialogTitle>
            <DialogContent>
              <TextField
                select
                label="Select Document"
                value={selectedDocument}
                onChange={(e) => setSelectedDocument(e.target.value)}
                fullWidth
                sx={{ mb: 2, mt: 1 }}
                SelectProps={{ native: true }}
              >
                <option value="">Select a document</option>
                {documents.map(doc => (
                  <option key={doc} value={doc}>{doc}</option>
                ))}
              </TextField>
              <TextField
                label="Task Description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                fullWidth
                placeholder="Task description"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Close</Button>
              <Button onClick={handleTaskSubmit} variant="contained">Submit Task</Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6">My Documents</Typography>
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
                      <Button variant="text" onClick={() => handleAIProcess(doc)}>
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
      <Card>
        <CardContent>
          <Typography variant="h6">My Tasks</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map(task => (
                  <TableRow key={task.id}>
                    <TableCell>{task.document}</TableCell>
                    <TableCell>{task.description}</TableCell>
                    <TableCell>{task.status}</TableCell>
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

export default CustomerDashboard;
