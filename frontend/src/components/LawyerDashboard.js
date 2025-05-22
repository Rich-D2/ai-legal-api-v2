import React, { useState, useEffect } from 'react';
import axios from 'axios';

function LawyerDashboard() {
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState('');

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

  return (
    <div style={{ padding: '20px' }}>
      <h1>Lawyer Dashboard</h1>
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
        <p>{message}</p>
      </div>
    </div>
  );
}

export default LawyerDashboard;
