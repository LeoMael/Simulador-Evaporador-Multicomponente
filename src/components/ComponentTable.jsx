import React from 'react';
import { Trash2, Plus, RefreshCw } from 'lucide-react';

export default function ComponentTable({ 
    components, 
    onUpdateComponent, 
    onAddComponent, 
    onDeleteComponent, 
    isManualK, 
    onNormalizeZ 
}) {
    
    const handleChange = (idx, field, val) => {
        let parsedVal = val;
        if (field !== 'Componente') {
            parsedVal = parseFloat(val);
            if (isNaN(parsedVal)) parsedVal = 0;
        }
        onUpdateComponent(idx, field, parsedVal);
    };

    const sumZ = components.reduce((sum, c) => sum + (c.z || 0), 0);
    const isZBalanced = Math.abs(sumZ - 1.0) < 1e-4;

    return (
        <div style={styles.container}>
            <div style={styles.headerRow}>
                <div style={styles.titleCol}>
                    <h3 style={styles.title}>Propiedades de los Componentes</h3>
                    <div style={styles.subtitleRow}>
                        <span style={styles.subtitle}>
                            Suma de z: <strong style={{ color: isZBalanced ? '#10b981' : '#f97316' }}>{sumZ.toFixed(4)}</strong>
                        </span>
                        {!isZBalanced && (
                            <button 
                                type="button" 
                                style={styles.normalizeButton} 
                                onClick={onNormalizeZ}
                                title="Normalizar fracciones para que sumen 1"
                            >
                                <RefreshCw size={10} style={{ marginRight: '3px' }} /> Normalizar
                            </button>
                        )}
                    </div>
                </div>
                <button type="button" style={styles.addButton} onClick={onAddComponent}>
                    <Plus size={14} style={{ marginRight: '4px' }} /> Agregar
                </button>
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Sustancia</th>
                            <th style={styles.th}>z (Alim.)</th>
                            <th style={styles.th}>Constante K</th>
                            <th style={styles.th}>Ant. A</th>
                            <th style={styles.th}>Ant. B</th>
                            <th style={styles.th}>Ant. C</th>
                            <th style={styles.th}>C<sub>p</sub></th>
                            <th style={styles.th}>&Delta;H<sub>vap</sub></th>
                            <th style={styles.thAction}>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {components.map((comp, idx) => (
                            <tr key={idx} style={styles.tr}>
                                <td style={styles.td}>
                                    <input 
                                        type="text" 
                                        style={styles.input} 
                                        value={comp.Componente} 
                                        onChange={(e) => handleChange(idx, 'Componente', e.target.value)}
                                        id={`comp-name-${idx}`}
                                    />
                                </td>
                                <td style={styles.td}>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        min="0" 
                                        max="1"
                                        style={styles.inputNumber} 
                                        value={comp.z} 
                                        onChange={(e) => handleChange(idx, 'z', e.target.value)}
                                        id={`comp-z-${idx}`}
                                    />
                                </td>
                                <td style={styles.td}>
                                    <input 
                                        type="number" 
                                        step="0.05" 
                                        min="0.001"
                                        disabled={!isManualK}
                                        style={{
                                            ...styles.inputNumber,
                                            ...(isManualK ? styles.editableK : styles.calculatedK)
                                        }} 
                                        value={comp.K} 
                                        onChange={(e) => handleChange(idx, 'K', e.target.value)}
                                        id={`comp-k-${idx}`}
                                        title={isManualK ? "Editar valor K manualmente" : "Valor K calculado por Antoine"}
                                    />
                                </td>
                                <td style={styles.td}>
                                    <input 
                                        type="number" 
                                        step="0.00001" 
                                        style={styles.inputNumber} 
                                        value={comp.Antoine_A} 
                                        onChange={(e) => handleChange(idx, 'Antoine_A', e.target.value)}
                                        id={`comp-antoinea-${idx}`}
                                    />
                                </td>
                                <td style={styles.td}>
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        style={styles.inputNumber} 
                                        value={comp.Antoine_B} 
                                        onChange={(e) => handleChange(idx, 'Antoine_B', e.target.value)}
                                        id={`comp-antoineb-${idx}`}
                                    />
                                </td>
                                <td style={styles.td}>
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        style={styles.inputNumber} 
                                        value={comp.Antoine_C} 
                                        onChange={(e) => handleChange(idx, 'Antoine_C', e.target.value)}
                                        id={`comp-antoinec-${idx}`}
                                    />
                                </td>
                                <td style={styles.td}>
                                    <input 
                                        type="number" 
                                        step="1" 
                                        min="0"
                                        style={styles.inputNumber} 
                                        value={comp.Cp} 
                                        onChange={(e) => handleChange(idx, 'Cp', e.target.value)}
                                        id={`comp-cp-${idx}`}
                                    />
                                </td>
                                <td style={styles.td}>
                                    <input 
                                        type="number" 
                                        step="10" 
                                        min="0"
                                        style={styles.inputNumber} 
                                        value={comp.dH_vap} 
                                        onChange={(e) => handleChange(idx, 'dH_vap', e.target.value)}
                                        id={`comp-dhvap-${idx}`}
                                    />
                                </td>
                                <td style={styles.tdAction}>
                                    <button 
                                        type="button" 
                                        style={styles.deleteButton} 
                                        onClick={() => onDeleteComponent(idx)}
                                        id={`comp-del-${idx}`}
                                        title="Eliminar Componente"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
        gap: '12px',
    },
    headerRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleCol: {
        borderLeft: '3px solid #06b6d4',
        paddingLeft: '10px',
    },
    title: {
        fontFamily: "'Outfit', sans-serif",
        fontSize: '0.9rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: '#f3f4f6',
    },
    subtitleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '2px',
    },
    subtitle: {
        fontSize: '0.72rem',
        color: '#9ca3af',
    },
    normalizeButton: {
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(249, 115, 22, 0.1)',
        color: '#f97316',
        border: '1px solid rgba(249, 115, 22, 0.2)',
        borderRadius: '4px',
        padding: '2px 6px',
        fontSize: '0.65rem',
        cursor: 'pointer',
        transition: '0.2s ease',
    },
    addButton: {
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.06)',
        color: '#f3f4f6',
        border: 'none',
        borderRadius: '6px',
        padding: '5px 10px',
        fontSize: '0.72rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: '0.2s ease',
    },
    tableWrapper: {
        overflowX: 'auto',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '6px',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.8rem',
        textAlign: 'left',
    },
    th: {
        padding: '8px 10px',
        background: 'rgba(0, 0, 0, 0.35)',
        color: '#9ca3af',
        fontWeight: 600,
        textTransform: 'uppercase',
        fontSize: '0.65rem',
        letterSpacing: '0.5px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    },
    thAction: {
        padding: '8px 10px',
        background: 'rgba(0, 0, 0, 0.35)',
        color: '#9ca3af',
        fontWeight: 600,
        textTransform: 'uppercase',
        fontSize: '0.65rem',
        letterSpacing: '0.5px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        textAlign: 'center',
    },
    tr: {
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        transition: '0.2s ease',
    },
    td: {
        padding: '4px 8px',
    },
    tdAction: {
        padding: '4px 8px',
        textAlign: 'center',
    },
    input: {
        background: 'transparent',
        border: 'none',
        color: '#f3f4f6',
        width: '100%',
        padding: '4px',
        fontFamily: 'inherit',
        fontSize: '0.8rem',
        borderBottom: '1px dashed rgba(255, 255, 255, 0.15)',
        outline: 'none',
    },
    inputNumber: {
        background: 'transparent',
        border: 'none',
        color: '#f3f4f6',
        width: '100%',
        padding: '4px',
        fontFamily: 'inherit',
        fontSize: '0.8rem',
        borderBottom: '1px dashed rgba(255, 255, 255, 0.15)',
        outline: 'none',
    },
    editableK: {
        color: '#22d3ee',
        borderBottomColor: 'rgba(34, 211, 238, 0.4)',
        fontWeight: 'bold',
    },
    calculatedK: {
        color: '#9ca3af',
        cursor: 'not-allowed',
        opacity: 0.8,
    },
    deleteButton: {
        background: 'transparent',
        color: '#ef4444',
        border: 'none',
        borderRadius: '4px',
        padding: '4px 6px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: '0.2s ease',
    },
};
