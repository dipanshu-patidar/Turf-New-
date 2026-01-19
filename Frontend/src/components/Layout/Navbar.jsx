import React from 'react';
import { Navbar, Container, Button, Nav, Dropdown } from 'react-bootstrap';
import { FaBars, FaSignOutAlt, FaUserCircle, FaBell, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const AppNavbar = ({ toggleSidebar, isOpen, role }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/login');
    };

    return (
        <Navbar expand="lg" className="navbar-custom sticky-top py-3 px-4">
            <Container fluid className="px-0">
                <div className="d-flex align-items-center">
                    <Button
                        variant="link"
                        onClick={toggleSidebar}
                        className="me-3 p-0 text-dark border-0 d-flex align-items-center justify-content-center"
                        style={{ width: '40px', height: '40px', background: '#f8f9fa', borderRadius: '10px' }}
                    >
                        <FaBars size={18} />
                    </Button>
                </div>

                <Nav className="ms-auto align-items-center flex-row gap-3">
                    {/* Search Icon (Placeholder) */}
                    <div className="d-none d-md-flex align-items-center bg-light rounded-pill px-3 py-2 cursor-pointer shadow-sm border border-light">
                        <FaSearch className="text-muted me-2" size={14} />
                        <span className="text-muted small">Search...</span>
                    </div>

                    {/* Notifications */}
                    {/* <div className="position-relative cursor-pointer p-2 rounded-circle hover-bg-light transition-all">
                        <FaBell size={20} className="text-secondary" />
                        <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                            <span className="visually-hidden">New alerts</span>
                        </span>
                    </div> */}

                    {/* User Profile Dropdown */}
                    <Dropdown align="end">
                        <Dropdown.Toggle variant="light" id="dropdown-basic" className="d-flex align-items-center border-0 bg-transparent p-0 shadow-none show-dropdown-arrow-none">
                            <div className="d-flex align-items-center bg-white rounded-pill pe-3 shadow-sm border border-light">
                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '38px', height: '38px' }}>
                                    <FaUserCircle size={20} />
                                </div>
                                <div className="d-none d-sm-block text-start">
                                    <small className="d-block fw-bold text-dark lh-1" style={{ fontSize: '0.85rem' }}>Admin User</small>
                                    <small className="d-block text-muted lh-1" style={{ fontSize: '0.7rem' }}>View Profile</small>
                                </div>
                            </div>
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="shadow-lg border-0 rounded-4 mt-2 p-2" style={{ minWidth: '200px' }}>
                            <Dropdown.Header className="text-uppercase small fw-bold text-muted">Account</Dropdown.Header>
                            <Dropdown.Item onClick={() => navigate(`/${role}/profile`)} className="rounded-2 py-2 mb-1">
                                <FaUserCircle className="me-2" style={{ color: '#E63946' }} /> Profile
                            </Dropdown.Item>
                            {/* <Dropdown.Item href="#" className="rounded-2 py-2 mb-1"><FaBell className="me-2 text-warning" /> Notifications</Dropdown.Item> */}
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={handleLogout} className="rounded-2 py-2 text-danger fw-medium">
                                <FaSignOutAlt className="me-2" /> Logout
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Nav>
            </Container>
        </Navbar>
    );
};

export default AppNavbar;
