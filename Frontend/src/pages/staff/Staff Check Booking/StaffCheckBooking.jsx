import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Badge, Modal, Form, Row, Col, Spinner } from 'react-bootstrap';
import { FaCalendarAlt, FaFilter, FaSearch, FaEye, FaEdit, FaTrash, FaTimes, FaPhone, FaTimesCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './StaffCheckBooking.css';
import bookingListService from '../../../api/bookingListService';
import courtService from '../../../api/courtService';

const StaffCheckBooking = () => {
    // Filters State
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        courtId: 'All',
        status: 'All'
    });

    const [loading, setLoading] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [courts, setCourts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [saving, setSaving] = useState(false);

    // Fetch Bookings
    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.date) params.date = filters.date;
            if (filters.courtId !== 'All') params.courtId = filters.courtId;
            if (filters.status !== 'All') params.paymentStatus = filters.status;

            const response = await bookingListService.getBookings(params);
            if (response.success) {
                setBookings(response.data);
            }
        } catch (error) {
            console.error('Booking fetch error:', error);
            toast.error('Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Fetch Courts for filter
    useEffect(() => {
        const fetchCourts = async () => {
            try {
                const data = await courtService.getCourts();
                console.log('Detected Courts Data:', data);

                // Extremely robust data extraction
                let extractedCourts = [];
                if (Array.isArray(data)) {
                    extractedCourts = data;
                } else if (data && Array.isArray(data.data)) {
                    extractedCourts = data.data;
                } else if (data && data.courts && Array.isArray(data.courts)) {
                    extractedCourts = data.courts;
                }

                if (extractedCourts.length > 0) {
                    setCourts(extractedCourts);
                } else {
                    console.warn('No courts found in API response');
                }
            } catch (error) {
                console.error('Court fetch error:', error);
                toast.error('Failed to load courts for dropdown');
            }
        };
        fetchCourts();
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleView = async (booking) => {
        try {
            const response = await bookingListService.getBookingById(booking.bookingId);
            if (response.success) {
                setSelectedBooking(response.data);
                setShowViewModal(true);
            }
        } catch (error) {
            toast.error('Failed to load booking details');
        }
    };

    const handleEdit = async (booking) => {
        try {
            const response = await bookingListService.getBookingById(booking.bookingId);
            if (response.success) {
                const b = response.data;
                setSelectedBooking({
                    bookingId: b._id,
                    customerName: b.customerName,
                    customerPhone: b.customerPhone,
                    date: b.bookingDate.split('T')[0],
                    startTime: b.startTime,
                    endTime: b.endTime,
                    advancePaid: b.payment?.advancePaid || 0,
                    totalAmount: b.finalAmount
                });
                setShowEditModal(true);
            }
        } catch (error) {
            toast.error('Failed to load booking details');
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await bookingListService.updateBooking(selectedBooking.bookingId, {
                customerName: selectedBooking.customerName,
                customerPhone: selectedBooking.customerPhone,
                startTime: selectedBooking.startTime,
                endTime: selectedBooking.endTime,
                advancePaid: Number(selectedBooking.advancePaid)
            });
            if (response.success) {
                toast.success('Booking updated successfully');
                setShowEditModal(false);
                fetchBookings();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update booking');
        } finally {
            setSaving(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setSelectedBooking(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleShowDelete = (booking) => {
        setBookingToDelete(booking);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!bookingToDelete) return;
        setSaving(true);
        try {
            const response = await bookingListService.deleteBooking(bookingToDelete.bookingId);
            if (response.success) {
                toast.success('Booking deleted permanently');
                setShowDeleteModal(false);
                fetchBookings();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete booking');
        } finally {
            setSaving(false);
        }
    };

    const filteredBookings = bookings.filter(booking => {
        const search = searchTerm.toLowerCase();
        return booking.customerName.toLowerCase().includes(search) ||
            booking.bookingId.toLowerCase().includes(search) ||
            booking.phoneNumber.includes(search);
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PAID': return <span className="checkbooking-badge paid">Fully Paid</span>;
            case 'BALANCE_PENDING': return <span className="checkbooking-badge pending">Balance Pending</span>;
            case 'ADVANCE_PENDING': return <span className="checkbooking-badge advance">Advance Only</span>;
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
                    <Button variant="outline-dark" className="checkbooking-btn-clear" onClick={() => setFilters({ date: new Date().toISOString().split('T')[0], courtId: 'All', status: 'All' })}>
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
                    name="courtId"
                    value={filters.courtId}
                    onChange={handleFilterChange}
                    style={{ width: 'auto' }}
                >
                    <option value="All">All Courts</option>
                    {courts.map(court => (
                        <option key={court._id} value={court._id}>
                            {court.name} ({court.sportType})
                        </option>
                    ))}
                </Form.Select>

                <Form.Select
                    className="checkbooking-filter-input"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    style={{ width: 'auto' }}
                >
                    <option value="All">All Payment Status</option>
                    <option value="PAID">Fully Paid</option>
                    <option value="BALANCE_PENDING">Balance Pending</option>
                    <option value="ADVANCE_PENDING">Advance Only</option>
                </Form.Select>

                <div className="ms-auto position-relative">
                    <FaSearch className="position-absolute text-muted top-50 start-0 translate-middle-y ms-3" />
                    <Form.Control
                        type="search"
                        placeholder="Search ID or Name..."
                        className="checkbooking-filter-input ps-5"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Bookings Table */}
            <div className="checkbooking-card">
                <div className="checkbooking-table-responsive">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 text-muted">Loading bookings...</p>
                        </div>
                    ) : (
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
                                    <tr key={booking.bookingId}>
                                        <td className="fw-bold text-primary">#{booking.bookingId.slice(-6).toUpperCase()}</td>
                                        <td>
                                            <div className="fw-bold">{booking.customerName}</div>
                                            {booking.status === 'CANCELLED' && <Badge bg="danger" className="ms-1">Cancelled</Badge>}
                                        </td>
                                        <td>
                                            <div className="text-muted small"><FaPhone className="me-1" />{booking.phoneNumber}</div>
                                        </td>
                                        <td>{booking.courtName}</td>
                                        <td>
                                            <div className="fw-bold">{booking.bookingDate}</div>
                                            <div className="small text-muted">{booking.timeSlot}</div>
                                        </td>
                                        <td>
                                            {getStatusBadge(booking.paymentStatus)}
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
                                                {booking.status !== 'CANCELLED' && (
                                                    <button
                                                        className="checkbooking-action-btn delete"
                                                        title="Delete Booking"
                                                        onClick={() => handleShowDelete(booking)}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )}
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
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Body className="text-center pt-4 pb-4">
                    <div className="mb-3 text-danger">
                        <FaTimesCircle size={50} />
                    </div>
                    <h5 className="fw-bold mb-2">Delete Booking?</h5>
                    <p className="text-muted">
                        Are you sure you want to permanently delete the booking for <strong>{bookingToDelete?.customerName}</strong>?
                        <br />Reference: #{bookingToDelete?.bookingId.slice(-6).toUpperCase()}
                        <br /><small className="text-danger">This will remove all associated slots and payment data!</small>
                    </p>
                    <div className="d-flex justify-content-center gap-2 mt-4">
                        <Button variant="light" onClick={() => setShowDeleteModal(false)} disabled={saving}>Cancel</Button>
                        <Button variant="danger" onClick={confirmDelete} disabled={saving}>
                            {saving ? <Spinner animation="border" size="sm" /> : 'Yes, Delete'}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* View Modal */}
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="md">
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="fw-bold">Booking Breakdown</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedBooking && (
                        <div className="p-1">
                            <div className="mb-4">
                                <h6 className="fw-bold border-bottom pb-2 mb-3 text-primary">General Information</h6>
                                <Row className="mb-2">
                                    <Col xs={5} className="text-muted small fw-bold">Booking ID:</Col>
                                    <Col xs={7} className="small">#{selectedBooking._id}</Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col xs={5} className="text-muted small fw-bold">Customer:</Col>
                                    <Col xs={7} className="small fw-bold">{selectedBooking.customerName}</Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col xs={5} className="text-muted small fw-bold">Phone:</Col>
                                    <Col xs={7} className="small">{selectedBooking.customerPhone}</Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col xs={5} className="text-muted small fw-bold">Court:</Col>
                                    <Col xs={7} className="small">{selectedBooking.courtId?.name}</Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col xs={5} className="text-muted small fw-bold">Schedule:</Col>
                                    <Col xs={7} className="small">{new Date(selectedBooking.bookingDate).toLocaleDateString()} | {selectedBooking.startTime} - {selectedBooking.endTime}</Col>
                                </Row>
                            </div>

                            <div>
                                <h6 className="fw-bold border-bottom pb-2 mb-3 text-success">Payment Breakdown</h6>
                                <Row className="mb-2">
                                    <Col xs={5} className="text-muted small fw-bold">Total Amount:</Col>
                                    <Col xs={7} className="small fw-bold">₹{selectedBooking.finalAmount}</Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col xs={5} className="text-muted small fw-bold text-success">Advance Paid:</Col>
                                    <Col xs={7} className="small text-success fw-bold">₹{selectedBooking.payment?.advancePaid || 0}</Col>
                                </Row>
                                <hr />
                                <Row className="mb-2">
                                    <Col xs={5} className="text-muted small fw-bold text-danger">Due Balance:</Col>
                                    <Col xs={7} className="small text-danger fw-bold h6 mb-0">₹{selectedBooking.payment?.balanceAmount || 0}</Col>
                                </Row>
                                <Row className="mt-3">
                                    <Col xs={5} className="text-muted small fw-bold">Payment Status:</Col>
                                    <Col xs={7}>{getStatusBadge(selectedBooking.payment?.balanceAmount === 0 ? 'PAID' : (selectedBooking.payment?.advancePaid > 0 ? 'BALANCE_PENDING' : 'ADVANCE_PENDING'))}</Col>
                                </Row>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="secondary" onClick={() => setShowViewModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">Edit Booking</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveEdit}>
                    <Modal.Body>
                        {selectedBooking && (
                            <Row className="g-3">
                                <Col md={12}>
                                    <Form.Label className="small fw-bold">Customer Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="customerName"
                                        value={selectedBooking.customerName}
                                        onChange={handleEditChange}
                                        required
                                    />
                                </Col>
                                <Col md={12}>
                                    <Form.Label className="small fw-bold">Phone Number</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="customerPhone"
                                        value={selectedBooking.customerPhone}
                                        onChange={handleEditChange}
                                        required
                                    />
                                </Col>
                                <Col md={6}>
                                    <Form.Label className="small fw-bold">Start Time</Form.Label>
                                    <Form.Control
                                        type="time"
                                        name="startTime"
                                        value={selectedBooking.startTime}
                                        onChange={handleEditChange}
                                        required
                                    />
                                </Col>
                                <Col md={6}>
                                    <Form.Label className="small fw-bold">End Time</Form.Label>
                                    <Form.Control
                                        type="time"
                                        name="endTime"
                                        value={selectedBooking.endTime}
                                        onChange={handleEditChange}
                                        required
                                    />
                                </Col>
                                <Col md={12}>
                                    <Form.Label className="small fw-bold text-success">Advance Payment (₹)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="advancePaid"
                                        value={selectedBooking.advancePaid}
                                        onChange={handleEditChange}
                                        max={selectedBooking.totalAmount}
                                    />
                                    <Form.Text className="text-muted">
                                        Total Price: ₹{selectedBooking.totalAmount}
                                    </Form.Text>
                                </Col>
                            </Row>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowEditModal(false)} disabled={saving}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default StaffCheckBooking;
