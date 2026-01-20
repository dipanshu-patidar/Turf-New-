import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner } from 'react-bootstrap';
import { FaCalendarCheck, FaClock, FaExclamationCircle, FaArrowAltCircleRight } from 'react-icons/fa';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import staffDashboardService from '../../../api/staffDashboardService';
import moment from 'moment';
import './StaffDashboard.css';

const COLORS = ['#198754', '#ffc107', '#0d6efd'];

const SummaryCards = ({ data, loading }) => {
    const cards = [
        {
            title: "Today's Total Bookings",
            value: loading ? <Spinner animation="border" size="sm" /> : data.todayBookings || 0,
            icon: <FaCalendarCheck />,
            theme: "staffdashboard-theme-blue"
        },
        {
            title: "Today's Scheduled Matches",
            value: loading ? <Spinner animation="border" size="sm" /> : data.todayScheduled || 0,
            icon: <FaClock />,
            theme: "staffdashboard-theme-green"
        },
        {
            title: "Pending Balance Count",
            value: loading ? <Spinner animation="border" size="sm" /> : data.pendingBalanceCount || 0,
            icon: <FaExclamationCircle />,
            theme: "staffdashboard-theme-orange"
        },
        {
            title: "Ongoing / Upcoming",
            value: loading ? <Spinner animation="border" size="sm" /> : data.ongoingUpcoming || 0,
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

const OperationalCharts = ({ trendData, utilizationData, statusData, loading }) => {
    // Process statusData for PieChart
    const processedStatusData = [
        { name: 'Fully Paid', value: statusData.fullyPaid || 0 },
        { name: 'Balance Pending', value: statusData.balancePending || 0 },
        { name: 'Advance Pending', value: statusData.advancePending || 0 },
    ];

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <Row className="g-4">
            {/* Bookings Per Day */}
            <Col lg={8}>
                <div className="staffdashboard-chart-card">
                    <div className="staffdashboard-chart-header">
                        <h4 className="staffdashboard-chart-title">Bookings Per Day</h4>
                    </div>
                    <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#6c757d' }}
                                tickFormatter={(val) => moment(val).format('DD MMM')}
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
                                dataKey="count"
                                name="Bookings"
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
                                data={processedStatusData}
                                cx="50%"
                                cy="45%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {processedStatusData.map((entry, index) => (
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
                        <BarChart data={utilizationData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                            <XAxis
                                dataKey="court"
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
                                dataKey="bookings"
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
    const [summary, setSummary] = useState({});
    const [trend, setTrend] = useState([]);
    const [utilization, setUtilization] = useState([]);
    const [statusDist, setStatusDist] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const from = moment().subtract(7, 'days').format('YYYY-MM-DD');
            const to = moment().format('YYYY-MM-DD');

            const [summaryRes, trendRes, utilRes, statusRes] = await Promise.all([
                staffDashboardService.getSummary(),
                staffDashboardService.getBookingsPerDay(from, to),
                staffDashboardService.getCourtUtilization(),
                staffDashboardService.getPaymentStatus()
            ]);

            setSummary(summaryRes);
            setTrend(trendRes);
            setUtilization(utilRes);
            setStatusDist(statusRes);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="staffdashboard-container">
            <div className="staffdashboard-page-header">
                <h2 className="staffdashboard-title">Operational Overview</h2>
                <p className="text-muted m-0">Daily management and utilization analysis</p>
            </div>

            <SummaryCards data={summary} loading={loading} />

            <div className="staffdashboard-operational-analytics mt-4">
                <h5 className="staffdashboard-section-title">Operational Analytics</h5>
                <OperationalCharts
                    trendData={trend}
                    utilizationData={utilization}
                    statusData={statusDist}
                    loading={loading}
                />
            </div>
        </div>
    );
};

export default StaffDashboard;
