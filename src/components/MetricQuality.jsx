import React from 'react';

export default function MetricQuality({ metric_quality_breakdown }) {
    if (!metric_quality_breakdown) return null;

    return (
        <div className="results-section" style={{ marginTop: '20px' }}>
            <h3>📊 Metric Quality Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', textAlign: 'center' }}>
                <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-rose)' }}>
                        {metric_quality_breakdown.weak_count || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Weak Metrics</div>
                </div>
                <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-amber)' }}>
                        {metric_quality_breakdown.good_count || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Good Metrics</div>
                </div>
                <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-emerald)' }}>
                        {metric_quality_breakdown.strong_count || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Strong Metrics</div>
                </div>
            </div>
            <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                Overall Quality Score: {metric_quality_breakdown.overall_score}/100
            </div>
        </div>
    );
}