import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Box, Card, CardContent, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Grid, MenuItem } from '@mui/material';
import { BarChart } from '@mui/x-charts';
import { UploadFile, AddTask, Add } from '@mui/icons-material';
import ChatWidget from './ChatWidget';

function CustomerDashboard() {
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedDocument, setSelectedDocument] = useState('');
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState('');
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openCaseDialog, setOpenCaseDialog] = useState(false);
  const [caseTitle, setCaseTitle] = useState('');
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      jwtDecode(token);
    } catch (e) {
      setError('Invalid token. Please log in again.');
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [casesResponse, documentsResponse, tasksResponse] = await Promise.all([
          axios.get('/api/cases', { headers: { Authorization: `Bearer ${token}` } }),
          selectedCase ? axios.get(`/api/documents?case_id=${selectedCase}`, { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve({ data: { documents: [] } }),
          selectedCase ? axios.get(`/api/tasks?case_id=${selectedCase}`, { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve({ data: { tasks: [] } })
        ]);
        setCases(casesResponse.data.cases || []);
        setDocuments(documentsResponse.data.documents || []);
        setTasks(tasksResponse.data.tasks || []);
        setError('');
      } catch (error) {
        console.error('Fetch error:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, selectedCase]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file || !selectedCase) {
      setMessage('Please select a file and case');
      return;
    }
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('case_id', selectedCase);
    axios.post('/api/documents', formData, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => {
        setMessage(response.data.message);
        setDocuments([...documents, response.data.filename]);
        setFile(null);
      })
      .catch(error => {
        console.error('Upload error:', error);
        setMessage('Error uploading document');
      });
  };

  const handleTaskSubmit = () => {
    if (!selectedDocument || !taskDescription || !selectedCase) {
      setMessage('Please select a document, enter a description, and select a case');
      return;
    }
    const token = localStorage.getItem('token');
    axios.post('/api/tasks', { document: selectedDocument, description: taskDescription, case_id: selectedCase }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        setMessage(response.data.message);
        setTasks([...tasks, response.data.task]);
        setTaskDescription('');
        setSelectedDocument('');
        setOpenTaskDialog(false);
      })
      .catch(error => {
        console.error('Task submit error:', error);
        setMessage('Error submitting task');
      });
  };

  const handleAIProcess = (doc) => {
    const token = localStorage.getItem('token');
    axios.post('/api/ai/process', { document: doc }, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => setMessage(response.data.message))
      .catch(error => {
        console.error('AI process error:', error);
        setMessage('Error processing with AI');
      });
  };

  const handleCreateCase = () => {
    if (!caseTitle) {
      setMessage('Please enter a case title');
      return;
    }
    const token = localStorage.getItem('token');
    axios.post('/api/cases', { title: caseTitle }, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => {
        setMessage(response.data.message);
        setCases([...cases, response.data.case]);
        setCaseTitle('');
        setOpenCaseDialog(false);
      })
      .catch(error => {
        console.error('Case create error:', error);
        setMessage('Error creating case');
      });
  };

  const filteredDocuments = documents.filter(doc => doc.toLowerCase().includes(searchQuery.toLowerCase()));
  const taskStatusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Customer Dashboard</Typography>
      {message && <Alert severity="info">{message}</Alert>}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Documents</Typography>
              <Typography variant="h4">{documents.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Pending Tasks</Typography>
              <Typography variant="h4">{taskStatusCounts.pending || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Completed Tasks</Typography>
              <Typography variant="h4">{taskStatusCounts.completed || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6">Case Management</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <TextField
              select
              label="Select Case"
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              sx={{ minWidth: 200, mr: 2 }}
            >
              <MenuItem value="">Select a case</MenuItem>
              {cases.map(caseItem => (
                <MenuItem key={caseItem.id} value={caseItem.id}>{caseItem.title}</MenuItem>
              ))}
            </TextField>
            <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCaseDialog(true)}>
              New Case
            </Button>
          </Box>
          <Dialog open={openCaseDialog} onClose={() => setOpenCaseDialog(false)}>
            <DialogTitle>Create New Case</DialogTitle>
            <DialogContent>
              <TextField
                label="Case Title"
                value={caseTitle}
                onChange={(e) => setCaseTitle(e.target.value)}
                fullWidth
                sx={{ mt: 1 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenCaseDialog(false)}>Close</Button>
              <Button onClick={handleCreateCase} variant="contained">Create</Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
      {selectedCase ? (
        <>
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
              <Button variant="outlined" startIcon={<AddTask />} onClick={() => setOpenTaskDialog(true)} sx={{ mt: 2 }}>
                Create Task
              </Button>
              <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)}>
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
                  <Button onClick={() => setOpenTaskDialog(false)}>Close</Button>
                  <Button onClick={handleTaskSubmit} variant="contained">Submit Task</Button>
                </DialogActions>
              </Dialog>
            </CardContent>
          </Card>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6">Task Status Overview</Typography>
              <BarChart
                xAxis={[{ scaleType: 'band', data: Object.keys(taskStatusCounts) }]}
                series={[{ data: Object.values(taskStatusCounts) }]}
                width={500}
                height={300}
              />
            </CardContent>
          </Card>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6">My Documents</Typography>
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
          <Card sx={{ mb: 4 }}>
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
          <ChatWidget caseId={selectedCase} />
        </>
      ) : (
        <Typography>Please select a case to view documents and tasks.</Typography>
      )}
    </Box>
  );
}

export default CustomerDashboard;
