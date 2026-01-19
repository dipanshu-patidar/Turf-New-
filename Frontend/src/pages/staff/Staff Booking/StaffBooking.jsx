import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Badge, Spinner } from 'react-bootstrap';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaTrash, FaEdit, FaRupeeSign } from 'react-icons/fa';
import { InputGroup } from 'react-bootstrap';
import toast from 'react-hot-toast';
import './StaffBooking.css';
import api from '../../../api/axiosInstance';

const StaffBooking = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [courts, setCourts] = useState([]);
    const [calendarData, setCalendarData] = useState([]);
    const [loading, setLoading] = useState(true);

    const timeSlots = [];
    for (let h = 6; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            timeSlots.push(time);
        }
    }

    const [showNewModal, setShowNewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState({ courtId: '', court: '', sportType: '', startTime: '', endTime: '', price: 0, hourlyRate: 0 });
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [newBookingData, setNewBookingData] = useState({
        customerName: '',
        phone: '',
        advancePaid: 0
    });

    const dateToString = (date) => {
        return date.toISOString().split('T')[0];
    };

    const fetchCourts = async () => {
        try {
            const response = await api.get('/courts');
            setCourts(response.data);
        } catch (error) {
            console.error('Error fetching courts:', error);
        }
    };

    const fetchCalendarData = async () => {
        setLoading(true);
        try {
            const dateStr = dateToString(selectedDate);
            const response = await api.get(`/calendar/day?date=${dateStr}`);
            if (response.data.success) {
                setCalendarData(response.data.courts);
            }
        } catch (error) {
            console.error('Error fetching calendar:', error);
            toast.error('Failed to load calendar data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourts();
    }, []);

    useEffect(() => {
        fetchCalendarData();
    }, [selectedDate]);

    // Check if slot is booked
    const getBookingForSlot = (courtId, timeSlot) => {
        const court = calendarData.find(c => c.courtId === courtId);
        if (!court) return null;

        return court.slots.find(b => {
            return timeSlot >= b.startTime && timeSlot < b.endTime;
        });
    };

    const handleSlotClick = (courtId, courtName, time) => {
        const booking = getBookingForSlot(courtId, time);
        if (booking) return;

        const court = courts.find(c => c._id === courtId);
        if (!court) return;

        // Default 1 hour duration
        const [h, m] = time.split(':').map(Number);
        const endM = m + 60;
        const endH = h + Math.floor(endM / 60);
        const finalM = endM % 60;
        const endTime = `${endH.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')}`;

        const isWeekend = (date) => {
            const day = date.getDay();
            return day === 0 || day === 6;
        };
        const hourlyRate = isWeekend(selectedDate) ? court.weekendPrice : court.weekdayPrice;

        setSelectedSlot({
            courtId,
            court: courtName,
            sportType: court.sportType,
            startTime: time,
            endTime,
            price: hourlyRate,
            hourlyRate
        });
        setNewBookingData({
            customerName: '',
            phone: '',
            advancePaid: 0
        });
        setShowNewModal(true);
    };

    const handleEndTimeChange = (newEndTime) => {
        const [startH, startM] = selectedSlot.startTime.split(':').map(Number);
        const [endH, endM] = newEndTime.split(':').map(Number);

        let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        if (totalMinutes < 15) totalMinutes = 15; // Minimum 15 mins

        const price = Math.ceil((selectedSlot.hourlyRate / 60) * totalMinutes);
        setSelectedSlot(prev => ({ ...prev, endTime: newEndTime, price }));
    };

    const handleNewBookingSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                customerName: newBookingData.customerName,
                customerPhone: newBookingData.phone,
                sportType: selectedSlot.sportType,
                courtId: selectedSlot.courtId,
                bookingDate: dateToString(selectedDate),
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                advancePaid: Number(newBookingData.advancePaid),
                paymentMode: 'CASH',
                discountType: 'NONE',
                discountValue: 0
            };

            await api.post('/admin/bookings', payload);
            toast.success('Booking created successfully');
            setShowNewModal(false);
            fetchCalendarData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create booking');
        }
    };

    const handleBookingClick = (e, booking) => {
        e.stopPropagation();
        setSelectedBooking(booking);
        setShowEditModal(true);
    };

    const handleCancelBooking = async () => {
        try {
            await api.delete(`/admin/bookings/${selectedBooking.bookingId}`);
            toast.success('Booking cancelled successfully');
            setShowEditModal(false);
            fetchCalendarData();
        } catch (error) {
            toast.error('Failed to cancel booking');
        }
    };

    const handlePrevDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
    };

    const handleNextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        setSelectedDate(next);
    };

    const handleToday = () => {
        setSelectedDate(new Date());
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getStatusBadgeClass = (status) => {
        const s = (status || '').toUpperCase();
        switch (s) {
            case 'PAID': return 'staffbooking-badge-paid';
            case 'PARTIAL': return 'staffbooking-badge-pending-bal';
            case 'PENDING': return 'staffbooking-badge-pending-adv';
            default: return '';
        }
    };

    const getStatusTheme = (status) => {
        const s = (status || '').toUpperCase();
        switch (s) {
            case 'PAID': return 'paid';
            case 'PARTIAL': return 'pending-bal';
            case 'PENDING': return 'pending-adv';
            default: return '';
        }
    };

    return (
        <div className="staffbooking-container">
            {/* Header with Navigation */}
            <div className="staffbooking-page-header">
                <div>
                    <h2 className="staffbooking-title">Booking Calendar</h2>
                    <p className="text-muted m-0 small">Manage and view turf availability</p>
                </div>

                <div className="staffbooking-date-nav">
                    <button className="staffbooking-nav-btn" onClick={handlePrevDay} title="Previous Day">
                        <FaChevronLeft />
                    </button>
                    <div
                        className="staffbooking-current-date cursor-pointer"
                        onClick={() => document.getElementById('staff-booking-date-picker').showPicker()}
                        title="Click to select date"
                    >
                        <FaCalendarAlt className="me-2 text-primary" />
                        {formatDate(selectedDate)}
                        <input
                            type="date"
                            id="staff-booking-date-picker"
                            className="position-absolute invisible"
                            style={{ top: 0, left: '50%', width: 0 }}
                            value={selectedDate.toISOString().split('T')[0]}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        />
                    </div>
                    <button className="staffbooking-nav-btn" onClick={handleNextDay} title="Next Day">
                        <FaChevronRight />
                    </button>
                    <Button variant="outline-danger" size="sm" className="staffbooking-today-btn" onClick={handleToday}>
                        Today
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="staffbooking-calendar-wrapper">
                {loading && (
                    <div className="staffbooking-loading-overlay">
                        <Spinner animation="border" variant="primary" />
                    </div>
                )}
                <div className="staffbooking-calendar-grid" style={{ gridTemplateColumns: `80px repeat(${calendarData.length}, 1fr)` }}>
                    {/* Header Row */}
                    <div className="staffbooking-header-cell time-head">Time</div>
                    {calendarData.map(court => (
                        <div key={court.courtId} className="staffbooking-header-cell">
                            {court.courtName}
                            <div className="small text-muted fw-normal">{court.sportType}</div>
                        </div>
                    ))}

                    {/* Time Rows */}
                    {timeSlots.map(time => (
                        <div key={time} className="staffbooking-time-row">
                            <div className="staffbooking-time-cell">{time}</div>
                            {calendarData.map(court => {
                                // Check for booking in this slot
                                const booking = getBookingForSlot(court.courtId, time);
                                const isStart = booking && booking.startTime === time;

                                return (
                                    <div
                                        key={`${court.courtId}-${time}`}
                                        className="staffbooking-slot"
                                        onClick={() => handleSlotClick(court.courtId, court.courtName, time)}
                                    >
                                        {isStart && (
                                            <div
                                                className={`staffbooking-booked-card ${getStatusTheme(booking.paymentStatus)}`}
                                                onClick={(e) => handleBookingClick(e, booking)}
                                            >
                                                <div>
                                                    <div className="staffbooking-slot-time">
                                                        {booking.startTime} - {booking.endTime}
                                                    </div>
                                                    <div className="staffbooking-customer-name">
                                                        {booking.customerName}
                                                    </div>
                                                </div>
                                                <div className={`staffbooking-status-badge ${getStatusBadgeClass(booking.paymentStatus)}`}>
                                                    {booking.paymentStatus}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            {/* New Booking Modal - Matches Admin Style */}
            <Modal show={showNewModal} onHide={() => setShowNewModal(false)} centered backdrop="static">
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Add New Booking</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleNewBookingSubmit}>
                    <Modal.Body className="p-4 pt-0">
                        <div className="row g-3 mb-3">
                            <div className="col-md-12">
                                <Form.Label className="small fw-bold">Court</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={selectedSlot.court}
                                    readOnly
                                    className="bg-light"
                                />
                            </div>
                            <div className="col-md-6">
                                <Form.Label className="small fw-bold">Start Time</Form.Label>
                                <Form.Control
                                    type="time"
                                    value={selectedSlot.startTime}
                                    readOnly
                                    className="bg-light"
                                />
                            </div>
                            <div className="col-md-6">
                                <Form.Label className="small fw-bold">End Time</Form.Label>
                                <Form.Control
                                    type="time"
                                    step="900"
                                    value={selectedSlot.endTime}
                                    onChange={(e) => handleEndTimeChange(e.target.value)}
                                />
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Customer Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter customer name"
                                required
                                value={newBookingData.customerName}
                                onChange={(e) => setNewBookingData({ ...newBookingData, customerName: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Phone Number <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="tel"
                                placeholder="Enter mobile number"
                                required
                                pattern="[0-9]{10}"
                                value={newBookingData.phone}
                                onChange={(e) => setNewBookingData({ ...newBookingData, phone: e.target.value })}
                            />
                        </Form.Group>

                        <div className="bg-light p-3 rounded mb-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <span>Total Price:</span>
                                <span className="fw-bold fs-5">₹ {selectedSlot.price}</span>
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Advance Payment</Form.Label>
                            <InputGroup>
                                <InputGroup.Text>₹</InputGroup.Text>
                                <Form.Control
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    max={selectedSlot.price}
                                    value={newBookingData.advancePaid}
                                    onChange={(e) => setNewBookingData({ ...newBookingData, advancePaid: e.target.value })}
                                />
                            </InputGroup>
                        </Form.Group>

                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="small text-muted">Balance:</span>
                            <span className="fw-bold text-danger">
                                ₹ {selectedSlot.price - (parseFloat(newBookingData.advancePaid) || 0)}
                            </span>
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="border-0 bg-light">
                        <Button variant="light" onClick={() => setShowNewModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" className="px-4">Create Booking</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit/View Booking Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Booking Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    {selectedBooking && (
                        <>
                            <div className="mb-4">
                                <Badge bg="light" text="dark" className="border px-3 py-3 w-100 text-start">
                                    <div className="row">
                                        <div className="col-6">
                                            <div className="small text-muted">Court</div>
                                            <div className="fw-bold">{selectedBooking.court}</div>
                                        </div>
                                        <div className="col-6 text-end">
                                            <div className="small text-muted">Time Slot</div>
                                            <div className="fw-bold">{selectedBooking.startTime} - {selectedBooking.endTime}</div>
                                        </div>
                                    </div>
                                </Badge>
                            </div>
                            <div className="mb-3">
                                <label className="small text-muted d-block">Customer</label>
                                <h5 className="fw-bold mb-0">{selectedBooking.customerName}</h5>
                            </div>
                            <div className="mb-3">
                                <label className="small text-muted d-block">Customer Number</label>
                                <div className="fw-bold">{selectedBooking.phone || 'N/A'}</div>
                            </div>
                            <div className="mb-3">
                                <label className="small text-muted d-block">Payment Status</label>
                                <div className={`staffbooking-status-badge mt-1 ${getStatusBadgeClass(selectedBooking.status)}`}>
                                    {selectedBooking.status}
                                </div>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 d-flex justify-content-between">
                    <Button variant="outline-danger" onClick={handleCancelBooking}>
                        <FaTrash className="me-2" /> Cancel Booking
                    </Button>
                    <div>
                        <Button variant="light" className="me-2" onClick={() => setShowEditModal(false)}>Close</Button>
                        <Button variant="primary" onClick={() => toast.error('Edit feature coming soon')}><FaEdit className="me-2" /> Edit</Button>
                    </div>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default StaffBooking;
