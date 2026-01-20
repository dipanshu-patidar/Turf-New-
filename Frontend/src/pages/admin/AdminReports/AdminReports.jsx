import React, { useState, useEffect, useCallback } from 'react';
import { Table, Badge, Nav, Form, Spinner } from 'react-bootstrap';
import { FaCalendarAlt, FaMoneyBillWave, FaExclamationTriangle, FaChartLine } from 'react-icons/fa';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import reportService from '../../../api/reportService';
import toast from 'react-hot-toast';
import './AdminReports.css';

const AdminReports = () => {
    const [activeTab, setActiveTab] = useState('daily');
    const [loading, setLoading] = useState(false);
    const [courtList, setCourtList] = useState([]);
    const [filters, setFilters] = useState({
        dateFrom: new Date().toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
        court: 'All Courts'
    });

    // Report Data States
    const [dailyData, setDailyData] = useState({ totalBookings: 0, totalRevenue: 0, pendingBalance: 0, bookings: [] });
    const [monthlyData, setMonthlyData] = useState({ summary: { totalBookings: 0, totalCollection: 0, pendingBalance: 0 }, dailyTrend: [] });
    const [revenueData, setRevenueData] = useState({ totalRevenue: 0, revenueTrend: [], weekdayVsWeekend: { weekday: 0, weekend: 0 }, courtWise: [] });
    const [pendingData, setPendingData] = useState({ totalPending: 0, pendingBookings: [] });

    const fetchCourts = async () => {
        try {
            const data = await reportService.getCourts();
            setCourtList(data);
        } catch (error) {
            console.error('Error fetching courts:', error);
            toast.error('Failed to load courts');
        }
    };

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'daily') {
                const data = await reportService.getDailyReport({
                    date: filters.dateFrom,
                    courtId: filters.court === 'All Courts' ? undefined : filters.court
                });
                setDailyData(data);
            } else if (activeTab === 'monthly') {
                const month = filters.dateFrom.substring(0, 7); // YYYY-MM
                const data = await reportService.getMonthlyReport({ month });
                setMonthlyData(data);
            } else if (activeTab === 'revenue') {
                const data = await reportService.getRevenueReport({
                    from: filters.dateFrom,
                    to: filters.dateTo
                });
                setRevenueData(data);
            } else if (activeTab === 'pending') {
                const data = await reportService.getPendingReport();
                setPendingData(data);
            }
        } catch (error) {
            console.error(`Error fetching ${activeTab} report:`, error);
            toast.error(`Failed to load ${activeTab} report`);
        } finally {
            setLoading(false);
        }
    }, [activeTab, filters.dateFrom, filters.dateTo, filters.court]);

    useEffect(() => {
        fetchCourts();
    }, []);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const COLORS = ['#E63946', '#457B9D', '#1D3557', '#A8DADC', '#F1FAEE'];

    // Render Daily Report
    const renderDailyReport = () => (
        <>
            <div className="adminreports-summary-cards">
                <div className="adminreports-summary-card">
                    <div className="adminreports-card-icon bookings">
                        <FaCalendarAlt />
                    </div>
                    <div className="adminreports-card-label">Total Bookings</div>
                    <div className="adminreports-card-value">{dailyData.totalBookings}</div>
                </div>
                <div className="adminreports-summary-card">
                    <div className="adminreports-card-icon revenue">
                        <FaMoneyBillWave />
                    </div>
                    <div className="adminreports-card-label">Total Revenue</div>
                    <div className="adminreports-card-value">₹ {dailyData.totalRevenue.toLocaleString()}</div>
                </div>
                <div className="adminreports-summary-card">
                    <div className="adminreports-card-icon pending">
                        <FaExclamationTriangle />
                    </div>
                    <div className="adminreports-card-label">Pending Balance</div>
                    <div className="adminreports-card-value">₹ {dailyData.pendingBalance.toLocaleString()}</div>
                </div>
            </div>

            <div className="adminreports-table-container">
                <h5 className="adminreports-section-title px-3 pt-3">Today's Bookings</h5>
                <Table responsive hover className="adminreports-table">
                    <thead>
                        <tr>
                            <th>Customer Name</th>
                            <th>Court</th>
                            <th>Time</th>
                            <th>Amount</th>
                            <th>Status Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dailyData.bookings.map((booking, idx) => (
                            <tr key={idx}>
                                <td className="fw-bold">{booking.customerName}</td>
                                <td>
                                    <Badge bg="light" text="dark" className="border">{booking.court}</Badge>
                                </td>
                                <td>{booking.time}</td>
                                <td className="adminreports-amount positive">₹ {booking.totalAmount}</td>
                                <td>
                                    <span className={`adminreports-badge ${booking.balance === 0 ? 'adminreports-badge-paid' : 'adminreports-badge-pending'}`}>
                                        {booking.balance === 0 ? 'Paid' : `₹${booking.balance} Bal`}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </>
    );

    // Render Monthly Report
    const renderMonthlyReport = () => (
        <>
            <div className="adminreports-summary-cards">
                <div className="adminreports-summary-card">
                    <div className="adminreports-card-icon bookings">
                        <FaCalendarAlt />
                    </div>
                    <div className="adminreports-card-label">Total Bookings</div>
                    <div className="adminreports-card-value">{monthlyData.summary.totalBookings}</div>
                </div>
                <div className="adminreports-summary-card">
                    <div className="adminreports-card-icon collection">
                        <FaMoneyBillWave />
                    </div>
                    <div className="adminreports-card-label">Total Collection</div>
                    <div className="adminreports-card-value">₹ {monthlyData.summary.totalCollection.toLocaleString()}</div>
                </div>
                <div className="adminreports-summary-card">
                    <div className="adminreports-card-icon pending">
                        <FaExclamationTriangle />
                    </div>
                    <div className="adminreports-card-label">Pending Balance</div>
                    <div className="adminreports-card-value">₹ {monthlyData.summary.pendingBalance.toLocaleString()}</div>
                </div>
            </div>

            <div className="adminreports-chart-container">
                <h5 className="adminreports-chart-title">Monthly Trend - Bookings & Revenue</h5>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData.dailyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#E63946" strokeWidth={2} name="Bookings" />
                        <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#457B9D" strokeWidth={2} name="Revenue (₹)" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </>
    );

    // Render Revenue Report
    const renderRevenueReport = () => {
        const weekdayWeekendChartData = [
            { name: 'Weekday', value: revenueData.weekdayVsWeekend.weekday },
            { name: 'Weekend', value: revenueData.weekdayVsWeekend.weekend }
        ];

        return (
            <>
                <div className="adminreports-summary-cards">
                    <div className="adminreports-summary-card">
                        <div className="adminreports-card-icon revenue">
                            <FaChartLine />
                        </div>
                        <div className="adminreports-card-label">Total Revenue</div>
                        <div className="adminreports-card-value">₹ {revenueData.totalRevenue.toLocaleString()}</div>
                    </div>
                    <div className="adminreports-summary-card">
                        <div className="adminreports-card-icon bookings">
                            <FaMoneyBillWave />
                        </div>
                        <div className="adminreports-card-label">Weekday Revenue</div>
                        <div className="adminreports-card-value">₹ {revenueData.weekdayVsWeekend.weekday.toLocaleString()}</div>
                    </div>
                    <div className="adminreports-summary-card">
                        <div className="adminreports-card-icon collection">
                            <FaMoneyBillWave />
                        </div>
                        <div className="adminreports-card-label">Weekend Revenue</div>
                        <div className="adminreports-card-value">₹ {revenueData.weekdayVsWeekend.weekend.toLocaleString()}</div>
                    </div>
                </div>

                <div className="row g-3">
                    <div className="col-md-8">
                        <div className="adminreports-chart-container">
                            <h5 className="adminreports-chart-title">Court-wise Revenue Breakdown</h5>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={revenueData.courtWise}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="court" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="amount" fill="#E63946" name="Revenue (₹)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="adminreports-chart-container">
                            <h5 className="adminreports-chart-title">Weekday vs Weekend</h5>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={weekdayWeekendChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {weekdayWeekendChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    // Render Pending Balance Report
    const renderPendingReport = () => (
        <>
            <div className="adminreports-summary-cards">
                <div className="adminreports-summary-card">
                    <div className="adminreports-card-icon pending">
                        <FaExclamationTriangle />
                    </div>
                    <div className="adminreports-card-label">Total Pending Amount</div>
                    <div className="adminreports-card-value">₹ {pendingData.totalPending.toLocaleString()}</div>
                </div>
                <div className="adminreports-summary-card">
                    <div className="adminreports-card-icon bookings">
                        <FaCalendarAlt />
                    </div>
                    <div className="adminreports-card-label">Pending Bookings</div>
                    <div className="adminreports-card-value">{pendingData.pendingBookings.length}</div>
                </div>
            </div>

            <div className="adminreports-table-container">
                <h5 className="adminreports-section-title px-3 pt-3">Pending Balance Details</h5>
                <Table responsive hover className="adminreports-table">
                    <thead>
                        <tr>
                            <th>Customer Name</th>
                            <th>Court</th>
                            <th>Booking Date</th>
                            <th>Balance Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingData.pendingBookings.map((item, idx) => (
                            <tr key={idx}>
                                <td className="fw-bold">{item.customerName}</td>
                                <td>
                                    <Badge bg="light" text="dark" className="border">{item.court}</Badge>
                                </td>
                                <td>{new Date(item.bookingDate).toLocaleDateString('en-IN')}</td>
                                <td className="adminreports-amount negative">₹ {item.balance}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </>
    );

    return (
        <div className="adminreports-container rounded-4 shadow-sm">
            {/* Header */}
            <div className="adminreports-page-header">
                <div>
                    <h2 className="adminreports-title">Reports</h2>
                    <p className="text-muted m-0 small">Business insights and financial analytics</p>
                </div>
            </div>

            {/* Filters */}
            <div className="adminreports-filters">
                <div className="adminreports-filter-group">
                    <label className="adminreports-filter-label">Date From</label>
                    <Form.Control
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    />
                </div>
                <div className="adminreports-filter-group">
                    <label className="adminreports-filter-label">Date To</label>
                    <Form.Control
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    />
                </div>
                <div className="adminreports-filter-group">
                    <label className="adminreports-filter-label">Court</label>
                    <Form.Select
                        value={filters.court}
                        onChange={(e) => setFilters({ ...filters, court: e.target.value })}
                        disabled={activeTab === 'monthly' || activeTab === 'pending'}
                    >
                        <option value="All Courts">All Courts</option>
                        {courtList.map(court => (
                            <option key={court._id} value={court._id}>{court.name}</option>
                        ))}
                    </Form.Select>
                </div>
            </div>

            {/* Tabs */}
            <Nav variant="tabs" className="adminreports-tabs">
                <Nav.Item>
                    <Nav.Link active={activeTab === 'daily'} onClick={() => setActiveTab('daily')}>
                        Daily Report
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link active={activeTab === 'monthly'} onClick={() => setActiveTab('monthly')}>
                        Monthly Report
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')}>
                        Revenue Report
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>
                        Pending Balance
                    </Nav.Link>
                </Nav.Item>
            </Nav>

            {/* Tab Content */}
            <div className="mt-4">
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="danger" />
                        <p className="mt-2 text-muted">Loading {activeTab} report...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'daily' && renderDailyReport()}
                        {activeTab === 'monthly' && renderMonthlyReport()}
                        {activeTab === 'revenue' && renderRevenueReport()}
                        {activeTab === 'pending' && renderPendingReport()}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminReports;
