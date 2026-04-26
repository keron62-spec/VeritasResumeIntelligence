import React from 'react';
import { Icons } from '../assets/icons';

export default function Header({ darkMode, toggleDarkMode }) {
    return (
        <div className="header">
            <div className="header-left">
                <h1>
                    <span className="veritas-accent">Veritas</span> Resume Intelligence Platform 
                    <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '8px' }}>V8.4</span>
                </h1>
                <p>AI-powered analysis with RIASEC personality matching, cognitive complexity scoring, and recruiter-grade evaluation</p>
            </div>
            <button onClick={toggleDarkMode} className="dark-mode-toggle">
                {darkMode ? <Icons.Sun /> : <Icons.Moon />}
                {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
        </div>
    );
}