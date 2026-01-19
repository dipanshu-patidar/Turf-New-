import React from 'react';
import { Container, Card } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';

const Placeholder = () => {
    const location = useLocation();
    // specific logic to make the title pretty
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const title = pathSegments.length > 0
        ? pathSegments[pathSegments.length - 1].split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        : 'Module';

    return (
        <Container fluid>
            <h2 className="fw-bold mb-4 text-dark border-start border-4 border-primary ps-3">{title}</h2>
            <Card className="shadow-sm border-0 rounded-4" style={{ minHeight: '400px' }}>
                <Card.Body className="d-flex align-items-center justify-content-center flex-column text-muted">
                    <div className="bg-light p-4 rounded-circle mb-3">
                        <i className="bi bi-cone-striped fs-1"></i> {/* If using bootstrap icons font, but I am using react-icons elsewhere. */}
                        <span style={{ fontSize: '3rem' }}>🚧</span>
                    </div>
                    <h4>Under Construction</h4>
                    <p>The <strong>{title}</strong> interface is coming soon.</p>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Placeholder;
