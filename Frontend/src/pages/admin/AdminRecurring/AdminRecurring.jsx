import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Modal, Form, InputGroup } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaPause, FaPlay, FaRupeeSign, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../../api/axiosInstance';
import './AdminRecurring.css';

const AdminRecurring = () => {
    // Courts configuration
    const [courts, setCourts] = useState([]);
    const [recurringBookings, setRecurringBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Map Backend <-> Frontend Enums
    const toFrontendDay = (d) => d.charAt(0) + d.slice(1).toLowerCase();
    const toBackendDay = (d) => d.toUpperCase();

    // Fetch Initial Data
    useEffect(() => {
        fetchCourts();
        fetchRecurringBookings();
    }, []);

    const fetchCourts = async () => {
        try {
            const { data } = await api.get('/courts');
            setCourts(data);
        } catch (error) {
            console.error('Error fetching courts:', error);
        }
    };

    const fetchRecurringBookings = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/recurring-bookings');
            setRecurringBookings(data.data || []);
        } catch (error) {
            console.error('Error fetching rules:', error);
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);
    const [bookingToDelete, setBookingToDelete] = useState(null);
    const [viewBooking, setViewBooking] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        courtId: '',
        sport: '', // Derived but stored for UI
        recurrenceType: 'WEEKLY',
        fixedDays: [],
        fixedTime: '', // Start Time
        endTime: '',   // End Time
        startDate: '',
        endDate: '',
        monthlyAmount: 0,
        amount: 0, // Total Amount per booking/month? Let's treat monthlyAmount as Total
        advancePaid: 0,
        discount: 0,
        discountType: 'NONE', // NONE, FLAT, PERCENT
        paymentStatus: 'PENDING'
    });

    const [balance, setBalance] = useState(0);

    // Calculate Balance Effect
    useEffect(() => {
        let total = Number(formData.monthlyAmount) || 0;
        let discount = Number(formData.discount) || 0;
        let advance = Number(formData.advancePaid) || 0;

        let finalTotal = total;
        if (formData.discountType === 'FLAT') {
            finalTotal = total - discount;
        } else if (formData.discountType === 'PERCENT') {
            finalTotal = total - (total * discount / 100);
        }

        setBalance(Math.max(0, finalTotal - advance));
    }, [formData.monthlyAmount, formData.advancePaid, formData.discount, formData.discountType]);


    // Handlers
    const handleClose = () => {
        setShowModal(false);
        setEditingBooking(null);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            customerName: '',
            phone: '',
            courtId: courts.length > 0 ? courts[0]._id : '',
            sport: courts.length > 0 ? courts[0].sportType : '',
            recurrenceType: 'WEEKLY',
            fixedDays: [],
            fixedTime: '',
            endTime: '',
            startDate: '',
            endDate: '',
            monthlyAmount: 0,
            advancePaid: 0,
            discount: 0,
            discountType: 'NONE',
            paymentStatus: 'PENDING'
        });
    };

    const handleShowAdd = () => {
        setEditingBooking(null);
        resetForm();
        // Set default court if available
        if (courts.length > 0) {
            setFormData(prev => ({
                ...prev,
                courtId: courts[0]._id,
                sport: courts[0].sportType
            }));
        }
        setShowModal(true);
    };

    const handleShowEdit = (booking) => {
        setEditingBooking(booking);
        setFormData({
            customerName: booking.customerName,
            phone: booking.customerPhone,
            courtId: booking.courtId?._id || booking.courtId,
            sport: booking.sportType,
            recurrenceType: booking.recurrenceType,
            fixedDays: booking.daysOfWeek?.map(toFrontendDay) || [],
            fixedTime: booking.startTime,
            endTime: booking.endTime,
            startDate: booking.startDate ? booking.startDate.split('T')[0] : '',
            endDate: booking.endDate ? booking.endDate.split('T')[0] : '',
            monthlyAmount: booking.monthlyAmount,
            advancePaid: booking.advancePaid || 0,
            discount: booking.discountValue || 0,
            discountType: booking.discountType || 'NONE',
            paymentStatus: booking.paymentStatus
        });
        setShowModal(true);
    };

    const handleShowView = (booking) => {
        setViewBooking(booking);
        setShowViewModal(true);
    }

    const handleCourtChange = (e) => {
        const courtId = e.target.value;
        const court = courts.find(c => c._id === courtId);
        setFormData(prev => ({
            ...prev,
            courtId,
            sport: court ? court.sportType : ''
        }));
    }

    // Auto-Calculate Price when Court, Time, or Days change
    useEffect(() => {
        // Require Start and End Date for calculation
        if (!formData.courtId || !formData.fixedTime || !formData.endTime || !formData.startDate || !formData.endDate) return;

        const court = courts.find(c => c._id === formData.courtId);
        if (!court) return;

        // Calculate Duration in Hours
        const [startH, startM] = formData.fixedTime.split(':').map(Number);
        const [endH, endM] = formData.endTime.split(':').map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        let durationMinutes = endTotal - startTotal;
        if (durationMinutes <= 0) return; // Invalid duration

        const durationHours = durationMinutes / 60;
        let totalPrice = 0;

        // Valid court prices
        const weekdayPrice = Number(court.weekdayPrice) || 0;
        const weekendPrice = Number(court.weekendPrice) || 0;

        if (formData.recurrenceType === 'WEEKLY' && formData.fixedDays.length > 0) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);

            // Iterate through every day in the range
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                // Get day name (Mon, Tue, ...)
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

                // Check if this booking day is selected
                if (formData.fixedDays.includes(dayName)) {
                    const isWeekend = dayName === 'Sat' || dayName === 'Sun';
                    const hourlyRate = isWeekend ? weekendPrice : weekdayPrice;
                    totalPrice += durationHours * hourlyRate;
                }
            }
        }

        setFormData(prev => ({
            ...prev,
            monthlyAmount: Math.round(totalPrice)
        }));

    }, [formData.courtId, formData.fixedTime, formData.endTime, formData.fixedDays, formData.recurrenceType, formData.startDate, formData.endDate, courts]);


    const handleDayToggle = (day) => {
        const currentDays = [...formData.fixedDays];
        const index = currentDays.indexOf(day);

        if (index > -1) {
            currentDays.splice(index, 1);
        } else {
            currentDays.push(day);
        }

        setFormData({ ...formData, fixedDays: currentDays });
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (formData.recurrenceType === 'WEEKLY' && formData.fixedDays.length === 0) {
            toast.error('Please select at least one day');
            return;
        }

        // 1. Check Availability First
        try {
            const checkPayload = {
                courtId: formData.courtId,
                startDate: formData.startDate,
                endDate: formData.endDate,
                startTime: formData.fixedTime,
                endTime: formData.endTime,
                daysOfWeek: formData.fixedDays.map(toBackendDay),
                recurrenceType: formData.recurrenceType
            };

            const availabilityRes = await api.post('/staff/calendar/check-availability', checkPayload);
            const { available, conflicts, checkedDates } = availabilityRes.data;

            if (!available) {
                if (conflicts.length === checkedDates) {
                    toast.error('Double Booking: This slot is ALREADY fully booked for all selected dates. Please choose another time.');
                    return;
                }

                // Partial conflicts - alert user
                const conflictDates = conflicts.slice(0, 3).map(c => c.date).join(', ');
                const moreCount = conflicts.length > 3 ? ` and ${conflicts.length - 3} more` : '';

                if (!window.confirm(`Warning: ${conflicts.length} dates are already booked (${conflictDates}${moreCount}). These dates will be SKIPPED. Do you want to continue?`)) {
                    return;
                }
            }
        } catch (error) {
            console.error('Availability check failed:', error);
            // If check fails (network etc), we might still allow submission but it's safer to block or warn
        }

        // 2. Prepare Payload for creation/update
        const payload = {
            customerName: formData.customerName,
            customerPhone: formData.phone,
            courtId: formData.courtId,
            sportType: formData.sport,
            recurrenceType: formData.recurrenceType, // WEEKLY
            daysOfWeek: formData.fixedDays.map(toBackendDay),
            startTime: formData.fixedTime,
            endTime: formData.endTime,
            startDate: formData.startDate,
            endDate: formData.endDate || null,
            monthlyAmount: Number(formData.monthlyAmount),
            advancePaid: Number(formData.advancePaid),
            discountValue: Number(formData.discount),
            discountType: Number(formData.discount) > 0 ? (formData.discountType === 'NONE' ? 'FLAT' : formData.discountType) : 'NONE',
            paymentStatus: formData.paymentStatus
        };

        try {
            if (editingBooking) {
                // Update
                await api.put(`/recurring-bookings/${editingBooking._id}`, payload);
                toast.success('Recurring booking updated successfully');
            } else {
                // Create
                await api.post('/recurring-bookings', payload);
                toast.success('Recurring booking created successfully');
            }
            fetchRecurringBookings();
            handleClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const togglePauseResume = async (booking) => {
        try {
            const newStatus = booking.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
            await api.patch(`/recurring-bookings/${booking._id}/status`, { status: newStatus });
            toast.success(`Booking ${newStatus === 'PAUSED' ? 'paused' : 'resumed'}`);
            fetchRecurringBookings();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update status');
        }
    };

    const handleShowDelete = (booking) => {
        setBookingToDelete(booking);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/recurring-bookings/${bookingToDelete._id}`);
            toast.success('Recurring booking deleted successfully');
            setShowDeleteModal(false);
            setBookingToDelete(null);
            fetchRecurringBookings();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete booking');
        }
    };

    // Calculate Due Balance for a booking object (Helpers)
    const getBalance = (booking) => {
        const total = booking.monthlyAmount || 0;
        const advance = booking.advancePaid || 0;
        const discountType = booking.discountType || 'NONE';
        const discountValue = booking.discountValue || 0;

        let finalTotal = total;
        if (discountType === 'FLAT') {
            finalTotal = total - discountValue;
        } else if (discountType === 'PERCENT') {
            finalTotal = total - (total * discountValue / 100);
        }
        return Math.max(0, finalTotal - advance);
    };

    return (
        <div className="adminrecurring-container rounded-4 shadow-sm">
            {/* Header */}
            <div className="adminrecurring-page-header">
                <div>
                    <h2 className="adminrecurring-title">Recurring Bookings</h2>
                    <p className="text-muted m-0 small">Manage weekly and monthly recurring court bookings</p>
                </div>
                <Button className="adminrecurring-btn-primary" onClick={handleShowAdd}>
                    <FaPlus className="me-2" /> Add Recurring Booking
                </Button>
            </div>

            {/* Table */}
            <div className="adminrecurring-table-container">
                <Table hover className="adminrecurring-table">
                    <thead>
                        <tr>
                            <th>Customer Name</th>
                            <th>Phone Number</th>
                            <th>Court</th>
                            <th>Recurrence</th>
                            <th>Time Slot</th>
                            <th>Total Amount</th>
                            <th>Payment Status</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recurringBookings.map((booking) => (
                            <tr key={booking._id} className={booking.status === 'PAUSED' ? 'paused' : ''}>
                                <td>
                                    <div className="fw-bold">{booking.customerName}</div>
                                </td>
                                <td>{booking.customerPhone}</td>
                                <td>
                                    <Badge bg="light" text="dark" className="border">
                                        {booking.courtId?.name || 'Unknown'}
                                    </Badge>
                                    {/* <div className="small text-muted">{booking.sportType}</div> */}
                                </td>
                                <td>
                                    <span className="adminrecurring-recurrence-badge">
                                        {booking.recurrenceType}
                                    </span>
                                </td>
                                <td className="fw-bold">{booking.startTime} - {booking.endTime}</td>
                                <td className="fw-bold text-success">
                                    ₹ {booking.monthlyAmount}
                                </td>
                                <td>
                                    <span className={`adminrecurring-badge ${booking.paymentStatus === 'PAID' ? 'adminrecurring-badge-paid' : 'adminrecurring-badge-pending'}`}>
                                        {booking.paymentStatus}
                                    </span>
                                </td>
                                <td>
                                    <span className={`adminrecurring-badge ${booking.status === 'ACTIVE' ? 'adminrecurring-badge-active' : 'adminrecurring-badge-paused'}`}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="d-flex">
                                        <button
                                            className="adminrecurring-action-btn view"
                                            title="View Details"
                                            onClick={() => handleShowView(booking)}
                                        >
                                            <FaEye />
                                        </button>
                                        <button
                                            className="adminrecurring-action-btn edit"
                                            title="Edit"
                                            onClick={() => handleShowEdit(booking)}
                                        >
                                            <FaEdit />
                                        </button>

                                        {booking.status === 'ACTIVE' ? (
                                            <button
                                                className="adminrecurring-action-btn pause"
                                                title="Pause"
                                                onClick={() => togglePauseResume(booking)}
                                            >
                                                <FaPause />
                                            </button>
                                        ) : (
                                            <button
                                                className="adminrecurring-action-btn play"
                                                title="Resume"
                                                onClick={() => togglePauseResume(booking)}
                                            >
                                                <FaPlay />
                                            </button>
                                        )}

                                        <button
                                            className="adminrecurring-action-btn delete"
                                            title="Delete"
                                            onClick={() => handleShowDelete(booking)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {recurringBookings.length === 0 && !loading && (
                            <tr>
                                <td colSpan="9" className="text-center py-4 text-muted">
                                    No recurring bookings found. Add one to get started.
                                </td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan="9" className="text-center py-4 text-muted">
                                    Loading...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={handleClose} centered backdrop="static" size="lg">
                <Modal.Header closeButton className="adminrecurring-modal-header">
                    <Modal.Title className="fw-bold">
                        {editingBooking ? 'Edit Recurring Booking' : 'Add Recurring Booking'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body className="p-4">
                        {/* ... Existing Modal Content ... */}
                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <Form.Label className="adminrecurring-form-label">
                                    Customer Name <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter customer name"
                                    required
                                    value={formData.customerName}
                                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6">
                                <Form.Label className="adminrecurring-form-label">
                                    Phone Number <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="tel"
                                    placeholder="10-digit mobile number"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <Form.Label className="adminrecurring-form-label">Court</Form.Label>
                                <Form.Select
                                    value={formData.courtId}
                                    onChange={handleCourtChange}
                                >
                                    <option value="" disabled>Select Court</option>
                                    {courts.map(court => (
                                        <option key={court._id} value={court._id}>{court.name}</option>
                                    ))}
                                </Form.Select>
                            </div>
                            <div className="col-md-6">
                                <Form.Label className="adminrecurring-form-label">Sport</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.sport}
                                    readOnly
                                    className="bg-light"
                                />
                            </div>
                        </div>

                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <Form.Label className="adminrecurring-form-label">Recurrence Type</Form.Label>
                                <Form.Select
                                    value={formData.recurrenceType}
                                    onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value })}
                                >
                                    <option value="WEEKLY">Weekly</option>
                                </Form.Select>
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label className="adminrecurring-form-label">
                                Fixed Day(s) <span className="text-danger">*</span>
                            </Form.Label>
                            <div className="adminrecurring-day-selector">
                                {daysOfWeek.map(day => (
                                    <div key={day}>
                                        <input
                                            type="checkbox"
                                            id={`day-${day}`}
                                            className="adminrecurring-day-checkbox"
                                            checked={formData.fixedDays.includes(day)}
                                            onChange={() => handleDayToggle(day)}
                                        />
                                        <label htmlFor={`day-${day}`} className="adminrecurring-day-label">
                                            {day}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </Form.Group>

                        <div className="row g-3 mb-3">
                            <div className="col-md-3">
                                <Form.Label className="adminrecurring-form-label">
                                    Start Time <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="time"
                                    required
                                    value={formData.fixedTime}
                                    onChange={(e) => setFormData({ ...formData, fixedTime: e.target.value })}
                                />
                            </div>
                            <div className="col-md-3">
                                <Form.Label className="adminrecurring-form-label">
                                    End Time <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="time"
                                    required
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </div>
                            <div className="col-md-3">
                                <Form.Label className="adminrecurring-form-label">
                                    Start Date <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div className="col-md-3">
                                <Form.Label className="adminrecurring-form-label">End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <hr className="my-4" />
                        <h6 className="mb-3 text-primary">Payment Details</h6>

                        <div className="row g-3 mb-3">
                            <div className="col-md-4">
                                <Form.Label className="adminrecurring-form-label">
                                    Total Amount <span className="text-danger">*</span>
                                </Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><FaRupeeSign size={12} /></InputGroup.Text>
                                    <Form.Control
                                        type="number"
                                        placeholder="0.00"
                                        required
                                        min="0"
                                        value={formData.monthlyAmount}
                                        onChange={(e) => setFormData({ ...formData, monthlyAmount: e.target.value })}
                                    />
                                </InputGroup>
                            </div>
                            <div className="col-md-4">
                                <Form.Label className="adminrecurring-form-label">
                                    Discount
                                </Form.Label>
                                <div className="d-flex gap-2">
                                    <Form.Control
                                        type="number"
                                        placeholder="Discount"
                                        min="0"
                                        value={formData.discount}
                                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                    />
                                    <Form.Select
                                        style={{ width: '90px' }}
                                        value={formData.discountType}
                                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                    >
                                        <option value="NONE">None</option>
                                        <option value="FLAT">Flat</option>
                                        <option value="PERCENT">%</option>
                                    </Form.Select>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <Form.Label className="adminrecurring-form-label">
                                    Advance Paid
                                </Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><FaRupeeSign size={12} /></InputGroup.Text>
                                    <Form.Control
                                        type="number"
                                        placeholder="0.00"
                                        min="0"
                                        value={formData.advancePaid}
                                        onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })}
                                    />
                                </InputGroup>
                            </div>
                        </div>

                        <div className="row g-3 mb-3 align-items-end">
                            <div className="col-md-6">
                                <Form.Label className="adminrecurring-form-label">Payment Status</Form.Label>
                                <Form.Select
                                    value={formData.paymentStatus}
                                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                                >
                                    <option value="PENDING">Pending</option>
                                    <option value="PAID">Paid</option>
                                    <option value="PARTIAL">Partial</option>
                                </Form.Select>
                            </div>
                            <div className="col-md-6 text-end">
                                <div className="bg-light p-2 rounded border">
                                    <span className="text-muted small me-2">Remaining Balance:</span>
                                    <span className={`fw-bold fs-5 ${balance > 0 ? 'text-danger' : 'text-success'}`}>
                                        ₹ {balance.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </Modal.Body>
                    <Modal.Footer className="adminrecurring-modal-footer">
                        <Button variant="light" onClick={handleClose}>Cancel</Button>
                        <Button type="submit" className="adminrecurring-btn-primary px-4">
                            {editingBooking ? 'Update Booking' : 'Create Booking'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* View Details Modal */}
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg">
                <Modal.Header closeButton className="adminrecurring-modal-header">
                    <Modal.Title className="fw-bold">Booking Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {viewBooking && (
                        <div>
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <h6 className="text-muted small text-uppercase">Customer Info</h6>
                                    <div className="fw-bold fs-5">{viewBooking.customerName}</div>
                                    <div className="text-muted">{viewBooking.customerPhone}</div>
                                </div>
                                <div className="col-md-6 text-end">
                                    <Badge bg={viewBooking.status === 'ACTIVE' ? 'success' : 'danger'}>
                                        {viewBooking.status}
                                    </Badge>
                                </div>
                            </div>

                            <hr className="text-muted opacity-25" />

                            <div className="row gy-4">
                                <div className="col-md-4">
                                    <label className="text-muted small d-block">Court Details</label>
                                    <div className="fw-bold">{viewBooking.courtId?.name || 'Unknown'}</div>
                                    <div className="small text-muted">{viewBooking.sportType}</div>
                                </div>
                                <div className="col-md-4">
                                    <label className="text-muted small d-block">Time Slot</label>
                                    <div className="fw-bold">{viewBooking.startTime} - {viewBooking.endTime}</div>
                                </div>
                                <div className="col-md-4">
                                    <label className="text-muted small d-block">Recurrence</label>
                                    <div className="fw-bold mb-1">{viewBooking.recurrenceType}</div>
                                    <div className="d-flex gap-1 flex-wrap">
                                        {viewBooking.daysOfWeek?.map(toFrontendDay).map(day => (
                                            <Badge key={day} className="fw-normal booking-badge">
                                                {day}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <label className="text-muted small d-block">Start Date</label>
                                    <div className="fw-bold">{new Date(viewBooking.startDate).toLocaleDateString()}</div>
                                </div>
                                <div className="col-md-4">
                                    <label className="text-muted small d-block">End Date</label>
                                    <div className="fw-bold">
                                        {viewBooking.endDate ? new Date(viewBooking.endDate).toLocaleDateString() : 'Ongoing'}
                                    </div>
                                </div>
                            </div>

                            <hr className="text-muted opacity-25" />
                            <h6 className="text-primary mb-3">Financials</h6>

                            <div className="row gy-3">
                                <div className="col-md-3">
                                    <label className="text-muted small d-block">Total Amount</label>
                                    <div className="fw-bold">₹ {viewBooking.monthlyAmount}</div>
                                </div>
                                <div className="col-md-3">
                                    <label className="text-muted small d-block">Discount</label>
                                    <div className="fw-bold">
                                        {viewBooking.discountValue > 0 ? (
                                            `₹ ${viewBooking.discountValue} (${viewBooking.discountType})`
                                        ) : 'None'}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <label className="text-muted small d-block">Advance Paid</label>
                                    <div className="fw-bold text-success">₹ {viewBooking.advancePaid || 0}</div>
                                </div>
                                <div className="col-md-3">
                                    <label className="text-muted small d-block">Due Payment</label>
                                    <div className="fw-bold text-danger">₹ {getBalance(viewBooking).toFixed(2)}</div>
                                </div>
                                <div className="col-md-12 mt-3">
                                    <label className="text-muted small me-2">Payment Status:</label>
                                    <span className={`adminrecurring-badge ${viewBooking.paymentStatus === 'PAID' ? 'adminrecurring-badge-paid' : 'adminrecurring-badge-pending'}`}>
                                        {viewBooking.paymentStatus}
                                    </span>
                                </div>
                            </div>

                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowViewModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title></Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center pt-0 pb-4">
                    <div className="mb-3 text-danger">
                        <FaTrash size={40} />
                    </div>
                    <h5 className="fw-bold mb-2">Delete Recurring Booking?</h5>
                    <p className="text-muted">
                        Are you sure you want to delete the recurring booking for{' '}
                        <strong>{bookingToDelete?.customerName}</strong>?
                        <br />
                        This will stop all future auto-generated bookings.
                    </p>
                    <div className="d-flex justify-content-center gap-2 mt-4">
                        <Button variant="light" onClick={() => setShowDeleteModal(false)} className="px-4">
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmDelete} className="px-4">
                            Delete
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default AdminRecurring;
