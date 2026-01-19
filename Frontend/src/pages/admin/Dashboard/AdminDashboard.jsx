import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import {
    FaCalendarCheck, FaMoneyBillWave, FaClock, FaCalendarAlt, FaChartLine
} from 'react-icons/fa';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import dashboardService from '../../../api/dashboardService';
import './AdminDashboard.css';

// --- Internal Components ---

const StatCard = ({ title, value, icon, color, subText }) => (
    <Card className="admindashboard-summary-card">
        <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-start z-1 position-relative">
                <div>
                    <h6 className="admindashboard-card-title">{title}</h6>
                    <h3 className="admindashboard-card-value">{value}</h3>
                    {subText && <small className="admindashboard-card-subtext">{subText}</small>}
                </div>
                <div className={`admindashboard-icon-wrapper bg-${color} text-white shadow-sm`} style={{ width: '48px', height: '48px' }}>
                    {icon}
                </div>
            </div>
        </Card.Body>
    </Card>
);

const SummaryCards = ({ data }) => {
    if (!data) return null;

    const stats = [
        {
            title: "Today's Bookings",
            value: data.todayBookings || 0,
            icon: <FaCalendarCheck size={20} />,
            color: "primary",
            subText: "Latest bookings"
        },
        {
            title: "Today's Revenue",
            value: `₹ ${data.todayRevenue?.toLocaleString() || 0}`,
            icon: <FaMoneyBillWave size={20} />,
            color: "success",
            subText: "Received today"
        },
        {
            title: "Pending Balance",
            value: `₹ ${data.pendingBalance?.toLocaleString() || 0}`,
            icon: <FaClock size={20} />,
            color: "warning",
            subText: "Overall outstanding"
        },
        {
            title: "This Month Bookings",
            value: data.monthBookings || 0,
            icon: <FaCalendarAlt size={20} />,
            color: "info",
            subText: "Current month"
        },
        {
            title: "Month Collection",
            value: `₹ ${(data.monthCollection / 100000).toFixed(2)}L`,
            icon: <FaChartLine size={20} />,
            color: "dark",
            subText: "This month total"
        },
        {
            title: "Total Revenue",
            value: `₹ ${(data.totalRevenue / 100000).toFixed(2)}L`,
            icon: <FaMoneyBillWave size={20} />,
            color: "primary",
            subText: "Lifetime earnings"
        }
    ];

    return (
        <Row className="g-3 mb-4">
            {stats.map((stat, index) => (
                <Col key={index} xs={12} sm={6} lg={4}>
                    <div className="h-100">
                        <StatCard {...stat} />
                    </div>
                </Col>
            ))}
        </Row>
    );
};

const CashFlowCharts = ({ revenueTrend, paymentStatus, weeklyEarnings }) => {
    const COLORS = ['#198754', '#ffc107', '#dc3545', '#0d6efd'];

    // Format Pie Data
    const paymentStatusData = [
        { name: 'Received', value: paymentStatus?.received || 0 },
        { name: 'Pending', value: paymentStatus?.pending || 0 },
    ];

    return (
        <Row className="g-4">
            <Col lg={12} className="mb-2">
                <h5 className="admindashboard-section-title">Financial Analytics</h5>
            </Col>

            {/* Monthly Revenue Chart */}
            <Col lg={8}>
                <Card className="admindashboard-chart-card">
                    <Card.Body className="p-4">
                        <h6 className="admindashboard-chart-title">Monthly Revenue Trend (Daily)</h6>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={revenueTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#aaa' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#aaa' }} unit="₹" />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="amount" stroke="#E63946" strokeWidth={3} dot={{ r: 4, fill: '#E63946' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card.Body>
                </Card>
            </Col>

            {/* Payment Status Pie Chart */}
            <Col lg={4}>
                <Card className="admindashboard-chart-card">
                    <Card.Body className="p-4">
                        <h6 className="admindashboard-chart-title">Payment Status Breakdown</h6>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={paymentStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {paymentStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card.Body>
                </Card>
            </Col>

            {/* Weekday vs Weekend (Simple Bar) */}
            <Col lg={12}>
                <Card className="admindashboard-chart-card">
                    <Card.Body className="p-4">
                        <h6 className="admindashboard-chart-title">Weekly Earnings Breakdown</h6>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={weeklyEarnings}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} unit="₹" />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                    <Bar dataKey="amount" fill="#1A1A1A" radius={[5, 5, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

// --- Main Page Component ---

const AdminDashboard = () => {
    const role = "ADMIN"; // Static for now as per original code
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        summary: null,
        revenueTrend: [],
        paymentStatus: null,
        weeklyEarnings: []
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [summary, revenueTrend, paymentStatus, weeklyEarnings] = await Promise.all([
                    dashboardService.getSummary(),
                    dashboardService.getMonthlyRevenue(),
                    dashboardService.getPaymentStatus(),
                    dashboardService.getWeeklyEarnings()
                ]);

                setDashboardData({
                    summary,
                    revenueTrend,
                    paymentStatus,
                    weeklyEarnings
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                toast.error('Failed to load dashboard analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <Container fluid className="px-0 admindashboard-container">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center admindashboard-header">
                <div>
                    <h2 className="admindashboard-title">Dashboard Overview</h2>
                    <p className="admindashboard-subtitle">Welcome back, Admin</p>
                </div>
            </div>

            {/* Top Summary Cards */}
            <SummaryCards data={dashboardData.summary} />

            {/* Financial Analytics - strictly for ADMIN */}
            {role === "ADMIN" && (
                <div className="admindashboard-analytics-section">
                    <CashFlowCharts
                        revenueTrend={dashboardData.revenueTrend}
                        paymentStatus={dashboardData.paymentStatus}
                        weeklyEarnings={dashboardData.weeklyEarnings}
                    />
                </div>
            )}
        </Container>
    );
};

export default AdminDashboard;

