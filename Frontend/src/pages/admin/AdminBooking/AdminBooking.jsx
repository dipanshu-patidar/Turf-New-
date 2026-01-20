import React, { useState, useRef, useEffect } from 'react';
import { Button, Modal, Form, InputGroup, Spinner } from 'react-bootstrap';
import { FaChevronLeft, FaChevronRight, FaCalendarDay, FaRupeeSign, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './AdminBooking.css';
import api from '../../../api/axiosInstance';

const AdminBooking = () => {
    // State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState([]);
    const [loading, setLoading] = useState(true);
    const dateInputRef = useRef(null);

    // Time slots (6 AM to 11 PM in 15-minute intervals)
    const timeSlots = [];
    for (let h = 6; h < 23; h++) {
        for (let m = 0; m < 60; m += 15) {
            const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            timeSlots.push(time);
        }
    }

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [editingBooking, setEditingBooking] = useState(null);
    const [bookingToDelete, setBookingToDelete] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        advancePaid: 0
    });

    const dateToString = (date) => {
        return date.toISOString().split('T')[0];
    };

    const [courts, setCourts] = useState([]);

    // Fetch Courts
    const fetchCourts = async () => {
        try {
            const response = await api.get('/courts');
            setCourts(response.data);
        } catch (error) {
            console.error('Error fetching courts:', error);
        }
    };

    // Fetch Calendar Data
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

    // Navigation handlers
    const goToPreviousDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const goToNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        setSelectedDate(newDate);
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    // Open date picker
    const openDatePicker = () => {
        setShowDatePicker(true);
    };

    // Helper functions
    const formatDate = (date) => {
        return date.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const isWeekend = (date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
    };

    // Check if slot is booked
    const getBookingForSlot = (courtId, timeSlot) => {
        const court = calendarData.find(c => c.courtId === courtId);
        if (!court) return null;

        return court.slots.find(b => {
            return timeSlot >= b.startTime && timeSlot < b.endTime;
        });
    };

    // Handle empty slot click
    const handleEmptySlotClick = (courtId, courtName, timeSlot) => {
        const court = courts.find(c => c._id === courtId);
        if (!court) return;

        // Default 1 hour duration
        const [h, m] = timeSlot.split(':').map(Number);
        const endM = m + 60; // Default 1 hour
        const endH = h + Math.floor(endM / 60);
        const finalM = endM % 60;
        const endTime = `${endH.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')}`;

        const hourlyRate = isWeekend(selectedDate) ? court.weekendPrice : court.weekdayPrice;

        setSelectedSlot({
            courtId,
            court: courtName,
            sportType: court.sportType,
            startTime: timeSlot,
            endTime,
            price: hourlyRate,
            hourlyRate
        });
        setFormData({ customerName: '', phone: '', advancePaid: 0 });
        setShowAddModal(true);
    };

    // Handle booked slot click
    const handleBookedSlotClick = (booking, courtName) => {
        setEditingBooking({
            ...booking,
            courtName,
            totalPrice: booking.finalAmount // Ensure total price is set from backend data
        });
        setFormData({
            customerName: booking.customerName,
            phone: booking.customerPhone,
            advancePaid: booking.advancePaid || 0,
            bookingStatus: booking.bookingStatus || 'BOOKED',
            paymentStatus: booking.paymentStatus || 'PENDING',
            startTime: booking.startTime, // Allow editing time
            endTime: booking.endTime
        });
        setShowEditModal(true);
    };

    // Add booking
    const handleAddBooking = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                customerName: formData.customerName,
                customerPhone: formData.phone,
                sportType: selectedSlot.sportType,
                courtId: selectedSlot.courtId,
                bookingDate: dateToString(selectedDate),
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                advancePaid: Number(formData.advancePaid),
                paymentMode: 'CASH', // Default for quick add
                discountType: 'NONE',
                discountValue: 0
            };

            const response = await api.post('/admin/bookings', payload);
            if (response.data.success) {
                toast.success('Booking created successfully!');
                setShowAddModal(false);
                fetchCalendarData(); // Refresh calendar
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create booking');
        }
    };

    // Calculate price when endTime changes
    const handleEndTimeChange = (newEndTime) => {
        const [startH, startM] = selectedSlot.startTime.split(':').map(Number);
        const [endH, endM] = newEndTime.split(':').map(Number);
        const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);

        if (totalMinutes <= 0) {
            toast.error("End time must be after start time");
            return;
        }

        // Check for overlaps with existing bookings on the same court
        const courtData = calendarData.find(c => c.courtId === selectedSlot.courtId);
        if (courtData) {
            const hasOverlap = courtData.slots.some(b => {
                // If we are editing, skip the current booking itself
                // But handleEndTimeChange is used in Add New Booking, so we check all.
                // For Add Modal:
                return (selectedSlot.startTime < b.endTime && newEndTime > b.startTime);
            });

            if (hasOverlap) {
                toast.error("Double Booking: The extended time slot overlaps with another booking.");
                return;
            }
        }

        const price = Math.ceil((selectedSlot.hourlyRate / 60) * totalMinutes);
        setSelectedSlot(prev => ({ ...prev, endTime: newEndTime, price }));
    };

    // Update booking
    const handleUpdateBooking = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                customerName: formData.customerName,
                customerPhone: formData.phone,
                advancePaid: Number(formData.advancePaid),
                status: formData.bookingStatus,
                paymentStatus: formData.paymentStatus,
                startTime: formData.startTime,
                endTime: formData.endTime,
                // Include validation helpers
                courtId: editingBooking.courtId,
                sportType: editingBooking.sportType,
                bookingDate: editingBooking.bookingDate,
                paymentMode: editingBooking.paymentMode,
                paymentNotes: editingBooking.paymentNotes,
                discountType: editingBooking.discountType,
                discountValue: editingBooking.discountValue
            };

            console.log('Update Payload:', payload);
            console.log('Editing Booking:', editingBooking);

            await api.put(`/admin/bookings/${editingBooking.bookingId}`, payload);
            toast.success('Booking updated successfully!');
            setShowEditModal(false);
            fetchCalendarData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update booking');
        }
    };

    // Delete booking
    const handleShowDelete = () => {
        setBookingToDelete(editingBooking);
        setShowEditModal(false);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/admin/bookings/${bookingToDelete.bookingId}`);
            toast.success('Booking deleted successfully!');
            setShowDeleteModal(false);
            fetchCalendarData();
        } catch (error) {
            toast.error('Failed to delete booking');
        }
    };

    const formatTime12h = (time24) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    };

    // Render booking card
    const renderBookingCard = (booking, courtName) => {
        const pStatus = (booking.paymentStatus || '').toUpperCase();
        return (
            <div
                className="adminbooking-card"
                onClick={() => handleBookedSlotClick(booking, courtName)}
            >
                <div>
                    <div className="adminbooking-card-customer">{booking.customerName}</div>
                    <div className="adminbooking-card-time">{formatTime12h(booking.startTime)} - {formatTime12h(booking.endTime)}</div>
                    <div className="adminbooking-card-phone">📞 {booking.customerPhone}</div>
                </div>
                <div>
                    <span className={`adminbooking-payment-badge ${pStatus.toLowerCase()}`}>
                        {pStatus === 'PAID' && '🟢 Fully Paid'}
                        {pStatus === 'PARTIAL' && '🟡 Balance Pending'}
                        {pStatus === 'PENDING' && '🔴 Advance Pending'}
                    </span>
                </div>
            </div>
        );
    };

    const getEndTime = (startTime) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + 15; // Default 15 min duration
        const endH = Math.floor(totalMinutes / 60);
        const endM = totalMinutes % 60;
        return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    };

    return (
        <div className="adminbooking-container">
            {/* Header */}
            <div className="adminbooking-header">
                <div>
                    <h2 className="adminbooking-title">Booking Calendar</h2>
                    <p className="text-muted m-0 small">Manage court bookings and schedules</p>
                </div>
            </div>

            {/* Date Navigation */}
            <div className="adminbooking-date-nav">
                <Button className="adminbooking-nav-btn" onClick={goToPreviousDay}>
                    <FaChevronLeft /> Previous
                </Button>
                <div
                    className="adminbooking-date-display"
                    onClick={openDatePicker}
                    style={{ cursor: 'pointer' }}
                >
                    <FaCalendarDay className="me-2" />
                    {formatDate(selectedDate)}
                </div>
                <Button className="adminbooking-nav-btn" onClick={goToNextDay}>
                    Next <FaChevronRight />
                </Button>
                <Button className="adminbooking-today-btn" onClick={goToToday}>
                    Today
                </Button>
            </div>

            {/* Calendar Grid */}
            <div className="adminbooking-calendar-wrapper">
                {loading && (
                    <div className="adminbooking-loading-overlay">
                        <Spinner animation="border" variant="primary" />
                    </div>
                )}
                <div className="adminbooking-calendar-grid" style={{ gridTemplateColumns: `100px repeat(${calendarData.length}, 1fr)` }}>
                    {/* Time Header */}
                    <div className="adminbooking-time-header">Time</div>

                    {/* Court Headers */}
                    {calendarData.map(court => (
                        <div key={court.courtId} className="adminbooking-court-header">
                            {court.courtName}
                            <div className="small text-muted fw-normal">{court.sportType}</div>
                        </div>
                    ))}

                    {/* Time Slots and Bookings */}
                    {timeSlots.map(timeSlot => (
                        <React.Fragment key={timeSlot}>
                            {/* Time Cell */}
                            <div className="adminbooking-time-cell">
                                {formatTime12h(timeSlot)}
                            </div>

                            {/* Court Slots */}
                            {calendarData.map(court => {
                                const booking = getBookingForSlot(court.courtId, timeSlot);
                                // Only render the card if it's the START of the booking
                                const isStart = booking && booking.startTime === timeSlot;

                                return (
                                    <div
                                        key={`${court.courtId}-${timeSlot}`}
                                        className={`adminbooking-slot-cell ${booking ? 'booked' : 'empty'}`}
                                        onClick={() => !booking && handleEmptySlotClick(court.courtId, court.courtName, timeSlot)}
                                        style={booking && !isStart ? { borderTop: 'none', color: 'transparent', height: '100%' } : {}}
                                    >
                                        {isStart && renderBookingCard(booking, court.courtName)}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Add Booking Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered backdrop="static">
                <Modal.Header closeButton className="adminbooking-modal-header">
                    <Modal.Title className="fw-bold">Add New Booking</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddBooking}>
                    <Modal.Body className="p-4">
                        <Form.Group className="mb-3">
                            <Form.Label className="adminbooking-form-label">Date</Form.Label>
                            <Form.Control
                                type="text"
                                value={formatDate(selectedDate)}
                                className="adminbooking-readonly-field"
                                readOnly
                            />
                        </Form.Group>

                        <div className="row g-3 mb-3">
                            <div className="col-md-4">
                                <Form.Label className="adminbooking-form-label">Court</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={selectedSlot?.court || ''}
                                    className="adminbooking-readonly-field"
                                    readOnly
                                />
                            </div>
                            <div className="col-md-4">
                                <Form.Label className="adminbooking-form-label">Start Time</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formatTime12h(selectedSlot?.startTime) || ''}
                                    className="adminbooking-readonly-field"
                                    readOnly
                                />
                            </div>
                            <div className="col-md-4">
                                <Form.Label className="adminbooking-form-label">End Time</Form.Label>
                                <Form.Control
                                    type="time"
                                    step="900"
                                    value={selectedSlot?.endTime || ''}
                                    onChange={(e) => handleEndTimeChange(e.target.value)}
                                />
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label className="adminbooking-form-label">Customer Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter customer name"
                                required
                                value={formData.customerName}
                                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="adminbooking-form-label">Phone Number <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="tel"
                                placeholder="10-digit mobile number"
                                required
                                pattern="[0-9\s]*"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </Form.Group>

                        <div className="adminbooking-price-display">
                            <div className="adminbooking-price-row">
                                <span>Total Price:</span>
                                <span className="fw-bold">₹ {selectedSlot?.price || 0}</span>
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label className="adminbooking-form-label">Advance Payment</Form.Label>
                            <InputGroup>
                                <InputGroup.Text><FaRupeeSign size={12} /></InputGroup.Text>
                                <Form.Control
                                    type="number"
                                    placeholder="0.00"
                                    min="0"
                                    max={selectedSlot?.price || 0}
                                    value={formData.advancePaid}
                                    onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })}
                                />
                            </InputGroup>
                        </Form.Group>

                        <div className="adminbooking-price-display">
                            <div className="adminbooking-price-row">
                                <span>Remaining Balance:</span>
                                <span className="fw-bold text-danger">
                                    ₹ {(selectedSlot?.price || 0) - (parseFloat(formData.advancePaid) || 0)}
                                </span>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="adminbooking-modal-footer">
                        <Button variant="light" onClick={() => setShowAddModal(false)}>Cancel</Button>
                        <Button type="submit" className="adminbooking-btn-primary">Create Booking</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit Booking Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static">
                <Modal.Header closeButton className="adminbooking-modal-header">
                    <Modal.Title className="fw-bold">Edit Booking</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUpdateBooking}>
                    <Modal.Body className="p-4">
                        <div className="row g-3 mb-3">
                            <div className="col-md-12">
                                <Form.Label className="adminbooking-form-label">Court (Read Only)</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editingBooking?.courtName || ''}
                                    className="adminbooking-readonly-field"
                                    readOnly
                                />
                            </div>
                            <div className="col-md-6">
                                <Form.Label className="adminbooking-form-label">Start Time</Form.Label>
                                <Form.Control
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6">
                                <Form.Label className="adminbooking-form-label">End Time</Form.Label>
                                <Form.Control
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label className="adminbooking-form-label">Customer Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={formData.customerName}
                                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="adminbooking-form-label">Phone Number <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="tel"
                                required
                                pattern="[0-9\s]*"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </Form.Group>

                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <Form.Label className="adminbooking-form-label">Booking Status</Form.Label>
                                <Form.Select
                                    value={formData.bookingStatus}
                                    onChange={(e) => setFormData({ ...formData, bookingStatus: e.target.value })}
                                >
                                    <option value="BOOKED">Booked</option>
                                    <option value="CANCELLED">Cancelled</option>
                                    <option value="COMPLETED">Completed</option>
                                </Form.Select>
                            </div>
                            <div className="col-md-6">
                                <Form.Label className="adminbooking-form-label">Payment Status</Form.Label>
                                <Form.Select
                                    value={formData.paymentStatus}
                                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                                >
                                    <option value="PAID">Paid</option>
                                    <option value="PARTIAL">Partial</option>
                                    <option value="PENDING">Pending</option>
                                </Form.Select>
                            </div>
                        </div>

                        <div className="adminbooking-price-display">
                            <div className="adminbooking-price-row">
                                <span>Total Price:</span>
                                <span className="fw-bold">₹ {editingBooking?.totalPrice || 0}</span>
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label className="adminbooking-form-label">Advance Payment</Form.Label>
                            <InputGroup>
                                <InputGroup.Text><FaRupeeSign size={12} /></InputGroup.Text>
                                <Form.Control
                                    type="number"
                                    min="0"
                                    value={formData.advancePaid}
                                    onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })}
                                />
                            </InputGroup>
                        </Form.Group>

                        <div className="adminbooking-price-display">
                            <div className="adminbooking-price-row">
                                <span>Remaining Balance:</span>
                                <span className="fw-bold text-danger">
                                    ₹ {(editingBooking?.totalPrice || 0) - (parseFloat(formData.advancePaid) || 0)}
                                </span>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="adminbooking-modal-footer">
                        <Button variant="danger" onClick={handleShowDelete}>
                            <FaTrash className="me-2" /> Delete
                        </Button>
                        <div className="ms-auto d-flex gap-2">
                            <Button variant="light" onClick={() => setShowEditModal(false)}>Cancel</Button>
                            <Button type="submit" className="adminbooking-btn-primary">Update Booking</Button>
                        </div>
                    </Modal.Footer>
                </Form>
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
                    <h5 className="fw-bold mb-2">Delete Booking?</h5>
                    <p className="text-muted">
                        Are you sure you want to delete the booking for <strong>{bookingToDelete?.customerName}</strong>?
                        <br />This action cannot be undone.
                    </p>
                    <div className="d-flex justify-content-center gap-2 mt-4">
                        <Button variant="light" onClick={() => setShowDeleteModal(false)} className="px-4">Cancel</Button>
                        <Button variant="danger" onClick={confirmDelete} className="px-4">Delete</Button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Date Picker Modal */}
            <Modal show={showDatePicker} onHide={() => setShowDatePicker(false)} centered>
                <Modal.Header closeButton className="adminbooking-modal-header">
                    <Modal.Title className="fw-bold">Select Date</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Form.Group>
                        <Form.Label className="adminbooking-form-label">Choose a date</Form.Label>
                        <Form.Control
                            type="date"
                            value={dateToString(selectedDate)}
                            onChange={(e) => {
                                setSelectedDate(new Date(e.target.value));
                                setShowDatePicker(false);
                            }}
                            autoFocus
                        />
                    </Form.Group>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default AdminBooking;
