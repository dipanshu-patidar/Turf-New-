import React, { useState, useEffect, useCallback } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';
import settingService from '../../../api/settingService';
import './AdminSetting.css';

const AdminSetting = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        turfName: '',
        openingTime: '',
        closingTime: '',
        slotDuration: 15,
        weekendDays: [],
        currency: 'INR'
    });

    const [errors, setErrors] = useState({});
    const [originalSettings, setOriginalSettings] = useState({ ...settings });

    // Fetch settings on mount
    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await settingService.getSettings();
            setSettings(data);
            setOriginalSettings(data);
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

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
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    // Handle weekend day toggle
    const handleWeekendToggle = (day) => {
        const currentWeekends = [...settings.weekendDays];
        const index = currentWeekends.indexOf(day);

        if (index > -1) {
            currentWeekends.splice(index, 1);
        } else {
            currentWeekends.push(day);
        }

        setSettings({
            ...settings,
            weekendDays: currentWeekends
        });

        if (errors.weekendDays) {
            setErrors({ ...errors, weekendDays: '' });
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!settings.turfName.trim()) {
            newErrors.turfName = 'Turf name is required';
        }

        if (!settings.openingTime) {
            newErrors.openingTime = 'Opening time is required';
        }
        if (!settings.closingTime) {
            newErrors.closingTime = 'Closing time is required';
        }
        if (settings.openingTime && settings.closingTime && settings.openingTime >= settings.closingTime) {
            newErrors.closingTime = 'Closing time must be after opening time';
        }

        if (settings.weekendDays.length === 0) {
            newErrors.weekendDays = 'At least one weekend day must be selected';
        }

        if (!settings.currency) {
            newErrors.currency = 'Currency is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle save
    const handleSave = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            setSaving(true);
            try {
                const data = await settingService.updateSettings({
                    turfName: settings.turfName,
                    openingTime: settings.openingTime,
                    closingTime: settings.closingTime,
                    weekendDays: settings.weekendDays,
                    currency: settings.currency
                });
                setSettings(data);
                setOriginalSettings(data);
                toast.success('Settings saved successfully!');
            } catch (error) {
                console.error('Error saving settings:', error);
                toast.error(error.response?.data?.message || 'Failed to save settings');
            } finally {
                setSaving(false);
            }
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

    if (loading) {
        return (
            <div className="adminsetting-container rounded-4 shadow-sm d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="danger" />
                    <p className="mt-2 text-muted">Loading settings...</p>
                </div>
            </div>
        );
    }

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
                                Slot Duration
                            </Form.Label>
                            <Form.Control
                                type="text"
                                className="adminsetting-form-control adminsetting-readonly"
                                value={`${settings.slotDuration} Minutes`}
                                readOnly
                            />
                            <div className="adminsetting-help-text">
                                Duration of each booking slot (System Controlled)
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
                                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                                    <div key={day} className="adminsetting-checkbox-item">
                                        <input
                                            type="checkbox"
                                            id={day}
                                            checked={settings.weekendDays.includes(day)}
                                            onChange={() => handleWeekendToggle(day)}
                                        />
                                        <label htmlFor={day}>{day}</label>
                                    </div>
                                ))}
                            </div>
                            {errors.weekendDays && (
                                <div className="adminsetting-error">{errors.weekendDays}</div>
                            )}
                            <div className="adminsetting-help-text">
                                Select days that are considered weekends for pricing and display
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
                            disabled={saving}
                        >
                            Reset
                        </Button>
                        <Button
                            type="submit"
                            className="adminsetting-btn-primary"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Saving...
                                </>
                            ) : 'Save Settings'}
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default AdminSetting;
