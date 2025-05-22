import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboard() {
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

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Dashboard</h1>
      <div>
        <h2>Documents</h2>
        <ul>
          {documents.map(doc => (
            <li key={doc}>{doc}</li>
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

export default AdminDashboard;
