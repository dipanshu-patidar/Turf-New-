import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Modal, Form, InputGroup } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaPause, FaPlay, FaRupeeSign, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../../api/axiosInstance';
import './StaffRecurringBooking.css';

const StaffRecurringBooking = () => {
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
        sport: '',
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

    // Auto-Calculate Price
    useEffect(() => {
        if (!formData.courtId || !formData.fixedTime || !formData.endTime || !formData.startDate || !formData.endDate) return;

        const court = courts.find(c => c._id === formData.courtId);
        if (!court) return;

        const [startH, startM] = formData.fixedTime.split(':').map(Number);
        const [endH, endM] = formData.endTime.split(':').map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        let durationMinutes = endTotal - startTotal;
        if (durationMinutes <= 0) return;

        const durationHours = durationMinutes / 60;
        let totalPrice = 0;

        const weekdayPrice = Number(court.weekdayPrice) || 0;
        const weekendPrice = Number(court.weekendPrice) || 0;

        if (formData.recurrenceType === 'WEEKLY' && formData.fixedDays.length > 0) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
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

                const conflictDates = conflicts.slice(0, 3).map(c => c.date).join(', ');
                const moreCount = conflicts.length > 3 ? ` and ${conflicts.length - 3} more` : '';

                if (!window.confirm(`Warning: ${conflicts.length} dates are already booked (${conflictDates}${moreCount}). These dates will be SKIPPED. Do you want to continue?`)) {
                    return;
                }
            }
        } catch (error) {
            console.error('Availability check failed:', error);
        }

        // 2. Prepare Payload
        const payload = {
            customerName: formData.customerName,
            customerPhone: formData.phone,
            courtId: formData.courtId,
            sportType: formData.sport,
            recurrenceType: formData.recurrenceType,
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
                await api.put(`/recurring-bookings/${editingBooking._id}`, payload);
                toast.success('Recurring booking updated successfully');
            } else {
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
            toast.success('Recurring booking and all associated slots deleted successfully');
            setShowDeleteModal(false);
            setBookingToDelete(null);
            fetchRecurringBookings();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete booking');
        }
    };

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
        <div className="staffrecurringbooking-container rounded-4 shadow-sm">
            <div className="staffrecurringbooking-page-header">
                <div>
                    <h2 className="staffrecurringbooking-title">Recurring Bookings</h2>
                    <p className="text-muted m-0 small">Manage weekly and monthly recurring court bookings</p>
                </div>
                <Button variant="primary" onClick={handleShowAdd}>
                    <FaPlus className="me-2" /> Add Recurring Booking
                </Button>
            </div>

            <div className="staffrecurringbooking-table-container">
                <Table hover className="staffrecurringbooking-table">
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
                                </td>
                                <td>
                                    <span className="staffrecurringbooking-recurrence-badge">
                                        {booking.recurrenceType}
                                    </span>
                                </td>
                                <td className="fw-bold">{booking.startTime} - {booking.endTime}</td>
                                <td className="fw-bold text-success">
                                    ₹ {booking.monthlyAmount}
                                </td>
                                <td>
                                    <span className={`staffrecurringbooking-badge ${booking.paymentStatus === 'PAID' ? 'paid' : 'pending'}`}>
                                        {booking.paymentStatus}
                                    </span>
                                </td>
                                <td>
                                    <span className={`staffrecurringbooking-badge ${booking.status === 'ACTIVE' ? 'active' : 'paused'}`}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="d-flex gap-2">
                                        <button className="staffrecurringbooking-action-btn edit" onClick={() => handleShowView(booking)} title="View"><FaEye /></button>
                                        <button className="staffrecurringbooking-action-btn edit" onClick={() => handleShowEdit(booking)} title="Edit"><FaEdit /></button>
                                        <button className="staffrecurringbooking-action-btn pause" onClick={() => togglePauseResume(booking)}>
                                            {booking.status === 'ACTIVE' ? <FaPause /> : <FaPlay />}
                                        </button>
                                        <button className="staffrecurringbooking-action-btn delete" onClick={() => handleShowDelete(booking)}><FaTrash /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            <Modal show={showModal} onHide={handleClose} centered backdrop="static" size="lg">
                <Modal.Header closeButton className="staffrecurringbooking-modal-header">
                    <Modal.Title>{editingBooking ? 'Edit Recurring Booking' : 'Add Recurring Booking'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body className="p-4">
                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <Form.Label className="staffrecurringbooking-form-label">Customer Name</Form.Label>
                                <Form.Control type="text" required value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} />
                            </div>
                            <div className="col-md-6">
                                <Form.Label className="staffrecurringbooking-form-label">Phone Number</Form.Label>
                                <Form.Control type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                        </div>

                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <Form.Label className="staffrecurringbooking-form-label">Court</Form.Label>
                                <Form.Select value={formData.courtId} onChange={handleCourtChange}>
                                    {courts.map(court => (
                                        <option key={court._id} value={court._id}>{court.name}</option>
                                    ))}
                                </Form.Select>
                            </div>
                            <div className="col-md-6">
                                <Form.Label className="staffrecurringbooking-form-label">Recurrence Type</Form.Label>
                                <Form.Select value={formData.recurrenceType} onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value })}>
                                    <option value="WEEKLY">Weekly</option>
                                </Form.Select>
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label className="staffrecurringbooking-form-label">Fixed Day(s)</Form.Label>
                            <div className="d-flex gap-2 flex-wrap">
                                {daysOfWeek.map(day => (
                                    <Form.Check
                                        key={day}
                                        type="checkbox"
                                        label={day}
                                        checked={formData.fixedDays.includes(day)}
                                        onChange={() => handleDayToggle(day)}
                                        className="border p-2 rounded"
                                    />
                                ))}
                            </div>
                        </Form.Group>

                        <div className="row g-3 mb-3">
                            <div className="col-md-3">
                                <Form.Label className="staffrecurringbooking-form-label">Start Time</Form.Label>
                                <Form.Control type="time" required value={formData.fixedTime} onChange={(e) => setFormData({ ...formData, fixedTime: e.target.value })} />
                            </div>
                            <div className="col-md-3">
                                <Form.Label className="staffrecurringbooking-form-label">End Time</Form.Label>
                                <Form.Control type="time" required value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
                            </div>
                            <div className="col-md-3">
                                <Form.Label className="staffrecurringbooking-form-label">Start Date</Form.Label>
                                <Form.Control type="date" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                            </div>
                            <div className="col-md-3">
                                <Form.Label className="staffrecurringbooking-form-label">End Date</Form.Label>
                                <Form.Control type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                            </div>
                        </div>

                        <hr />
                        <h6>Payment Details</h6>
                        <div className="row g-3 mb-3">
                            <div className="col-md-4">
                                <Form.Label>Total Amount</Form.Label>
                                <Form.Control type="number" readOnly value={formData.monthlyAmount} className="bg-light" />
                            </div>
                            <div className="col-md-4">
                                <Form.Label>Advance Paid</Form.Label>
                                <Form.Control type="number" value={formData.advancePaid} onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })} />
                            </div>
                            <div className="col-md-4">
                                <Form.Label>Payment Status</Form.Label>
                                <Form.Select value={formData.paymentStatus} onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}>
                                    <option value="PENDING">Pending</option>
                                    <option value="PAID">Paid</option>
                                    <option value="PARTIAL">Partial</option>
                                </Form.Select>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={handleClose}>Cancel</Button>
                        <Button type="submit" variant="primary">Save Booking</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Body className="text-center p-4">
                    <FaTrash size={40} className="text-danger mb-3" />
                    <h5>Delete Recurring Booking?</h5>
                    <p className="text-muted">This will remove the rule and ALL associated future bookings. This cannot be undone.</p>
                    <div className="d-flex justify-content-center gap-3">
                        <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                        <Button variant="danger" onClick={confirmDelete}>Delete Everything</Button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default StaffRecurringBooking;
