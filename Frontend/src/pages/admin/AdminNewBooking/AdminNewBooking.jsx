import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card, Badge, InputGroup } from 'react-bootstrap';
import { FaUser, FaCalendarAlt, FaTableTennis, FaWallet, FaSave, FaTimes, FaCheck, FaCalculator } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import './AdminNewBooking.css';

import api from '../../../api/axiosInstance';

const AdminNewBooking = () => {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];

    // Data State
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        customerName: '',
        phoneNumber: '',
        date: today,
        startTime: '06:00',
        endTime: '07:00',
        sport: '', // Will be set after fetching courts
        courtId: '', // Changed from 'court' (name) to 'courtId'
        advancePaid: 0,
        paymentMode: 'Cash',
        notes: ''
    });

    // Pricing Logic State
    const [pricing, setPricing] = useState({
        dayType: 'Weekday',
        totalPrice: 0,
        finalAmount: 0,
        remainingBalance: 0,
        duration: '0h 0m',
        hourlyRate: 0,
        totalMinutes: 0,
        discount: 0,
        isPriceOverridden: false
    });

    // Fetch Courts on Mount
    useEffect(() => {
        const fetchCourts = async () => {
            try {
                const response = await api.get('/courts');
                const activeCourts = response.data.filter(c => c.status === 'ACTIVE');
                setCourts(activeCourts);

                if (activeCourts.length > 0) {
                    // Set default sport and court
                    const defaultCourt = activeCourts[0];
                    setFormData(prev => ({
                        ...prev,
                        sport: defaultCourt.sportType,
                        courtId: defaultCourt._id
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

    // Derived State for UI
    const uniqueSports = [...new Set(courts.map(c => c.sportType))];
    const availableCourts = courts.filter(c => c.sportType === formData.sport);

    // Calculate Day Type, Duration, and Price
    useEffect(() => {
        const selectedCourt = courts.find(c => c._id === formData.courtId);
        if (!selectedCourt) return;

        const dateObj = new Date(formData.date);
        const day = dateObj.getDay();
        const isWeekend = (day === 0 || day === 6);
        const dayType = isWeekend ? 'Weekend' : 'Weekday';

        const hourlyRate = isWeekend ? selectedCourt.weekendPrice : selectedCourt.weekdayPrice;

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

        // Auto-Calculate Price if NOT overridden
        let calculatedPrice = pricing.totalPrice;
        if (!pricing.isPriceOverridden) {
            // Price per minute * minutes (Multiply first to avoid floating point errors)
            calculatedPrice = Math.ceil((hourlyRate * totalMinutes) / 60);
        }

        // Apply Discount
        const discountAmount = Number(pricing.discount) || 0;
        const finalPayable = Math.max(0, calculatedPrice - discountAmount);
        // Ensure advance doesn't exceed final payable (visual only here, validation on submit)

        // Format Duration
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const durationString = minutes > 0 ? `${hours}h ${minutes}m` : `${hours} Hours`;

        setPricing(prev => ({
            ...prev,
            dayType,
            totalPrice: calculatedPrice,
            finalAmount: finalPayable,
            remainingBalance: Math.max(0, finalPayable - formData.advancePaid),
            duration: durationString,
            totalMinutes,
            hourlyRate: !prev.isPriceOverridden ? hourlyRate : prev.hourlyRate
        }));

    }, [formData.date, formData.courtId, formData.startTime, formData.endTime, pricing.discount, pricing.isPriceOverridden, formData.advancePaid, courts]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'sport') {
            // When sport changes, select the first available court for that sport
            const firstCourt = courts.find(c => c.sportType === value);
            if (firstCourt) {
                setFormData(prev => ({
                    ...prev,
                    sport: value,
                    courtId: firstCourt._id
                }));
            }
        }
    };

    const handlePriceChange = (e) => {
        const newPrice = Number(e.target.value);
        setPricing(prev => ({
            ...prev,
            totalPrice: newPrice,
            isPriceOverridden: true
        }));
    };

    const handleDiscountChange = (e) => {
        const discount = Number(e.target.value);
        setPricing(prev => ({
            ...prev,
            discount: discount
        }));
    };

    const resetPrice = () => {
        setPricing(prev => ({
            ...prev,
            isPriceOverridden: false,
            discount: 0
        }));
        toast.success('Price reset to auto-calculation');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.customerName || !formData.phoneNumber) {
            toast.error('Customer details are required');
            return;
        }

        if (formData.advancePaid > pricing.finalAmount) {
            toast.error('Advance cannot be greater than Final Amount');
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

        // Prepare Payload
        const payload = {
            customerName: formData.customerName,
            customerPhone: formData.phoneNumber,
            sportType: formData.sport,
            courtId: formData.courtId,
            bookingDate: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            // If overridden, we might handle discount differently, but for now sending standard logic
            discountType: pricing.discount > 0 ? 'FLAT' : 'NONE',
            discountValue: pricing.discount,
            advancePaid: Number(formData.advancePaid),
            balanceAmount: pricing.remainingBalance, // Added as per user request to be in payload
            paymentMode: formData.paymentMode.toUpperCase(), // Backend expects uppercase
            paymentNotes: formData.notes
        };

        try {
            const response = await api.post('/admin/bookings', payload);
            if (response.data.success) {
                toast.success('Booking saved successfully!');
                setTimeout(() => {
                    navigate('/admin/booking-calendar');
                }, 1500);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create booking');
        }
    };

    return (
        <div className="adminnewbooking-container">
            <div className="adminnewbooking-page-header">
                <div>
                    <h2 className="adminnewbooking-title">New Booking (Admin)</h2>
                    <p className="text-muted m-0">Full control booking creation</p>
                </div>
            </div>

            <div className="adminnewbooking-card">
                <Form onSubmit={handleSubmit}>
                    <Row className="g-4">
                        {/* Customer Details */}
                        <Col lg={6}>
                            <h5 className="adminnewbooking-section-title">
                                <FaUser /> Customer Details
                            </h5>
                            <Row>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="adminnewbooking-form-label">Customer Name *</Form.Label>
                                    <Form.Control
                                        className="adminnewbooking-input"
                                        type="text"
                                        name="customerName"
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        required
                                    />
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="adminnewbooking-form-label">Phone Number *</Form.Label>
                                    <Form.Control
                                        className="adminnewbooking-input"
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </Col>
                            </Row>
                        </Col>

                        {/* Booking Details */}
                        <Col lg={6}>
                            <h5 className="adminnewbooking-section-title">
                                <FaCalendarAlt /> Slot Selection
                            </h5>
                            <Row>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="adminnewbooking-form-label">Date</Form.Label>
                                    <Form.Control
                                        className="adminnewbooking-input"
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                    />
                                </Col>
                                <Col md={3} className="mb-3">
                                    <Form.Label className="adminnewbooking-form-label">Start Time</Form.Label>
                                    <Form.Control
                                        className="adminnewbooking-input"
                                        type="time"
                                        step="900"
                                        name="startTime"
                                        value={formData.startTime}
                                        onChange={handleChange}
                                    />
                                </Col>
                                <Col md={3} className="mb-3">
                                    <Form.Label className="adminnewbooking-form-label">End Time</Form.Label>
                                    <Form.Control
                                        className="adminnewbooking-input"
                                        type="time"
                                        step="900"
                                        name="endTime"
                                        value={formData.endTime}
                                        onChange={handleChange}
                                    />
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="adminnewbooking-form-label">Sport</Form.Label>
                                    <Form.Select
                                        className="adminnewbooking-input"
                                        name="sport"
                                        value={formData.sport}
                                        onChange={handleChange}
                                        disabled={loading}
                                    >
                                        <option value="">Select Sport</option>
                                        {uniqueSports.map(sport => (
                                            <option key={sport} value={sport}>{sport}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="adminnewbooking-form-label">Court</Form.Label>
                                    <Form.Select
                                        className="adminnewbooking-input"
                                        name="courtId"
                                        value={formData.courtId}
                                        onChange={handleChange}
                                        disabled={!formData.sport || loading}
                                    >
                                        <option value="">Select Court</option>
                                        {availableCourts.map(ct => (
                                            <option key={ct._id} value={ct._id}>{ct.name}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                            </Row>
                        </Col>

                        <Col lg={12}><hr className="my-2" /></Col>

                        {/* Admin Pricing Section */}
                        <Col lg={5}>
                            <h5 className="adminnewbooking-section-title">
                                <FaTableTennis /> Pricing & Overrides
                            </h5>
                            <div className="adminnewbooking-pricing-box">
                                <div className="d-flex justify-content-between mb-3">
                                    <span className="text-muted">Day Type:</span>
                                    <Badge bg={pricing.dayType === 'Weekend' ? 'danger' : 'primary'}>{pricing.dayType}</Badge>
                                </div>
                                <div className="mb-3">
                                    <Form.Label className="small text-muted">Total Price (Editable)</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>₹</InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            className={`fw-bold ${pricing.isPriceOverridden ? 'text-warning' : ''}`}
                                            value={pricing.totalPrice}
                                            onChange={handlePriceChange}
                                        />
                                        {pricing.isPriceOverridden && (
                                            <Button variant="outline-secondary" onClick={resetPrice} title="Reset to Auto">
                                                <FaCalculator />
                                            </Button>
                                        )}
                                    </InputGroup>
                                </div>
                                <div className="mb-3">
                                    <Form.Label className="small text-muted">Discount (₹)</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>-</InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            value={pricing.discount}
                                            onChange={handleDiscountChange}
                                            placeholder="0"
                                        />
                                    </InputGroup>
                                </div>
                                <hr />
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="h6 mb-0">Final Payable:</span>
                                    <span className="adminnewbooking-total-display text-primary">₹{pricing.finalAmount}</span>
                                </div>
                            </div>
                        </Col>

                        {/* Payment Entry */}
                        <Col lg={7}>
                            <h5 className="adminnewbooking-section-title">
                                <FaWallet /> Payment Entry
                            </h5>
                            <Row>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="adminnewbooking-form-label">Advance Paid (₹)</Form.Label>
                                    <Form.Control
                                        className="adminnewbooking-input"
                                        type="number"
                                        name="advancePaid"
                                        value={formData.advancePaid}
                                        onChange={handleChange}
                                    />
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="adminnewbooking-form-label">Remaining Balance (₹)</Form.Label>
                                    <Form.Control
                                        className="adminnewbooking-input bg-light"
                                        type="text"
                                        readOnly
                                        value={`₹${pricing.remainingBalance}`}
                                    />
                                </Col>
                                <Col md={12} className="mb-3">
                                    <Form.Label className="adminnewbooking-form-label">Payment Mode</Form.Label>
                                    <div className="d-flex gap-2">
                                        {['Cash', 'UPI', 'Card', 'Online'].map(mode => (
                                            <Button
                                                key={mode}
                                                variant={formData.paymentMode === mode ? 'dark' : 'outline-secondary'}
                                                onClick={() => setFormData(prev => ({ ...prev, paymentMode: mode }))}
                                                className="flex-grow-1"
                                            >
                                                {mode}
                                            </Button>
                                        ))}
                                    </div>
                                </Col>
                                <Col md={12}>
                                    <Form.Label className="adminnewbooking-form-label">Notes</Form.Label>
                                    <Form.Control
                                        className="adminnewbooking-input"
                                        as="textarea"
                                        rows={2}
                                        placeholder="Admin notes (optional)"
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                    />
                                </Col>
                            </Row>
                        </Col>
                    </Row>

                    <div className="adminnewbooking-actions">
                        <Button variant="outline-secondary" onClick={() => navigate('/admin/booking-calendar')}>
                            <FaTimes className="me-2" /> Cancel
                        </Button>
                        <Button variant="success" type="submit" className="adminnewbooking-btn-save">
                            <FaSave className="me-2" /> Save Booking
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default AdminNewBooking;
