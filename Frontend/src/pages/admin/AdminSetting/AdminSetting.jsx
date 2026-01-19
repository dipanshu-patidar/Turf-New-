import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import toast from 'react-hot-toast';
import './AdminSetting.css';

const AdminSetting = () => {
    // Initial settings state
    const [settings, setSettings] = useState({
        turfName: 'Elite Sports Arena',
        openingTime: '06:00',
        closingTime: '23:00',
        slotDuration: '60',
        weekendDays: {
            saturday: true,
            sunday: true
        },
        currency: 'INR'
    });

    const [errors, setErrors] = useState({});
    const [originalSettings, setOriginalSettings] = useState({ ...settings });

    // Slot duration options
    const slotDurations = [
        { value: '30', label: '30 Minutes' },
        { value: '60', label: '60 Minutes' },
        { value: '90', label: '90 Minutes' },
        { value: '120', label: '120 Minutes' }
    ];

    // Currency options
    const currencies = [
        { value: 'INR', label: 'INR - Indian Rupee (₹)' },
        { value: 'USD', label: 'USD - US Dollar ($)' },
        { value: 'EUR', label: 'EUR - Euro (€)' },
        { value: 'GBP', label: 'GBP - British Pound (£)' }
    ];

    // Handle input changes
    const handleInputChange = (field, value) => {
        setSettings({ ...settings, [field]: value });
        // Clear error for this field
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    // Handle weekend day toggle
    const handleWeekendToggle = (day) => {
        setSettings({
            ...settings,
            weekendDays: {
                ...settings.weekendDays,
                [day]: !settings.weekendDays[day]
            }
        });
        // Clear weekend error
        if (errors.weekendDays) {
            setErrors({ ...errors, weekendDays: '' });
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Turf name validation
        if (!settings.turfName.trim()) {
            newErrors.turfName = 'Turf name is required';
        }

        // Operating hours validation
        if (!settings.openingTime) {
            newErrors.openingTime = 'Opening time is required';
        }
        if (!settings.closingTime) {
            newErrors.closingTime = 'Closing time is required';
        }
        if (settings.openingTime && settings.closingTime && settings.openingTime >= settings.closingTime) {
            newErrors.closingTime = 'Closing time must be after opening time';
        }

        // Slot duration validation
        if (!settings.slotDuration) {
            newErrors.slotDuration = 'Slot duration is required';
        }

        // Weekend days validation
        if (!settings.weekendDays.saturday && !settings.weekendDays.sunday) {
            newErrors.weekendDays = 'At least one weekend day must be selected';
        }

        // Currency validation
        if (!settings.currency) {
            newErrors.currency = 'Currency is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle save
    const handleSave = (e) => {
        e.preventDefault();

        if (validateForm()) {
            // Save settings logic here (API call)
            setOriginalSettings({ ...settings });
            toast.success('Settings saved successfully!');
        } else {
            toast.error('Please fix the errors before saving');
        }
    };

    // Handle reset
    const handleReset = () => {
        setSettings({ ...originalSettings });
        setErrors({});
        toast.info('Settings reset to last saved values');
    };

    return (
        <div className="adminsetting-container rounded-4 shadow-sm">
            {/* Header */}
            <div className="adminsetting-page-header">
                <div>
                    <h2 className="adminsetting-title">Settings</h2>
                    <p className="text-muted m-0 small">Configure your turf management system</p>
                </div>
            </div>

            {/* Form */}
            <div className="adminsetting-form-container">
                <Form onSubmit={handleSave}>
                    {/* General Information */}
                    <div className="adminsetting-section">
                        <h5 className="adminsetting-section-title">General Information</h5>
                        <Form.Group className="mb-3">
                            <Form.Label className="adminsetting-form-label">
                                Turf Name <span className="required">*</span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                className="adminsetting-form-control"
                                placeholder="Enter turf name"
                                value={settings.turfName}
                                onChange={(e) => handleInputChange('turfName', e.target.value)}
                                isInvalid={!!errors.turfName}
                            />
                            {errors.turfName && (
                                <div className="adminsetting-error">{errors.turfName}</div>
                            )}
                            <div className="adminsetting-help-text">
                                This name will be displayed across the system
                            </div>
                        </Form.Group>
                    </div>

                    {/* Operating Hours */}
                    <div className="adminsetting-section">
                        <h5 className="adminsetting-section-title">Operating Hours</h5>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label className="adminsetting-form-label">
                                        Opening Time <span className="required">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="time"
                                        className="adminsetting-form-control"
                                        value={settings.openingTime}
                                        onChange={(e) => handleInputChange('openingTime', e.target.value)}
                                        isInvalid={!!errors.openingTime}
                                    />
                                    {errors.openingTime && (
                                        <div className="adminsetting-error">{errors.openingTime}</div>
                                    )}
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label className="adminsetting-form-label">
                                        Closing Time <span className="required">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="time"
                                        className="adminsetting-form-control"
                                        value={settings.closingTime}
                                        onChange={(e) => handleInputChange('closingTime', e.target.value)}
                                        isInvalid={!!errors.closingTime}
                                    />
                                    {errors.closingTime && (
                                        <div className="adminsetting-error">{errors.closingTime}</div>
                                    )}
                                </Form.Group>
                            </div>
                        </div>
                    </div>

                    {/* Booking Configuration */}
                    <div className="adminsetting-section">
                        <h5 className="adminsetting-section-title">Booking Configuration</h5>
                        <Form.Group className="mb-3">
                            <Form.Label className="adminsetting-form-label">
                                Slot Duration <span className="required">*</span>
                            </Form.Label>
                            <Form.Select
                                className="adminsetting-form-control"
                                value={settings.slotDuration}
                                onChange={(e) => handleInputChange('slotDuration', e.target.value)}
                                isInvalid={!!errors.slotDuration}
                            >
                                <option value="">Select slot duration</option>
                                {slotDurations.map(slot => (
                                    <option key={slot.value} value={slot.value}>
                                        {slot.label}
                                    </option>
                                ))}
                            </Form.Select>
                            {errors.slotDuration && (
                                <div className="adminsetting-error">{errors.slotDuration}</div>
                            )}
                            <div className="adminsetting-help-text">
                                Duration of each booking slot
                            </div>
                        </Form.Group>

                        <Form.Group>
                            <Form.Label className="adminsetting-form-label">
                                Back-to-back Booking
                            </Form.Label>
                            <Form.Control
                                type="text"
                                className="adminsetting-form-control adminsetting-readonly"
                                value="Enabled"
                                readOnly
                            />
                            <div className="adminsetting-help-text">
                                Customers can book consecutive time slots
                            </div>
                        </Form.Group>
                    </div>

                    {/* Weekend Configuration */}
                    <div className="adminsetting-section">
                        <h5 className="adminsetting-section-title">Weekend Configuration</h5>
                        <Form.Group>
                            <Form.Label className="adminsetting-form-label">
                                Weekend Days <span className="required">*</span>
                            </Form.Label>
                            <div className="adminsetting-checkbox-group">
                                <div className="adminsetting-checkbox-item">
                                    <input
                                        type="checkbox"
                                        id="saturday"
                                        checked={settings.weekendDays.saturday}
                                        onChange={() => handleWeekendToggle('saturday')}
                                    />
                                    <label htmlFor="saturday">Saturday</label>
                                </div>
                                <div className="adminsetting-checkbox-item">
                                    <input
                                        type="checkbox"
                                        id="sunday"
                                        checked={settings.weekendDays.sunday}
                                        onChange={() => handleWeekendToggle('sunday')}
                                    />
                                    <label htmlFor="sunday">Sunday</label>
                                </div>
                            </div>
                            {errors.weekendDays && (
                                <div className="adminsetting-error">{errors.weekendDays}</div>
                            )}
                            <div className="adminsetting-help-text">
                                Select days that are considered weekends for pricing
                            </div>
                        </Form.Group>
                    </div>

                    {/* Currency Settings */}
                    <div className="adminsetting-section">
                        <h5 className="adminsetting-section-title">Currency Settings</h5>
                        <Form.Group>
                            <Form.Label className="adminsetting-form-label">
                                Currency <span className="required">*</span>
                            </Form.Label>
                            <Form.Select
                                className="adminsetting-form-control"
                                value={settings.currency}
                                onChange={(e) => handleInputChange('currency', e.target.value)}
                                isInvalid={!!errors.currency}
                            >
                                {currencies.map(curr => (
                                    <option key={curr.value} value={curr.value}>
                                        {curr.label}
                                    </option>
                                ))}
                            </Form.Select>
                            {errors.currency && (
                                <div className="adminsetting-error">{errors.currency}</div>
                            )}
                            <div className="adminsetting-help-text">
                                Currency used for all pricing and transactions
                            </div>
                        </Form.Group>
                    </div>

                    {/* Action Buttons */}
                    <div className="adminsetting-actions">
                        <Button
                            type="button"
                            className="adminsetting-btn-secondary"
                            onClick={handleReset}
                        >
                            Reset
                        </Button>
                        <Button
                            type="submit"
                            className="adminsetting-btn-primary"
                        >
                            Save Settings
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default AdminSetting;
