import React, { useState, useRef } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { FaUpload } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './AdminProfile.css';

const AdminProfile = () => {
    // Personal Info State
    const [personalInfo, setPersonalInfo] = useState({
        name: 'WorkDo',
        email: 'company@example.com',
        avatar: 'https://img.freepik.com/free-photo/handsome-young-man-with-new-haircut-style_23-2147847101.jpg' // Using a placeholder similar to the image
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const fileInputRef = useRef(null);

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
            const reader = new FileReader();
            reader.onloadend = () => {
                setPersonalInfo(prev => ({ ...prev, avatar: reader.result }));
                toast.success('Avatar uploaded successfully!');
            };
            reader.readAsDataURL(file);
        }
    };

    // Submit Handlers
    const handlePersonalInfoSubmit = (e) => {
        e.preventDefault();
        if (!personalInfo.name || !personalInfo.email) {
            toast.error('Name and Email are required');
            return;
        }
        toast.success('Personal info updated successfully!');
    };

    const handlePasswordSubmit = (e) => {
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

        toast.success('Password changed successfully!');
        setPasswordData({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

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
                                >
                                    <FaUpload /> Choose file here
                                </button>
                            </div>
                            <img
                                src={personalInfo.avatar}
                                alt="Avatar Preview"
                                className="adminprofile-avatar-preview"
                            />
                            <div className="adminprofile-avatar-hint">
                                Please upload a valid image file. Size of image should not be more than 2MB.
                            </div>
                        </div>
                    </div>
                    <div className="adminprofile-card-footer">
                        <Button type="submit" className="adminprofile-btn-primary">
                            Save Changes
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
                        <Button type="submit" className="adminprofile-btn-primary">
                            Change Password
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default AdminProfile;
