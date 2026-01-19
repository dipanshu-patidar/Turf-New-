import React, { useState, useEffect } from 'react';
import { Table, Form, InputGroup, Button, Row, Col, Badge, Modal, Card } from 'react-bootstrap';
import { FaFilter, FaSearch, FaTimes, FaCalendarAlt, FaEdit, FaTrash, FaExclamationTriangle, FaSave } from 'react-icons/fa';
import api from '../../../api/axiosInstance';
import './AdminBookingList.css';
import toast from 'react-hot-toast';

const AdminBookingList = () => {
    // --- State ---
    const [bookings, setBookings] = useState([]);
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Filter State
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        courtId: '',
        paymentStatus: '',
        search: ''
    });

    // Edit Form State
    const [editFormData, setEditFormData] = useState({
        customerName: '',
        customerPhone: '',
        sport: '',
        courtId: '',
        date: '',
        startTime: '',
        endTime: '',
        advancePaid: 0,
        paymentMode: 'CASH',
        notes: '',
        status: 'BOOKED',
        paymentStatus: 'PARTIAL', // Added paymentStatus
        discount: 0,
        discountType: 'NONE'
    });

    const [editPricing, setEditPricing] = useState({
        totalPrice: 0,
        finalAmount: 0,
        remainingBalance: 0,
        duration: '',
        hourlyRate: 0,
        dayType: ''
    });

    // --- Effects ---
    useEffect(() => {
        fetchCourts();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBookings();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters]);

    // Recalculate pricing when edit fields change
    useEffect(() => {
        if (!showEditModal || !editFormData.courtId || !editFormData.date || !editFormData.startTime || !editFormData.endTime) return;

        const selectedCourt = courts.find(c => c._id === editFormData.courtId);
        if (!selectedCourt) return;

        const dateObj = new Date(editFormData.date);
        const day = dateObj.getDay();
        const isWeekend = (day === 0 || day === 6);
        const dayType = isWeekend ? 'Weekend' : 'Weekday';
        const hourlyRate = isWeekend ? selectedCourt.weekendPrice : selectedCourt.weekdayPrice;

        const start = new Date(`1970-01-01T${editFormData.startTime}:00`);
        const end = new Date(`1970-01-01T${editFormData.endTime}:00`);

        let diffMinutes = (end - start) / 60000;
        if (diffMinutes < 0) diffMinutes += 24 * 60; // Handle overnight if needed (though UI prevents usually)

        const calculatedPrice = Math.ceil((hourlyRate / 60) * diffMinutes);

        // Simple Discount Logic (Flat for now based on previous UI)
        let discount = Number(editFormData.discount) || 0;
        let finalPayable = Math.max(0, calculatedPrice - discount);

        setEditPricing({
            totalPrice: calculatedPrice,
            finalAmount: finalPayable,
            remainingBalance: Math.max(0, finalPayable - Number(editFormData.advancePaid)),
            duration: `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`,
            hourlyRate,
            dayType
        });

    }, [editFormData.courtId, editFormData.date, editFormData.startTime, editFormData.endTime, editFormData.advancePaid, editFormData.discount, showEditModal, courts]);


    // --- API Calls ---
    const fetchCourts = async () => {
        try {
            const response = await api.get('/courts');
            setCourts(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.date) params.append('date', filters.date);
            if (filters.courtId) params.append('courtId', filters.courtId);
            if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
            if (filters.search) params.append('search', filters.search);

            const response = await api.get(`/admin/bookings?${params.toString()}`);
            setBookings(response.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            date: '',
            courtId: '',
            paymentStatus: '',
            search: ''
        });
    };

    const handleDeleteClick = (booking) => {
        setSelectedBooking(booking);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/admin/bookings/${selectedBooking._id}`);
            toast.success('Booking deleted successfully');
            setShowDeleteModal(false);
            fetchBookings();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete booking');
        }
    };

    const handleEditClick = (booking) => {
        setSelectedBooking(booking);
        // Pre-fill form
        setEditFormData({
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            sport: booking.sportType,
            courtId: booking.courtId?._id || booking.courtId, // Handle populated or not
            date: new Date(booking.bookingDate).toISOString().split('T')[0],
            startTime: booking.startTime,
            endTime: booking.endTime,
            advancePaid: booking.paymentDetails?.advancePaid || 0,
            paymentMode: booking.paymentDetails?.paymentMode || 'CASH',
            notes: booking.paymentDetails?.paymentNotes || '',
            paymentStatus: booking.paymentStatus, // Populate status
            status: booking.status,
            discount: booking.discountValue || 0,
            discountType: booking.discountType || 'NONE'
        });
        setShowEditModal(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Auto-update sport if court changes
        if (name === 'courtId') {
            const court = courts.find(c => c._id === value);
            if (court) {
                setEditFormData(prev => ({ ...prev, sport: court.sportType }));
            }
        }
    };

    const handleUpdateBooking = async () => {
        try {
            const payload = {
                ...editFormData,
                sportType: editFormData.sport, // field name match
                bookingDate: editFormData.date, // field name match
                discountValue: editFormData.discount,
                discountType: Number(editFormData.discount) > 0 ? 'FLAT' : 'NONE', // Simplify logic
            };

            // Remove helper fields not needed by API directly if any, or API ignores them

            await api.put(`/admin/bookings/${selectedBooking._id}`, payload);
            toast.success('Booking updated successfully');
            setShowEditModal(false);
            fetchBookings();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update booking');
        }
    };

    return (
        <div className="adminbookinglist-container">
            {/* Header & Filters */}
            <div className="adminbookinglist-page-header">
                <div>
                    <h2 className="adminbookinglist-title">Bookings List</h2>
                    <p className="text-muted m-0 small">View and manage all reservations</p>
                </div>
                <Button variant="outline-dark" size="sm" onClick={clearFilters}>
                    <FaTimes className="me-2" /> Clear Filters
                </Button>
            </div>

            <div className="adminbookinglist-filters">
                <Row className="g-3 align-items-center">
                    <Col md="auto" className="d-flex align-items-center text-muted fw-bold">
                        <FaFilter className="me-2" /> Filters:
                    </Col>
                    <Col md="auto">
                        <InputGroup size="sm">
                            <InputGroup.Text className="bg-white border-end-0"><FaCalendarAlt className="text-muted" /></InputGroup.Text>
                            <Form.Control type="date" name="date" value={filters.date} onChange={handleFilterChange} className="border-start-0 ps-0" />
                        </InputGroup>
                    </Col>
                    <Col md="auto">
                        <Form.Select size="sm" name="courtId" value={filters.courtId} onChange={handleFilterChange}>
                            <option value="">All Courts</option>
                            {courts.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </Form.Select>
                    </Col>
                    <Col md="auto">
                        <Form.Select size="sm" name="paymentStatus" value={filters.paymentStatus} onChange={handleFilterChange}>
                            <option value="">All Payment Status</option>
                            <option value="PAID">Paid</option>
                            <option value="PARTIAL">Partial</option>
                        </Form.Select>
                    </Col>
                    <Col className="ms-auto">
                        <InputGroup size="sm">
                            <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-muted" /></InputGroup.Text>
                            <Form.Control type="text" placeholder="Search..." name="search" value={filters.search} onChange={handleFilterChange} className="border-start-0" />
                        </InputGroup>
                    </Col>
                </Row>
            </div>

            {/* Table */}
            <div className="adminbookinglist-table-container">
                <Table hover responsive className="adminbookinglist-table mb-0">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Court</th>
                            <th>Schedule</th>
                            <th>Payment Status</th>
                            <th>Balance</th>
                            <th>Booking Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => (
                            <tr key={booking._id}>
                                <td><span className="booking-id-text">#{booking._id.slice(-6).toUpperCase()}</span></td>
                                <td>
                                    <div className="fw-bold">{booking.customerName}</div>
                                    <small className="text-muted">{booking.customerPhone}</small>
                                </td>
                                <td>
                                    <div>{booking.courtId?.name || 'Unknown'}</div>
                                    <small className="text-muted">{booking.sportType}</small>
                                </td>
                                <td>
                                    <div>{new Date(booking.bookingDate).toLocaleDateString()}</div>
                                    <small className="text-muted">{booking.startTime} - {booking.endTime}</small>
                                </td>
                                <td>
                                    <span className={`adminbookinglist-badge badge-${booking.paymentStatus?.toLowerCase()} me-2`}>{booking.paymentStatus}</span>
                                </td>
                                <td>
                                    <span className={`fw-bold ${booking.paymentStatus === 'PAID' ? 'text-success' :
                                            booking.paymentStatus === 'PARTIAL' ? 'text-warning' :
                                                booking.paymentStatus === 'PENDING' ? 'text-danger' :
                                                    'text-muted'
                                        }`}>
                                        ₹{booking.paymentDetails?.balanceAmount || 0}
                                    </span>
                                </td>
                                <td>
                                    <span className={`adminbookinglist-badge badge-${booking.status.toLowerCase()}`}>{booking.status}</span>
                                </td>
                                <td>
                                    <Button variant="light" size="sm" className="text-primary me-2" onClick={() => handleEditClick(booking)}><FaEdit /></Button>
                                    <Button variant="light" size="sm" className="text-danger" onClick={() => handleDeleteClick(booking)}><FaTrash /></Button>
                                </td>
                            </tr>
                        ))}
                        {bookings.length === 0 && !loading && (
                            <tr>
                                <td colSpan="8" className="text-center py-5 text-muted">No bookings found matching criteria.</td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan="8" className="text-center py-5 text-muted">Loading Bookings...</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            {/* Delete Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton><Modal.Title className="text-danger"><FaExclamationTriangle /> Confirm Delete</Modal.Title></Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this booking?
                    <br />
                    <small className="text-muted">This action allows getting slots back, but permanently removes this record.</small>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={confirmDelete}>Delete</Button>
                </Modal.Footer>
            </Modal>

            {/* Full Edit Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Booking Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <h6 className="mb-3 text-muted">Customer & Court Details</h6>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Customer Name</Form.Label>
                                    <Form.Control type="text" name="customerName" value={editFormData.customerName} onChange={handleEditFormChange} />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Phone Number</Form.Label>
                                    <Form.Control type="text" name="customerPhone" value={editFormData.customerPhone} onChange={handleEditFormChange} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Select Court</Form.Label>
                                    <Form.Select name="courtId" value={editFormData.courtId} onChange={handleEditFormChange}>
                                        {courts.map(c => <option key={c._id} value={c._id}>{c.name} ({c.sportType})</option>)}
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Booking Status</Form.Label>
                                    <Form.Select name="status" value={editFormData.status} onChange={handleEditFormChange}>
                                        <option value="BOOKED">BOOKED</option>
                                        <option value="COMPLETED">COMPLETED</option>
                                        <option value="CANCELLED">CANCELLED</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <h6 className="mb-3 text-muted">Schedule</h6>
                        <Row className="mb-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Date</Form.Label>
                                    <Form.Control type="date" name="date" value={editFormData.date} onChange={handleEditFormChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Start Time</Form.Label>
                                    <Form.Control type="time" name="startTime" value={editFormData.startTime} onChange={handleEditFormChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>End Time</Form.Label>
                                    <Form.Control type="time" name="endTime" value={editFormData.endTime} onChange={handleEditFormChange} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <h6 className="mb-3 text-muted mt-4">Payment & Pricing (Auto-Calculated)</h6>
                        <Row>
                            <Col md={6}>
                                <Card className="bg-light border-0 mb-3">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Duration:</span>
                                            <span className="fw-bold">{editPricing.duration}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Rate ({editPricing.dayType}):</span>
                                            <span className="fw-bold">₹{editPricing.hourlyRate}/hr</span>
                                        </div>
                                        <div className="d-flex justify-content-between border-top pt-2">
                                            <span>Total Amount:</span>
                                            <span className="fw-bold text-primary">₹{editPricing.totalPrice}</span>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Payment Status (Manual Override)</Form.Label>
                                    <Form.Select name="paymentStatus" value={editFormData.paymentStatus} onChange={handleEditFormChange}>
                                        <option value="PAID">PAID</option>
                                        <option value="PARTIAL">PARTIAL</option>
                                        <option value="PENDING">PENDING</option>
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Discount (Flat)</Form.Label>
                                    <Form.Control type="number" name="discount" value={editFormData.discount} onChange={handleEditFormChange} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Advance Paid</Form.Label>
                                    <Form.Control type="number" name="advancePaid" value={editFormData.advancePaid} onChange={handleEditFormChange} />
                                </Form.Group>
                                <div className="d-flex justify-content-between align-items-center bg-white p-2 border rounded">
                                    <span>Balance:</span>
                                    <span className={`fw-bold fs-5 ${editPricing.remainingBalance > 0 ? 'text-danger' : 'text-success'}`}>
                                        ₹{editPricing.remainingBalance}
                                    </span>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleUpdateBooking}>
                        <FaSave className="me-2" /> Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AdminBookingList;
