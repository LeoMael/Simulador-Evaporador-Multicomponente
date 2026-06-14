import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload } from 'lucide-react';

export default function FileUploader({ onDataLoaded }) {
    const fileInputRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleZoneClick = () => {
        fileInputRef.current.click();
    };

    const handleFileSelect = (e) => {
        if (e.target.files.length > 0) {
            parseFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files.length > 0) {
            parseFile(e.dataTransfer.files[0]);
        }
    };

    const parseFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                if (workbook.SheetNames.length === 0) {
                    throw new Error("El archivo no tiene hojas de cálculo.");
                }
                
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet);
                
                if (!rows || rows.length === 0) {
                    throw new Error("El archivo de datos está vacío.");
                }
                
                // Mapeador insensible a mayúsculas, minúsculas, espacios y acentos
                const getVal = (row, possibleKeys, defaultVal = 0) => {
                    for (let key of Object.keys(row)) {
                        const cleanKey = key.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        if (possibleKeys.includes(cleanKey)) {
                            return row[key];
                        }
                    }
                    return defaultVal;
                };

                const newComponents = rows.map(row => {
                    const name = getVal(row, ['componente', 'component', 'name', 'nombre', 'sustancia'], 'Sustancia');
                    const z = parseFloat(getVal(row, ['z', 'fraction', 'fraccion', 'fraccion de alimentacion', 'z (alimentacion)'], 0));
                    const k = parseFloat(getVal(row, ['k', 'k_i', 'kvalue', 'k-value', 'constante k', 'constante_k'], 1.0));
                    const cp = parseFloat(getVal(row, ['cp', 'cp liquido', 'cp_liq', 'cp_liquid', 'capacidad calorifica'], 0));
                    const dH_vap = parseFloat(getVal(row, ['dh_vap', 'dhvap', 'dh_vaporizacion', 'entalpia_vaporizacion', 'calor de vaporizacion', 'dh_vap a 105°c'], 0));
                    const a = parseFloat(getVal(row, ['antoine_a', 'antoine a', 'antoinea', 'ant_a', 'a'], 0));
                    const b = parseFloat(getVal(row, ['antoine_b', 'antoine b', 'antoineb', 'ant_b', 'b'], 0));
                    const c = parseFloat(getVal(row, ['antoine_c', 'antoine c', 'antoinec', 'ant_c', 'c'], 0));

                    return {
                        Componente: name.toString(),
                        z: z,
                        K: k,
                        Cp: cp,
                        dH_vap: dH_vap,
                        Antoine_A: a,
                        Antoine_B: b,
                        Antoine_C: c
                    };
                });

                // Normalizar fracciones de alimentación de forma proactiva si es necesario
                const sumZ = newComponents.reduce((sum, comp) => sum + comp.z, 0);
                if (sumZ > 0 && Math.abs(sumZ - 1.0) > 1e-4) {
                    newComponents.forEach(comp => comp.z = comp.z / sumZ);
                }

                onDataLoaded(newComponents, file.name);
            } catch (err) {
                console.error(err);
                alert(`Error al procesar el archivo: ${err.message}`);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const downloadTemplate = (e) => {
        e.stopPropagation(); // Evitar que se abra el selector de archivos al hacer clic en este botón
        const wb = XLSX.utils.book_new();
        const rows = [
            ["Componente", "z", "K", "Antoine_A", "Antoine_B", "Antoine_C", "Cp", "dH_vap"],
            ["Propano", 0.30, 7.0, 6.80398, 803.81, 246.99, 68.0, 4500.0],
            ["n-Butano", 0.10, 2.4, 6.80896, 935.86, 238.73, 78.0, 5300.0],
            ["n-Pentano", 0.15, 0.8, 6.87632, 1075.78, 233.20, 88.0, 6100.0],
            ["n-Hexano", 0.45, 0.3, 6.87776, 1171.53, 224.37, 98.0, 6900.0]
        ];
        const ws = XLSX.utils.aoa_to_sheet(rows);
        
        // Ajustar anchos de columnas básicos para la plantilla
        ws['!cols'] = [
            { wch: 15 }, // Componente
            { wch: 8 },  // z
            { wch: 8 },  // K
            { wch: 12 }, // Antoine_A
            { wch: 12 }, // Antoine_B
            { wch: 12 }, // Antoine_C
            { wch: 8 },  // Cp
            { wch: 10 }  // dH_vap
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Plantilla Mezcla");
        XLSX.writeFile(wb, "plantilla_mezcla_flash.xlsx");
    };

    return (
        <div style={styles.container}>
            <div 
                style={{
                    ...styles.uploadZone,
                    ...(isDragOver ? styles.uploadZoneDragOver : {})
                }}
                onClick={handleZoneClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                id="file-drop-zone"
            >
                <div style={styles.iconCircle}>
                    <Upload size={14} color="#06b6d4" />
                </div>
                <div style={styles.textContainer}>
                    <span style={styles.uploadText}>
                        <strong>Carga de datos:</strong> Arrastra aquí o haz clic para importar CSV/Excel
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button 
                        type="button" 
                        style={styles.templateButton} 
                        onClick={downloadTemplate}
                        id="btn-download-template"
                        title="Descargar plantilla Excel de ejemplo"
                    >
                        Plantilla
                    </button>
                    <button type="button" style={styles.browseButton}>Cargar</button>
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    id="file-input-field"
                />
            </div>
        </div>
    );
}

const styles = {
    container: {
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        padding: '8px 12px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
    },
    uploadZone: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        cursor: 'pointer',
        gap: '10px',
        transition: '0.2s ease',
    },
    uploadZoneDragOver: {
        background: 'rgba(6, 182, 212, 0.05)',
        borderRadius: '6px',
    },
    iconCircle: {
        width: '28px',
        height: '28px',
        background: 'rgba(6, 182, 212, 0.1)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    textContainer: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        textAlign: 'left',
    },
    uploadText: {
        fontSize: '0.72rem',
        color: '#d1d5db',
        lineHeight: '1.2',
    },
    templateButton: {
        background: 'rgba(6, 182, 212, 0.08)',
        border: '1px solid rgba(6, 182, 212, 0.2)',
        borderRadius: '4px',
        color: '#06b6d4',
        padding: '4px 10px',
        fontSize: '0.7rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: '0.2s ease',
        flexShrink: 0,
    },
    browseButton: {
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        color: '#f3f4f6',
        padding: '4px 10px',
        fontSize: '0.7rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: '0.2s ease',
        flexShrink: 0,
    }
};

