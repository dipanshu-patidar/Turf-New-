import React, { useState } from 'react';
import { Table, Button, Badge, Modal, Form } from 'react-bootstrap';
import { FaCheckCircle, FaEdit, FaEye, FaRupeeSign, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './AdminPayment.css';

const AdminPayment = () => {
    // Courts configuration
    const courts = ['All Courts', 'Football', 'Cricket', 'Badminton - Court 1', 'Badminton - Court 2', 'Pickleball'];
    const paymentModes = ['Cash', 'UPI', 'Card', 'Online'];

    // Mock payment data
    const [payments, setPayments] = useState([
        {
            id: 1,
            bookingRef: 'BK-2026-001',
            customerName: 'Rahul Sharma',
            court: 'Football',
            bookingDate: '2026-01-16',
            bookingTime: '18:00',
            totalAmount: 1500,
            advancePaid: 1500,
            balancePending: 0,
            paymentMode: 'UPI',
            paymentStatus: 'Paid'
        },
        {
            id: 2,
            bookingRef: 'BK-2026-002',
            customerName: 'Priya Singh',
            court: 'Cricket',
            bookingDate: '2026-01-16',
            bookingTime: '17:00',
            totalAmount: 1300,
            advancePaid: 500,
            balancePending: 800,
            paymentMode: 'Cash',
            paymentStatus: 'Pending'
        },
        {
            id: 3,
            bookingRef: 'BK-2026-003',
            customerName: 'Amit Verma',
            court: 'Badminton - Court 1',
            bookingDate: '2026-01-17',
            bookingTime: '09:00',
            totalAmount: 600,
            advancePaid: 300,
            balancePending: 300,
            paymentMode: 'Card',
            paymentStatus: 'Pending'
        },
        {
            id: 4,
            bookingRef: 'BK-2026-004',
            customerName: 'Sneha Patel',
            court: 'Pickleball',
            bookingDate: '2026-01-17',
            bookingTime: '10:00',
            totalAmount: 700,
            advancePaid: 700,
            balancePending: 0,
            paymentMode: 'Online',
            paymentStatus: 'Paid'
        }
    ]);

    // Filter states
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        court: 'All Courts',
        paymentStatus: 'All'
    });

    // Modal states
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [showModeModal, setShowModeModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [paymentToDelete, setPaymentToDelete] = useState(null);

    // Form data
    const [settlementData, setSettlementData] = useState({
        paymentMode: 'Cash',
        paymentDate: new Date().toISOString().split('T')[0]
    });

    // Handlers
    const handleShowSettle = (payment) => {
        if (payment.balancePending === 0) {
            toast.error('No balance pending for this booking');
            return;
        }
        setSelectedPayment(payment);
        setSettlementData({
            paymentMode: payment.paymentMode,
            paymentDate: new Date().toISOString().split('T')[0]
        });
        setShowSettleModal(true);
    };

    const handleConfirmSettlement = () => {
        const updatedPayments = payments.map(p => {
            if (p.id === selectedPayment.id) {
                return {
                    ...p,
                    advancePaid: p.totalAmount,
                    balancePending: 0,
                    paymentMode: settlementData.paymentMode,
                    paymentStatus: 'Paid'
                };
            }
            return p;
        });
        setPayments(updatedPayments);
        toast.success('Balance settled successfully!');
        setShowSettleModal(false);
        setSelectedPayment(null);
    };

    const handleShowModeUpdate = (payment) => {
        setSelectedPayment(payment);
        setSettlementData({
            paymentMode: payment.paymentMode,
            paymentDate: new Date().toISOString().split('T')[0]
        });
        setShowModeModal(true);
    };

    const handleUpdateMode = () => {
        const updatedPayments = payments.map(p => {
            if (p.id === selectedPayment.id) {
                return {
                    ...p,
                    paymentMode: settlementData.paymentMode
                };
            }
            return p;
        });
        setPayments(updatedPayments);
        toast.success('Payment mode updated successfully!');
        setShowModeModal(false);
        setSelectedPayment(null);
    };

    const handleShowView = (payment) => {
        setSelectedPayment(payment);
        setShowViewModal(true);
    };

    // Delete handlers
    const handleShowDelete = (payment) => {
        setPaymentToDelete(payment);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        setPayments(payments.filter(p => p.id !== paymentToDelete.id));
        toast.success('Payment record deleted successfully');
        setShowDeleteModal(false);
        setPaymentToDelete(null);
    };

    // Filter logic
    const filteredPayments = payments.filter(payment => {
        if (filters.court !== 'All Courts' && payment.court !== filters.court) {
            return false;
        }
        if (filters.paymentStatus !== 'All' && payment.paymentStatus !== filters.paymentStatus) {
            return false;
        }
        if (filters.dateFrom && payment.bookingDate < filters.dateFrom) {
            return false;
        }
        if (filters.dateTo && payment.bookingDate > filters.dateTo) {
            return false;
        }
        return true;
    });

    const getPaymentStatusBadge = (status, balance) => {
        if (status === 'Paid' || balance === 0) {
            return <div className="adminpayment-status-badge adminpayment-status-paid">Fully Paid</div>;
        } else {
            return <div className="adminpayment-status-badge adminpayment-status-pending">Balance Pending</div>;
        }
    };

    return (
        <div className="adminpayment-container rounded-4 shadow-sm">
            {/* Header */}
            <div className="adminpayment-page-header">
                <div>
                    <h2 className="adminpayment-title">Payments & Settlement</h2>
                    <p className="text-muted m-0 small">Manage booking payments and balance settlements</p>
                </div>
            </div>

            {/* Filters */}
            <div className="adminpayment-filters">
                <div className="adminpayment-filter-group">
                    <label className="adminpayment-filter-label">Date From</label>
                    <Form.Control
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    />
                </div>
                <div className="adminpayment-filter-group">
                    <label className="adminpayment-filter-label">Date To</label>
                    <Form.Control
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    />
                </div>
                <div className="adminpayment-filter-group">
                    <label className="adminpayment-filter-label">Court</label>
                    <Form.Select
                        value={filters.court}
                        onChange={(e) => setFilters({ ...filters, court: e.target.value })}
                    >
                        {courts.map(court => (
                            <option key={court} value={court}>{court}</option>
                        ))}
                    </Form.Select>
                </div>
                <div className="adminpayment-filter-group">
                    <label className="adminpayment-filter-label">Payment Status</label>
                    <Form.Select
                        value={filters.paymentStatus}
                        onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                    >
                        <option value="All">All Status</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                    </Form.Select>
                </div>
            </div>

            {/* Table */}
            <div className="adminpayment-table-container">
                <Table hover className="adminpayment-table">
                    <thead>
                        <tr>
                            <th>Booking Ref</th>
                            <th>Customer Name</th>
                            <th>Court</th>
                            <th>Booking Date & Time</th>
                            <th>Total Amount</th>
                            <th>Advance Paid</th>
                            <th>Balance Pending</th>
                            <th>Payment Mode</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayments.map((payment) => (
                            <tr key={payment.id}>
                                <td>
                                    <div className="adminpayment-booking-ref">{payment.bookingRef}</div>
                                </td>
                                <td>
                                    <div className="fw-bold">{payment.customerName}</div>
                                </td>
                                <td>
                                    <Badge bg="light" text="dark" className="border fw-normal px-2 py-1">
                                        {payment.court}
                                    </Badge>
                                </td>
                                <td>
                                    <div className="text-nowrap">{new Date(payment.bookingDate).toLocaleDateString('en-IN')}</div>
                                    <div className="text-muted small">{payment.bookingTime}</div>
                                </td>
                                <td>
                                    <span className="adminpayment-amount total text-nowrap">₹ {payment.totalAmount}</span>
                                </td>
                                <td>
                                    <span className="adminpayment-amount advance text-nowrap">₹ {payment.advancePaid}</span>
                                </td>
                                <td>
                                    <span className="adminpayment-amount balance text-nowrap">₹ {payment.balancePending}</span>
                                </td>
                                <td>
                                    <span className={`adminpayment-mode-badge adminpayment-mode-${payment.paymentMode.toLowerCase()}`}>
                                        {payment.paymentMode}
                                    </span>
                                </td>
                                <td>
                                    {getPaymentStatusBadge(payment.paymentStatus, payment.balancePending)}
                                </td>
                                <td>
                                    <div className="d-flex">
                                        <button
                                            className="adminpayment-action-btn settle"
                                            title="Mark Balance as Paid"
                                            onClick={() => handleShowSettle(payment)}
                                            disabled={payment.balancePending === 0}
                                        >
                                            <FaCheckCircle />
                                        </button>
                                        <button
                                            className="adminpayment-action-btn edit"
                                            title="Update Payment Mode"
                                            onClick={() => handleShowModeUpdate(payment)}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className="adminpayment-action-btn view"
                                            title="View Details"
                                            onClick={() => handleShowView(payment)}
                                        >
                                            <FaEye />
                                        </button>
                                        <button
                                            className="adminpayment-action-btn delete"
                                            title="Delete Payment"
                                            onClick={() => handleShowDelete(payment)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredPayments.length === 0 && (
                            <tr>
                                <td colSpan="10" className="text-center py-4 text-muted">
                                    No payment records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            {/* Settle Balance Modal */}
            <Modal show={showSettleModal} onHide={() => setShowSettleModal(false)} centered>
                <Modal.Header closeButton className="adminpayment-modal-header">
                    <Modal.Title className="fw-bold">Settle Balance Payment</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <div className="adminpayment-summary-box">
                        <div className="adminpayment-summary-row">
                            <span className="adminpayment-summary-label">Total Amount:</span>
                            <span className="adminpayment-summary-value total">
                                ₹ {selectedPayment?.totalAmount || 0}
                            </span>
                        </div>
                        <div className="adminpayment-summary-row">
                            <span className="adminpayment-summary-label">Advance Paid:</span>
                            <span className="adminpayment-summary-value advance">
                                ₹ {selectedPayment?.advancePaid || 0}
                            </span>
                        </div>
                        <div className="adminpayment-summary-row total">
                            <span className="adminpayment-summary-label">Balance to Settle:</span>
                            <span className="adminpayment-summary-value balance">
                                ₹ {selectedPayment?.balancePending || 0}
                            </span>
                        </div>
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Label className="adminpayment-form-label">Payment Mode</Form.Label>
                        <Form.Select
                            value={settlementData.paymentMode}
                            onChange={(e) => setSettlementData({ ...settlementData, paymentMode: e.target.value })}
                        >
                            {paymentModes.map(mode => (
                                <option key={mode} value={mode}>{mode}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="adminpayment-form-label">Payment Date</Form.Label>
                        <Form.Control
                            type="date"
                            value={settlementData.paymentDate}
                            onChange={(e) => setSettlementData({ ...settlementData, paymentDate: e.target.value })}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="adminpayment-modal-footer">
                    <Button variant="light" onClick={() => setShowSettleModal(false)}>Cancel</Button>
                    <Button className="adminpayment-btn-primary" onClick={handleConfirmSettlement}>
                        Confirm Payment
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Update Payment Mode Modal */}
            <Modal show={showModeModal} onHide={() => setShowModeModal(false)} centered>
                <Modal.Header closeButton className="adminpayment-modal-header">
                    <Modal.Title className="fw-bold">Update Payment Mode</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Form.Group className="mb-3">
                        <Form.Label className="adminpayment-form-label">Booking Reference</Form.Label>
                        <Form.Control
                            type="text"
                            value={selectedPayment?.bookingRef || ''}
                            className="adminpayment-readonly-field"
                            readOnly
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="adminpayment-form-label">Payment Mode</Form.Label>
                        <Form.Select
                            value={settlementData.paymentMode}
                            onChange={(e) => setSettlementData({ ...settlementData, paymentMode: e.target.value })}
                        >
                            {paymentModes.map(mode => (
                                <option key={mode} value={mode}>{mode}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="adminpayment-modal-footer">
                    <Button variant="light" onClick={() => setShowModeModal(false)}>Cancel</Button>
                    <Button className="adminpayment-btn-primary" onClick={handleUpdateMode}>
                        Update Mode
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* View Details Modal */}
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered>
                <Modal.Header closeButton className="adminpayment-modal-header">
                    <Modal.Title className="fw-bold">Booking Payment Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <div className="mb-3">
                        <strong>Booking Reference:</strong>
                        <div className="adminpayment-booking-ref mt-1">{selectedPayment?.bookingRef}</div>
                    </div>
                    <div className="mb-3">
                        <strong>Customer Name:</strong>
                        <div className="mt-1">{selectedPayment?.customerName}</div>
                    </div>
                    <div className="mb-3">
                        <strong>Court:</strong>
                        <div className="mt-1">{selectedPayment?.court}</div>
                    </div>
                    <div className="mb-3">
                        <strong>Booking Date & Time:</strong>
                        <div className="mt-1">
                            {selectedPayment && new Date(selectedPayment.bookingDate).toLocaleDateString('en-IN')} at {selectedPayment?.bookingTime}
                        </div>
                    </div>
                    <div className="adminpayment-summary-box">
                        <div className="adminpayment-summary-row">
                            <span>Total Amount:</span>
                            <span className="adminpayment-summary-value total">₹ {selectedPayment?.totalAmount}</span>
                        </div>
                        <div className="adminpayment-summary-row">
                            <span>Advance Paid:</span>
                            <span className="adminpayment-summary-value advance">₹ {selectedPayment?.advancePaid}</span>
                        </div>
                        <div className="adminpayment-summary-row total">
                            <span>Balance Pending:</span>
                            <span className="adminpayment-summary-value balance">₹ {selectedPayment?.balancePending}</span>
                        </div>
                    </div>
                    <div className="mb-3">
                        <strong>Payment Mode:</strong>
                        <div className="mt-1">
                            <span className={`adminpayment-mode-badge adminpayment-mode-${selectedPayment?.paymentMode?.toLowerCase()}`}>
                                {selectedPayment?.paymentMode}
                            </span>
                        </div>
                    </div>
                    <div className="mb-3">
                        <strong>Payment Status:</strong>
                        <div className="mt-1">
                            {selectedPayment && getPaymentStatusBadge(selectedPayment.paymentStatus, selectedPayment.balancePending)}
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="adminpayment-modal-footer">
                    <Button variant="light" onClick={() => setShowViewModal(false)}>Close</Button>
                </Modal.Footer>
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
                    <h5 className="fw-bold mb-2">Delete Payment Record?</h5>
                    <p className="text-muted">
                        Are you sure you want to delete the payment record for <strong>{paymentToDelete?.customerName}</strong>?
                        <br />This action cannot be undone.
                    </p>
                    <div className="d-flex justify-content-center gap-2 mt-4">
                        <Button variant="light" onClick={() => setShowDeleteModal(false)} className="px-4">Cancel</Button>
                        <Button variant="danger" onClick={confirmDelete} className="px-4">Delete</Button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default AdminPayment;
