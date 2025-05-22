import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
    // Placeholder for task completion
    setMessage(`Task ${taskId} marked as completed (placeholder)`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Paralegal Dashboard</h1>
      <div>
        <h2>Customer Tasks</h2>
        <ul>
          {tasks.map(task => (
            <li key={task.id}>
              {task.document}: {task.description} ({task.status})
              <button onClick={() => handleCompleteTask(task.id)} style={{ marginLeft: '10px' }}>
                Complete
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Documents</h2>
        <ul>
          {documents.map(doc => (
            <li key={doc}>{doc}</li>
          ))}
        </ul>
      </div>
      <p>{message}</p>
    </div>
  );
}

export default ParalegalDashboard;
