import React, { useState } from 'react';
import { Table, Button, Badge, Dropdown, Modal, Form, Row, Col } from 'react-bootstrap';
import { FaPlus, FaEllipsisV, FaEdit, FaPause, FaPlay, FaTrash, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './StaffRecurringBooking.css';

const StaffRecurringBooking = () => {
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState(null);

    // Mock Data
    const [bookings, setBookings] = useState([
        {
            id: 1,
            customerName: "Ravi Kumar",
            phone: "9876543210",
            court: "Football - Main Turf",
            recurrence: "Weekly",
            day: "Monday",
            time: "18:00 - 19:00",
            amount: 4800,
            status: "Active"
        },
        {
            id: 2,
            customerName: "Team Spartans",
            phone: "9123456780",
            court: "Cricket - Net 1",
            recurrence: "Monthly",
            day: "1st & 15th",
            time: "07:00 - 09:00",
            amount: 2000,
            status: "Active"
        },
        {
            id: 3,
            customerName: "Badminton Club",
            phone: "9988776655",
            court: "Badminton - Court 2",
            recurrence: "Weekly",
            day: "Wednesday",
            time: "20:00 - 21:00",
            amount: 2000,
            status: "Paused"
        }
    ]);

    const initialFormState = {
        customerName: '',
        phone: '',
        court: 'Football - Main Turf',
        recurrence: 'Weekly',
        day: 'Monday',
        startTime: '18:00',
        endTime: '19:00',
        amount: 0
    };

    const [formData, setFormData] = useState(initialFormState);

    const handleOpenModal = (booking = null) => {
        if (booking) {
            setIsEditMode(true);
            const [start, end] = booking.time.split(' - ');
            setFormData({
                ...booking,
                startTime: start,
                endTime: end
            });
        } else {
            setIsEditMode(false);
            setFormData(initialFormState);
        }
        setShowModal(true);
    };

    const handleShowDelete = (booking) => {
        setBookingToDelete(booking);
        setShowDeleteModal(true);
    };

    const handleCloseDelete = () => {
        setShowDeleteModal(false);
        setBookingToDelete(null);
    };

    const confirmDelete = () => {
        if (bookingToDelete) {
            setBookings(bookings.filter(b => b.id !== bookingToDelete.id));
            toast.success('Recurring booking deleted');
            handleCloseDelete();
        }
    };

    const handleToggleStatus = (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
        setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
        toast.success(`Booking ${newStatus === 'Active' ? 'Resumed' : 'Paused'}`);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validation would go here

        if (formData.startTime && formData.endTime) {
            const [startHour, startMin] = formData.startTime.split(':').map(Number);
            const [endHour, endMin] = formData.endTime.split(':').map(Number);

            const startTotalMins = startHour * 60 + startMin;
            const endTotalMins = endHour * 60 + endMin;

            if (startTotalMins >= endTotalMins) {
                toast.error('End time must be after Start time');
                return;
            }

            if (startTotalMins % 15 !== 0 || endTotalMins % 15 !== 0) {
                toast.error('Recurrence times must be in 15-minute intervals');
                return;
            }
        }

        // Mock Save Logic
        if (isEditMode) {
            // Update logic (mock)
            toast.success('Recurring booking updated successfully');
        } else {
            // Create logic (mock)
            toast.success('New recurring booking created');
        }
        setShowModal(false);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="staffrecurringbooking-container">
            <div className="staffrecurringbooking-page-header">
                <div>
                    <h2 className="staffrecurringbooking-title">Recurring Bookings</h2>
                    <p className="text-muted m-0 small">Manage regular weekly and monthly slots</p>
                </div>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                    <FaPlus className="me-2" /> Add Recurring
                </Button>
            </div>

            <div className="staffrecurringbooking-card">
                <div className="staffrecurringbooking-table-responsive">
                    <Table hover className="staffrecurringbooking-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Phone</th>
                                <th>Court</th>
                                <th>Recurrence</th>
                                <th>Schedule</th>
                                <th>Monthly Amount</th>
                                <th>Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking) => (
                                <tr key={booking.id}>
                                    <td>
                                        <div className="fw-bold">{booking.customerName}</div>
                                    </td>
                                    <td>{booking.phone}</td>
                                    <td>{booking.court}</td>
                                    <td>
                                        <Badge bg="light" text="dark" className="border fw-normal">
                                            {booking.recurrence}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="small fw-bold">{booking.day}</div>
                                        <div className="small text-muted">{booking.time}</div>
                                    </td>
                                    <td className="fw-bold text-primary">₹{booking.amount}</td>
                                    <td>
                                        <span className={`staffrecurringbooking-badge ${booking.status.toLowerCase()}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="text-end">
                                        <div className="d-flex justify-content-end gap-2">
                                            <button
                                                className="staffrecurringbooking-action-btn edit"
                                                onClick={() => handleOpenModal(booking)}
                                                title="Edit Details"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="staffrecurringbooking-action-btn pause"
                                                onClick={() => handleToggleStatus(booking.id, booking.status)}
                                                title={booking.status === 'Active' ? 'Pause Booking' : 'Resume Booking'}
                                            >
                                                {booking.status === 'Active' ? <FaPause className="text-warning" /> : <FaPlay className="text-success" />}
                                            </button>
                                            <button
                                                className="staffrecurringbooking-action-btn delete"
                                                onClick={() => handleShowDelete(booking)}
                                                title="Delete"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <Modal.Header closeButton className="staffrecurringbooking-modal-header">
                    <Modal.Title className="staffrecurringbooking-modal-title">
                        {isEditMode ? 'Edit Recurring Booking' : 'New Recurring Booking'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Label className="staffrecurringbooking-form-label">Customer Name</Form.Label>
                                <Form.Control
                                    className="staffrecurringbooking-input"
                                    type="text"
                                    required
                                    name="customerName"
                                    value={formData.customerName}
                                    onChange={handleFormChange}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="staffrecurringbooking-form-label">Phone Number</Form.Label>
                                <Form.Control
                                    className="staffrecurringbooking-input"
                                    type="tel"
                                    required
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleFormChange}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="staffrecurringbooking-form-label">Court</Form.Label>
                                <Form.Select
                                    className="staffrecurringbooking-input"
                                    name="court"
                                    value={formData.court}
                                    onChange={handleFormChange}
                                >
                                    <option>Football - Main Turf</option>
                                    <option>Cricket - Net 1</option>
                                    <option>Badminton - Court 1</option>
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="staffrecurringbooking-form-label">Recurrence Type</Form.Label>
                                <Form.Select
                                    className="staffrecurringbooking-input"
                                    name="recurrence"
                                    value={formData.recurrence}
                                    onChange={handleFormChange}
                                >
                                    <option>Weekly</option>
                                    <option>Monthly</option>
                                </Form.Select>
                            </Col>
                            <Col md={4}>
                                <Form.Label className="staffrecurringbooking-form-label">Day(s)</Form.Label>
                                <Form.Control
                                    className="staffrecurringbooking-input"
                                    type="text"
                                    placeholder="e.g. Monday"
                                    name="day"
                                    value={formData.day}
                                    onChange={handleFormChange}
                                />
                            </Col>
                            <Col md={4}>
                                <Form.Label className="staffrecurringbooking-form-label">Start Time</Form.Label>
                                <Form.Control
                                    className="staffrecurringbooking-input"
                                    type="time"
                                    step="900"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleFormChange}
                                />
                            </Col>
                            <Col md={4}>
                                <Form.Label className="staffrecurringbooking-form-label">End Time</Form.Label>
                                <Form.Control
                                    className="staffrecurringbooking-input"
                                    type="time"
                                    step="900"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleFormChange}
                                />
                            </Col>
                            <Col md={12}>
                                <hr className="my-2" />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="staffrecurringbooking-form-label text-muted">Estimated Monthly Amount (Read-Only)</Form.Label>
                                <Form.Control
                                    className="staffrecurringbooking-input bg-light fw-bold"
                                    type="text"
                                    readOnly
                                    value={`₹ ${formData.amount || '4800'}`} // Mock value
                                />
                                <Form.Text className="text-muted small">
                                    <FaCheck className="me-1 text-success" /> Auto-calculated based on hours
                                </Form.Text>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="border-0">
                        <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit">
                            {isEditMode ? 'Save Changes' : 'Create Recurring Booking'}
                        </Button>
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
                    <h5 className="fw-bold mb-2">Delete Booking?</h5>
                    <p className="text-muted">
                        Are you sure you want to delete the booking for <strong>{bookingToDelete?.customerName}</strong>?
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

export default StaffRecurringBooking;
