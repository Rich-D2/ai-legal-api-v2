import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CustomerDashboard() {
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedDocument, setSelectedDocument] = useState('');
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch documents and tasks
    axios.get('/api/documents')
      .then(response => setDocuments(response.data.documents))
      .catch(error => setMessage('Error fetching documents'));
    axios.get('/api/tasks')
      .then(response => setTasks(response.data.tasks))
      .catch(error => setMessage('Error fetching tasks'));
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) {
      setMessage('Please select a file');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    axios.post('/api/documents', formData)
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
    axios.post('/api/tasks', { document: selectedDocument, description: taskDescription })
      .then(response => {
        setMessage(response.data.message);
        setTasks([...tasks, response.data.task]);
        setTaskDescription('');
        setSelectedDocument('');
      })
      .catch(error => setMessage('Error submitting task'));
  };

  const handleAIProcess = (doc) => {
    axios.post('/api/ai/process', { document: doc })
      .then(response => setMessage(response.data.message))
      .catch(error => setMessage('Error processing with AI'));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Customer Dashboard</h1>
      <div>
        <h2>Upload Document</h2>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>
      </div>
      <div>
        <h2>Submit Task to Paralegal</h2>
        <select
          value={selectedDocument}
          onChange={(e) => setSelectedDocument(e.target.value)}
        >
          <option value="">Select a document</option>
          {documents.map(doc => (
            <option key={doc} value={doc}>{doc}</option>
          ))}
        </select>
        <input
          type="text"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          placeholder="Task description"
          style={{ margin: '10px', width: '300px' }}
        />
        <button onClick={handleTaskSubmit}>Submit Task</button>
      </div>
      <div>
        <h2>Documents</h2>
        <ul>
          {documents.map(doc => (
            <li key={doc}>
              {doc}
              <button onClick={() => handleAIProcess(doc)} style={{ marginLeft: '10px' }}>
                Process with AI
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Tasks</h2>
        <ul>
          {tasks.map(task => (
            <li key={task.id}>
              {task.document}: {task.description} ({task.status})
            </li>
          ))}
        </ul>
      </div>
      <p>{message}</p>
    </div>
  );
}

export default CustomerDashboard;
