import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Table, Button, Alert } from 'react-bootstrap';

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
    <div>
      <h2>Lawyer Dashboard</h2>
      {message && <Alert variant="info">{message}</Alert>}
      <Card>
        <Card.Header>Documents</Card.Header>
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Document</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc}>
                  <td>{doc}</td>
                  <td>
                    <Button variant="link" onClick={() => handleAIProcess(doc)}>
                      Process with AI
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

export default LawyerDashboard;
