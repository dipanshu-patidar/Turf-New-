import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { FaCalendarCheck, FaClock, FaExclamationCircle, FaArrowAltCircleRight } from 'react-icons/fa';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import './StaffDashboard.css';

// Mock Data
const bookingHistoryData = [
    { date: '10 Jan', bookings: 12 },
    { date: '11 Jan', bookings: 18 },
    { date: '12 Jan', bookings: 15 },
    { date: '13 Jan', bookings: 22 },
    { date: '14 Jan', bookings: 30 },
    { date: '15 Jan', bookings: 25 },
    { date: '16 Jan', bookings: 28 },
];

const courtUtilizationData = [
    { name: 'Football', count: 45 },
    { name: 'Cricket', count: 38 },
    { name: 'Badminton 1', count: 32 },
    { name: 'Badminton 2', count: 28 },
    { name: 'Pickleball', count: 20 },
];

const paymentStatusData = [
    { name: 'Fully Paid', value: 65 },
    { name: 'Balance Pending', value: 25 },
    { name: 'Advance Pending', value: 10 },
];

const COLORS = ['#198754', '#ffc107', '#0d6efd'];

const SummaryCards = () => {
    const cards = [
        {
            title: "Today's Total Bookings",
            value: "28",
            icon: <FaCalendarCheck />,
            theme: "staffdashboard-theme-blue"
        },
        {
            title: "Today's Scheduled Matches",
            value: "15",
            icon: <FaClock />,
            theme: "staffdashboard-theme-green"
        },
        {
            title: "Pending Balance Count",
            value: "08",
            icon: <FaExclamationCircle />,
            theme: "staffdashboard-theme-orange"
        },
        {
            title: "Ongoing / Upcoming",
            value: "06",
            icon: <FaArrowAltCircleRight />,
            theme: "staffdashboard-theme-purple"
        }
    ];

    return (
        <Row className="staffdashboard-summary-row g-4">
            {cards.map((card, index) => (
                <Col key={index} lg={3} md={6}>
                    <Card className={`staffdashboard-card ${card.theme}`}>
                        <Card.Body className="staffdashboard-card-body">
                            <div className="staffdashboard-icon-wrapper">
                                {card.icon}
                            </div>
                            <div className="staffdashboard-card-info">
                                <h3>{card.value}</h3>
                                <p>{card.title}</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

const OperationalCharts = () => {
    return (
        <Row className="g-4">
            {/* Bookings Per Day */}
            <Col lg={8}>
                <div className="staffdashboard-chart-card">
                    <div className="staffdashboard-chart-header">
                        <h4 className="staffdashboard-chart-title">Bookings Per Day</h4>
                    </div>
                    <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={bookingHistoryData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#6c757d' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#6c757d' }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="bookings"
                                stroke="#0d6efd"
                                strokeWidth={3}
                                dot={{ fill: '#0d6efd', r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Col>

            {/* Payment Status Distribution */}
            <Col lg={4}>
                <div className="staffdashboard-chart-card">
                    <div className="staffdashboard-chart-header">
                        <h4 className="staffdashboard-chart-title">Payment Status Distribution</h4>
                    </div>
                    <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                            <Pie
                                data={paymentStatusData}
                                cx="50%"
                                cy="45%"
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
                            <Legend verticalAlign="bottom" align="center" iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Col>

            {/* Court Utilization */}
            <Col lg={12}>
                <div className="staffdashboard-chart-card" style={{ height: '450px' }}>
                    <div className="staffdashboard-chart-header">
                        <h4 className="staffdashboard-chart-title">Court Utilization (Total Bookings)</h4>
                    </div>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={courtUtilizationData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#6c757d' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#6c757d' }}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8f9fa' }}
                                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                            />
                            <Bar
                                dataKey="count"
                                fill="#7b1fa2"
                                radius={[6, 6, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Col>
        </Row>
    );
};

const StaffDashboard = () => {
    return (
        <div className="staffdashboard-container">
            <div className="staffdashboard-page-header">
                <h2 className="staffdashboard-title">Operational Overview</h2>
                <p className="text-muted m-0">Daily management and utilization analysis</p>
            </div>

            <SummaryCards />

            <div className="staffdashboard-operational-analytics mt-4">
                <h5 className="staffdashboard-section-title">Operational Analytics</h5>
                <OperationalCharts />
            </div>
        </div>
    );
};

export default StaffDashboard;
