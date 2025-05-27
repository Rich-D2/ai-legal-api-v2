import React, { useState } from 'react';
import axios from 'axios';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/api/login', { email, password })
      .then(response => {
        localStorage.setItem('token', response.data.token);
        navigate('/customer');
      })
      .catch(error => setMessage('Login failed. Please check your credentials.'));
  };

  return (
    <Container className="my-5">
      <Card className="mx-auto" style={{ maxWidth: '400px' }}>
        <Card.Header>Login</Card.Header>
        <Card.Body>
          {message && <Alert variant="danger">{message}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formPassword" className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
            <Button variant="primary" type="submit">Login</Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;
