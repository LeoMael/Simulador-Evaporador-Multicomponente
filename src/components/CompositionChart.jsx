import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Registrar los módulos necesarios de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function CompositionChart({ components, xValues = [], yValues = [] }) {
    const labels = components.map(c => c.Componente);
    const zData = components.map(c => c.z);
    
    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Alimentación (z)',
                data: zData,
                backgroundColor: 'rgba(59, 130, 246, 0.75)',
                borderColor: '#3b82f6',
                borderWidth: 1.5,
                borderRadius: 4
            },
            {
                label: 'Líquido (x)',
                data: xValues,
                backgroundColor: 'rgba(6, 182, 212, 0.75)',
                borderColor: '#06b6d4',
                borderWidth: 1.5,
                borderRadius: 4
            },
            {
                label: 'Vapor (y)',
                data: yValues,
                backgroundColor: 'rgba(16, 185, 129, 0.75)',
                borderColor: '#10b981',
                borderWidth: 1.5,
                borderRadius: 4
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 12,
                    padding: 15,
                    color: '#9ca3af',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11,
                        weight: 500
                    }
                }
            },
            tooltip: {
                backgroundColor: '#1f2937',
                titleColor: '#ffffff',
                bodyColor: '#e5e7eb',
                borderColor: 'rgba(255, 255, 255, 0.08)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 6
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.03)'
                },
                ticks: {
                    color: '#9ca3af',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    }
                }
            },
            y: {
                min: 0,
                max: 1,
                grid: {
                    color: 'rgba(255, 255, 255, 0.03)'
                },
                title: {
                    display: true,
                    text: 'Fracción Molar',
                    color: '#9ca3af',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11,
                        weight: 600
                    }
                },
                ticks: {
                    color: '#9ca3af',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    }
                }
            }
        }
    };

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>Comparación de Fracciones Molares (z vs. x vs. y)</h3>
            <div style={styles.chartWrapper}>
                <Bar data={data} options={options} />
            </div>
        </div>
    );
}

const styles = {
    container: {
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.03)',
        padding: '16px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    title: {
        fontFamily: "'Outfit', sans-serif",
        fontSize: '0.9rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: '#f3f4f6',
        borderLeft: '3px solid #8b5cf6',
        paddingLeft: '10px',
    },
    chartWrapper: {
        position: 'relative',
        height: '240px',
        width: '100%',
    }
};
