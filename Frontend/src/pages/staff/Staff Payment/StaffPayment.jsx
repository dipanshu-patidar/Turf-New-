import React, { useState } from 'react';
import { Table, Button, Badge, Modal, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { FaMoneyBillWave, FaFilter, FaSearch, FaCheck, FaTimes, FaCreditCard, FaRupeeSign } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './StaffPayment.css';

const StaffPayment = () => {
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');

    // Mock Data
    const [payments, setPayments] = useState([
        {
            id: 101,
            customerName: "Rahul Sharma",
            court: "Football - Main Turf",
            date: "2024-03-20",
            time: "18:00 - 19:00",
            totalAmount: 1500,
            advancePaid: 500,
            balance: 1000,
            mode: "Cash",
            status: "Pending"
        },
        {
            id: 102,
            customerName: "Amit Patel",
            court: "Cricket - Net 1",
            date: "2024-03-20",
            time: "16:00 - 17:00",
            totalAmount: 1200,
            advancePaid: 1200,
            balance: 0,
            mode: "UPI",
            status: "Paid"
        },
        {
            id: 103,
            customerName: "Sneha Gupta",
            court: "Badminton - Court 1",
            date: "2024-03-21",
            time: "07:00 - 08:00",
            totalAmount: 500,
            advancePaid: 0,
            balance: 500,
            mode: "Pending",
            status: "Pending"
        }
    ]);

    const [paymentForm, setPaymentForm] = useState({
        mode: 'Cash',
        notes: ''
    });

    const handleOpenPayModal = (booking) => {
        setSelectedBooking(booking);
        setPaymentForm({ mode: 'Cash', notes: '' });
        setShowPayModal(true);
    };

    const handleConfirmPayment = (e) => {
        e.preventDefault();

        // Update mock state
        setPayments(payments.map(p => {
            if (p.id === selectedBooking.id) {
                return {
                    ...p,
                    advancePaid: p.totalAmount,
                    balance: 0,
                    status: 'Paid',
                    mode: paymentForm.mode
                };
            }
            return p;
        }));

        toast.success(`Payment of ₹${selectedBooking.balance} received!`);
        setShowPayModal(false);
        setSelectedBooking(null);
    };

    const filteredPayments = payments.filter(p => {
        if (filterStatus === 'All') return true;
        return p.status === filterStatus;
    });

    return (
        <div className="staffpayment-container">
            <div className="staffpayment-page-header">
                <div>
                    <h2 className="staffpayment-title">Payments & Settlement</h2>
                    <p className="text-muted m-0 small">Manage booking payments and balances</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="staffpayment-filter-bar">
                <div className="d-flex align-items-center gap-2 text-muted fw-bold">
                    <FaFilter /> Filters:
                </div>
                <Form.Select
                    className="staffpayment-filter-input"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ width: 'auto' }}
                >
                    <option value="All">All Status</option>
                    <option value="Paid">Fully Paid</option>
                    <option value="Pending">Balance Pending</option>
                </Form.Select>

                <div className="ms-auto position-relative">
                    <FaSearch className="position-absolute text-muted top-50 start-0 translate-middle-y ms-3" />
                    <Form.Control
                        type="search"
                        placeholder="Search customer..."
                        className="staffpayment-filter-input ps-5"
                    />
                </div>
            </div>

            <div className="staffpayment-card">
                <div className="staffpayment-table-responsive">
                    <Table hover className="staffpayment-table">
                        <thead>
                            <tr>
                                <th>Booking Ref</th>
                                <th>Customer</th>
                                <th>Court Details</th>
                                <th>Total</th>
                                <th>Advance</th>
                                <th>Balance</th>
                                <th>Mode</th>
                                <th>Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map((booking) => (
                                <tr key={booking.id}>
                                    <td className="fw-bold text-muted">#{booking.id}</td>
                                    <td>
                                        <div className="fw-bold">{booking.customerName}</div>
                                    </td>
                                    <td>
                                        <div className="small fw-bold">{booking.court}</div>
                                        <div className="small text-muted">{booking.date} | {booking.time}</div>
                                    </td>
                                    <td className="fw-bold">₹{booking.totalAmount}</td>
                                    <td className="text-success">₹{booking.advancePaid}</td>
                                    <td className={`fw-bold ${booking.balance > 0 ? 'text-danger' : 'text-muted'}`}>
                                        ₹{booking.balance}
                                    </td>
                                    <td>
                                        <Badge bg="light" text="dark" className="border fw-normal">
                                            {booking.mode}
                                        </Badge>
                                    </td>
                                    <td>
                                        <span className={`staffpayment-badge ${booking.status.toLowerCase()}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="text-end">
                                        {booking.status === 'Pending' && (
                                            <button
                                                className="staffpayment-action-btn pay"
                                                onClick={() => handleOpenPayModal(booking)}
                                                title="Mark Balance as Paid"
                                            >
                                                <FaMoneyBillWave />
                                            </button>
                                        )}
                                        {booking.status === 'Paid' && (
                                            <span className="text-success small fw-bold">
                                                <FaCheck className="me-1" /> Settled
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredPayments.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="text-center py-5 text-muted">
                                        No payments found matching criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </div>

            {/* Mark as Paid Modal */}
            <Modal show={showPayModal} onHide={() => setShowPayModal(false)} centered>
                <Modal.Header closeButton className="staffpayment-modal-header">
                    <Modal.Title className="staffpayment-modal-title">Settle Balance Payment</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleConfirmPayment}>
                    <Modal.Body>
                        {selectedBooking && (
                            <div className="p-3 bg-light rounded-3 mb-4 border">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Customer:</span>
                                    <span className="fw-bold">{selectedBooking.customerName}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Total Amount:</span>
                                    <span>₹{selectedBooking.totalAmount}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Paid Adv:</span>
                                    <span className="text-success">- ₹{selectedBooking.advancePaid}</span>
                                </div>
                                <hr className="my-2" />
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="h6 mb-0 text-danger">Pending Balance:</span>
                                    <span className="h4 mb-0 text-danger fw-bold">₹{selectedBooking.balance}</span>
                                </div>
                            </div>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label className="staffpayment-form-label">Payment Mode</Form.Label>
                            <div className="d-flex gap-2">
                                {['Cash', 'UPI', 'Card'].map(mode => (
                                    <Button
                                        key={mode}
                                        variant={paymentForm.mode === mode ? 'success' : 'outline-secondary'}
                                        onClick={() => setPaymentForm({ ...paymentForm, mode })}
                                        className="flex-grow-1"
                                    >
                                        {mode}
                                    </Button>
                                ))}
                            </div>
                        </Form.Group>

                        <Form.Group>
                            <Form.Label className="staffpayment-form-label">Notes (Optional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                className="staffpayment-filter-input"
                                placeholder="Txn ID or remarks..."
                                value={paymentForm.notes}
                                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0">
                        <Button variant="light" onClick={() => setShowPayModal(false)}>Cancel</Button>
                        <Button variant="success" type="submit" className="px-4">
                            <FaCheck className="me-2" /> Mark as Paid
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default StaffPayment;
