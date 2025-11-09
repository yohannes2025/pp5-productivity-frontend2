// src/components/Register.js
import React, { useState } from "react";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert,
  Card,
} from "react-bootstrap";
import styles from "../styles/Common.module.css";
import clsx from "clsx";

const Register = () => {
  const navigate = useNavigate();

  // Updated state variable
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    // Basic frontend validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await api.post(
        "/api/register/",
        {
          username,
          email,
          password,
          confirm_password: confirmPassword,
        },
        { timeout: 5000 }
      );

      // Successful registration: redirect to login
      navigate("/login");
    } catch (err) {
      // DRF typically returns field-specific errors
      if (err.response?.data) {
        const data = err.response.data;

        // Combine field errors into a single string for display
        const messages = Object.values(data).flat().join(" ");
        setError(messages || "An error occurred during registration.");
      } else {
        setError("An error occurred during registration.");
      }
    }
  };

  return (
    <Container
      className={clsx(
        styles.container,
        "d-flex",
        "flex-column",
        "justify-content-center",
        "align-items-center"
      )}
    >
      <Row className="w-100">
        <Col xs={12} sm={10} md={8} lg={5} className="mx-auto">
          <Card className="shadow">
            <Card.Body>
              <Card.Title className="text-center">Register</Card.Title>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="formUsername" className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="formEmail" className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="formPassword" className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="formConfirmPassword" className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100 mt-3">
                  Register
                </Button>
              </Form>

              <div className="text-center mt-3">
                Already have an account? <Link to="/login">Login</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
