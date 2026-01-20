import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Badge, Modal, Form, Spinner } from 'react-bootstrap';
import { FaCheckCircle, FaEdit, FaEye, FaRupeeSign, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './AdminPayment.css';
import paymentService from '../../../api/paymentService';
import api from '../../../api/axiosInstance';

const AdminPayment = () => {
    // Courts configuration
    const [courtList, setCourtList] = useState([]);
    const paymentModes = ['Cash', 'UPI', 'Card', 'Online'];

    // Payment data
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);

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

    // Fetch Courts
    const fetchCourts = async () => {
        try {
            const response = await api.get('/courts');
            setCourtList(response.data);
        } catch (error) {
            console.error('Error fetching courts:', error);
            // toast.error('Failed to load courts');
        }
    };

    // Fetch Payments
    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await paymentService.getPayments({
                ...filters,
                courtId: filters.court === 'All Courts' ? undefined : filters.court
            });
            setPayments(data);
        } catch (error) {
            console.error('Error fetching payments:', error);
            toast.error('Failed to load payments');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchCourts();
    }, []);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    // Handlers
    const handleShowSettle = (payment) => {
        if (payment.balanceAmount === 0) {
            toast.error('No balance pending for this booking');
            return;
        }
        setSelectedPayment(payment);
        setSettlementData({
            paymentMode: payment.paymentMode || 'Cash',
            paymentDate: new Date().toISOString().split('T')[0]
        });
        setShowSettleModal(true);
    };

    const handleConfirmSettlement = async () => {
        try {
            await paymentService.markAsPaid(selectedPayment._id, settlementData);
            toast.success('Balance settled successfully!');
            setShowSettleModal(false);
            setSelectedPayment(null);
            fetchPayments();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to settle balance');
        }
    };

    const handleShowModeUpdate = (payment) => {
        setSelectedPayment(payment);
        setSettlementData({
            paymentMode: payment.paymentMode || 'Cash',
            paymentDate: new Date().toISOString().split('T')[0]
        });
        setShowModeModal(true);
    };

    const handleUpdateMode = async () => {
        try {
            await paymentService.updatePaymentMode(selectedPayment._id, {
                paymentMode: settlementData.paymentMode
            });
            toast.success('Payment mode updated successfully!');
            setShowModeModal(false);
            setSelectedPayment(null);
            fetchPayments();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update mode');
        }
    };

    const handleShowView = (payment) => {
        setSelectedPayment(payment);
        setShowViewModal(true);
    };

    // Delete handlers (Note: Backend doesn't have delete currently, but following existing UI)
    const handleShowDelete = (payment) => {
        setPaymentToDelete(payment);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        // Backend delete not implemented in requirements, keeping frontend only for now
        setPayments(payments.filter(p => p._id !== paymentToDelete._id));
        toast.success('Payment record removed from view');
        setShowDeleteModal(false);
        setPaymentToDelete(null);
    };

    const getPaymentStatusBadge = (status, balance) => {
        if (status === 'Paid' || status === 'PAID' || balance === 0) {
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
                        <option value="All Courts">All Courts</option>
                        {courtList.map(court => (
                            <option key={court._id} value={court._id}>{court.name}</option>
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
                        <option value="Partial">Pending</option>
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
                        {loading ? (
                            <tr>
                                <td colSpan="10" className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-2 text-muted">Loading payments...</p>
                                </td>
                            </tr>
                        ) : payments.map((payment) => (
                            <tr key={payment._id}>
                                <td>
                                    <div className="adminpayment-booking-ref">{payment.bookingRef}</div>
                                </td>
                                <td>
                                    <div className="fw-bold text-dark">{payment.customerName}</div>
                                </td>
                                <td>
                                    <Badge bg="white" text="dark" className="border fw-normal px-2 py-1 text-muted">
                                        {payment.courtName}
                                    </Badge>
                                </td>
                                <td>
                                    <div className="text-nowrap" style={{ fontSize: '0.9rem' }}>{payment.bookingDateTime}</div>
                                </td>
                                <td>
                                    <span className="adminpayment-amount total text-nowrap">₹ {payment.totalAmount}</span>
                                </td>
                                <td>
                                    <span className="adminpayment-amount advance text-nowrap">₹ {payment.advancePaid}</span>
                                </td>
                                <td>
                                    <span className="adminpayment-amount balance text-nowrap">₹ {payment.balanceAmount}</span>
                                </td>
                                <td>
                                    <span className={`adminpayment-mode-badge adminpayment-mode-${payment.paymentMode ? payment.paymentMode.toLowerCase() : 'cash'}`}>
                                        {payment.paymentMode || 'CASH'}
                                    </span>
                                </td>
                                <td>
                                    {getPaymentStatusBadge(payment.status, payment.balanceAmount)}
                                </td>
                                <td>
                                    <div className="d-flex align-items-center gap-1">
                                        <button
                                            className="adminpayment-action-btn settle"
                                            title="Mark Balance as Paid"
                                            onClick={() => handleShowSettle(payment)}
                                            disabled={payment.balanceAmount === 0}
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
                        {!loading && payments.length === 0 && (
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
                                ₹ {selectedPayment?.balanceAmount || 0}
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
                        <div className="mt-1">{selectedPayment?.courtName}</div>
                    </div>
                    <div className="mb-3">
                        <strong>Booking Date & Time:</strong>
                        <div className="mt-1">
                            {selectedPayment?.bookingDateTime}
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
                            <span className="adminpayment-summary-value balance">₹ {selectedPayment?.balanceAmount}</span>
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
                            {selectedPayment && getPaymentStatusBadge(selectedPayment.status, selectedPayment.balanceAmount)}
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
