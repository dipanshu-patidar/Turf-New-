import React, { useState } from 'react';
import { Container, Form, Button, Alert, InputGroup, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', {
                email,
                password,
            });

            if (response.data.success) {
                const { token, user } = response.data;

                // Store token and user details
                localStorage.setItem('auth_token', token);
                localStorage.setItem('user', JSON.stringify(user));

                toast.success('Login Successful!');

                // Redirect based on role
                if (user.role === 'ADMIN') {
                    navigate('/admin/dashboard');
                } else if (user.role === 'STAFF') {
                    navigate('/management/dashboard');
                } else {
                    navigate('/management/dashboard'); // Default
                }
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="vh-100 d-flex align-items-center justify-content-center position-relative"
            style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1920&auto=format&fit=crop")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark" style={{ opacity: 0.3 }}></div>

            <Container style={{ maxWidth: '500px', zIndex: 2 }}>
                <div
                    className="p-5 rounded-4 text-center text-white"
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                    }}
                >
                    <div className="mb-4 d-inline-block rounded p-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <img src="/Logo.jpeg" alt="Turf Pro Logo" style={{ maxWidth: '80px', height: 'auto', objectFit: 'contain' }} />
                    </div>
                    <h3 className="m-0 fw-bold text-white mb-2" style={{ fontFamily: 'sans-serif' }}>TURF<span className="text-success">PRO</span></h3>
                    <small className="text-white-50 d-block mb-4" style={{ fontSize: '0.7rem' }}>Smart Turf Management</small>

                    <h5 className="mb-4 fw-light text-uppercase" style={{ letterSpacing: '1px' }}>Login to your account</h5>

                    {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

                    <Form onSubmit={handleLogin}>
                        <Form.Group className="mb-3">
                            <InputGroup>
                                <InputGroup.Text className="bg-white border-0 text-secondary">
                                    <FaUser />
                                </InputGroup.Text>
                                <Form.Control
                                    type="email"
                                    placeholder="EMAIL"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="border-0 shadow-none"
                                    style={{ height: '50px' }}
                                />
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <InputGroup>
                                <InputGroup.Text className="bg-white border-0 text-secondary">
                                    <FaLock />
                                </InputGroup.Text>
                                <Form.Control
                                    type="password"
                                    placeholder="PASSWORD"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="border-0 shadow-none"
                                    style={{ height: '50px' }}
                                />
                            </InputGroup>
                        </Form.Group>

                        <Button
                            type="submit"
                            className="w-100 py-3 fw-bold text-uppercase mb-3"
                            style={{ backgroundColor: '#D90429', border: 'none', borderRadius: '5px', letterSpacing: '1px' }}
                            disabled={loading}
                        >
                            {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Log In'}
                        </Button>
                    </Form>

                    <div className="d-flex justify-content-end text-right text-white-50 text-decoration-none small mb-4">
                        <a href="#" className="text-white-50 text-decoration-none">Forget Password?</a>
                    </div>

                </div>
            </Container>
        </div>
    );
};

export default Login;
