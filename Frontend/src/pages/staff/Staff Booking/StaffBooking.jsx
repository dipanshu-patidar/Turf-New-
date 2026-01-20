import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Badge, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaTrash, FaEdit, FaRupeeSign, FaPhone, FaHistory, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './StaffBooking.css';
import api from '../../../api/axiosInstance';

const StaffBooking = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [courts, setCourts] = useState([]);
    const [calendarData, setCalendarData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Generate time slots from 06:00 to 23:45
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
            setCourts(Array.isArray(response.data) ? response.data : (response.data.data || []));
        } catch (error) {
            console.error('Error fetching courts:', error);
        }
    };

    const fetchCalendarData = useCallback(async () => {
        setLoading(true);
        try {
            const dateStr = dateToString(selectedDate);
            // Use specialized staff calendar API
            const response = await api.get(`/staff/calendar/day?date=${dateStr}`);
            if (response.data.success) {
                setCalendarData(response.data.courts);
            }
        } catch (error) {
            console.error('Error fetching calendar:', error);
            toast.error('Failed to load calendar data');
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchCourts();
    }, []);

    useEffect(() => {
        fetchCalendarData();
    }, [fetchCalendarData]);

    const getBookingForSlot = (courtId, timeSlot) => {
        const court = calendarData.find(c => c.courtId === courtId);
        if (!court) return null;

        return court.slots.find(b => {
            const [bStartH, bStartM] = b.startTime.split(':').map(Number);
            const [bEndH, bEndM] = b.endTime.split(':').map(Number);
            const [checkH, checkM] = timeSlot.split(':').map(Number);

            const bStart = bStartH * 60 + bStartM;
            const bEnd = bEndH * 60 + bEndM;
            const check = checkH * 60 + checkM;

            return check >= bStart && check < bEnd;
        });
    };

    const getSlotHeight = (startTime, endTime) => {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        const slots = totalMinutes / 15;
        return `${slots * 80 - 4}px`; // 80px is slot height, -4 for margin
    };

    const handleSlotClick = (courtId, courtName, time) => {
        const booking = getBookingForSlot(courtId, time);
        if (booking) return;

        const court = courts.find(c => c._id === courtId);
        if (!court) return;

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
        if (totalMinutes < 15) totalMinutes = 15;

        const price = (selectedSlot.hourlyRate / 4) * (totalMinutes / 15);
        setSelectedSlot(prev => ({ ...prev, endTime: newEndTime, price }));
    };

    const handleNewBookingSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                customerName: newBookingData.customerName,
                phoneNumber: newBookingData.phone,
                sport: selectedSlot.sportType,
                courtId: selectedSlot.courtId,
                bookingDate: dateToString(selectedDate),
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                advancePaid: Number(newBookingData.advancePaid),
                paymentMode: 'CASH'
            };

            await api.post('/staff/bookings', payload);
            toast.success('Booking created successfully');
            setShowNewModal(false);
            fetchCalendarData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create booking');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBookingClick = (e, booking, courtName) => {
        e.stopPropagation();
        setSelectedBooking({
            ...booking,
            courtName
        });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setSelectedBooking(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateBooking = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                customerName: selectedBooking.customerName,
                customerPhone: selectedBooking.customerPhone,
                startTime: selectedBooking.startTime,
                endTime: selectedBooking.endTime,
                advancePaid: Number(selectedBooking.advancePaid)
            };

            await api.put(`/staff/calendar/bookings/${selectedBooking.bookingId}`, payload);
            toast.success('Booking updated successfully');
            setShowEditModal(false);
            fetchCalendarData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update booking');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelBooking = async () => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        setIsSaving(true);
        try {
            await api.patch(`/staff/calendar/bookings/${selectedBooking.bookingId}/cancel`);
            toast.success('Booking cancelled successfully');
            setShowEditModal(false);
            fetchCalendarData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel booking');
        } finally {
            setIsSaving(false);
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

    const getStatusTheme = (status) => {
        const s = (status || '').toUpperCase();
        switch (s) {
            case 'PAID': return 'paid';
            case 'BALANCE_PENDING': return 'pending-bal';
            case 'ADVANCE_PENDING': return 'pending-adv';
            default: return '';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'PAID': return 'Fully Paid';
            case 'BALANCE_PENDING': return 'Balance PndG';
            case 'ADVANCE_PENDING': return 'Advance PndG';
            default: return status;
        }
    };

    return (
        <div className="staffbooking-container">
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

            <div className="staffbooking-calendar-wrapper">
                {loading && (
                    <div className="staffbooking-loading-overlay">
                        <Spinner animation="border" variant="primary" />
                    </div>
                )}
                <div className="staffbooking-calendar-grid" style={{ gridTemplateColumns: `80px repeat(${calendarData.length || 1}, 1fr)` }}>
                    <div className="staffbooking-header-cell time-head">Time</div>
                    {calendarData.map(court => (
                        <div key={court.courtId} className="staffbooking-header-cell">
                            {court.courtName}
                        </div>
                    ))}
                    {calendarData.length === 0 && !loading && (
                        <div className="staffbooking-header-cell text-muted">No Active Courts</div>
                    )}

                    {timeSlots.map(time => (
                        <div key={time} className="staffbooking-time-row">
                            <div className="staffbooking-time-cell">{time}</div>
                            {calendarData.map(court => {
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
                                                onClick={(e) => handleBookingClick(e, booking, court.courtName)}
                                                style={{ height: getSlotHeight(booking.startTime, booking.endTime) }}
                                            >
                                                <div className="staffbooking-slot-content">
                                                    <div className="staffbooking-slot-time">
                                                        {booking.startTime} - {booking.endTime}
                                                    </div>
                                                    <div className="staffbooking-customer-name">
                                                        {booking.customerName}
                                                        {booking.bookingSource === 'RECURRING' && <FaHistory className="ms-1 small" title="Recurring" />}
                                                    </div>
                                                    <div className="small text-muted" style={{ fontSize: '0.7rem' }}>
                                                        <FaPhone size={10} className="me-1" /> {booking.customerPhone}
                                                    </div>
                                                </div>
                                                <div className="staffbooking-status-badge">
                                                    {getStatusLabel(booking.paymentStatus)}
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

            <Modal show={showNewModal} onHide={() => setShowNewModal(false)} centered backdrop="static">
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Add New Booking</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleNewBookingSubmit}>
                    <Modal.Body className="p-4 pt-0">
                        <div className="row g-3 mb-3">
                            <div className="col-md-12">
                                <Form.Label className="small fw-bold">Court</Form.Label>
                                <Form.Control type="text" value={selectedSlot.court} readOnly className="bg-light" />
                            </div>
                            <div className="col-md-6">
                                <Form.Label className="small fw-bold">Start Time</Form.Label>
                                <Form.Control type="time" value={selectedSlot.startTime} readOnly className="bg-light" />
                            </div>
                            <div className="col-md-6">
                                <Form.Label className="small fw-bold">End Time</Form.Label>
                                <Form.Control type="time" step="900" value={selectedSlot.endTime} onChange={(e) => handleEndTimeChange(e.target.value)} />
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
                        <Button variant="primary" type="submit" disabled={isSaving}>
                            {isSaving ? <Spinner animation="border" size="sm" /> : 'Create Booking'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="md">
                <Modal.Header closeButton className="border-0 bg-light">
                    <Modal.Title className="fw-bold">
                        {selectedBooking?.isEditable ? 'Edit Booking' : 'Booking Details'}
                        {selectedBooking?.bookingSource === 'RECURRING' && <Badge bg="info" className="ms-2 small">Recurring</Badge>}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUpdateBooking}>
                    <Modal.Body className="p-4">
                        {selectedBooking && (
                            <Row className="g-3">
                                <Col xs={12}>
                                    <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded border mb-2">
                                        <div>
                                            <div className="small text-muted">Court</div>
                                            <div className="fw-bold">{selectedBooking.courtName}</div>
                                        </div>
                                        <div className="text-end">
                                            <div className="small text-muted">Time Slot</div>
                                            <div className="fw-bold">{selectedBooking.startTime} - {selectedBooking.endTime}</div>
                                        </div>
                                    </div>
                                </Col>

                                <Col md={12}>
                                    <Form.Label className="small fw-bold">Customer Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="customerName"
                                        value={selectedBooking.customerName}
                                        onChange={handleEditChange}
                                        readOnly={!selectedBooking.isEditable}
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
                                        readOnly={!selectedBooking.isEditable}
                                        required
                                    />
                                </Col>

                                {selectedBooking.isEditable && (
                                    <>
                                        <Col md={6}>
                                            <Form.Label className="small fw-bold">Start Time</Form.Label>
                                            <Form.Control
                                                type="time"
                                                name="startTime"
                                                value={selectedBooking.startTime}
                                                onChange={handleEditChange}
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <Form.Label className="small fw-bold">End Time</Form.Label>
                                            <Form.Control
                                                type="time"
                                                name="endTime"
                                                value={selectedBooking.endTime}
                                                onChange={handleEditChange}
                                            />
                                        </Col>
                                    </>
                                )}

                                <Col xs={12}>
                                    <div className="mt-3 border-top pt-3">
                                        <h6 className="fw-bold text-muted mb-3"><FaRupeeSign className="me-1" /> Payment Breakdown</h6>
                                        <Row className="small mb-2">
                                            <Col xs={6} className="text-muted">Total Amount:</Col>
                                            <Col xs={6} className="text-end fw-bold text-dark">₹{selectedBooking.finalAmount}</Col>
                                        </Row>
                                        <Row className="small mb-2 align-items-center">
                                            <Col xs={6} className="text-success fw-bold">Advance Paid:</Col>
                                            <Col xs={6} className="text-end">
                                                {selectedBooking.isEditable ? (
                                                    <Form.Control
                                                        size="sm"
                                                        type="number"
                                                        name="advancePaid"
                                                        value={selectedBooking.advancePaid}
                                                        onChange={handleEditChange}
                                                        className="d-inline-block text-end w-75"
                                                    />
                                                ) : <span className="fw-bold text-success">₹{selectedBooking.advancePaid}</span>}
                                            </Col>
                                        </Row>
                                        <Row className="small mb-2 border-top pt-2">
                                            <Col xs={6} className="text-danger fw-bold">Due Balance:</Col>
                                            <Col xs={6} className="text-end fw-bold text-danger h5 mb-0">₹{selectedBooking.finalAmount - (selectedBooking.advancePaid || 0)}</Col>
                                        </Row>
                                    </div>
                                </Col>

                                <Col xs={12} className="text-center mt-3">
                                    <div className={`staffbooking-status-badge w-100 py-2 border ${getStatusTheme(selectedBooking.paymentStatus)}`}>
                                        Status: {getStatusLabel(selectedBooking.paymentStatus)}
                                    </div>
                                </Col>
                            </Row>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="border-0 bg-light d-flex justify-content-between">
                        {selectedBooking?.isDeletable ? (
                            <Button variant="outline-danger" onClick={handleCancelBooking} disabled={isSaving}>
                                <FaTrash className="me-2" /> Cancel Booking
                            </Button>
                        ) : <div></div>}

                        <div>
                            <Button variant="light" className="me-2" onClick={() => setShowEditModal(false)}>Close</Button>
                            {selectedBooking?.isEditable && (
                                <Button variant="primary" type="submit" disabled={isSaving}>
                                    {isSaving ? <Spinner animation="border" size="sm" /> : <><FaEdit className="me-2" /> Save Changes</>}
                                </Button>
                            )}
                        </div>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default StaffBooking;
