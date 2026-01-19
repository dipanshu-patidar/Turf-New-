import React, { useState } from 'react';
import { Table, Badge, Nav, Form } from 'react-bootstrap';
import { FaCalendarAlt, FaMoneyBillWave, FaExclamationTriangle, FaChartLine } from 'react-icons/fa';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './AdminReports.css';

const AdminReports = () => {
    const [activeTab, setActiveTab] = useState('daily');
    const [filters, setFilters] = useState({
        dateFrom: new Date().toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
        court: 'All Courts'
    });

    const courts = ['All Courts', 'Football', 'Cricket', 'Badminton - Court 1', 'Badminton - Court 2', 'Pickleball'];

    // Mock data for daily report
    const dailyStats = {
        totalBookings: 12,
        totalRevenue: 15600,
        pendingBalance: 2400
    };

    const dailyBookings = [
        { id: 1, customer: 'Rahul Sharma', court: 'Football', time: '18:00', amount: 1500, status: 'Paid' },
        { id: 2, customer: 'Priya Singh', court: 'Cricket', time: '17:00', amount: 1300, status: 'Pending' },
        { id: 3, customer: 'Amit Verma', court: 'Badminton - Court 1', time: '09:00', amount: 600, status: 'Paid' }
    ];

    // Mock data for monthly report
    const monthlyStats = {
        totalBookings: 245,
        totalCollection: 312000,
        pendingBalance: 18500
    };

    const monthlyTrendData = [
        { date: 'Week 1', bookings: 58, revenue: 72000 },
        { date: 'Week 2', bookings: 62, revenue: 78500 },
        { date: 'Week 3', bookings: 55, revenue: 69000 },
        { date: 'Week 4', bookings: 70, revenue: 92500 }
    ];

    // Mock data for revenue report
    const revenueStats = {
        totalRevenue: 312000,
        weekdayRevenue: 185000,
        weekendRevenue: 127000
    };

    const courtRevenueData = [
        { court: 'Football', revenue: 125000 },
        { court: 'Cricket', revenue: 98000 },
        { court: 'Badminton 1', revenue: 45000 },
        { court: 'Badminton 2', revenue: 28000 },
        { court: 'Pickleball', revenue: 16000 }
    ];

    const weekdayWeekendData = [
        { name: 'Weekday', value: 185000 },
        { name: 'Weekend', value: 127000 }
    ];

    // Mock data for pending balance report
    const pendingBalances = [
        { id: 1, customer: 'Priya Singh', court: 'Cricket', bookingDate: '2026-01-16', balance: 800 },
        { id: 2, customer: 'Amit Verma', court: 'Badminton - Court 1', bookingDate: '2026-01-17', balance: 300 },
        { id: 3, customer: 'Sneha Patel', court: 'Football', bookingDate: '2026-01-15', balance: 500 },
        { id: 4, customer: 'Ravi Kumar', court: 'Pickleball', bookingDate: '2026-01-14', balance: 800 }
    ];

    const totalPending = pendingBalances.reduce((sum, item) => sum + item.balance, 0);

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
                    <div className="adminreports-card-value">{dailyStats.totalBookings}</div>
                </div>
                <div className="adminreports-summary-card">
                    <div className="adminreports-card-icon revenue">
                        <FaMoneyBillWave />
                    </div>
                    <div className="adminreports-card-label">Total Revenue</div>
                    <div className="adminreports-card-value">₹ {dailyStats.totalRevenue.toLocaleString()}</div>
                </div>
                <div className="adminreports-summary-card">
                    <div className="adminreports-card-icon pending">
                        <FaExclamationTriangle />
                    </div>
                    <div className="adminreports-card-label">Pending Balance</div>
                    <div className="adminreports-card-value">₹ {dailyStats.pendingBalance.toLocaleString()}</div>
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
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dailyBookings.map(booking => (
                            <tr key={booking.id}>
                                <td className="fw-bold">{booking.customer}</td>
                                <td>
                                    <Badge bg="light" text="dark" className="border">{booking.court}</Badge>
                                </td>
                                <td>{booking.time}</td>
                                <td className="adminreports-amount positive">₹ {booking.amount}</td>
                                <td>
                                    <span className={`adminreports-badge ${booking.status === 'Paid' ? 'adminreports-badge-paid' : 'adminreports-badge-pending'}`}>
                                        {booking.status}
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
                    <div className="adminreports-card-value">{monthlyStats.totalBookings}</div>
                </div>
                <div className="adminreports-summary-card">
                    <div className="adminreports-card-icon collection">
                        <FaMoneyBillWave />
                    </div>
                    <div className="adminreports-card-label">Total Collection</div>
                    <div className="adminreports-card-value">₹ {monthlyStats.totalCollection.toLocaleString()}</div>
                </div>
                <div className="adminreports-summary-card">
                    <div className="adminreports-card-icon pending">
                        <FaExclamationTriangle />
                    </div>
                    <div className="adminreports-card-label">Pending Balance</div>
                    <div className="adminreports-card-value">₹ {monthlyStats.pendingBalance.toLocaleString()}</div>
                </div>
            </div>

            <div className="adminreports-chart-container">
                <h5 className="adminreports-chart-title">Monthly Trend - Bookings & Revenue</h5>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
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
    const renderRevenueReport = () => (
        <>
            <div className="adminreports-summary-cards">
                <div className="adminreports-summary-card">
                    <div className="adminreports-card-icon revenue">
                        <FaChartLine />
                    </div>
                    <div className="adminreports-card-label">Total Revenue</div>
                    <div className="adminreports-card-value">₹ {revenueStats.totalRevenue.toLocaleString()}</div>
                </div>
                <div className="adminreports-summary-card">
                    <div className="adminreports-card-icon bookings">
                        <FaMoneyBillWave />
                    </div>
                    <div className="adminreports-card-label">Weekday Revenue</div>
                    <div className="adminreports-card-value">₹ {revenueStats.weekdayRevenue.toLocaleString()}</div>
                </div>
                <div className="adminreports-summary-card">
                    <div className="adminreports-card-icon collection">
                        <FaMoneyBillWave />
                    </div>
                    <div className="adminreports-card-label">Weekend Revenue</div>
                    <div className="adminreports-card-value">₹ {revenueStats.weekendRevenue.toLocaleString()}</div>
                </div>
            </div>

            <div className="row g-3">
                <div className="col-md-8">
                    <div className="adminreports-chart-container">
                        <h5 className="adminreports-chart-title">Court-wise Revenue Breakdown</h5>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={courtRevenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="court" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="revenue" fill="#E63946" name="Revenue (₹)" />
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
                                    data={weekdayWeekendData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {weekdayWeekendData.map((entry, index) => (
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

    // Render Pending Balance Report
    const renderPendingReport = () => (
        <>
            <div className="adminreports-summary-cards">
                <div className="adminreports-summary-card">
                    <div className="adminreports-card-icon pending">
                        <FaExclamationTriangle />
                    </div>
                    <div className="adminreports-card-label">Total Pending Amount</div>
                    <div className="adminreports-card-value">₹ {totalPending.toLocaleString()}</div>
                </div>
                <div className="adminreports-summary-card">
                    <div className="adminreports-card-icon bookings">
                        <FaCalendarAlt />
                    </div>
                    <div className="adminreports-card-label">Pending Bookings</div>
                    <div className="adminreports-card-value">{pendingBalances.length}</div>
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
                        {pendingBalances.map(item => (
                            <tr key={item.id}>
                                <td className="fw-bold">{item.customer}</td>
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
                    >
                        {courts.map(court => (
                            <option key={court} value={court}>{court}</option>
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
                {activeTab === 'daily' && renderDailyReport()}
                {activeTab === 'monthly' && renderMonthlyReport()}
                {activeTab === 'revenue' && renderRevenueReport()}
                {activeTab === 'pending' && renderPendingReport()}
            </div>
        </div>
    );
};

export default AdminReports;
