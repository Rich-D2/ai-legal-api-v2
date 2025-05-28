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
        setTasks
