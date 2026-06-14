import React from 'react';
import { Activity, Flame, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function MetricsGrid({ vf, feed, results }) {
    const vFlow = vf * feed;
    const lFlow = feed - vFlow;

    // Determinar el estado físico
    let stateLabel = "Equilibrio Líquido-Vapor";
    let stateColor = "#10b981"; // success green
    let stateBg = "rgba(16, 185, 129, 0.1)";

    if (vf <= 0) {
        stateLabel = "Líquido Subenfriado";
        stateColor = "#3b82f6"; // blue
        stateBg = "rgba(59, 130, 246, 0.1)";
    } else if (vf >= 1) {
        stateLabel = "Vapor Sobrecalentado";
        stateColor = "#f97316"; // orange
        stateBg = "rgba(249, 115, 22, 0.1)";
    }

    // Calcular Cp Promedio y Calor latente si están disponibles
    const cpAvg = results?.cpAvg || 0;
    const hVapTotal = results?.hVaporTotal || 0; // cal/mol alim o kJ/h
    // Q es la potencia térmica para evaporar
    // Q = V * dH_vap_avg
    const dH_vap_avg = results?.dH_vap_avg || 0; // cal/mol
    const heatDuty = (vFlow * 1000 * dH_vap_avg) / 1000000; // Mcal/h (kgmol/h * 1000 mol/kgmol * cal/mol / 10^6)

    return (
        <div style={styles.grid}>
            {/* Card 1: Fracción de Vapor V/F */}
            <div style={{ ...styles.card, borderLeftColor: '#06b6d4' }}>
                <div style={styles.cardHeader}>
                    <span style={styles.cardTitle}>Fracción Vaporizada (V/F)</span>
                    <Activity size={16} color="#06b6d4" />
                </div>
                <div style={styles.valueRow}>
                    <span style={styles.value}>{(vf * 100).toFixed(2)} %</span>
                </div>
                <div style={styles.footerRow}>
                    <span style={{ ...styles.stateBadge, color: stateColor, backgroundColor: stateBg }}>
                        {stateLabel}
                    </span>
                </div>
            </div>

            {/* Card 2: Flujo de Vapor (V) */}
            <div style={{ ...styles.card, borderLeftColor: '#10b981' }}>
                <div style={styles.cardHeader}>
                    <span style={styles.cardTitle}>Flujo de Vapor (V)</span>
                    <ArrowUpRight size={16} color="#10b981" />
                </div>
                <div style={styles.valueRow}>
                    <span style={styles.value}>{vFlow.toFixed(0)}</span>
                    <span style={styles.unit}>kgmol/h</span>
                </div>
                <div style={styles.footerRow}>
                    <span style={styles.footerText}>Fase de tope del evaporador</span>
                </div>
            </div>

            {/* Card 3: Flujo de Líquido (L) */}
            <div style={{ ...styles.card, borderLeftColor: '#f97316' }}>
                <div style={styles.cardHeader}>
                    <span style={styles.cardTitle}>Flujo de Líquido (L)</span>
                    <ArrowDownRight size={16} color="#f97316" />
                </div>
                <div style={styles.valueRow}>
                    <span style={styles.value}>{lFlow.toFixed(0)}</span>
                    <span style={styles.unit}>kgmol/h</span>
                </div>
                <div style={styles.footerRow}>
                    <span style={styles.footerText}>Fase de fondo del evaporador</span>
                </div>
            </div>

            {/* Card 4: Carga Térmica Estimada (Q) */}
            <div style={{ ...styles.card, borderLeftColor: '#8b5cf6' }}>
                <div style={styles.cardHeader}>
                    <span style={styles.cardTitle}>Carga de Evaporación (Q)</span>
                    <Flame size={16} color="#8b5cf6" />
                </div>
                <div style={styles.valueRow}>
                    <span style={styles.value}>{heatDuty.toFixed(2)}</span>
                    <span style={styles.unit}>Mcal/h</span>
                </div>
                <div style={styles.footerRow}>
                    <span style={styles.footerText}>
                        Cp Prom: {cpAvg.toFixed(1)} cal/mol·°C
                    </span>
                </div>
            </div>
        </div>
    );
}

const styles = {
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        width: '100%',
    },
    card: {
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        borderLeftWidth: '4px',
        borderRadius: '8px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15)',
        transition: 'transform 0.2s ease',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
    },
    valueRow: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '6px',
        marginTop: '2px',
    },
    value: {
        fontFamily: "'Outfit', sans-serif",
        fontSize: '1.45rem',
        fontWeight: 700,
        color: '#f3f4f6',
    },
    unit: {
        fontSize: '0.72rem',
        color: '#9ca3af',
    },
    footerRow: {
        marginTop: 'auto',
        paddingTop: '4px',
        display: 'flex',
        alignItems: 'center',
    },
    footerText: {
        fontSize: '0.68rem',
        color: '#6b7280',
    },
    stateBadge: {
        padding: '2px 8px',
        fontSize: '0.68rem',
        fontWeight: 600,
        borderRadius: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.2px',
    }
};
