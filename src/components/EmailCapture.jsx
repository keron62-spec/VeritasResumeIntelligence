import React from 'react';
import { Icons } from '../assets/icons.jsx';

export default function EmailCapture({ email, setEmail, emailSent, handleEmailSubmit }) {
    return (
        <div className="email-capture">
            <h3><Icons.Email /> Get Your Full Report</h3>
            <p>Enter your email to receive a detailed PDF with all findings, personalized recommendations, and a complete action plan.</p>
            {!emailSent ? (
                <div className="email-input">
                    <input 
                        type="email" 
                        placeholder="your.email@example.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                    />
                    <button onClick={handleEmailSubmit}>Send Full Report</button>
                </div>
            ) : (
                <p style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>
                    ✅ Full report will be sent to {email}
                </p>
            )}
        </div>
    );
}