import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import {
    FaTachometerAlt, FaUserShield, FaMoneyBillWave, FaListAlt,
    FaKey, FaUsers, FaCalendarAlt, FaClock, FaChartBar, FaCog, FaPlusCircle, FaLeaf
} from 'react-icons/fa';

const Sidebar = ({ role, isOpen, toggleSidebar }) => {
    const location = useLocation();

    const menus = {
        superadmin: [
            { label: 'Dashboard', path: '/superadmin/dashboard', icon: <FaTachometerAlt /> },
            { label: 'Admin Management', path: '/superadmin/admin-management', icon: <FaUserShield /> },
            { label: 'Plans & Pricing', path: '/superadmin/plans-pricing', icon: <FaMoneyBillWave /> },
            { label: 'Request Plan', path: '/superadmin/request-plan', icon: <FaListAlt /> },
            { label: 'Payments', path: '/superadmin/payments', icon: <FaMoneyBillWave /> },
            { label: 'Manage Passwords', path: '/superadmin/manage-passwords', icon: <FaKey /> },
        ],
        admin: [
            { label: 'Dashboard', path: '/admin/dashboard', icon: <FaTachometerAlt /> },
            { label: 'Management Users', path: '/admin/management-users', icon: <FaUsers /> },
            { label: 'Courts & Pricing', path: '/admin/courts-pricing', icon: <FaMoneyBillWave /> },
            { label: 'New Booking', path: '/admin/new-booking', icon: <FaPlusCircle /> },
            { label: 'Bookings List', path: '/admin/bookings-list', icon: <FaListAlt /> },
            { label: 'Booking Calendar', path: '/admin/booking-calendar', icon: <FaCalendarAlt /> },
            { label: 'Recurring Bookings', path: '/admin/recurring-bookings', icon: <FaClock /> },
            { label: 'Payments', path: '/admin/payments', icon: <FaMoneyBillWave /> },
            { label: 'Reports', path: '/admin/reports', icon: <FaChartBar /> },
            // { label: 'Settings', path: '/admin/settings', icon: <FaCog /> },
        ],
        management: [
            { label: 'Dashboard', path: '/management/dashboard', icon: <FaTachometerAlt /> },
            { label: 'Booking Calendar', path: '/management/booking-calendar', icon: <FaCalendarAlt /> },
            { label: 'New Booking', path: '/management/new-booking', icon: <FaPlusCircle /> },
            { label: 'Bookings', path: '/management/bookings', icon: <FaListAlt /> },
            { label: 'Recurring Bookings', path: '/management/recurring-bookings', icon: <FaClock /> },
            { label: 'Payments', path: '/management/payments', icon: <FaMoneyBillWave /> },
        ]
    };

    const currentMenu = menus[role] || [];

    return (
        <div
            className={`d-flex flex-column sidebar-wrapper vh-100 position-fixed start-0 top-0 text-white ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}
            style={{ overflowX: 'hidden', zIndex: 1000, transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
            <div className={`p-4 d-flex align-items-center border-bottom border-light border-opacity-10 ${!isOpen ? 'justify-content-center px-2' : ''}`}>
                <div className="bg-primary rounded p-2 d-flex align-items-center justify-content-center shadow-sm icon-shadow">
                    <FaLeaf size={isOpen ? 18 : 22} className="text-white" />
                </div>
                <div className={`ms-3 transition-opacity ${isOpen ? 'd-block' : 'd-none'}`}>
                    <h5 className="m-0 fw-bold text-white ls-1 text-nowrap">TURF<span className="text-primary">PRO</span></h5>
                </div>
            </div>

            <div className="flex-grow-1 overflow-auto p-3 custom-scrollbar">
                {/* {isOpen && <small className="text-muted fw-bold text-uppercase px-3 mb-2 d-block text-nowrap" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Menu</small>} */}
                <Nav className="flex-column w-100">
                    {currentMenu.map((item, index) => (
                        <Nav.Item key={index} className="mb-1">
                            <Link
                                to={item.path}
                                className={`nav-link text-decoration-none d-flex align-items-center py-3 rounded-3 nav-link-custom ${location.pathname === item.path ? 'active' : ''} ${!isOpen ? 'justify-content-center px-0' : 'px-3'}`}
                                title={!isOpen ? item.label : ''}
                            >
                                <span className={`fs-5 icon-shadow ${isOpen ? 'me-3' : ''}`} style={{ minWidth: '24px', display: 'flex', justifyContent: 'center' }}>{item.icon}</span>
                                <span className={`fw-medium text-nowrap ${isOpen ? 'd-block' : 'd-none'}`}>{item.label}</span>
                            </Link>
                        </Nav.Item>
                    ))}
                </Nav>
            </div>

            <div className="p-3 border-top border-light border-opacity-10 bg-black bg-opacity-25">
                <div className={`d-flex align-items-center p-2 rounded-3 ${!isOpen ? 'justify-content-center' : ''}`} style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="bg-gradient-primary rounded-circle d-flex align-items-center justify-content-center text-white shadow icon-shadow"
                        style={{ width: '38px', height: '38px', minWidth: '38px', background: 'var(--primary-color)' }}>
                        <span className="fw-bold">{role ? role.charAt(0).toUpperCase() : 'U'}</span>
                    </div>
                    {isOpen && (
                        <div className="ms-3 overflow-hidden">
                            <small className="d-block text-white-50 lh-1" style={{ fontSize: '0.75rem' }}>Signed in as</small>
                            <span className="fw-bold text-capitalize text-white text-truncate d-block">{role}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
