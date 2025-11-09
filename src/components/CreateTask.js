// src/components/CreateTask.js
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Container, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import styles from "../styles/Common.module.css";
import clsx from "clsx";
import api from "../services/api";
import publicApi from "../services/publicApi";

const CreateTask = ({ onSubmit, onCancel }) => {
  if (typeof onSubmit !== "function") {
    throw new Error("onSubmit prop must be a function");
  }

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [priority, setPriority] = useState("medium");
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const [usersRes, catsRes] = await Promise.all([
          api.get("/api/users/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          publicApi.get("/api/categories/"),
        ]);

        setUsers(usersRes.data);
        const cats = catsRes.data || [];
        setCategories(cats);

        if (cats.length > 0) {
          setCategory(String(cats[0].id));
        } else {
          setErrorMessage("No categories yet — adding defaults...");
          await publicApi.get("/api/categories/"); // Trigger creation
          const retry = await publicApi.get("/api/categories/");
          setCategories(retry.data);
          if (retry.data.length > 0) {
            setCategory(String(retry.data[0].id));
            setErrorMessage("");
          }
        }
      } catch (err) {
        setErrorMessage("Failed to load data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssignedUserChange = (e) => {
    setAssignedUsers(Array.from(e.target.selectedOptions, (opt) => opt.value));
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate(new Date());
    setPriority("medium");
    setCategory(categories[0] ? String(categories[0].id) : "");
    setStatus("pending");
    setAssignedUsers([]);
    setFiles([]);
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("due_date", dueDate.toISOString().split("T")[0]);
      formData.append("priority", priority);
      formData.append("category", category);
      formData.append("status", status);

      // FIX: Send as numbers
      assignedUsers.forEach((id) =>
        formData.append("assigned_users", Number(id))
      );

      // FIX: Send files correctly
      files.forEach((file, index) => formData.append("new_files[]", file));

      console.log("Sending:", Object.fromEntries(formData)); // DEBUG

      await api.post("/api/tasks/", formData); // api.js fixes headers

      setSuccessMessage("Task + files uploaded!");
      setTimeout(() => {
        resetForm();
        onCancel?.();
      }, 1500);
    } catch (err) {
      console.error("400 Error:", err.response?.data);
      setErrorMessage(
        "Check: file size <10MB, category selected, users assigned"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p>Loading form...</p>
      </Container>
    );
  }

  return (
    <Container className={clsx(styles.container, "mt-5")}>
      <Card
        className="p-4 shadow"
        style={{ maxWidth: "620px", margin: "auto" }}
      >
        <h3 className="text-center mb-4">Create New Task</h3>

        {successMessage && <Alert variant="success">{successMessage}</Alert>}
        {errorMessage && <Alert variant="warning">{errorMessage}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Task Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Description *"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Due Date</Form.Label>
            <DatePicker
              selected={dueDate}
              onChange={setDueDate}
              className="form-control"
              minDate={new Date()}
            />
          </Form.Group>

          <Form.Group className="mb-3">
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

          {/* Beautiful fallback UX */}
          <Form.Group className="mb-3">
            <Form.Label>Category *</Form.Label>
            {categories.length === 0 ? (
              <Alert variant="info" className="py-2 mb-2">
                <strong>No categories yet.</strong> We’re adding defaults for
                you...
                <br />
                <small>
                  Or{" "}
                  <a
                    href="/admin/productivity_app/category/add/"
                    target="_blank"
                    rel="noopener"
                  >
                    add your own in Django Admin
                  </a>
                </small>
              </Alert>
            ) : (
              <Form.Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select Category
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </Form.Select>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
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

          <Form.Group className="mb-3">
            <Form.Label>Assign Users</Form.Label>
            <Form.Select
              multiple
              value={assignedUsers}
              onChange={handleAssignedUserChange}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Attach Files</Form.Label>
            <Form.Control type="file" multiple onChange={handleFileChange} />
          </Form.Group>

          <div className="d-flex gap-2">
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting || categories.length === 0}
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
            <Button variant="secondary" onClick={onCancel || resetForm}>
              Cancel
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default CreateTask;
