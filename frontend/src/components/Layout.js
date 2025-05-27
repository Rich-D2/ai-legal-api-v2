import React from 'react';
import { Navbar, Nav, Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function Layout({ children }) {
  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">AI Legal API</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/customer">Customer</Nav.Link>
              <Nav.Link as={Link} to="/paralegal">Paralegal</Nav.Link>
              <Nav.Link as={Link} to="/lawyer">Lawyer</Nav.Link>
              <Nav.Link as={Link} to="/admin">Admin</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container fluid>
        <Row>
          <Col md={3} className="bg-light p-3" style={{ minHeight: '100vh' }}>
            <Nav className="flex-column">
              <Nav.Link as={Link} to="/customer" className="fw-bold">Customer Dashboard</Nav.Link>
              <Nav.Link as={Link} to="/paralegal" className="fw-bold">Paralegal Dashboard</Nav.Link>
              <Nav.Link as={Link} to="/lawyer" className="fw-bold">Lawyer Dashboard</Nav.Link>
              <Nav.Link as={Link} to="/admin" className="fw-bold">Admin Dashboard</Nav.Link>
            </Nav>
          </Col>
          <Col md={9} className="p-4">
            {children}
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Layout;
