import React, { useState, useEffect, Component } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Box, Card, CardContent, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Grid, MenuItem } from '@mui/material';
import { BarChart } from '@mui/x-charts';
import { UploadFile, AddTask, Add } from '@mui/icons-material';
import ChatWidget from './ChatWidget';

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: '' };

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error">
          Something went wrong: {this.state.error}. Please try again or contact support.
        </Alert>
      );
    }
    return this.props.children;
  }
}

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
    console.log('CustomerDashboard useEffect triggered');
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found, redirecting to login');
      navigate('/login');
      return;
    }
    try {
      jwtDecode(token);
      console.log('Token decoded successfully');
    } catch (e) {
      console.error('Invalid token:', e);
      setError('Invalid token. Please log in again.');
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('Fetching cases');
        const casesResponse = await axios.get('/api/cases', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Cases response:', casesResponse.data);
        setCases(casesResponse.data.cases || []);

        if (selectedCase) {
          console.log(`Fetching documents and tasks for case: ${selectedCase}`);
          const [documentsResponse, tasksResponse] = await Promise.all([
            axios.get(`/api/documents?case_id=${selectedCase}`, {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(e => ({ data: { documents: [] } })), // Fallback to empty array
            axios.get(`/api/tasks?case_id=${selectedCase}`, {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(e => ({ data: { tasks: [] } })) // Fallback to empty array
          ]);
          console.log('Documents response:', documentsResponse.data);
          console.log('Tasks response:', tasksResponse.data);
          setDocuments(documentsResponse.data.documents || []);
          setTasks(tasksResponse.data.tasks || []);
        } else {
          setDocuments([]);
          setTasks([]);
        }
        setError('');
      } catch (error) {
        console.error('Fetch error:', error.response || error);
        setError(`Failed to load data: ${error.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, selectedCase]);

  const handleFileChange = (e) => {
    console.log('File selected:', e.target.files[0]?.name);
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file || !selectedCase) {
      console.warn('Missing file or case selection');
      setMessage('Please select a file and case');
      return;
    }
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('case_id', selectedCase);
    console.log('Uploading document for case:', selectedCase);
    axios.post('/api/documents', formData, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => {
        console.log('Upload success:', response.data);
        setMessage(response.data.message);
        setDocuments([...documents, response.data.filename]);
        setFile(null);
      })
      .catch(error => {
        console.error('Upload error:', error.response || error);
        setMessage('Error uploading document');
      });
  };

  const handleTaskSubmit = () => {
    if (!selectedDocument || !taskDescription || !selectedCase) {
      console.warn('Missing task data or case selection');
      setMessage('Please select a document, enter a description, and select a case');
      return;
    }
    const token = localStorage.getItem('token');
    console.log('Submitting task for case:', selectedCase);
    axios.post('/api/tasks', { document: selectedDocument, description: taskDescription, case_id: selectedCase }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        console.log('Task submit success:', response.data);
        setMessage(response.data.message);
        setTasks([...tasks, response.data.task]);
        setTaskDescription('');
        setSelectedDocument('');
        setOpenTaskDialog(false);
      })
      .catch(error => {
        console.error('Task submit error:', error.response || error);
        setMessage('Error submitting task');
      });
  };

  const handleAIProcess = (doc) => {
    const token = localStorage.getItem('token');
    console.log('Processing AI for document:', doc);
    axios.post('/api/ai/process', { document: doc }, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => {
        console.log('AI process success:', response.data);
        setMessage(response.data.message);
      })
      .catch(error => {
        console.error('AI process error:', error.response || error);
        setMessage('Error processing with AI');
      });
  };

  const handleCreateCase = () => {
    if (!caseTitle) {
      console.warn('Missing case title');
      setMessage('Please enter a case title');
      return;
    }
    const token = localStorage.getItem('token');
    console.log('Creating case with title:', caseTitle);
    axios.post('/api/cases', { title: caseTitle }, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => {
        console.log('Case create success:', response.data);
        setMessage(response.data.message);
        setCases([...cases, response.data.case]);
        setCaseTitle('');
        setOpenCaseDialog(false);
      })
      .catch(error => {
        console.error('Case create error:', error.response || error);
        setMessage('Error creating case');
      });
  };

  const filteredDocuments = documents.filter(doc => doc.toLowerCase().includes(searchQuery.toLowerCase()));
  const taskStatusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  console.log('Rendering CustomerDashboard', { cases, documents, tasks, selectedCase });

  return (
    <ErrorBoundary>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Customer Dashboard</Typography>
        {message && <Alert severity="info">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {loading && <Typography>Loading...</Typography>}
        {!loading && (
          <>
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
                    onChange={(e) => {
                      console.log('Selected case:', e.target.value);
                      setSelectedCase(e.target.value);
                    }}
                    sx={{ minWidth: 200, mr: 2 }}
                  >
                    <MenuItem value="">Select a case</MenuItem>
                    {cases.length === 0 ? (
                      <MenuItem disabled>No cases available. Create one below.</MenuItem>
                    ) : (
                      cases.map(caseItem => (
                        <MenuItem key={caseItem.id} value={caseItem.id}>{caseItem.title}</MenuItem>
                      ))
                    )}
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
              <Typography>Please select a case to view documents and tasks. Create a new case above to get started.</Typography>
            )}
          </>
        )}
      </Box>
    </ErrorBoundary>
  );
}

export default CustomerDashboard;
