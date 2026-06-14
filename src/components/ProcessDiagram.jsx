import React from 'react';
import { motion } from 'framer-motion';

export default function ProcessDiagram({ 
    vf, 
    T_flash, 
    pressure, 
    feed, 
    components, 
    xValues = [], 
    yValues = [] 
}) {
    // Velocidades de flujo proporcionales
    const liquidSpeed = Math.max(0.25, (1.0 - vf) * 2.5);
    const vaporSpeed = Math.max(0.25, vf * 2.5);
    const feedSpeed = 1.5;

    // Altura del líquido en el tambor (y va desde 115 hasta 325, altura 210px)
    const windowMinY = 115;
    const windowMaxY = 325;
    const windowHeight = windowMaxY - windowMinY;
    const liquidHeight = (1.0 - vf) * windowHeight;
    const liquidTopY = windowMaxY - liquidHeight;

    // Presión: rango 50 kPa a 1000 kPa
    const pPercent = Math.min(1.0, Math.max(0.0, (pressure - 50) / 950));
    const pAngle = -180 + pPercent * 180;

    // Temperatura: rango 0°C a 150°C
    const tPercent = Math.min(1.0, Math.max(0.0, (T_flash - 0) / 150));
    const tAngle = -180 + tPercent * 180;

    // Componente principal para mostrar resumen si es necesario, o listar todo
    const comp0 = components[0] || { Componente: 'C1', z: 0 };
    const comp1 = components[1] || { Componente: 'C2', z: 0 };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>Diagrama de Operación de la Cámara Flash</h3>
                <span style={styles.subtitle}>Comportamiento de fases y variables de proceso en tiempo real</span>
            </div>
            
            <div style={styles.diagramWrapper}>
                <svg viewBox="0 0 760 460" width="100%" height="100%" style={styles.svg}>
                    <defs>
                        {/* Degradados metálicos y de fluidos */}
                        <linearGradient id="metalVessel" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#1e293b" />
                            <stop offset="30%" stopColor="#475569" />
                            <stop offset="50%" stopColor="#64748b" />
                            <stop offset="70%" stopColor="#475569" />
                            <stop offset="100%" stopColor="#1e293b" />
                        </linearGradient>

                        <linearGradient id="metalLeg" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#0f172a" />
                            <stop offset="50%" stopColor="#334155" />
                            <stop offset="100%" stopColor="#0f172a" />
                        </linearGradient>

                        <linearGradient id="innerGlass" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#020617" />
                            <stop offset="15%" stopColor="#0f172a" />
                            <stop offset="85%" stopColor="#0f172a" />
                            <stop offset="100%" stopColor="#020617" />
                        </linearGradient>

                        <linearGradient id="pipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#475569" />
                            <stop offset="50%" stopColor="#94a3b8" />
                            <stop offset="100%" stopColor="#334155" />
                        </linearGradient>

                        <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.85" />
                        </linearGradient>

                        <linearGradient id="sprayMist" x1="0%" y1="50%" x2="100%" y2="50%">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                            <stop offset="60%" stopColor="#0891b2" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                        </linearGradient>

                        <linearGradient id="feedFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>

                        <linearGradient id="vaporFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>

                        <linearGradient id="liquidFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#0891b2" />
                        </linearGradient>

                        <radialGradient id="vaporMistCloud" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </radialGradient>

                        <pattern id="demisterMesh" width="6" height="6" patternUnits="userSpaceOnUse">
                            <path d="M 0 3 L 6 3 M 3 0 L 3 6 M 0 0 L 6 6" stroke="rgba(255,255,255,0.25)" strokeWidth="0.75" />
                        </pattern>

                        <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* SOPORTES ESTRUCTURALES DEL TAMBOR */}
                    <rect x="335" y="340" width="12" height="55" fill="url(#metalLeg)" stroke="#0f172a" />
                    <rect x="393" y="340" width="12" height="55" fill="url(#metalLeg)" stroke="#0f172a" />
                    <rect x="310" y="390" width="120" height="12" fill="#334155" rx="3" stroke="#1e293b" />

                    {/* CUERPO PRINCIPAL DEL VESSEL (Cámara Flash Cilíndrica) */}
                    <path d="M 320 70 C 320 30, 420 30, 420 70 L 420 340 C 420 380, 320 380, 320 340 Z" fill="url(#metalVessel)" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />

                    {/* TUBERÍAS DE PROCESO (Alto contraste y animación de flujos) */}
                    {/* Tubería Alimentación (Izquierda) */}
                    <path d="M 20 220 L 320 220" stroke="#475569" strokeWidth="15" fill="none" />
                    <path d="M 20 220 L 320 220" stroke="url(#feedFlow)" strokeWidth="9" strokeDasharray="8,8" fill="none">
                        <animate attributeName="stroke-dashoffset" values="32;0" dur={`${1.2 / feedSpeed}s`} repeatCount="indefinite" />
                    </path>
                    
                    {/* Tubería Vapor (Tope) */}
                    <path d="M 370 45 L 370 18 L 740 18" stroke="#475569" strokeWidth="15" fill="none" />
                    <path d="M 370 45 L 370 18 L 740 18" stroke="url(#vaporFlow)" strokeWidth="9" strokeDasharray="8,8" fill="none">
                        <animate attributeName="stroke-dashoffset" values="32;0" dur={`${1.2 / vaporSpeed}s`} repeatCount="indefinite" />
                    </path>

                    {/* Tubería Líquido (Fondo) */}
                    <path d="M 370 355 L 370 410 L 740 410" stroke="#475569" strokeWidth="15" fill="none" />
                    <path d="M 370 355 L 370 410 L 740 410" stroke="url(#liquidFlow)" strokeWidth="9" strokeDasharray="8,8" fill="none">
                        <animate attributeName="stroke-dashoffset" values="0;32" dur={`${1.2 / liquidSpeed}s`} repeatCount="indefinite" />
                    </path>

                    {/* BRIDAS Y CONEXIONES (Flanges) */}
                    <rect x="312" y="210" width="8" height="20" fill="#4b5563" stroke="#0f172a" />
                    <rect x="355" y="42" width="30" height="6" fill="#4b5563" stroke="#0f172a" />
                    <rect x="355" y="352" width="30" height="6" fill="#4b5563" stroke="#0f172a" />

                    {/* VÁLVULA DE ESTRANGULAMIENTO DE ALIMENTACIÓN (Flash Throttle Valve) */}
                    <g transform="translate(140, 202)">
                        <polygon points="0,0 0,36 30,18" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
                        <polygon points="30,0 30,36 0,18" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
                        <rect x="12" y="-10" width="6" height="15" fill="#475569" />
                        <circle cx="15" cy="-10" r="10" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
                        <text x="15" y="-7" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">VLV</text>
                    </g>

                    {/* VENTANA VISORA INTERNA DEL TAMBOR */}
                    <rect x="340" y="110" width="60" height="220" rx="30" fill="url(#innerGlass)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

                    {/* FILTRO DEMISTER (Eliminador de Neblina superior) */}
                    <rect x="341" y="125" width="58" height="20" fill="url(#demisterMesh)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

                    {/* LIQUIDO INTERNO CON OLEAJE ANIMADO */}
                    {vf < 1.0 && (
                        <g>
                            <path d={`
                                M 341 ${liquidTopY} 
                                Q 356 ${liquidTopY - 3}, 370 ${liquidTopY} 
                                T 399 ${liquidTopY} 
                                L 399 320 
                                C 399 323, 341 323, 341 320 
                                Z
                            `} fill="url(#liquidGrad)" stroke="#06b6d4" strokeWidth="1" opacity="0.85">
                                <animate 
                                    attributeName="d" 
                                    dur="2.5s" 
                                    repeatCount="indefinite"
                                    values={`
                                        M 341 ${liquidTopY} Q 356 ${liquidTopY - 4}, 370 ${liquidTopY} T 399 ${liquidTopY} L 399 320 L 341 320 Z;
                                        M 341 ${liquidTopY} Q 356 ${liquidTopY + 4}, 370 ${liquidTopY - 2} T 399 ${liquidTopY} L 399 320 L 341 320 Z;
                                        M 341 ${liquidTopY} Q 356 ${liquidTopY - 4}, 370 ${liquidTopY} T 399 ${liquidTopY} L 399 320 L 341 320 Z
                                    `} 
                                />
                            </path>
                            <path d={`M 341 ${liquidTopY} Q 356 ${liquidTopY - 4}, 370 ${liquidTopY} T 399 ${liquidTopY}`} fill="none" stroke="#22d3ee" strokeWidth="2" opacity="0.6">
                                <animate 
                                    attributeName="d" 
                                    dur="2.5s" 
                                    repeatCount="indefinite"
                                    values={`
                                        M 341 ${liquidTopY} Q 356 ${liquidTopY - 4}, 370 ${liquidTopY} T 399 ${liquidTopY};
                                        M 341 ${liquidTopY} Q 356 ${liquidTopY + 4}, 370 ${liquidTopY - 2} T 399 ${liquidTopY};
                                        M 341 ${liquidTopY} Q 356 ${liquidTopY - 4}, 370 ${liquidTopY}
                                    `} 
                                />
                            </path>
                        </g>
                    )}

                    {/* DEFLECTOR DE ENTRADA INDUSTRIAL (Baffle Plate) */}
                    <path d="M 358 200 L 358 240" stroke="#9ca3af" strokeWidth="3.5" strokeLinecap="round" />

                    {/* BOQUILLA DE PULVERIZACIÓN (Inlet Spray Nozzle) */}
                    <path d="M 320 220 L 348 220" stroke="#6b7280" strokeWidth="4" />
                    <path d="M 348 214 L 353 210 L 353 230 L 348 226 Z" fill="#4b5563" />

                    {/* CONO DE PULVERIZACIÓN ATOMIZADO (Spray Cone) */}
                    {vf > 0 && (
                        <path d="M 353 220 L 378 190 L 378 250 Z" fill="url(#sprayMist)" opacity="0.45">
                            <animate attributeName="opacity" values="0.15;0.6;0.15" dur="0.8s" repeatCount="indefinite" />
                        </path>
                    )}

                    {/* GOTAS DE LÍQUIDO CONDENSADO CAYENDO */}
                    {vf < 1.0 && vf > 0 && [...Array(5)].map((_, i) => (
                        <circle
                            key={`drop-${i}`}
                            cx={358 + (i % 2 === 0 ? 6 : -6) + (i % 3) * 2}
                            cy="225"
                            r="1.8"
                            fill="#22d3ee"
                        >
                            <animate 
                                attributeName="cy" 
                                values={`225;${windowMaxY - 10}`} 
                                dur={`${0.85 / liquidSpeed}s`} 
                                begin={`${i * 0.18}s`} 
                                repeatCount="indefinite" 
                            />
                            <animate 
                                attributeName="opacity" 
                                values="1;1;0" 
                                dur={`${0.85 / liquidSpeed}s`} 
                                begin={`${i * 0.18}s`} 
                                repeatCount="indefinite" 
                            />
                        </circle>
                    ))}

                    {/* BURBUJAS DE VAPOR ASCENDIENDO */}
                    {vf > 0 && [...Array(6)].map((_, i) => (
                        <circle
                            key={`bubble-${i}`}
                            cx={348 + i * 8}
                            cy="310"
                            r={1.2 + (i % 2) * 0.8}
                            fill="#10b981"
                            opacity="0"
                        >
                            <animate 
                                attributeName="cy" 
                                values="310;145" 
                                dur={`${1.5 / vaporSpeed}s`} 
                                begin={`${i * 0.25}s`} 
                                repeatCount="indefinite" 
                            />
                            <animate 
                                attributeName="opacity" 
                                values="0;0.8;0.8;0" 
                                dur={`${1.5 / vaporSpeed}s`} 
                                begin={`${i * 0.25}s`} 
                                repeatCount="indefinite" 
                            />
                            <animate 
                                attributeName="cx" 
                                values={`${348 + i * 8};${348 + i * 8 + (i % 2 === 0 ? 5 : -5)};${348 + i * 8}`} 
                                dur={`${1.5 / vaporSpeed}s`} 
                                begin={`${i * 0.25}s`} 
                                repeatCount="indefinite" 
                            />
                        </circle>
                    ))}

                    {/* EFECTO DE NEBLINA DE VAPOR EN LA MITAD SUPERIOR */}
                    {vf > 0 && (
                        <rect x="341" y="145" width="58" height="60" fill="url(#vaporMistCloud)" opacity="0.25">
                            <animate attributeName="opacity" values="0.1;0.4;0.1" dur="3s" repeatCount="indefinite" />
                        </rect>
                    )}

                    {/* BURBUJEO DE AGITACIÓN TÉRMICA EN LA FASE LÍQUIDA */}
                    {vf < 1.0 && [...Array(4)].map((_, i) => (
                        <circle
                            key={`liq-bub-${i}`}
                            cx={350 + i * 12}
                            cy={windowMaxY - 10}
                            r="1.2"
                            fill="rgba(255, 255, 255, 0.45)"
                        >
                            <animate 
                                attributeName="cy" 
                                values={`${windowMaxY - 5};${liquidTopY + 5}`} 
                                dur="1.2s" 
                                begin={`${i * 0.3}s`} 
                                repeatCount="indefinite" 
                            />
                            <animate 
                                attributeName="opacity" 
                                values="0;0.9;0" 
                                dur="1.2s" 
                                begin={`${i * 0.3}s`} 
                                repeatCount="indefinite" 
                            />
                        </circle>
                    ))}

                    {/* INDICADOR DE VIDRIO DE NIVEL EXTERNO (Sight Level Glass) */}
                    {/* Conectores */}
                    <line x1="395" y1="160" x2="435" y2="160" stroke="#374151" strokeWidth="2.5" />
                    <line x1="395" y1="290" x2="435" y2="290" stroke="#374151" strokeWidth="2.5" />
                    {/* Carcasa del visor */}
                    <rect x="435" y="140" width="8" height="170" rx="3" fill="rgba(15, 23, 42, 0.9)" stroke="#4b5563" strokeWidth="1.2" />
                    {/* Columna de fluido proporcional al nivel */}
                    {vf < 1.0 && (
                        <rect x="436" y={Math.max(143, windowMaxY - ((1.0 - vf) * 160) - 30)} width="6" height={Math.min(164, (1.0 - vf) * 164)} fill="url(#liquidFlow)" rx="1" opacity="0.9" />
                    )}

                    {/* PANEL DE CONTROL DE INSTRUMENTACIÓN */}
                    <g>
                        {/* Soportes de montaje al tanque */}
                        <rect x="337" y="82" width="6" height="14" fill="#475569" stroke="#1f2937" strokeWidth="0.5" />
                        <rect x="397" y="82" width="6" height="14" fill="#475569" stroke="#1f2937" strokeWidth="0.5" />
                        
                        {/* Caja del panel */}
                        <rect x="290" y="32" width="160" height="60" rx="5" fill="url(#metalVessel)" stroke="#4b5563" strokeWidth="1.5" />
                        <rect x="293" y="35" width="154" height="54" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    </g>

                    {/* MANÓMETROS E INSTRUMENTOS DE DIAL (Aumentados de tamaño para visibilidad) */}
                    {/* Dial de Presión */}
                    <g transform="translate(325, 71)">
                        <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#9ca3af" strokeWidth="1.2" />
                        <path d="M -8 0 L -5 0 M 0 -8 L 0 -5 M 8 0 L 5 0" stroke="#4b5563" strokeWidth="1" />
                        {/* Aguja giratoria */}
                        <g transform={`rotate(${pAngle})`}>
                            <line x1="0" y1="0" x2="11" y2="0" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="0" cy="0" r="2" fill="#ef4444" />
                        </g>
                    </g>

                    {/* Dial de Temperatura */}
                    <g transform="translate(415, 71)">
                        <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#9ca3af" strokeWidth="1.2" />
                        <path d="M -8 0 L -5 0 M 0 -8 L 0 -5 M 8 0 L 5 0" stroke="#4b5563" strokeWidth="1" />
                        {/* Aguja giratoria */}
                        <g transform={`rotate(${tAngle})`}>
                            <line x1="0" y1="0" x2="11" y2="0" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="0" cy="0" r="2" fill="#ef4444" />
                        </g>
                    </g>

                    {/* LECTURAS DIGITALES ADYACENTES (Aumentadas de tamaño considerablemente) */}
                    <g transform="translate(325, 48)">
                        <rect x="-30" y="-10" width="60" height="18" rx="3" fill="rgba(15, 23, 42, 0.95)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="0.75" />
                        <text x="0" y="3" fill="#06b6d4" fontSize="11" fontFamily="Outfit" fontWeight="bold" textAnchor="middle">{pressure.toFixed(1)} kPa</text>
                    </g>
                    <g transform="translate(415, 48)">
                        <rect x="-30" y="-10" width="60" height="18" rx="3" fill="rgba(15, 23, 42, 0.95)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="0.75" />
                        <text x="0" y="3" fill="#f43f5e" fontSize="11" fontFamily="Outfit" fontWeight="bold" textAnchor="middle">{T_flash.toFixed(1)} °C</text>
                    </g>

                    {/* ETIQUETAS DE CORRIENTES - REDISEÑADAS PARA EVITAR SOLAPAMIENTOS */}
                    {/* Corriente de Alimentación (F) - Izquierda abajo */}
                    <foreignObject x="15" y="255" width="200" height="120">
                        <div style={styles.badgeFeed}>
                            <div style={styles.badgeTitleFeed}>Alimentación (F)</div>
                            <div style={styles.badgeRow}>
                                Flujo: <strong>{feed.toFixed(0)} kgmol/h</strong>
                            </div>
                            <div style={styles.badgeRow}>
                                z ({comp0.Componente}): <motion.strong key={comp0.z} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.3 }}>{comp0.z.toFixed(3)}</motion.strong>
                            </div>
                            <div style={styles.badgeRow}>
                                z ({comp1.Componente}): <motion.strong key={comp1.z} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.3 }}>{comp1.z.toFixed(3)}</motion.strong>
                            </div>
                        </div>
                    </foreignObject>

                    {/* Corriente de Vapor (V) - Derecha arriba */}
                    <foreignObject x="530" y="25" width="210" height="120">
                        <div style={styles.badgeVapor}>
                            <div style={styles.badgeTitleVapor}>Vapor (V)</div>
                            <div style={styles.badgeRow}>
                                Flujo: <strong>{(vf * feed).toFixed(0)} kgmol/h</strong>
                            </div>
                            <div style={styles.badgeRow}>
                                y ({comp0.Componente}): <motion.strong key={yValues[0]} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.3 }}>{(yValues[0] || 0).toFixed(3)}</motion.strong>
                            </div>
                            <div style={styles.badgeRow}>
                                y ({comp1.Componente}): <motion.strong key={yValues[1]} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.3 }}>{(yValues[1] || 0).toFixed(3)}</motion.strong>
                            </div>
                        </div>
                    </foreignObject>

                    {/* Corriente de Líquido (L) - Derecha abajo */}
                    <foreignObject x="530" y="315" width="210" height="120">
                        <div style={styles.badgeLiquid}>
                            <div style={styles.badgeTitleLiquid}>Líquido (L)</div>
                            <div style={styles.badgeRow}>
                                Flujo: <strong>{((1.0 - vf) * feed).toFixed(0)} kgmol/h</strong>
                            </div>
                            <div style={styles.badgeRow}>
                                x ({comp0.Componente}): <motion.strong key={xValues[0]} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.3 }}>{(xValues[0] || 0).toFixed(3)}</motion.strong>
                            </div>
                            <div style={styles.badgeRow}>
                                x ({comp1.Componente}): <motion.strong key={xValues[1]} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.3 }}>{(xValues[1] || 0).toFixed(3)}</motion.strong>
                            </div>
                        </div>
                    </foreignObject>
                </svg>
            </div>
        </div>
    );
}

const styles = {
    container: {
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.03)',
        padding: '16px',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
    },
    header: {
        borderLeft: '3px solid #06b6d4',
        paddingLeft: '10px',
        marginBottom: '2px',
    },
    title: {
        fontFamily: "'Outfit', sans-serif",
        fontSize: '0.9rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: '#f3f4f6',
    },
    subtitle: {
        fontSize: '0.7rem',
        color: '#9ca3af',
        display: 'block',
        marginTop: '1px',
    },
    diagramWrapper: {
        position: 'relative',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.25)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.03)',
        padding: '8px',
    },
    svg: {
        background: 'rgba(10, 15, 25, 0.4)',
        borderRadius: '8px',
        maxHeight: '420px',
    },
    badgeFeed: {
        background: 'rgba(10, 15, 25, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderLeft: '4px solid #3b82f6',
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '0.82rem',
        color: '#f3f4f6',
        boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
    },
    badgeTitleFeed: {
        fontWeight: 700,
        color: '#3b82f6',
        fontSize: '0.88rem',
        marginBottom: '4px',
    },
    badgeVapor: {
        background: 'rgba(10, 15, 25, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderLeft: '4px solid #10b981',
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '0.82rem',
        color: '#f3f4f6',
        boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
    },
    badgeTitleVapor: {
        fontWeight: 700,
        color: '#10b981',
        fontSize: '0.88rem',
        marginBottom: '4px',
    },
    badgeLiquid: {
        background: 'rgba(10, 15, 25, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderLeft: '4px solid #06b6d4',
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '0.82rem',
        color: '#f3f4f6',
        boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
    },
    badgeTitleLiquid: {
        fontWeight: 700,
        color: '#06b6d4',
        fontSize: '0.88rem',
        marginBottom: '4px',
    },
    badgeRow: {
        marginTop: '3px',
        color: '#e5e7eb',
    }
};
