import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card, Badge } from 'react-bootstrap';
import { FaUser, FaCalendarAlt, FaTableTennis, FaWallet, FaSave, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import './StaffNewBooking.css';

const StaffNewBooking = () => {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];

    // Form State
    const [formData, setFormData] = useState({
        customerName: '',
        phoneNumber: '',
        date: today,
        startTime: '06:00',
        endTime: '07:00',
        sport: 'Football',
        court: 'Main Turf',
        advancePaid: 0,
        paymentMode: 'Cash'
    });

    // Pricing Logic State
    const [pricing, setPricing] = useState({
        dayType: 'Weekday',
        totalPrice: 1200,
        remainingBalance: 1200,
        duration: 1,
        hourlyRate: 1200
    });

    // Mock Pricing Configuration
    const pricingConfig = {
        'Football': { Weekday: 1200, Weekend: 1500 },
        'Cricket': { Weekday: 1000, Weekend: 1300 },
        'Badminton': { Weekday: 400, Weekend: 500 },
        'Pickleball': { Weekday: 600, Weekend: 800 }
    };

    const courtsBySport = {
        'Football': ['Grass Court', 'Main Court'],
        'Cricket': ['Grass Court', 'Main Court'],
        'Badminton': ['Court 1', 'Court 2'],
        'Pickleball': ['Pickleball Court']
    };

    // Calculate Day Type and Price
    // Calculate Day Type, Duration, and Price
    useEffect(() => {
        const dateObj = new Date(formData.date);
        const day = dateObj.getDay();
        const isWeekend = (day === 0 || day === 6); // 0 is Sunday, 6 is Saturday
        const dayType = isWeekend ? 'Weekend' : 'Weekday';

        const hourlyRate = pricingConfig[formData.sport]?.[dayType] || 0;

        // Calculate Duration
        let durationHours = 0;
        let totalMinutes = 0;

        if (formData.startTime && formData.endTime) {
            const [startHour, startMin] = formData.startTime.split(':').map(Number);
            const [endHour, endMin] = formData.endTime.split(':').map(Number);

            const startTotalMins = startHour * 60 + startMin;
            const endTotalMins = endHour * 60 + endMin;

            if (endTotalMins > startTotalMins) {
                totalMinutes = endTotalMins - startTotalMins;
                durationHours = totalMinutes / 60;
            }
        }

        // Pricing: (HourlyRate / 60) * TotalMinutes
        const totalPrice = Math.ceil((hourlyRate / 60) * totalMinutes);

        // Format Duration String (e.g., "1h 15m")
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const durationString = minutes > 0 ? `${hours}h ${minutes}m` : `${hours} Hours`;

        setPricing(prev => ({
            ...prev,
            dayType: dayType,
            totalPrice: totalPrice,
            remainingBalance: totalPrice - formData.advancePaid,
            duration: durationString,
            totalMinutes: totalMinutes,
            hourlyRate: hourlyRate
        }));
    }, [formData.date, formData.sport, formData.advancePaid, formData.startTime, formData.endTime]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Reset court if sport changes
        if (name === 'sport') {
            setFormData(prev => ({
                ...prev,
                court: courtsBySport[value][0]
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.customerName || !formData.phoneNumber) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.advancePaid > pricing.totalPrice) {
            toast.error('Advance cannot be greater than Total Price');
            return;
        }

        if (formData.phoneNumber.length < 10) {
            toast.error('Please enter a valid phone number');
            return;
        }

        const [startHour, startMin] = formData.startTime.split(':').map(Number);
        const [endHour, endMin] = formData.endTime.split(':').map(Number);

        const startTotalMins = startHour * 60 + startMin;
        const endTotalMins = endHour * 60 + endMin;

        if (startTotalMins >= endTotalMins) {
            toast.error('End time must be after Start time');
            return;
        }

        if (startTotalMins % 15 !== 0 || endTotalMins % 15 !== 0) {
            toast.error('Bookings must be in 15-minute intervals');
            return;
        }

        // Mock Save
        console.log('Saving Booking:', { ...formData, ...pricing });
        toast.success('Booking saved successfully!');

        // Redirect to calendar or dashboard
        setTimeout(() => {
            navigate('/management/booking-calendar');
        }, 1500);
    };

    return (
        <div className="newbooking-container">
            <div className="newbooking-page-header">
                <h2 className="newbooking-title">Create New Booking</h2>
                <p className="text-muted m-0">Fill in details to reserve a slot</p>
            </div>

            <div className="newbooking-card">
                <Form onSubmit={handleSubmit}>
                    <Row className="g-4">
                        {/* Section 1: Customer Details */}
                        <Col lg={6}>
                            <h5 className="newbooking-section-title">
                                <FaUser /> Customer Details
                            </h5>
                            <Row>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="newbooking-form-label">Customer Name *</Form.Label>
                                    <Form.Control
                                        className="newbooking-input"
                                        type="text"
                                        name="customerName"
                                        placeholder="Enter customer name"
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        required
                                    />
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="newbooking-form-label">Phone Number *</Form.Label>
                                    <Form.Control
                                        className="newbooking-input"
                                        type="tel"
                                        name="phoneNumber"
                                        placeholder="Enter 10-digit number"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </Col>
                            </Row>
                        </Col>

                        {/* Section 2: Booking Details */}
                        <Col lg={6}>
                            <h5 className="newbooking-section-title">
                                <FaCalendarAlt /> Slot Selection
                            </h5>
                            <Row>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="newbooking-form-label">Date</Form.Label>
                                    <Form.Control
                                        className="newbooking-input"
                                        type="date"
                                        name="date"
                                        min={today}
                                        value={formData.date}
                                        onChange={handleChange}
                                    />
                                </Col>
                                <Col md={3} className="mb-3">
                                    <Form.Label className="newbooking-form-label">Start Time</Form.Label>
                                    <Form.Control
                                        className="newbooking-input"
                                        type="time"
                                        step="900"
                                        name="startTime"
                                        value={formData.startTime}
                                        onChange={handleChange}
                                    />
                                </Col>
                                <Col md={3} className="mb-3">
                                    <Form.Label className="newbooking-form-label">End Time</Form.Label>
                                    <Form.Control
                                        className="newbooking-input"
                                        type="time"
                                        step="900"
                                        name="endTime"
                                        value={formData.endTime}
                                        onChange={handleChange}
                                    />
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="newbooking-form-label">Sport</Form.Label>
                                    <Form.Select
                                        className="newbooking-input"
                                        name="sport"
                                        value={formData.sport}
                                        onChange={handleChange}
                                    >
                                        <option value="Football">Football</option>
                                        <option value="Cricket">Cricket</option>
                                        <option value="Badminton">Badminton</option>
                                        <option value="Pickleball">Pickleball</option>
                                    </Form.Select>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="newbooking-form-label">Court</Form.Label>
                                    <Form.Select
                                        className="newbooking-input"
                                        name="court"
                                        value={formData.court}
                                        onChange={handleChange}
                                        disabled={formData.sport === 'Pickleball'}
                                    >
                                        {courtsBySport[formData.sport].map(ct => (
                                            <option key={ct} value={ct}>{ct}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                            </Row>
                        </Col>

                        <Col lg={12}><hr className="my-2" /></Col>

                        {/* Section 3 & 4: Pricing and Payment */}
                        <Col lg={5}>
                            <h5 className="newbooking-section-title">
                                <FaTableTennis /> Pricing Info
                            </h5>
                            <div className="newbooking-pricing-box">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Day Type:</span>
                                    <Badge bg={pricing.dayType === 'Weekend' ? 'danger' : 'primary'}>
                                        {pricing.dayType}
                                    </Badge>
                                </div>
                                <div className="d-flex justify-content-between mb-2 align-items-center">
                                    <span className="text-muted">Rate Per Hour:</span>
                                    <span className="fw-bold">₹{pricing.hourlyRate}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2 align-items-center">
                                    <span className="text-muted">Duration:</span>
                                    <span className="fw-bold">{pricing.duration}</span>
                                </div>
                                <hr />
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="h6 mb-0">Total Amount:</span>
                                    <span className="newbooking-total-display">₹{pricing.totalPrice}</span>
                                </div>
                            </div>
                        </Col>

                        <Col lg={7}>
                            <h5 className="newbooking-section-title">
                                <FaWallet /> Payment Entry
                            </h5>
                            <Row>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="newbooking-form-label">Advance Paid (₹)</Form.Label>
                                    <Form.Control
                                        className="newbooking-input"
                                        type="number"
                                        name="advancePaid"
                                        placeholder="Enter amount"
                                        value={formData.advancePaid}
                                        onChange={handleChange}
                                    />
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="newbooking-form-label">Remaining Balance (₹)</Form.Label>
                                    <Form.Control
                                        className="newbooking-input"
                                        type="text"
                                        readOnly
                                        value={`₹${pricing.remainingBalance}`}
                                    />
                                    <Form.Text className="text-danger small">
                                        * To be collected at turf
                                    </Form.Text>
                                </Col>
                                <Col md={12} className="mb-3">
                                    <Form.Label className="newbooking-form-label">Payment Mode</Form.Label>
                                    <div className="d-flex gap-2">
                                        {['Cash', 'UPI', 'Card'].map(mode => (
                                            <Button
                                                key={mode}
                                                variant={formData.paymentMode === mode ? 'danger' : 'outline-secondary'}
                                                onClick={() => setFormData(prev => ({ ...prev, paymentMode: mode }))}
                                                className="flex-grow-1 py-3 fw-bold"
                                            >
                                                {mode}
                                            </Button>
                                        ))}
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>

                    <div className="newbooking-actions">
                        <Button variant="danger" type="submit" className="newbooking-btn-save">
                            <FaSave className="me-2" /> Save Booking
                        </Button>
                        <Button variant="outline-secondary" className="newbooking-btn-cancel" onClick={() => navigate('/management/booking-calendar')}>
                            <FaTimes className="me-2" /> Cancel
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default StaffNewBooking;
