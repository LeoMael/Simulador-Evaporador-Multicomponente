import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
    Database,
    RefreshCw,
    FileText,
    FileSpreadsheet,
    Activity,
    Settings,
    Info,
    HelpCircle
} from 'lucide-react';
import ProcessDiagram from './components/ProcessDiagram';
import ComponentTable from './components/ComponentTable';
import MetricsGrid from './components/MetricsGrid';
import FileUploader from './components/FileUploader';
import CompositionChart from './components/CompositionChart';

// Componentes y valores por defecto (Ejemplo 2-2 del libro)
const DEFAULT_COMPONENTS = [
    { Componente: "Propano", z: 0.30, K: 7.0, Cp: 68.0, dH_vap: 4500.0, Antoine_A: 6.80398, Antoine_B: 803.81, Antoine_C: 246.99 },
    { Componente: "n-Butano", z: 0.10, K: 2.4, Cp: 78.0, dH_vap: 5300.0, Antoine_A: 6.80896, Antoine_B: 935.86, Antoine_C: 238.73 },
    { Componente: "n-Pentano", z: 0.15, K: 0.8, Cp: 88.0, dH_vap: 6100.0, Antoine_A: 6.87632, Antoine_B: 1075.78, Antoine_C: 233.20 },
    { Componente: "n-Hexane", z: 0.45, K: 0.3, Cp: 98.0, dH_vap: 6900.0, Antoine_A: 6.87776, Antoine_B: 1171.53, Antoine_C: 224.37 }
];

export default function App() {
    const [components, setComponents] = useState(JSON.parse(JSON.stringify(DEFAULT_COMPONENTS)));
    const [temperature, setTemperature] = useState(50.0); // °C
    const [pressure, setPressure] = useState(200.0); // kPa
    const [feedFlow, setFeedFlow] = useState(1000.0); // kgmol/h

    // Configuración del solver y simulación
    const [isManualK, setIsManualK] = useState(true);
    const [initialVf, setInitialVf] = useState(0.1); // Guess inicial V/F
    const [tolerance, setTolerance] = useState(1e-7);
    const [maxIterations, setMaxIterations] = useState(100);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Resultados calculados
    const [results, setResults] = useState(null);

    // Correr la simulación al cambiar cualquier parámetro de entrada relevante
    useEffect(() => {
        runSimulation();
    }, [components, temperature, pressure, feedFlow, isManualK, initialVf, tolerance, maxIterations]);

    /* ==========================================================================
       RESOLVEDOR DE RACHFORD-RICE (ISOTÉRMICO)
       ========================================================================== */
    const runSimulation = () => {
        try {
            // 1. Determinar constantes K efectivas para el cálculo
            const kValues = components.map(comp => {
                if (isManualK) {
                    return comp.K;
                } else {
                    // Ecuación de Antoine: log10(Psat [mmHg]) = A - B / (T[°C] + C)
                    const tempC = temperature;
                    const denom = tempC + comp.Antoine_C;
                    const safeDenom = Math.abs(denom) < 1e-9 ? (denom >= 0 ? 1e-9 : -1e-9) : denom;
                    const pSatmmHg = Math.pow(10, comp.Antoine_A - comp.Antoine_B / safeDenom);

                    // mmHg a kPa (1 mmHg = 0.1333224 kPa)
                    const pSatkPa = pSatmmHg * 0.1333224;

                    // K = Psat / P
                    return pSatkPa / pressure;
                }
            });

            // 2. Verificar límites físicos para asegurar que existe solución bifásica
            // R(0) = sum( z_i * (K_i - 1) )
            const r0 = components.reduce((sum, comp, idx) => sum + comp.z * (kValues[idx] - 1.0), 0.0);

            // R(1) = sum( z_i * (K_i - 1) / K_i ) = 1 - sum( z_i / K_i )
            const r1 = components.reduce((sum, comp, idx) => {
                const k = kValues[idx];
                return sum + (k !== 0 ? (comp.z * (k - 1.0)) / k : 0);
            }, 0.0);

            let vf_solved = 0.5;
            let phaseState = "Equilibrio Líquido-Vapor";
            let iterationsHistory = [];
            let converged = false;

            if (r0 <= 0) {
                // Mezcla subenfriada (completamente líquida, V/F = 0)
                vf_solved = 0.0;
                phaseState = "Líquido Subenfriado";
                converged = true;
                iterationsHistory.push({
                    iter: 1,
                    vf: 0.0,
                    r: r0,
                    rPrime: 0.0,
                    note: "Subenfriado (Fase líquida única)"
                });
            } else if (r1 >= 0) {
                // Mezcla sobrecalentada (completamente vaporizada, V/F = 1)
                vf_solved = 1.0;
                phaseState = "Vapor Sobrecalentado";
                converged = true;
                iterationsHistory.push({
                    iter: 1,
                    vf: 1.0,
                    r: r1,
                    rPrime: 0.0,
                    note: "Sobrecalentado (Fase vapor única)"
                });
            } else {
                // Resolver por Newton-Raphson con brackets de bisección de salvaguarda
                let lower = 0.0;
                let upper = 1.0;
                let vf = initialVf;

                for (let iter = 1; iter <= maxIterations; iter++) {
                    let r = 0.0;
                    let rPrime = 0.0;

                    for (let c = 0; c < components.length; c++) {
                        const z = components[c].z;
                        const K = kValues[c];
                        const denom = 1.0 + vf * (K - 1.0);
                        const safeDenom = Math.abs(denom) < 1e-15 ? 1e-15 : denom;

                        r += ((K - 1.0) * z) / safeDenom;
                        rPrime -= ((K - 1.0) * (K - 1.0) * z) / (safeDenom * safeDenom);
                    }

                    iterationsHistory.push({
                        iter: iter,
                        vf: vf,
                        r: r,
                        rPrime: rPrime,
                        note: `Newton Step: R(vf)=${r.toExponential(4)}`
                    });

                    if (Math.abs(r) < tolerance) {
                        vf_solved = vf;
                        converged = true;
                        break;
                    }

                    // Calcular siguiente paso por Newton-Raphson
                    let nextVf = vf - r / (rPrime !== 0 ? rPrime : -1e-15);

                    // Si el paso sale de los límites físicos (0, 1), realizar bisección
                    if (nextVf <= lower || nextVf >= upper) {
                        nextVf = (lower + upper) / 2.0;
                    }

                    // Acotar los límites de la raíz según el signo de R(vf)
                    // R(vf) es una función estrictamente decreciente.
                    // Si R(vf) > 0, la raíz real está a la derecha.
                    // Si R(vf) < 0, la raíz real está a la izquierda.
                    if (r > 0) {
                        lower = vf;
                    } else {
                        upper = vf;
                    }

                    if (isManualK) {
                        nextVf = Math.round(nextVf * 100) / 100;
                        if (nextVf === vf) {
                            vf_solved = vf;
                            converged = true;
                            break;
                        }
                    }

                    vf = nextVf;
                    vf_solved = vf;
                }
            }

            // 3. Fracciones molares de las fases en equilibrio (x_i, y_i)
            const xValues = [];
            const yValues = [];
            components.forEach((comp, idx) => {
                const z = comp.z;
                const k = kValues[idx];

                // x_i = z_i / [ 1 + (K_i - 1) * V/F ]
                let denom = 1.0 + vf_solved * (k - 1.0);
                let x = z / (Math.abs(denom) < 1e-15 ? 1e-15 : denom);

                // Asegurar cotas físicas
                if (vf_solved <= 0) {
                    x = z;
                } else if (vf_solved >= 1) {
                    x = z / k;
                }

                // y_i = K_i * x_i
                let y = k * x;
                if (vf_solved >= 1) {
                    y = z;
                } else if (vf_solved <= 0) {
                    y = k * z;
                }

                xValues.push(x);
                yValues.push(y);
            });

            // Normalización para visualización limpia
            const sumX = xValues.reduce((s, v) => s + v, 0);
            const sumY = yValues.reduce((s, v) => s + v, 0);
            const normalizedX = xValues.map(v => sumX > 0 ? v / sumX : v);
            const normalizedY = yValues.map(v => sumY > 0 ? v / sumY : v);

            // 4. Balances de entalpía y capacidad calorífica
            const cpAvg = components.reduce((sum, comp) => sum + comp.z * comp.Cp, 0.0);
            const dH_vap_avg = components.reduce((sum, comp, idx) => sum + normalizedY[idx] * comp.dH_vap, 0.0);
            const hVaporTotal = vf_solved * feedFlow * dH_vap_avg; // Calor total de vaporización

            setResults({
                vf: vf_solved,
                converged,
                phaseState,
                kValues,
                xValues: normalizedX,
                yValues: normalizedY,
                iterations: iterationsHistory,
                cpAvg,
                dH_vap_avg,
                hVaporTotal
            });

        } catch (err) {
            console.error("Fallo del solver flash:", err);
        }
    };

    /* ==========================================================================
       MANEJADORES DE ESTADO E INGRESO DE DATOS
       ========================================================================== */
    const handleUpdateComponent = (idx, field, val) => {
        const next = [...components];
        next[idx][field] = val;
        setComponents(next);
    };

    const handleAddComponent = () => {
        setComponents([
            ...components,
            {
                Componente: `Comp ${components.length + 1}`,
                z: 0.0,
                K: 1.0,
                Cp: 80.0,
                dH_vap: 6000.0,
                Antoine_A: 6.8,
                Antoine_B: 1000.0,
                Antoine_C: 230.0
            }
        ]);
    };

    const handleDeleteComponent = (idx) => {
        if (components.length <= 1) {
            alert("Debe haber al menos un componente en la mezcla.");
            return;
        }
        const next = components.filter((_, i) => i !== idx);

        // Renormalizar automáticamente tras eliminar
        const sumZ = next.reduce((sum, c) => sum + c.z, 0);
        if (sumZ > 0) {
            next.forEach(c => c.z = c.z / sumZ);
        }
        setComponents(next);
    };

    const handleNormalizeZ = () => {
        const sumZ = components.reduce((sum, c) => sum + c.z, 0);
        if (sumZ <= 0) return;
        const next = components.map(c => ({
            ...c,
            z: c.z / sumZ
        }));
        setComponents(next);
    };

    const handleReset = () => {
        setComponents(JSON.parse(JSON.stringify(DEFAULT_COMPONENTS)));
        setTemperature(50.0);
        setPressure(200.0);
        setFeedFlow(1000.0);
        setIsManualK(true);
        setInitialVf(0.5);
    };

    const handleDataLoaded = (newComps, fileName) => {
        setComponents(newComps);
    };

    /* ==========================================================================
       EXPORTADORES (CSV / Excel)
       ========================================================================== */
    const exportCSV = () => {
        if (!results) return;
        let csvContent = "REPORTE DE SIMULACION: EVAPORADOR FLASH MULTICOMPONENTE\n\n";
        csvContent += "PARAMETROS DE ENTRADA,VALOR,UNIDAD\n";
        csvContent += `Temperatura de la Camara (T),${temperature.toFixed(2)},°C\n`;
        csvContent += `Presion de la Camara (P),${pressure.toFixed(2)},kPa\n`;
        csvContent += `Flujo de Alimentacion (F),${feedFlow.toFixed(2)},kgmol/h\n`;
        csvContent += `Modo de Calculo de K,${isManualK ? "Manual" : "Automatico (Antoine)"},\n`;
        csvContent += `Estado Fisico,${results.phaseState},\n\n`;

        csvContent += "RESULTADOS GLOBALES,VALOR,UNIDAD\n";
        csvContent += `Fraccion Vaporizada (V/F),${results.vf.toFixed(6)},mol vapor / mol alim\n`;
        csvContent += `Flujo de Vapor (V),${(results.vf * feedFlow).toFixed(2)},kgmol/h\n`;
        csvContent += `Flujo de Liquido (L),${((1 - results.vf) * feedFlow).toFixed(2)},kgmol/h\n`;
        csvContent += `Cp Promedio Alimentacion,${results.cpAvg.toFixed(2)},cal/mol·°C\n`;
        csvContent += `Calor de Vaporizacion Promedio,${results.dH_vap_avg.toFixed(2)},cal/mol\n`;
        csvContent += `Carga Termica de Evaporacion,${((results.vf * feedFlow * 1000 * results.dH_vap_avg) / 1000000).toFixed(4)},Mcal/h\n\n`;

        csvContent += "RESULTADOS DETALLADOS POR COMPONENTE\n";
        csvContent += "Componente,z (Alimentacion),Flujo Alim (kgmol/h),Constante K,x (Liquido),y (Vapor),Flujo Liquido L_i (kgmol/h),Flujo Vapor V_i (kgmol/h),Cp Liquido (cal/mol.C),dH_vap (cal/mol),Antoine A,Antoine B,Antoine C\n";

        components.forEach((c, idx) => {
            const z = c.z;
            const K = results.kValues[idx];
            const x = results.xValues[idx];
            const y = results.yValues[idx];
            const feedCompFlow = z * feedFlow;
            const liqFlow = x * (1 - results.vf) * feedFlow;
            const vapFlow = y * results.vf * feedFlow;
            csvContent += `${c.Componente},${z.toFixed(6)},${feedCompFlow.toFixed(4)},${K.toFixed(6)},${x.toFixed(6)},${y.toFixed(6)},${liqFlow.toFixed(4)},${vapFlow.toFixed(4)},${c.Cp.toFixed(2)},${c.dH_vap.toFixed(2)},${c.Antoine_A.toFixed(5)},${c.Antoine_B.toFixed(2)},${c.Antoine_C.toFixed(2)}\n`;
        });

        const sumZ = components.reduce((s, c) => s + c.z, 0);
        const sumX = results.xValues.reduce((s, v) => s + v, 0);
        const sumY = results.yValues.reduce((s, v) => s + v, 0);
        const sumLiq = (1 - results.vf) * feedFlow;
        const sumVap = results.vf * feedFlow;
        csvContent += `SUMA / TOTAL,${sumZ.toFixed(4)},${feedFlow.toFixed(2)},,${sumX.toFixed(4)},${sumY.toFixed(4)},${sumLiq.toFixed(2)},${sumVap.toFixed(2)},,,,,\n`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "reporte_evaporador_flash.csv";
        link.click();
    };

    const exportExcel = () => {
        if (!results) return;
        const wb = XLSX.utils.book_new();

        const makeCell = (val, type = 's', format = '') => {
            const cell = { v: val, t: type };
            if (format) cell.z = format;
            return cell;
        };

        // Hoja 1: Resumen de Simulación
        const globalRows = [
            [makeCell("SIMULACIÓN DE EVAPORACIÓN INSTANTÁNEA (FLASH)"), makeCell(""), makeCell("")],
            [makeCell("=================================================="), makeCell(""), makeCell("")],
            [],
            [makeCell("PARÁMETRO DE ENTRADA"), makeCell("VALOR"), makeCell("UNIDAD")],
            [makeCell("Temperatura de la Cámara (T)"), makeCell(temperature, 'n', '#,##0.0'), makeCell("°C")],
            [makeCell("Presión de la Cámara (P)"), makeCell(pressure, 'n', '#,##0.0'), makeCell("kPa")],
            [makeCell("Flujo de Alimentación (F)"), makeCell(feedFlow, 'n', '#,##0.0'), makeCell("kgmol/h")],
            [makeCell("Modo de Cálculo de Constantes K"), makeCell(isManualK ? "Manual (Libro)" : "Automático (Antoine)"), makeCell("-")],
            [],
            [makeCell("VARIABLE DE SALIDA CALCULADA"), makeCell("VALOR"), makeCell("UNIDAD")],
            [makeCell("Fracción Vaporizada (V/F)"), makeCell(results.vf, 'n', '0.0000'), makeCell("mol vapor/mol feed")],
            [makeCell("Flujo de Vapor Destilado (V)"), makeCell(results.vf * feedFlow, 'n', '#,##0.0'), makeCell("kgmol/h")],
            [makeCell("Flujo de Líquido Retenido (L)"), makeCell((1.0 - results.vf) * feedFlow, 'n', '#,##0.0'), makeCell("kgmol/h")],
            [makeCell("Carga Térmica Estimada (Q)"), makeCell((results.vf * feedFlow * 1000.0 * results.dH_vap_avg) / 1000000.0, 'n', '#,##0.0000'), makeCell("Mcal/h")],
            [makeCell("Estado de Operación del Sistema"), makeCell(results.phaseState), makeCell("-")],
            [makeCell("=================================================="), makeCell(""), makeCell("")]
        ];

        const wsGlobal = XLSX.utils.aoa_to_sheet(globalRows);

        // Merges para Hoja 1 (A1:C1 y A2:C2)
        wsGlobal['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }
        ];

        wsGlobal['!cols'] = [
            { wch: 35 }, // Parámetro
            { wch: 25 }, // Valor
            { wch: 20 }  // Unidad
        ];

        XLSX.utils.book_append_sheet(wb, wsGlobal, "Resumen Proceso");

        // Hoja 2: Resultados por Componente
        const compRows = [
            [makeCell("EQUILIBRIO DE FASES MULTICOMPONENTE - DETALLE DE COMPONENTES"), makeCell(""), makeCell(""), makeCell(""), makeCell(""), makeCell(""), makeCell(""), makeCell(""), makeCell(""), makeCell(""), makeCell(""), makeCell(""), makeCell("")],
            [makeCell("========================================================================================================================="), makeCell(""), makeCell(""), makeCell(""), makeCell(""), makeCell(""), makeCell(""), makeCell(""), makeCell(""), makeCell(""), makeCell(""), makeCell(""), makeCell("")],
            [],
            [
                makeCell("Componente"),
                makeCell("Fracción Alim (z)"),
                makeCell("Flujo Alim (kgmol/h)"),
                makeCell("Constante K"),
                makeCell("Fracción Líquida (x)"),
                makeCell("Fracción Vapor (y)"),
                makeCell("Flujo Líquido (kgmol/h)"),
                makeCell("Flujo Vapor (kgmol/h)"),
                makeCell("Cp Líquido (cal/mol·°C)"),
                makeCell("dH_vap (cal/mol)"),
                makeCell("Antoine A"),
                makeCell("Antoine B"),
                makeCell("Antoine C")
            ]
        ];

        components.forEach((c, idx) => {
            const z = c.z;
            const K = results.kValues[idx];
            const x = results.xValues[idx];
            const y = results.yValues[idx];
            compRows.push([
                makeCell(c.Componente),
                makeCell(z, 'n', '0.0000'),
                makeCell(z * feedFlow, 'n', '#,##0.0'),
                makeCell(K, 'n', '0.0000'),
                makeCell(x, 'n', '0.0000'),
                makeCell(y, 'n', '0.0000'),
                makeCell(x * (1 - results.vf) * feedFlow, 'n', '#,##0.0'),
                makeCell(y * results.vf * feedFlow, 'n', '#,##0.0'),
                makeCell(c.Cp, 'n', '#,##0.0'),
                makeCell(c.dH_vap, 'n', '#,##0.0'),
                makeCell(c.Antoine_A, 'n', '0.00000'),
                makeCell(c.Antoine_B, 'n', '#,##0.00'),
                makeCell(c.Antoine_C, 'n', '#,##0.00')
            ]);
        });

        const sumZ = components.reduce((s, c) => s + c.z, 0);
        const sumX = results.xValues.reduce((s, v) => s + v, 0);
        const sumY = results.yValues.reduce((s, v) => s + v, 0);
        const sumLiq = (1 - results.vf) * feedFlow;
        const sumVap = results.vf * feedFlow;

        compRows.push([
            makeCell("SUMA / TOTAL"),
            makeCell(sumZ, 'n', '0.0000'),
            makeCell(feedFlow, 'n', '#,##0.0'),
            makeCell(""),
            makeCell(sumX, 'n', '0.0000'),
            makeCell(sumY, 'n', '0.0000'),
            makeCell(sumLiq, 'n', '#,##0.0'),
            makeCell(sumVap, 'n', '#,##0.0'),
            makeCell(""),
            makeCell(""),
            makeCell(""),
            makeCell(""),
            makeCell("")
        ]);

        const wsComps = XLSX.utils.aoa_to_sheet(compRows);

        // Merges para Hoja 2 (A1:M1 y A2:M2)
        wsComps['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } }
        ];

        wsComps['!cols'] = [
            { wch: 16 }, // Componente
            { wch: 18 }, // z
            { wch: 22 }, // Flujo Alim
            { wch: 14 }, // K
            { wch: 20 }, // x
            { wch: 20 }, // y
            { wch: 22 }, // Flujo Líquido
            { wch: 22 }, // Flujo Vapor
            { wch: 22 }, // Cp Líquido
            { wch: 18 }, // dH_vap
            { wch: 12 }, // Antoine A
            { wch: 12 }, // Antoine B
            { wch: 12 }  // Antoine C
        ];

        XLSX.utils.book_append_sheet(wb, wsComps, "Componentes");

        XLSX.writeFile(wb, "simulacion_evaporador_flash.xlsx");
    };

    return (
        <div className="app-container">
            {/* Header */}
            <header className="app-header">
                <div className="logo-container">
                    <div className="logo-icon"></div>
                    <div className="logo-text">
                        <h1>Simulador de Evaporador Flash Multicomponente</h1>
                        <span className="sub-title">Resolución Numérica Rachford-Rice en Equilibrio Isotérmico</span>
                    </div>
                </div>
                <div className="header-actions">
                    <span className="badge badge-success">Simulación Activa</span>
                </div>
            </header>

            {/* Main Layout Grid */}
            <main className="app-main">
                {/* COLUMNA IZQUIERDA: CONTROLES & TABLA */}
                <section className="panel panel-input" style={{ flex: 1 }}>
                    <div className="panel-header">
                        <h2>Configuración del Proceso</h2>
                        <p className="panel-subtitle">Ajuste de variables de la cámara e importación de mezcla</p>
                    </div>

                    {/* Operational Variables (Sliders) */}
                    <div className="section-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Variables de Operación</h3>

                            {/* Toggle Antoine vs Manual */}
                            <div className="toggle-container" id="k-mode-selector">
                                <button
                                    type="button"
                                    className={`toggle-btn ${isManualK ? 'active' : ''}`}
                                    onClick={() => setIsManualK(true)}
                                    id="btn-k-manual"
                                >
                                    K Manual
                                </button>
                                <button
                                    type="button"
                                    className={`toggle-btn ${!isManualK ? 'active' : ''}`}
                                    onClick={() => setIsManualK(false)}
                                    id="btn-k-antoine"
                                >
                                    Antoine (Auto)
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '6px' }}>
                            {/* Temperatura Slider */}
                            <div className="input-field">
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#9ca3af' }}>
                                    <label htmlFor="temp-slider">Temperatura de la Cámara (T):</label>
                                    <strong style={{ color: '#f43f5e' }}>{temperature.toFixed(1)} °C</strong>
                                </div>
                                <input
                                    type="range"
                                    id="temp-slider"
                                    min="0"
                                    max="150"
                                    step="0.5"
                                    value={temperature}
                                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                    className="slider"
                                />
                            </div>

                            {/* Presión Slider */}
                            <div className="input-field">
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#9ca3af' }}>
                                    <label htmlFor="pres-slider">Presión de la Cámara (P):</label>
                                    <strong style={{ color: '#06b6d4' }}>{pressure.toFixed(0)} kPa</strong>
                                </div>
                                <input
                                    type="range"
                                    id="pres-slider"
                                    min="50"
                                    max="1000"
                                    step="5"
                                    value={pressure}
                                    onChange={(e) => setPressure(parseFloat(e.target.value))}
                                    className="slider"
                                />
                            </div>

                            {/* Alimentación Slider */}
                            <div className="input-field">
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#9ca3af' }}>
                                    <label htmlFor="feed-slider">Flujo de Alimentación (F):</label>
                                    <strong style={{ color: '#3b82f6' }}>{feedFlow.toFixed(0)} kgmol/h</strong>
                                </div>
                                <input
                                    type="range"
                                    id="feed-slider"
                                    min="100"
                                    max="5000"
                                    step="50"
                                    value={feedFlow}
                                    onChange={(e) => setFeedFlow(parseFloat(e.target.value))}
                                    className="slider"
                                />
                            </div>
                        </div>
                    </div>

                    {/* File Uploader */}
                    <FileUploader onDataLoaded={handleDataLoaded} />

                    {/* Component Table */}
                    <ComponentTable
                        components={components}
                        onUpdateComponent={handleUpdateComponent}
                        onAddComponent={handleAddComponent}
                        onDeleteComponent={handleDeleteComponent}
                        isManualK={isManualK}
                        onNormalizeZ={handleNormalizeZ}
                    />

                    {/* Opciones Avanzadas del Solver */}
                    <div style={{ marginTop: '4px' }}>
                        <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            id="toggle-advanced-btn"
                        >
                            <Settings size={12} /> {showAdvanced ? "Ocultar" : "Mostrar"} Parámetros del Resolvedor
                        </button>

                        {showAdvanced && (
                            <div className="section-group" style={{ marginTop: '10px', animation: 'fadeIn 0.2s ease' }}>
                                <h3>Parámetros Rachford-Rice</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                                    <div className="input-field">
                                        <label htmlFor="solver-guess">V/F Inicial (Guess):</label>
                                        <input
                                            type="number"
                                            id="solver-guess"
                                            min="0.01"
                                            max="0.99"
                                            step="0.05"
                                            style={{
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '4px',
                                                color: '#fff',
                                                padding: '4px 8px',
                                                fontSize: '0.8rem',
                                                outline: 'none'
                                            }}
                                            value={initialVf}
                                            onChange={(e) => setInitialVf(parseFloat(e.target.value) || 0.5)}
                                        />
                                    </div>
                                    <div className="input-field">
                                        <label htmlFor="solver-tol">Tolerancia Convergencia:</label>
                                        <select
                                            id="solver-tol"
                                            style={{
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '4px',
                                                color: '#fff',
                                                padding: '4px 8px',
                                                fontSize: '0.8rem',
                                                outline: 'none'
                                            }}
                                            value={tolerance}
                                            onChange={(e) => setTolerance(parseFloat(e.target.value))}
                                        >
                                            <option value="1e-5">1e-5</option>
                                            <option value="1e-6">1e-6</option>
                                            <option value="1e-7">1e-7</option>
                                            <option value="1e-8">1e-8</option>
                                            <option value="1e-9">1e-9</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Reset Button */}
                    <div className="action-buttons" style={{ marginTop: 'auto' }}>
                        <button type="button" className="btn btn-secondary" onClick={handleReset} style={{ flex: 1 }} id="btn-restore-values">
                            <RefreshCw size={14} style={{ marginRight: '8px' }} /> Restaurar Valores Iniciales
                        </button>
                    </div>
                </section>

                {/* COLUMNA DERECHA: DIAGRAMA SVG, MÉTRICAS, GRÁFICO, TABLA RESULTADOS */}
                <section className="panel panel-results" style={{ flex: 1.25 }}>
                    <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                            <h2>Resultados y Separación de Fases</h2>
                            <p className="panel-subtitle">Balance de materia molecular y visualización de la cámara</p>
                        </div>
                        {results && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-xs"
                                    onClick={exportExcel}
                                    style={{ padding: '6px 12px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    id="header-btn-export-excel"
                                    title="Exportar reporte detallado a Excel"
                                >
                                    <FileSpreadsheet size={13} /> Exportar Excel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline btn-xs"
                                    onClick={exportCSV}
                                    style={{ padding: '6px 12px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    id="header-btn-export-csv"
                                    title="Exportar datos a CSV"
                                >
                                    <FileText size={13} /> Exportar CSV
                                </button>
                            </div>
                        )}
                    </div>

                    {results && (
                        <>
                            {/* Evaporador SVG Diagram */}
                            <ProcessDiagram
                                vf={results.vf}
                                T_flash={temperature}
                                pressure={pressure}
                                feed={feedFlow}
                                components={components}
                                xValues={results.xValues}
                                yValues={results.yValues}
                            />

                            {/* Metrics indicators */}
                            <MetricsGrid
                                vf={results.vf}
                                feed={feedFlow}
                                results={results}
                            />

                            {/* Composition bar chart */}
                            <CompositionChart
                                components={components}
                                xValues={results.xValues}
                                yValues={results.yValues}
                            />

                            {/* Detailed Composition Table */}
                            <div className="results-table-section" style={{ padding: '14px', gap: '10px' }}>
                                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '0.85rem' }}>Detalle de Fracciones en Equilibrio</h3>
                                </div>

                                <div className="table-container">
                                    <table className="data-table results-table" style={{ fontSize: '0.78rem' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '6px 8px', fontSize: '0.68rem' }}>Componente</th>
                                                <th style={{ padding: '6px 8px', fontSize: '0.68rem' }}>z (Alimentación)</th>
                                                <th style={{ padding: '6px 8px', fontSize: '0.68rem' }}>K (Constante)</th>
                                                <th style={{ padding: '6px 8px', fontSize: '0.68rem' }}>x (Líquido)</th>
                                                <th style={{ padding: '6px 8px', fontSize: '0.68rem' }}>y (Vapor)</th>
                                                <th style={{ padding: '6px 8px', fontSize: '0.68rem' }}>L_i (kgmol/h)</th>
                                                <th style={{ padding: '6px 8px', fontSize: '0.68rem' }}>V_i (kgmol/h)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {components.map((comp, idx) => {
                                                const K = results.kValues[idx] || 0;
                                                const x = results.xValues[idx] || 0;
                                                const y = results.yValues[idx] || 0;
                                                const liqFlow = x * (1.0 - results.vf) * feedFlow;
                                                const vapFlow = y * results.vf * feedFlow;

                                                return (
                                                    <tr key={idx}>
                                                        <td style={{ padding: '6px 8px' }}><strong>{comp.Componente}</strong></td>
                                                        <td style={{ padding: '6px 8px' }}>{(comp.z || 0).toFixed(4)}</td>
                                                        <td style={{ padding: '6px 8px', color: '#22d3ee' }}>{K.toFixed(4)}</td>
                                                        <td style={{ padding: '6px 8px', color: '#06b6d4', fontWeight: 'bold' }}>{x.toFixed(4)}</td>
                                                        <td style={{ padding: '6px 8px', color: '#10b981', fontWeight: 'bold' }}>{y.toFixed(4)}</td>
                                                        <td style={{ padding: '6px 8px' }}>{liqFlow.toFixed(0)}</td>
                                                        <td style={{ padding: '6px 8px' }}>{vapFlow.toFixed(0)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td style={{ padding: '6px 8px' }}><strong>SUMA / TOTAL</strong></td>
                                                <td style={{ padding: '6px 8px' }}>
                                                    <strong>{components.reduce((s, c) => s + c.z, 0).toFixed(4)}</strong>
                                                </td>
                                                <td style={{ padding: '6px 8px' }}>-</td>
                                                <td style={{ padding: '6px 8px' }}>
                                                    <strong>{results.xValues.reduce((s, v) => s + v, 0).toFixed(4)}</strong>
                                                </td>
                                                <td style={{ padding: '6px 8px' }}>
                                                    <strong>{results.yValues.reduce((s, v) => s + v, 0).toFixed(4)}</strong>
                                                </td>
                                                <td style={{ padding: '6px 8px' }}>
                                                    <strong>{((1.0 - results.vf) * feedFlow).toFixed(0)}</strong>
                                                </td>
                                                <td style={{ padding: '6px 8px' }}>
                                                    <strong>{(results.vf * feedFlow).toFixed(0)}</strong>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Iteration history showing Newton-Raphson convergence */}
                            <div className="results-table-section" style={{ padding: '14px', gap: '8px' }}>
                                <h3 style={{ fontSize: '0.85rem', borderLeftColor: '#f97316' }}>Historial del Resolvedor Rachford-Rice</h3>
                                <p style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                                    Paso a paso de la convergencia numérica de Newton-Raphson para V/F.
                                </p>
                                <div className="table-container">
                                    <table className="data-table" style={{ fontSize: '0.74rem' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '4px 6px' }}>Iteración</th>
                                                <th style={{ padding: '4px 6px' }}>Estimado V/F</th>
                                                <th style={{ padding: '4px 6px' }}>Función R(V/F)</th>
                                                <th style={{ padding: '4px 6px' }}>Derivada R'(V/F)</th>
                                                <th style={{ padding: '4px 6px' }}>Nota / Detalle</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.iterations.map((step, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ padding: '4px 6px' }}>{step.iter}</td>
                                                    <td style={{ padding: '4px 6px', fontWeight: 'bold' }}>{step.vf.toFixed(4)}</td>
                                                    <td style={{ padding: '4px 6px', color: Math.abs(step.r) < tolerance ? '#10b981' : '#f97316' }}>
                                                        {step.r.toExponential(4)}
                                                    </td>
                                                    <td style={{ padding: '4px 6px' }}>{step.rPrime.toFixed(4)}</td>
                                                    <td style={{ padding: '4px 6px', color: '#9ca3af' }}>{step.note}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}
