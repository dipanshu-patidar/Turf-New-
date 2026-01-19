import React, { useState } from 'react';
import { Table, Button, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import { FaCalendarAlt, FaFilter, FaSearch, FaEye, FaEdit, FaTrash, FaTimes, FaPhone } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './StaffCheckBooking.css';

const StaffCheckBooking = () => {
    // Filters State
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        court: 'All',
        status: 'All'
    });

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Mock Data
    const [bookings, setBookings] = useState([
        {
            id: 'BK-2024-001',
            customerName: "Rahul Sharma",
            phone: "9876543210",
            court: "Football - Main Turf",
            date: "2024-03-20",
            time: "18:15 - 19:45",
            amount: 1800,
            status: "Pending" // Paid, Pending, Advance Pending
        },
        {
            id: 'BK-2024-002',
            customerName: "Amit Patel",
            phone: "9123456780",
            court: "Cricket - Net 1",
            date: "2024-03-20",
            time: "16:00 - 16:45",
            amount: 900,
            status: "Paid"
        },
        {
            id: 'BK-2024-003',
            customerName: "Sneha Gupta",
            phone: "9988776655",
            court: "Badminton - Court 1",
            date: "2024-03-21",
            time: "07:00 - 08:00",
            amount: 500,
            status: "Advance"
        },
        {
            id: 'BK-2024-004',
            customerName: "Vikram Singh",
            phone: "8877665544",
            court: "Football - Side Turf",
            date: "2024-03-22",
            time: "20:00 - 21:00",
            amount: 1000,
            status: "Paid"
        }
    ]);

    const handleView = (booking) => {
        setSelectedBooking(booking);
        setShowViewModal(true);
    };

    const handleEdit = (booking) => {
        setSelectedBooking(booking);
        setShowEditModal(true);
    };

    const handleSaveEdit = (e) => {
        e.preventDefault();
        // Update mock data logic
        setBookings(bookings.map(b => b.id === selectedBooking.id ? selectedBooking : b));
        toast.success('Booking details updated successfully');
        setShowEditModal(false);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setSelectedBooking(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleShowCancel = (booking) => {
        setBookingToCancel(booking);
        setShowCancelModal(true);
    };

    const confirmCancel = () => {
        if (bookingToCancel) {
            setBookings(bookings.filter(b => b.id !== bookingToCancel.id));
            toast.success(`Booking ${bookingToCancel.id} cancelled successfully`);
            setShowCancelModal(false);
            setBookingToCancel(null);
        }
    };

    // Filter Logic
    const filteredBookings = bookings.filter(booking => {
        const matchesDate = !filters.date || booking.date === filters.date;
        const matchesCourt = filters.court === 'All' || booking.court === filters.court;
        const matchesStatus = filters.status === 'All' ||
            (filters.status === 'Paid' && booking.status === 'Paid') ||
            (filters.status === 'Pending' && booking.status === 'Pending') ||
            (filters.status === 'Advance' && booking.status === 'Advance');

        return matchesDate && matchesCourt && matchesStatus;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Paid': return <span className="checkbooking-badge paid">Fully Paid</span>;
            case 'Pending': return <span className="checkbooking-badge pending">Balance Pending</span>;
            case 'Advance': return <span className="checkbooking-badge advance">Advance Only</span>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="checkbooking-container">
            <div className="checkbooking-page-header">
                <div>
                    <h2 className="checkbooking-title">Bookings List</h2>
                    <p className="text-muted m-0 small">View and manage all reservations</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-dark" className="checkbooking-btn-clear" onClick={() => setFilters({ date: '', court: 'All', status: 'All' })}>
                        <FaTimes className="me-2" /> Clear Filters
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="checkbooking-filter-bar">
                <div className="d-flex align-items-center gap-2 text-muted fw-bold">
                    <FaFilter /> Filters:
                </div>

                <Form.Control
                    type="date"
                    className="checkbooking-filter-input"
                    name="date"
                    value={filters.date}
                    onChange={handleFilterChange}
                    style={{ width: 'auto' }}
                />

                <Form.Select
                    className="checkbooking-filter-input"
                    name="court"
                    value={filters.court}
                    onChange={handleFilterChange}
                    style={{ width: 'auto' }}
                >
                    <option value="All">All Courts</option>
                    <option value="Football - Main Turf">Football - Main Turf</option>
                    <option value="Football - Side Turf">Football - Side Turf</option>
                    <option value="Cricket - Net 1">Cricket - Net 1</option>
                    <option value="Badminton - Court 1">Badminton - Court 1</option>
                </Form.Select>

                <Form.Select
                    className="checkbooking-filter-input"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    style={{ width: 'auto' }}
                >
                    <option value="All">All Payment Status</option>
                    <option value="Paid">Fully Paid</option>
                    <option value="Pending">Balance Pending</option>
                    <option value="Advance">Advance Only</option>
                </Form.Select>

                <div className="ms-auto position-relative">
                    <FaSearch className="position-absolute text-muted top-50 start-0 translate-middle-y ms-3" />
                    <Form.Control
                        type="search"
                        placeholder="Search ID or Name..."
                        className="checkbooking-filter-input ps-5"
                    />
                </div>
            </div>

            {/* Bookings Table */}
            <div className="checkbooking-card">
                <div className="checkbooking-table-responsive">
                    <Table hover className="checkbooking-table">
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>Customer</th>
                                <th>Contact</th>
                                <th>Court Details</th>
                                <th>Schedule</th>
                                <th>Payment Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id}>
                                    <td className="fw-bold text-primary">{booking.id}</td>
                                    <td>
                                        <div className="fw-bold">{booking.customerName}</div>
                                    </td>
                                    <td>
                                        <div className="text-muted small"><FaPhone className="me-1" />{booking.phone}</div>
                                    </td>
                                    <td>{booking.court}</td>
                                    <td>
                                        <div className="fw-bold">{booking.date}</div>
                                        <div className="small text-muted">{booking.time}</div>
                                    </td>
                                    <td>
                                        {getStatusBadge(booking.status)}
                                    </td>
                                    <td className="text-end">
                                        <div className="d-flex justify-content-end gap-2">
                                            <button
                                                className="checkbooking-action-btn view"
                                                title="View Details"
                                                onClick={() => handleView(booking)}
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                className="checkbooking-action-btn edit"
                                                title="Edit Booking"
                                                onClick={() => handleEdit(booking)}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="checkbooking-action-btn delete"
                                                title="Cancel Booking"
                                                onClick={() => handleShowCancel(booking)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredBookings.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center py-5 text-muted">
                                        No bookings found matching criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title></Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center pt-0 pb-4">
                    <div className="mb-3 text-danger">
                        <FaTimes size={40} className="rounded-circle border border-danger p-2" />
                    </div>
                    <h5 className="fw-bold mb-2">Cancel Booking?</h5>
                    <p className="text-muted">
                        Are you sure you want to cancel the booking for <strong>{bookingToCancel?.customerName}</strong>?
                        <br />Reference: {bookingToCancel?.id}
                    </p>
                    <div className="d-flex justify-content-center gap-2 mt-4">
                        <Button variant="light" onClick={() => setShowCancelModal(false)} className="px-4">No, Keep it</Button>
                        <Button variant="danger" onClick={confirmCancel} className="px-4">Yes, Cancel</Button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* View Modal */}
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Booking Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedBooking && (
                        <div className="p-2">
                            <Row className="mb-2">
                                <Col xs={5} className="text-muted fw-bold">Booking ID:</Col>
                                <Col xs={7}>{selectedBooking.id}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col xs={5} className="text-muted fw-bold">Customer:</Col>
                                <Col xs={7}>{selectedBooking.customerName}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col xs={5} className="text-muted fw-bold">Phone:</Col>
                                <Col xs={7}>{selectedBooking.phone}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col xs={5} className="text-muted fw-bold">Court:</Col>
                                <Col xs={7}>{selectedBooking.court}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col xs={5} className="text-muted fw-bold">Date & Time:</Col>
                                <Col xs={7}>{selectedBooking.date} at {selectedBooking.time}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col xs={5} className="text-muted fw-bold">Amount:</Col>
                                <Col xs={7}>₹{selectedBooking.amount}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col xs={5} className="text-muted fw-bold">Status:</Col>
                                <Col xs={7}>{getStatusBadge(selectedBooking.status)}</Col>
                            </Row>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowViewModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Booking</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveEdit}>
                    <Modal.Body>
                        {selectedBooking && (
                            <Row className="g-3">
                                <Col md={12}>
                                    <Form.Label>Customer Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="customerName"
                                        value={selectedBooking.customerName}
                                        onChange={handleEditChange}
                                    />
                                </Col>
                                <Col md={12}>
                                    <Form.Label>Phone Number</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="phone"
                                        value={selectedBooking.phone}
                                        onChange={handleEditChange}
                                    />
                                </Col>
                                <Col md={6}>
                                    <Form.Label>Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="date"
                                        value={selectedBooking.date}
                                        onChange={handleEditChange}
                                    />
                                </Col>
                                <Col md={6}>
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select
                                        name="status"
                                        value={selectedBooking.status}
                                        onChange={handleEditChange}
                                    >
                                        <option value="Paid">Fully Paid</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Advance">Advance</option>
                                    </Form.Select>
                                </Col>
                            </Row>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit">Save Changes</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default StaffCheckBooking;
