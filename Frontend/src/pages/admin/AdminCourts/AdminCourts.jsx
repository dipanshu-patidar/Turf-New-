import React, { useState } from 'react';
import { Table, Button, Badge, Modal, Form, InputGroup } from 'react-bootstrap';
import { FaPlus, FaEdit, FaCheckCircle, FaBan, FaRupeeSign, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './AdminCourts.css'; // Importing collocated CSS

const AdminCourts = () => {
    // --- Mock Data ---
    const [courtList, setCourtList] = useState([
        { id: 1, name: 'Turf A - Football', type: 'Football', weekdayPrice: 1200, weekendPrice: 1500, status: 'Active' },
        { id: 2, name: 'Turf B - Cricket', type: 'Cricket', weekdayPrice: 1000, weekendPrice: 1300, status: 'Active' },
        { id: 3, name: 'Court 1 - Badminton', type: 'Badminton', weekdayPrice: 400, weekendPrice: 600, status: 'Inactive' },
    ]);

    // --- State ---
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingCourt, setEditingCourt] = useState(null); // null means "Add Mode"
    const [courtToDelete, setCourtToDelete] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Football',
        weekdayPrice: '',
        weekendPrice: '',
        status: 'Active'
    });

    // --- Handlers ---
    const handleClose = () => {
        setShowModal(false);
        setEditingCourt(null);
        setFormData({ name: '', type: 'Football', weekdayPrice: '', weekendPrice: '', status: 'Active' });
    };

    const handleShowAdd = () => {
        setEditingCourt(null);
        setFormData({ name: '', type: 'Football', weekdayPrice: '', weekendPrice: '', status: 'Active' });
        setShowModal(true);
    };

    const handleShowEdit = (court) => {
        setEditingCourt(court);
        setFormData({ ...court });
        setShowModal(true);
    };

    // Delete Handlers
    const handleShowDelete = (court) => {
        setCourtToDelete(court);
        setShowDeleteModal(true);
    };

    const handleCloseDelete = () => {
        setShowDeleteModal(false);
        setCourtToDelete(null);
    };

    const confirmDelete = () => {
        if (courtToDelete) {
            setCourtList(courtList.filter(c => c.id !== courtToDelete.id));
            toast.success('Court deleted successfully');
            handleCloseDelete();
        }
    };

    const handleSave = (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name || !formData.weekdayPrice || !formData.weekendPrice) {
            toast.error('Please fill all required fields');
            return;
        }

        if (editingCourt) {
            // Edit Logic
            const updatedList = courtList.map(c => c.id === editingCourt.id ? { ...c, ...formData } : c);
            setCourtList(updatedList);
            toast.success('Court details updated successfully');
        } else {
            // Add Logic
            const newCourt = { id: Date.now(), ...formData };
            setCourtList([...courtList, newCourt]);
            toast.success('New court added successfully');
        }
        handleClose();
    };

    const toggleStatus = (id) => {
        const updatedList = courtList.map(c => {
            if (c.id === id) {
                const newStatus = c.status === 'Active' ? 'Inactive' : 'Active';
                toast.success(`Court ${newStatus === 'Active' ? 'activated' : 'deactivated'}`);
                return { ...c, status: newStatus };
            }
            return c;
        });
        setCourtList(updatedList);
    };

    return (
        <div className="admincourts-container rounded-4 shadow-sm">
            {/* Header */}
            <div className="admincourts-page-header">
                <div>
                    <h2 className="admincourts-title">Courts & Pricing</h2>
                    <p className="text-muted m-0 small">Manage your sports facilities and rates</p>
                </div>
                <Button className="admincourts-btn-primary" onClick={handleShowAdd}>
                    <FaPlus className="me-2" /> Add Court
                </Button>
            </div>

            {/* Table */}
            <div className="admincourts-table-container">
                <Table hover className="admincourts-table">
                    <thead>
                        <tr>
                            <th>Court Name</th>
                            <th>Sport Type</th>
                            <th>Weekday Price (1hr)</th>
                            <th>Weekend Price (1hr)</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courtList.map((court) => (
                            <tr key={court.id}>
                                <td>
                                    <div className="fw-bold">{court.name}</div>
                                </td>
                                <td>
                                    <Badge bg="light" text="dark" className="border">
                                        {court.type}
                                    </Badge>
                                </td>
                                <td className="fw-bold text-success">₹ {court.weekdayPrice}</td>
                                <td className="fw-bold text-primary">₹ {court.weekendPrice}</td>
                                <td>
                                    <span className={`admincourts-badge ${court.status === 'Active' ? 'admincourts-badge-active' : 'admincourts-badge-inactive'}`}>
                                        {court.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="d-flex">
                                        <button className="admincourts-action-btn edit" title="Edit" onClick={() => handleShowEdit(court)}>
                                            <FaEdit />
                                        </button>

                                        <button
                                            className="admincourts-action-btn delete"
                                            title="Delete Court"
                                            onClick={() => handleShowDelete(court)}
                                        >
                                            <FaTrash />
                                        </button>

                                        {court.status === 'Active' ? (
                                            <button
                                                className="admincourts-action-btn delete"
                                                title="Deactivate"
                                                onClick={() => { if (window.confirm('Deactivate this court?')) toggleStatus(court.id) }}
                                            >
                                                <FaBan />
                                            </button>
                                        ) : (
                                            <button
                                                className="admincourts-action-btn activate"
                                                title="Activate"
                                                onClick={() => { if (window.confirm('Activate this court?')) toggleStatus(court.id) }}
                                            >
                                                <FaCheckCircle />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {courtList.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center py-4 text-muted">No courts found. Add one to get started.</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={handleClose} centered backdrop="static">
                <Modal.Header closeButton className="admincourts-modal-header">
                    <Modal.Title className="fw-bold">{editingCourt ? 'Edit Court Details' : 'Add New Court'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body className="p-4">
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Court Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g. Turf A - Football"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Sport Type</Form.Label>
                            <Form.Select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="Football">Football</option>
                                <option value="Cricket">Cricket</option>
                                <option value="Badminton">Badminton</option>
                                <option value="Pickleball">Pickleball</option>
                            </Form.Select>
                        </Form.Group>

                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <Form.Label className="fw-semibold">Weekday Price <span className="text-danger">*</span></Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><FaRupeeSign size={12} /></InputGroup.Text>
                                    <Form.Control
                                        type="number"
                                        placeholder="0.00"
                                        required
                                        min="0"
                                        value={formData.weekdayPrice}
                                        onChange={(e) => setFormData({ ...formData, weekdayPrice: e.target.value })}
                                    />
                                </InputGroup>
                                <Form.Text className="text-muted small">Mon - Fri</Form.Text>
                            </div>
                            <div className="col-md-6">
                                <Form.Label className="fw-semibold">Weekend Price <span className="text-danger">*</span></Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><FaRupeeSign size={12} /></InputGroup.Text>
                                    <Form.Control
                                        type="number"
                                        placeholder="0.00"
                                        required
                                        min="0"
                                        value={formData.weekendPrice}
                                        onChange={(e) => setFormData({ ...formData, weekendPrice: e.target.value })}
                                    />
                                </InputGroup>
                                <Form.Text className="text-muted small">Sat & Sun</Form.Text>
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                id="court-status-switch"
                                label={formData.status === 'Active' ? 'Court Active' : 'Court Inactive'}
                                checked={formData.status === 'Active'}
                                onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'Active' : 'Inactive' })}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="admincourts-modal-footer">
                        <Button variant="light" onClick={handleClose}>Cancel</Button>
                        <Button type="submit" className="admincourts-btn-primary px-4">Save Changes</Button>
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
                    <h5 className="fw-bold mb-2">Delete Court?</h5>
                    <p className="text-muted">
                        Are you sure you want to delete <strong>{courtToDelete?.name}</strong>?
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

export default AdminCourts;
