import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import {
    FaCalendarCheck, FaMoneyBillWave, FaClock, FaCalendarAlt, FaChartLine
} from 'react-icons/fa';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import toast from 'react-hot-toast';
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

const SummaryCards = () => {
    // Mock Data
    const stats = [
        {
            title: "Today's Bookings",
            value: "14",
            icon: <FaCalendarCheck size={20} />,
            color: "primary",
            subText: "+2 from yesterday"
        },
        {
            title: "Today's Revenue",
            value: "₹ 12,500",
            icon: <FaMoneyBillWave size={20} />,
            color: "success",
            subText: "On track"
        },
        {
            title: "Pending Balance",
            value: "₹ 4,200",
            icon: <FaClock size={20} />,
            color: "warning",
            subText: "Needs attention"
        },
        {
            title: "This Month Bookings",
            value: "342",
            icon: <FaCalendarAlt size={20} />,
            color: "info",
            subText: "+12% vs last month"
        },
        {
            title: "Month Collection",
            value: "₹ 2.85L",
            icon: <FaChartLine size={20} />,
            color: "dark",
            subText: "Exceeding targets"
        },
        {
            title: "Total Revenue",
            value: "₹ 15.40L",
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

const CashFlowCharts = () => {
    const COLORS = ['#198754', '#ffc107', '#dc3545', '#0d6efd'];

    // Mock Data
    const monthlyRevenueData = [
        { name: '1', value: 4000 }, { name: '5', value: 3000 }, { name: '10', value: 2000 },
        { name: '15', value: 2780 }, { name: '20', value: 1890 }, { name: '25', value: 2390 },
        { name: '30', value: 3490 },
    ];

    const paymentStatusData = [
        { name: 'Received', value: 75000 },
        { name: 'Pending', value: 15000 },
    ];

    const weekData = [
        { name: 'Mon', revenue: 2000 },
        { name: 'Tue', revenue: 2500 },
        { name: 'Wed', revenue: 2200 },
        { name: 'Thu', revenue: 2800 },
        { name: 'Fri', revenue: 4500 },
        { name: 'Sat', revenue: 8000 },
        { name: 'Sun', revenue: 8500 },
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
                        <h6 className="admindashboard-chart-title">Monthly Revenue Trend</h6>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={monthlyRevenueData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#aaa' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#aaa' }} unit="₹" />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#E63946" strokeWidth={3} dot={{ r: 4, fill: '#E63946' }} activeDot={{ r: 6 }} />
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
                        <h6 className="admindashboard-chart-title">Payment Status</h6>
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
                                <BarChart data={weekData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} unit="₹" />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                    <Bar dataKey="revenue" fill="#1A1A1A" radius={[5, 5, 0, 0]} barSize={40} />
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
    // In a real app, we'd get the user role from a global AuthContext.
    // For this UI demo, we assume we are viewing as Admin because the Layout route is /admin.
    const role = "ADMIN";

    useEffect(() => {
        toast('Dashboard loaded', { icon: '👏' });
    }, []);

    return (
        <Container fluid className="px-0 admindashboard-container">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center admindashboard-header">
                <div>
                    <h2 className="admindashboard-title">Dashboard Overview</h2>
                    <p className="admindashboard-subtitle">Welcome back, Admin</p>
                </div>
                {/* 
                 */}
            </div>

            {/* Top Summary Cards */}
            <SummaryCards />

            {/* Financial Analytics - strictly for ADMIN */}
            {role === "ADMIN" && (
                <div className="admindashboard-analytics-section">
                    <CashFlowCharts />
                </div>
            )}
        </Container>
    );
};

export default AdminDashboard;
