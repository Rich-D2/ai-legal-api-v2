import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, Grid, TextField } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';

function AdminDashboard() {
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    axios.get('/api/documents')
      .then(response => setDocuments(response.data.documents))
      .catch(error => setMessage('Error fetching documents'));
    axios.get('/api/tasks')
      .then(response => setTasks(response.data.tasks))
      .catch(error => setMessage('Error fetching tasks'));
  }, []);

  const filteredTasks = tasks.filter(task => task.description.toLowerCase().includes(searchQuery.toLowerCase()));
  const taskStatusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
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
              <Typography variant="h6">Total Tasks</Typography>
              <Typography variant="h4">{tasks.length}</Typography>
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
      </Grid>
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
      <Card>
        <CardContent>
          <Typography variant="h6">Tasks</Typography>
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
                {filteredTasks.map(task => (
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

export default AdminDashboard;
