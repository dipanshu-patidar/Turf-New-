import React, { useState } from 'react';
import { Table, Button, Badge, Modal, Form, InputGroup } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaPause, FaPlay, FaRupeeSign } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './AdminRecurring.css';

const AdminRecurring = () => {
    // Courts configuration
    const courts = [
        'Football',
        'Cricket',
        'Badminton - Court 1',
        'Badminton - Court 2',
        'Pickleball'
    ];

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Mock data
    const [recurringBookings, setRecurringBookings] = useState([
        {
            id: 1,
            customerName: 'Rahul Sharma',
            phone: '9876543210',
            court: 'Football',
            recurrenceType: 'Weekly',
            fixedDays: ['Mon', 'Wed', 'Fri'],
            fixedTime: '18:00',
            monthlyAmount: 15000,
            paymentStatus: 'Paid',
            status: 'Active',
            startDate: '2026-01-01',
            endDate: null
        },
        {
            id: 2,
            customerName: 'Priya Singh',
            phone: '9123456780',
            court: 'Badminton - Court 1',
            recurrenceType: 'Weekly',
            fixedDays: ['Tue', 'Thu'],
            fixedTime: '17:00',
            monthlyAmount: 4800,
            paymentStatus: 'Pending',
            status: 'Active',
            startDate: '2026-01-05',
            endDate: '2026-06-30'
        },
        {
            id: 3,
            customerName: 'Amit Verma',
            phone: '9988776655',
            court: 'Cricket',
            recurrenceType: 'Monthly',
            fixedDays: ['Sat'],
            fixedTime: '09:00',
            monthlyAmount: 5200,
            paymentStatus: 'Paid',
            status: 'Paused',
            startDate: '2025-12-01',
            endDate: null
        }
    ]);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);
    const [bookingToDelete, setBookingToDelete] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        court: 'Football',
        recurrenceType: 'Weekly',
        fixedDays: [],
        fixedTime: '',
        startDate: '',
        endDate: '',
        monthlyAmount: 0,
        paymentStatus: 'Pending'
    });

    // Handlers
    const handleClose = () => {
        setShowModal(false);
        setEditingBooking(null);
        setFormData({
            customerName: '',
            phone: '',
            court: 'Football',
            recurrenceType: 'Weekly',
            fixedDays: [],
            fixedTime: '',
            startDate: '',
            endDate: '',
            monthlyAmount: 0,
            paymentStatus: 'Pending'
        });
    };

    const handleShowAdd = () => {
        setEditingBooking(null);
        setFormData({
            customerName: '',
            phone: '',
            court: 'Football',
            recurrenceType: 'Weekly',
            fixedDays: [],
            fixedTime: '',
            startDate: '',
            endDate: '',
            monthlyAmount: 0,
            paymentStatus: 'Pending'
        });
        setShowModal(true);
    };

    const handleShowEdit = (booking) => {
        setEditingBooking(booking);
        setFormData({
            customerName: booking.customerName,
            phone: booking.phone,
            court: booking.court,
            recurrenceType: booking.recurrenceType,
            fixedDays: booking.fixedDays,
            fixedTime: booking.fixedTime,
            startDate: booking.startDate,
            endDate: booking.endDate || '',
            monthlyAmount: booking.monthlyAmount,
            paymentStatus: booking.paymentStatus
        });
        setShowModal(true);
    };

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

    const handleSave = (e) => {
        e.preventDefault();

        if (formData.fixedDays.length === 0) {
            toast.error('Please select at least one day');
            return;
        }

        // Validate 15-minute interval alignment
        const [hours, minutes] = formData.fixedTime.split(':').map(Number);
        if (minutes % 15 !== 0) {
            toast.error('Start time must be in 15-minute intervals (e.g., 00, 15, 30, 45)');
            return;
        }

        if (editingBooking) {
            // Edit Logic
            const updatedList = recurringBookings.map(b =>
                b.id === editingBooking.id
                    ? { ...b, ...formData, status: editingBooking.status }
                    : b
            );
            setRecurringBookings(updatedList);
            toast.success('Recurring booking updated successfully');
        } else {
            // Add Logic
            const newBooking = {
                id: Date.now(),
                ...formData,
                status: 'Active'
            };
            setRecurringBookings([...recurringBookings, newBooking]);
            toast.success('Recurring booking created successfully');
        }
        handleClose();
    };

    const togglePauseResume = (id) => {
        const updatedList = recurringBookings.map(b => {
            if (b.id === id) {
                const newStatus = b.status === 'Active' ? 'Paused' : 'Active';
                toast.success(`Booking ${newStatus === 'Paused' ? 'paused' : 'resumed'}`);
                return { ...b, status: newStatus };
            }
            return b;
        });
        setRecurringBookings(updatedList);
    };

    const handleShowDelete = (booking) => {
        setBookingToDelete(booking);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        setRecurringBookings(recurringBookings.filter(b => b.id !== bookingToDelete.id));
        toast.success('Recurring booking deleted successfully');
        setShowDeleteModal(false);
        setBookingToDelete(null);
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
                            <th>Fixed Day(s)</th>
                            <th>Fixed Time</th>
                            <th>Monthly Amount</th>
                            <th>Payment Status</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recurringBookings.map((booking) => (
                            <tr key={booking.id} className={booking.status === 'Paused' ? 'paused' : ''}>
                                <td>
                                    <div className="fw-bold">{booking.customerName}</div>
                                </td>
                                <td>{booking.phone}</td>
                                <td>
                                    <Badge bg="light" text="dark" className="border">
                                        {booking.court}
                                    </Badge>
                                </td>
                                <td>
                                    <span className="adminrecurring-recurrence-badge">
                                        {booking.recurrenceType}
                                    </span>
                                </td>
                                <td>
                                    <div className="adminrecurring-days">
                                        {booking.fixedDays.map(day => (
                                            <span key={day} className="adminrecurring-day-badge">
                                                {day}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="fw-bold">{booking.fixedTime}</td>
                                <td className="fw-bold text-success">₹ {booking.monthlyAmount}</td>
                                <td>
                                    <span className={`adminrecurring-badge ${booking.paymentStatus === 'Paid' ? 'adminrecurring-badge-paid' : 'adminrecurring-badge-pending'}`}>
                                        {booking.paymentStatus}
                                    </span>
                                </td>
                                <td>
                                    <span className={`adminrecurring-badge ${booking.status === 'Active' ? 'adminrecurring-badge-active' : 'adminrecurring-badge-paused'}`}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="d-flex">
                                        <button
                                            className="adminrecurring-action-btn edit"
                                            title="Edit"
                                            onClick={() => handleShowEdit(booking)}
                                        >
                                            <FaEdit />
                                        </button>

                                        {booking.status === 'Active' ? (
                                            <button
                                                className="adminrecurring-action-btn pause"
                                                title="Pause"
                                                onClick={() => togglePauseResume(booking.id)}
                                            >
                                                <FaPause />
                                            </button>
                                        ) : (
                                            <button
                                                className="adminrecurring-action-btn play"
                                                title="Resume"
                                                onClick={() => togglePauseResume(booking.id)}
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
                        {recurringBookings.length === 0 && (
                            <tr>
                                <td colSpan="10" className="text-center py-4 text-muted">
                                    No recurring bookings found. Add one to get started.
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
                                    pattern="[0-9]{10}"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <Form.Label className="adminrecurring-form-label">Court</Form.Label>
                                <Form.Select
                                    value={formData.court}
                                    onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                                >
                                    {courts.map(court => (
                                        <option key={court} value={court}>{court}</option>
                                    ))}
                                </Form.Select>
                            </div>
                            <div className="col-md-6">
                                <Form.Label className="adminrecurring-form-label">Recurrence Type</Form.Label>
                                <Form.Select
                                    value={formData.recurrenceType}
                                    onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value })}
                                >
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
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
                            <div className="col-md-4">
                                <Form.Label className="adminrecurring-form-label">
                                    Fixed Time <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="time"
                                    required
                                    step="900"
                                    value={formData.fixedTime}
                                    onChange={(e) => setFormData({ ...formData, fixedTime: e.target.value })}
                                />
                            </div>
                            <div className="col-md-4">
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
                            <div className="col-md-4">
                                <Form.Label className="adminrecurring-form-label">End Date (Optional)</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <Form.Label className="adminrecurring-form-label">
                                    Monthly Amount <span className="text-danger">*</span>
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
                            <div className="col-md-6">
                                <Form.Label className="adminrecurring-form-label">Payment Status</Form.Label>
                                <Form.Select
                                    value={formData.paymentStatus}
                                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                                >
                                    <option value="Paid">Paid</option>
                                    <option value="Pending">Pending</option>
                                </Form.Select>
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
