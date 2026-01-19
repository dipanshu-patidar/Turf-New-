import React, { useState } from 'react';
import { Table, Button, Badge, Modal, Form } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaCheckCircle, FaBan } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './ManagementUsers.css'; // Importing collocated CSS

import api from '../../../api/axiosInstance';

const ManagementUsers = () => {
    // --- State ---
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null); // null means "Add Mode"
    const [staffToDelete, setStaffToDelete] = useState(null);

    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', status: 'ACTIVE' });

    // --- API Calls ---
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users/staff');
            setStaffList(response.data);
        } catch (error) {
            console.error('Error fetching staff:', error);
            toast.error('Failed to load staff members');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchUsers();
    }, []);

    // --- Handlers ---
    const handleClose = () => {
        setShowModal(false);
        setEditingStaff(null);
        setFormData({ name: '', email: '', phone: '', password: '', status: 'ACTIVE' });
    };

    const handleShowAdd = () => {
        setEditingStaff(null);
        setFormData({ name: '', email: '', phone: '', password: '', status: 'ACTIVE' });
        setShowModal(true);
    };

    const handleShowEdit = (staff) => {
        setEditingStaff(staff);
        setFormData({
            name: staff.name,
            email: staff.email,
            phone: staff.phone,
            password: '',
            status: staff.status
        });
        setShowModal(true);
    };

    // Delete Handlers
    const handleShowDelete = (staff) => {
        setStaffToDelete(staff);
        setShowDeleteModal(true);
    };

    const handleCloseDelete = () => {
        setShowDeleteModal(false);
        setStaffToDelete(null);
    };

    const confirmDelete = async () => {
        if (staffToDelete) {
            try {
                await api.delete(`/users/staff/${staffToDelete._id}`);
                setStaffList(staffList.filter(s => s._id !== staffToDelete._id));
                toast.success('Staff member deleted successfully');
                handleCloseDelete();
            } catch (error) {
                console.error(error);
                toast.error(error.response?.data?.message || 'Failed to delete staff');
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            if (editingStaff) {
                // Edit Logic
                const payload = {
                    name: formData.name,
                    phone: formData.phone,
                };
                if (formData.password) payload.password = formData.password;

                const response = await api.put(`/users/staff/${editingStaff._id}`, payload);

                // Update list locally to reflect changes immediately
                setStaffList(staffList.map(s => s._id === editingStaff._id ? response.data.user : s));
                toast.success('Staff details updated successfully');
            } else {
                // Add Logic
                const response = await api.post('/users/staff', formData);
                setStaffList([...staffList, response.data.user]);
                toast.success('New staff member added');
            }
            handleClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const toggleStatus = async (staff) => {
        try {
            const newStatus = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            await api.patch(`/users/staff/${staff._id}/status`, { status: newStatus });

            // Optimistic update
            setStaffList(staffList.map(s => s._id === staff._id ? { ...s, status: newStatus } : s));
            toast.success(`User ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="mu-container rounded-4 shadow-sm">
            {/* Header */}
            <div className="mu-page-header">
                <h2 className="mu-title">Management Users</h2>
                <Button className="mu-btn-primary" onClick={handleShowAdd}>
                    <FaPlus className="me-2" /> Add Staff
                </Button>
            </div>

            {/* Table */}
            <div className="mu-table-container">
                <Table hover className="mu-table">
                    <thead>
                        <tr>
                            <th>Staff Name</th>
                            <th>Email / Username</th>
                            <th>Phone Number</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staffList.map((staff) => (
                            <tr key={staff._id}>
                                <td>
                                    <div className="fw-bold">{staff.name}</div>
                                </td>
                                <td>{staff.email}</td>
                                <td>{staff.phone}</td>
                                <td>
                                    <Badge bg="secondary" className="fw-normal">{staff.role}</Badge>
                                </td>
                                <td>
                                    <span className={`mu-badge ${staff.status === 'ACTIVE' ? 'mu-badge-active' : 'mu-badge-inactive'}`}>
                                        {staff.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="d-flex">
                                        <button className="mu-action-btn edit" title="Edit" onClick={() => handleShowEdit(staff)}>
                                            <FaEdit />
                                        </button>

                                        <button
                                            className="mu-action-btn delete"
                                            title="Delete User"
                                            onClick={() => handleShowDelete(staff)}
                                        >
                                            <FaTrash />
                                        </button>

                                        {staff.status === 'ACTIVE' ? (
                                            <button
                                                className="mu-action-btn delete"
                                                title="Deactivate"
                                                onClick={() => { if (window.confirm('Deactivate this user?')) toggleStatus(staff) }}
                                            >
                                                <FaBan />
                                            </button>
                                        ) : (
                                            <button
                                                className="mu-action-btn text-success"
                                                title="Activate"
                                                onClick={() => { if (window.confirm('Activate this user?')) toggleStatus(staff) }}
                                            >
                                                <FaCheckCircle />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {staffList.length === 0 && !loading && (
                            <tr>
                                <td colSpan="6" className="text-center py-4 text-muted">No staff members found.</td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan="6" className="text-center py-4 text-muted">Loading...</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={handleClose} centered backdrop="static">
                <Modal.Header closeButton className="mu-modal-header">
                    <Modal.Title className="fw-bold">{editingStaff ? 'Edit Staff Details' : 'Add New Staff'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body className="p-4">
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Full Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g. John Doe"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Email (Username) <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="name@turf.com"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={!!editingStaff}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Phone Number</Form.Label>
                            <Form.Control
                                type="tel"
                                placeholder="10-digit number"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
                                {editingStaff ? 'New Password (leave blank to keep current)' : 'Password'} {(!editingStaff) && <span className="text-danger">*</span>}
                            </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Secret password (min 6 chars)"
                                required={!editingStaff}
                                minLength={6}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                id="status-switch"
                                label={formData.status === 'ACTIVE' ? 'Account Active' : 'Account Inactive'}
                                checked={formData.status === 'ACTIVE'}
                                onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'ACTIVE' : 'INACTIVE' })}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="mu-modal-footer">
                        <Button variant="light" onClick={handleClose}>Cancel</Button>
                        <Button type="submit" className="mu-btn-primary px-4">Save Changes</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={handleCloseDelete} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title></Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center pt-0 pb-4">
                    <div className="mb-3 text-danger">
                        <FaTrash size={40} />
                    </div>
                    <h5 className="fw-bold mb-2">Delete User?</h5>
                    <p className="text-muted">
                        Are you sure you want to delete <strong>{staffToDelete?.name}</strong>?
                        <br />This action cannot be undone.
                    </p>
                    <div className="d-flex justify-content-center gap-2 mt-4">
                        <Button variant="light" onClick={handleCloseDelete} className="px-4">Cancel</Button>
                        <Button variant="danger" onClick={confirmDelete} className="px-4">Delete</Button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default ManagementUsers;
