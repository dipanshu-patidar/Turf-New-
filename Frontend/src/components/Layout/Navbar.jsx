import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, Container, Button, Nav, Dropdown } from 'react-bootstrap';
import { FaBars, FaSignOutAlt, FaUserCircle, FaBell, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import profileService from '../../api/profileService';

const AppNavbar = ({ toggleSidebar, isOpen, role }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        name: 'Loading...',
        avatar: ''
    });

    const fetchUser = useCallback(async () => {
        try {
            const data = await profileService.getProfile();
            setUser({
                name: data.name,
                avatar: data.avatar
            });
        } catch (error) {
            console.error('Error fetching user for navbar:', error);
        }
    }, []);

    useEffect(() => {
        fetchUser();

        // Listen for profile updates
        const handleProfileUpdate = (e) => {
            if (e.detail) {
                setUser({
                    name: e.detail.name,
                    avatar: e.detail.avatar
                });
            } else {
                fetchUser();
            }
        };

        window.addEventListener('profileUpdate', handleProfileUpdate);
        return () => window.removeEventListener('profileUpdate', handleProfileUpdate);
    }, [fetchUser]);

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

                    {/* User Profile Dropdown */}
                    <Dropdown align="end">
                        <Dropdown.Toggle variant="light" id="dropdown-basic" className="d-flex align-items-center border-0 bg-transparent p-0 shadow-none show-dropdown-arrow-none">
                            <div className="d-flex align-items-center bg-white rounded-pill pe-3 shadow-sm border border-light">
                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2 overflow-hidden" style={{ width: '38px', height: '38px' }}>
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt="Profile"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 496 512" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 18.8-35.4 55.6-59.8 98.5-59.8 2.4 0 4.8.4 7.1 1.1 13 4.2 26.6 6.9 40.9 6.9 14.3 0 28-2.7 40.9-6.9 2.3-.7 4.7-1.1 7.1-1.1 42.9 0 79.7 24.4 98.5 59.8C359.3 421.4 306.7 448 248 448z"></path></svg>'; }}
                                        />
                                    ) : (
                                        <FaUserCircle size={20} />
                                    )}
                                </div>
                                <div className="d-none d-sm-block text-start">
                                    <small className="d-block fw-bold text-dark lh-1" style={{ fontSize: '0.85rem' }}>{user.name}</small>
                                    <small className="d-block text-muted lh-1" style={{ fontSize: '0.7rem' }}>View Profile</small>
                                </div>
                            </div>
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="shadow-lg border-0 rounded-4 mt-2 p-2" style={{ minWidth: '200px' }}>
                            <Dropdown.Header className="text-uppercase small fw-bold text-muted">Account</Dropdown.Header>
                            <Dropdown.Item onClick={() => navigate(`/${role}/profile`)} className="rounded-2 py-2 mb-1">
                                <FaUserCircle className="me-2" style={{ color: '#E63946' }} /> Profile
                            </Dropdown.Item>
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
