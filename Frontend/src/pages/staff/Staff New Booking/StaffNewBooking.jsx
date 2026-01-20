import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card, Badge, Spinner } from 'react-bootstrap';
import { FaUser, FaCalendarAlt, FaTableTennis, FaWallet, FaSave, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import './StaffNewBooking.css';
import courtService from '../../../api/courtService';
import staffBookingService from '../../../api/staffBookingService';

const StaffNewBooking = () => {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];

    // Data State
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        customerName: '',
        phoneNumber: '',
        date: today,
        startTime: '06:00',
        endTime: '07:00',
        sport: '',
        courtId: '',
        advancePaid: 0,
        paymentMode: 'Cash'
    });

    // Pricing Logic State
    const [pricing, setPricing] = useState({
        dayType: 'Weekday',
        totalPrice: 0,
        remainingBalance: 0,
        duration: '0 Hours',
        hourlyRate: 0
    });

    // Fetch Courts on Mount
    useEffect(() => {
        const fetchCourts = async () => {
            try {
                const data = await courtService.getCourts();
                setCourts(data);

                // Set default sport and court if possible
                if (data.length > 0) {
                    const firstSport = data[0].sportType;
                    const firstCourt = data.find(c => c.sportType === firstSport);

                    setFormData(prev => ({
                        ...prev,
                        sport: firstSport,
                        courtId: firstCourt ? firstCourt._id : ''
                    }));
                }
            } catch (error) {
                console.error('Error fetching courts:', error);
                toast.error('Failed to load courts');
            } finally {
                setLoading(false);
            }
        };

        fetchCourts();
    }, []);

    // Calculate Day Type, Duration, and Price
    useEffect(() => {
        if (!formData.courtId || !formData.date) return;

        const selectedCourt = courts.find(c => c._id === formData.courtId);
        if (!selectedCourt) return;

        const dateObj = new Date(formData.date);
        const day = dateObj.getDay();
        const isWeekend = (day === 0 || day === 6); // 0 is Sunday, 6 is Saturday
        const dayType = isWeekend ? 'Weekend' : 'Weekday';

        const hourlyRate = isWeekend ? selectedCourt.weekendPrice : selectedCourt.weekdayPrice;

        // Calculate Duration
        let totalMinutes = 0;
        if (formData.startTime && formData.endTime) {
            const [startHour, startMin] = formData.startTime.split(':').map(Number);
            const [endHour, endMin] = formData.endTime.split(':').map(Number);

            const startTotalMins = startHour * 60 + startMin;
            const endTotalMins = endHour * 60 + endMin;

            if (endTotalMins > startTotalMins) {
                totalMinutes = endTotalMins - startTotalMins;
            }
        }

        // Pricing: (HourlyRate / 4) * (TotalMinutes / 15) to match backend slot logic
        const totalPrice = (hourlyRate / 4) * (totalMinutes / 15);

        // Format Duration String
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const durationString = minutes > 0 ? `${hours}h ${minutes}m` : `${hours} Hours`;

        setPricing({
            dayType: dayType,
            totalPrice: totalPrice,
            remainingBalance: Math.max(0, totalPrice - (parseFloat(formData.advancePaid) || 0)),
            duration: durationString,
            hourlyRate: hourlyRate
        });
    }, [formData.date, formData.courtId, formData.advancePaid, formData.startTime, formData.endTime, courts]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'sport') {
            const firstCourtForSport = courts.find(c => c.sportType === value);
            setFormData(prev => ({
                ...prev,
                sport: value,
                courtId: firstCourtForSport ? firstCourtForSport._id : ''
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.customerName || !formData.phoneNumber || !formData.courtId) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.phoneNumber.length !== 10) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }

        if (formData.advancePaid > pricing.totalPrice) {
            toast.error('Advance cannot be greater than Total Price');
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

        setSaving(true);
        try {
            await staffBookingService.createBooking({
                customerName: formData.customerName,
                phoneNumber: formData.phoneNumber,
                bookingDate: formData.date,
                startTime: formData.startTime,
                endTime: formData.endTime,
                courtId: formData.courtId,
                sport: formData.sport,
                advancePaid: Number(formData.advancePaid),
                remainingBalance: pricing.remainingBalance,
                paymentMode: formData.paymentMode.toUpperCase()
            });

            toast.success('Booking saved successfully!');
            setTimeout(() => {
                navigate('/management/booking-calendar');
            }, 1000);
        } catch (error) {
            console.error('Save Error:', error);
            toast.error(error.response?.data?.message || 'Failed to save booking');
        } finally {
            setSaving(false);
        }
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
                                        {[...new Set(courts.map(c => c.sportType))].map(sport => (
                                            <option key={sport} value={sport}>{sport}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="newbooking-form-label">Court</Form.Label>
                                    <Form.Select
                                        className="newbooking-input"
                                        name="courtId"
                                        value={formData.courtId}
                                        onChange={handleChange}
                                    >
                                        {courts.filter(c => c.sportType === formData.sport).map(ct => (
                                            <option key={ct._id} value={ct._id}>{ct.name}</option>
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
                        <Button
                            variant="danger"
                            type="submit"
                            className="newbooking-btn-save"
                            disabled={saving || loading}
                        >
                            {(saving || loading) ? (
                                <Spinner animation="border" size="sm" className="me-2" />
                            ) : (
                                <FaSave className="me-2" />
                            )}
                            {saving ? 'Saving...' : 'Save Booking'}
                        </Button>
                        <Button
                            variant="outline-secondary"
                            className="newbooking-btn-cancel"
                            onClick={() => navigate('/management/booking-calendar')}
                            disabled={saving}
                        >
                            <FaTimes className="me-2" /> Cancel
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default StaffNewBooking;
