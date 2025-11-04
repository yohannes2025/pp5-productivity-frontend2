// src/components/CreateTask.js

import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Container, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import styles from "../styles/Common.module.css";
import clsx from "clsx";
import api from "../services/api";

const CreateTask = ({ onSubmit, onCancel }) => {
  if (typeof onSubmit !== "function") {
    throw new Error("onSubmit prop must be a function");
  }

  // --- State Initialization ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [priority, setPriority] = useState("medium");
  // category will hold the ID as a string for form compatibility
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("pending");
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");

        // Fetch users
        const usersRes = await api.get("/api/users/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(usersRes.data);

        // Fetch categories
        const catsRes = await api.get("/api/categories/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(catsRes.data);

        // FIX: Ensure initial state is set as a STRING ID if data exists
        if (catsRes.data.length > 0) {
          setCategory(String(catsRes.data[0].id));
        } else {
          setCategory(""); // Kept empty to match the placeholder
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
        setErrorMessage("Failed to load users or categories.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssignedUserChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map(
      (opt) => opt.value
    );
    setAssignedUsers(selected);
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate(new Date());
    setPriority("medium");
    // FIX: Ensure reset value is a STRING ID
    setCategory(categories.length > 0 ? String(categories[0].id) : "");
    setStatus("pending");
    setAssignedUsers([]);
    setFiles([]);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);

      const dateObj = new Date(dueDate);
      const formattedDate = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${dateObj.getDate().toString().padStart(2, "0")}`;
      formData.append("due_date", formattedDate);

      formData.append("priority", priority);
      formData.append("category", category); // sending the category ID (as a string)
      formData.append("status", status);

      assignedUsers.forEach((userId) =>
        formData.append("assigned_users", userId)
      );
      files.forEach((file) => formData.append("files", file));

      await onSubmit(formData);

      setSuccessMessage("Task created successfully!");
      setTimeout(() => {
        resetForm();
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Task creation failed:", error.response || error);
      setErrorMessage(
        error?.response?.data?.detail ||
          error?.message ||
          "Something went wrong while creating the task."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    if (onCancel) onCancel();
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p>Loading users and categories...</p>
      </Container>
    );
  }

  // --- Rendered Form ---
  return (
    <Container
      className={clsx(
        styles.container,
        "d-flex",
        "flex-column",
        "justify-content-center",
        "align-items-center",
        "mt-5"
      )}
    >
      <Card className="p-4 shadow" style={{ width: "100%", maxWidth: "600px" }}>
        <h3 className="text-center mb-4">Create Task</h3>

        {/* Alerts */}
        {successMessage && (
          <Alert variant="success" className="mb-3">
            {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert variant="danger" className="mb-3">
            {errorMessage}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* Title */}
          <Form.Group controlId="taskTitle" className="mb-3">
            <Form.Control
              type="text"
              placeholder="Task Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Form.Group>

          {/* Description */}
          <Form.Group controlId="taskDescription" className="mb-3">
            <Form.Control
              as="textarea"
              placeholder="Task Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </Form.Group>

          {/* Due Date */}
          <Form.Group controlId="dueDate" className="mb-3">
            <Form.Label>Due Date</Form.Label>
            <DatePicker
              selected={dueDate}
              onChange={(date) => setDueDate(date)}
              className="form-control"
              required
              minDate={new Date()}
            />
          </Form.Group>

          {/* Priority */}
          <Form.Group controlId="taskPriority" className="mb-3">
            <Form.Label>Priority</Form.Label>
            <Form.Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Form.Select>
          </Form.Group>

          {/* Category Dropdown (Dynamic) */}
          <Form.Group controlId="taskCategory" className="mb-3">
            <Form.Label>Category</Form.Label>
            <Form.Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="" disabled hidden>
                Select a Category
              </option>

              {/* Map over fetched categories */}
              {categories.map((cat) => (
                // FIX: Use of String(cat.id) to ensure consistency with state
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* Status */}
          <Form.Group controlId="taskStatus" className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="pending">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </Form.Select>
          </Form.Group>

          {/* Assigned Users */}
          <Form.Group controlId="assignedUsers" className="mb-3">
            <Form.Label>Assigned Users</Form.Label>
            <Form.Select
              multiple
              required
              value={assignedUsers}
              onChange={handleAssignedUserChange}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* Files */}
          <Form.Group controlId="taskFiles" className="mb-3">
            <Form.Label>Upload Files</Form.Label>
            <Form.Control type="file" multiple onChange={handleFileChange} />
          </Form.Group>

          {/* Buttons */}
          <div className="d-flex justify-content-between mt-4">
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Spinner animation="border" size="sm" />
              ) : (
                "Create Task"
              )}
            </Button>
            <Button
              variant="outline-secondary"
              type="button"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default CreateTask;
