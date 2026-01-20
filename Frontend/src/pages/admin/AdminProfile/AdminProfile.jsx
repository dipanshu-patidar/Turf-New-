import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { FaUpload } from 'react-icons/fa';
import toast from 'react-hot-toast';
import profileService from '../../../api/profileService';
import './AdminProfile.css';

const AdminProfile = () => {
    const [loading, setLoading] = useState(true);
    const [updatingInfo, setUpdatingInfo] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Personal Info State
    const [personalInfo, setPersonalInfo] = useState({
        name: '',
        email: '',
        avatar: ''
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');

    // Password State
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const fileInputRef = useRef(null);

    // Fetch Profile
    const fetchProfile = useCallback(async () => {
        try {
            const data = await profileService.getProfile();
            setPersonalInfo({
                name: data.name,
                email: data.email,
                avatar: data.avatar
            });
            setAvatarPreview(data.avatar);
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Handle Personal Info Changes
    const handlePersonalInfoChange = (e) => {
        const { name, value } = e.target;
        setPersonalInfo(prev => ({ ...prev, [name]: value }));
    };

    // Handle Password Changes
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    // Handle Avatar Upload
    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image size should not be more than 2MB');
                return;
            }
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Submit Handlers
    const handlePersonalInfoSubmit = async (e) => {
        e.preventDefault();
        if (!personalInfo.name || !personalInfo.email) {
            toast.error('Name and Email are required');
            return;
        }

        setUpdatingInfo(true);
        try {
            const formData = new FormData();
            formData.append('name', personalInfo.name);
            formData.append('email', personalInfo.email);
            if (selectedFile) {
                formData.append('avatar', selectedFile);
            }

            const updatedUser = await profileService.updateProfile(formData);
            setPersonalInfo({
                name: updatedUser.name,
                email: updatedUser.email,
                avatar: updatedUser.avatar
            });
            setAvatarPreview(updatedUser.avatar);
            setSelectedFile(null);

            // Notify other components (like Navbar) about the update
            window.dispatchEvent(new CustomEvent('profileUpdate', { detail: updatedUser }));

            toast.success('Personal info updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setUpdatingInfo(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const { oldPassword, newPassword, confirmPassword } = passwordData;

        if (!oldPassword || !newPassword || !confirmPassword) {
            toast.error('All password fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('New password must be at least 8 characters');
            return;
        }

        setChangingPassword(true);
        try {
            await profileService.changePassword(passwordData);
            toast.success('Password changed successfully!');
            setPasswordData({
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="adminprofile-container d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="danger" />
                    <p className="mt-2 text-muted">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="adminprofile-container">
            {/* Personal Info Card */}
            <div className="adminprofile-card">
                <div className="adminprofile-card-header">
                    <div className="adminprofile-header-indicator"></div>
                    <h5 className="adminprofile-card-title">Personal Info</h5>
                </div>
                <Form onSubmit={handlePersonalInfoSubmit}>
                    <div className="adminprofile-card-body">
                        <Row className="g-4">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="adminprofile-form-label">
                                        Name<span className="required">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="adminprofile-form-control"
                                        name="name"
                                        value={personalInfo.name}
                                        onChange={handlePersonalInfoChange}
                                        placeholder="Enter your name"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="adminprofile-form-label">
                                        Email<span className="required">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="email"
                                        className="adminprofile-form-control"
                                        name="email"
                                        value={personalInfo.email}
                                        onChange={handlePersonalInfoChange}
                                        placeholder="Enter your email"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="adminprofile-avatar-section">
                            <label className="adminprofile-avatar-label">Avatar</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <div className="adminprofile-upload-btn-container">
                                <button
                                    type="button"
                                    className="adminprofile-upload-btn"
                                    onClick={handleAvatarClick}
                                    disabled={updatingInfo}
                                >
                                    <FaUpload /> Choose file here
                                </button>
                            </div>
                            <img
                                src={avatarPreview || 'https://via.placeholder.com/150'}
                                alt="Avatar Preview"
                                className="adminprofile-avatar-preview"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                            />
                            <div className="adminprofile-avatar-hint">
                                Please upload a valid image file. Size of image should not be more than 2MB.
                            </div>
                        </div>
                    </div>
                    <div className="adminprofile-card-footer">
                        <Button
                            type="submit"
                            className="adminprofile-btn-primary"
                            disabled={updatingInfo}
                        >
                            {updatingInfo ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Updating...
                                </>
                            ) : 'Save Changes'}
                        </Button>
                    </div>
                </Form>
            </div>

            {/* Change Password Card */}
            <div className="adminprofile-card">
                <div className="adminprofile-card-header">
                    <div className="adminprofile-header-indicator"></div>
                    <h5 className="adminprofile-card-title">Change Password</h5>
                </div>
                <Form onSubmit={handlePasswordSubmit}>
                    <div className="adminprofile-card-body">
                        <Row className="g-4">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="adminprofile-form-label">
                                        Old Password<span className="required">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        className="adminprofile-form-control"
                                        name="oldPassword"
                                        value={passwordData.oldPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter Old Password"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="adminprofile-form-label">
                                        New Password<span className="required">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        className="adminprofile-form-control"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter Your Password"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="adminprofile-form-label">
                                        Confirm New Password<span className="required">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        className="adminprofile-form-control"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter Your Confirm Password"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>
                    <div className="adminprofile-card-footer">
                        <Button
                            type="submit"
                            className="adminprofile-btn-primary"
                            disabled={changingPassword}
                        >
                            {changingPassword ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Changing...
                                </>
                            ) : 'Change Password'}
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default AdminProfile;
