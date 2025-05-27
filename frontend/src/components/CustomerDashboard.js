import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Form, Button, Table, Modal, Alert } from 'react-bootstrap';

function CustomerDashboard() {
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedDocument, setSelectedDocument] = useState('');
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
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
        setShowModal(false);
      })
      .catch(error => setMessage('Error submitting task'));
  };

  const handleAIProcess = (doc) => {
    axios.post('/api/ai/process', { document: doc })
      .then(response => setMessage(response.data.message))
      .catch(error => setMessage('Error processing with AI'));
  };

  return (
    <div>
      <h2>Customer Dashboard</h2>
      {message && <Alert variant="info">{message}</Alert>}
      <Card className="mb-4">
        <Card.Header>Upload Document</Card.Header>
        <Card.Body>
          <Form>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Control type="file" onChange={handleFileChange} />
            </Form.Group>
            <Button variant="primary" onClick={handleUpload}>Upload</Button>
          </Form>
        </Card.Body>
      </Card>
      <Card className="mb-4">
        <Card.Header>Submit Task</Card.Header>
        <Card.Body>
          <Button variant="outline-primary" onClick={() => setShowModal(true)}>
            Create Task
          </Button>
          <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Create Task</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group controlId="formDocumentSelect" className="mb-3">
                  <Form.Label>Select Document</Form.Label>
                  <Form.Select
                    value={selectedDocument}
                    onChange={(e) => setSelectedDocument(e.target.value)}
                  >
                    <option value="">Select a document</option>
                    {documents.map(doc => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group controlId="formTaskDescription" className="mb-3">
                  <Form.Label>Task Description</Form.Label>
                  <Form.Control
                    type="text"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Task description"
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
              <Button variant="primary" onClick={handleTaskSubmit}>Submit Task</Button>
            </Modal.Footer>
          </Modal>
        </Card.Body>
      </Card>
      <Card className="mb-4">
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
      <Card>
        <Card.Header>Tasks</Card.Header>
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Document</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td>{task.document}</td>
                  <td>{task.description}</td>
                  <td>{task.status}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

export default CustomerDashboard;
