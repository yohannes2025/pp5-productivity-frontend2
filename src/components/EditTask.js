// src/components/EditTask.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Container, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import styles from "../styles/Common.module.css";
import clsx from "clsx";
import api from "../services/api";
import publicApi from "../services/publicApi";
import { toast } from "react-toastify";

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("pending");
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const [taskRes, usersRes, catsRes] = await Promise.all([
          api.get(`/api/tasks/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/api/users/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          publicApi.get("/api/categories/"), // Public
        ]);

        const task = taskRes.data;
        setTitle(task.title);
        setDescription(task.description || "");
        setDueDate(task.due_date ? new Date(task.due_date) : null);
        setPriority(task.priority || "medium");
        setStatus(task.status || "pending");
        setAssignedUsers(task.assigned_users.map(String));
        setUsers(usersRes.data);
        setCategories(catsRes.data || []);

        // Set current category or fallback
        const currentCat = catsRes.data.find((c) => c.id === task.category);
        setCategory(
          currentCat
            ? String(currentCat.id)
            : catsRes.data[0]
            ? String(catsRes.data[0].id)
            : ""
        );
      } catch (error) {
        setErrorMessage("Failed to load task.");
        toast.error("Task not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAssignedUserChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map(
      (opt) => opt.value
    );
    setAssignedUsers(selected);
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    if (dueDate)
      formData.append("due_date", dueDate.toISOString().split("T")[0]);
    formData.append("priority", priority);
    formData.append("category", category);
    formData.append("status", status);
    assignedUsers.forEach((id) => formData.append("assigned_users", id));
    files.forEach((file, index) => formData.append("new_files[]", file));

    try {
      await api.put(`/api/tasks/${id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Task updated!");
      navigate("/tasklist");
    } catch (error) {
      setErrorMessage("Failed to update task.");
      toast.error("Update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <Container className="text-center mt-5">
        <Spinner />
      </Container>
    );
  if (errorMessage && !title)
    return <Alert variant="danger">{errorMessage}</Alert>;

  return (
    <Container className={clsx(styles.container, "mt-5")}>
      <Card
        className="p-4 shadow"
        style={{ maxWidth: "600px", margin: "auto" }}
      >
        <h3 className="text-center mb-4">Edit Task</h3>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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

          <Form.Group className="mb-3">
            <Form.Label>Category</Form.Label>
            <Form.Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </Form.Select>
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
            <Form.Label>Assigned Users</Form.Label>
            <Form.Select
              multiple
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

          <Form.Group className="mb-3">
            <Form.Label>Replace Files</Form.Label>
            <Form.Control type="file" multiple onChange={handleFileChange} />
          </Form.Group>

          <div className="d-flex gap-2">
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Update Task"}
            </Button>
            <Button variant="secondary" onClick={() => navigate("/tasklist")}>
              Cancel
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default EditTask;
