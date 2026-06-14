# Documentación Técnica: Simulador de Evaporador Flash Multicomponente

Esta documentación detalla los fundamentos fisicoquímicos, el funcionamiento del resolvedor numérico y la arquitectura de software del simulador interactivo de evaporación flash isotérmica.

---

## 1. Fundamentos Termodinámicos y Matemáticos

El simulador resuelve el equilibrio líquido-vapor de una mezcla multicomponente que se somete a una expansión instantánea a temperatura (T) y presión (P) constantes dentro de una cámara flash.

### A. Ecuación de Rachford-Rice
Para hallar la fracción molar vaporizada (V/F, denotada como vf), se resuelve la ecuación de Rachford-Rice:

```
R(vf) = Suma_i [ (K_i - 1) * z_i / (1 + vf * (K_i - 1)) ] = 0
```

Donde:
* **z_i**: Fracción molar del componente *i* en la corriente de alimentación.
* **vf**: Fracción molar vaporizada del sistema (V/F), valor entre 0 y 1.
* **K_i**: Constante de equilibrio líquido-vapor del componente *i* a la T y P del tanque.

### B. Cálculo de la Constante K_i (Ecuación de Antoine vs. Manual)
1. **Modo Manual**: El usuario ingresa directamente los valores de K_i (por ejemplo, para reproducir el Ejemplo 2-2 del libro de texto donde K_propano = 7.0, K_butano = 2.4, K_pentano = 0.8, K_hexano = 0.3).
2. **Modo Automático**: Las constantes se calculan a partir de la presión de vapor saturado (P_sat_i) utilizando la ecuación empírica de Antoine:

```
log10(P_sat_i [mmHg]) = A_i - B_i / (T [°C] + C_i)
```

La presión calculada en mmHg se convierte a kPa mediante la relación:
```
P_sat_i [kPa] = P_sat_i [mmHg] * 0.1333224
```
Finalmente:
```
K_i = P_sat_i [kPa] / P [kPa]
```

### C. Fase Líquida (x_i) y Fase Vapor (y_i)
Una vez hallado el valor de vf que cumple R(vf) = 0:
* Fracción molar en el líquido: **x_i = z_i / (1 + vf * (K_i - 1))**
* Fracción molar en el vapor: **y_i = K_i * x_i**

---

## 2. Resolvedor de Newton-Raphson de Rachford-Rice

El resolvedor matemático reside en la función `runSimulation` en [App.jsx](./src/App.jsx) y cuenta con protección ante desbordamientos.

### A. Verificación de Regiones de Fase Única (Fases Monofásicas)
Antes de iterar numéricamente, se evalúan los límites físicos:
* **Límite de Burbuja**: Se calcula R(0) = Suma_i [ z_i * (K_i - 1) ]. Si R(0) <= 0, el sistema está por debajo de su punto de burbuja (líquido subenfriado). El solucionador establece de inmediato vf = 0 sin iterar.
* **Límite de Rocío**: Se calcula R(1) = 1 - Suma_i [ z_i / K_i ]. Si R(1) >= 0, el sistema está por encima de su punto de rocío (vapor sobrecalentado). El solucionador establece de inmediato vf = 1 sin iterar.

### B. Iteraciones con Bisección de Salvaguarda
Si R(0) > 0 y R(1) < 0, existe una raíz única en el intervalo (0, 1). Se aplica el método de Newton-Raphson:
1. **Derivada Analítica (Jacobiano)**:
   ```
   R'(vf) = - Suma_i [ (K_i - 1)^2 * z_i / (1 + vf * (K_i - 1))^2 ]
   ```
2. **Actualización**:
   ```
   vf_(k+1) = vf_k - R(vf_k) / R'(vf_k)
   ```
3. **Salvaguarda de Bisección**: Si el valor resultante vf_(k+1) sale de los límites físicos (menor que el límite inferior acotado o mayor que el superior), se realiza un paso de bisección: `vf_(k+1) = (limite_inferior + limite_superior) / 2.0`.
4. **Actualización de Intervalos**: Según el signo de R(vf_k), se actualiza el límite inferior (si R > 0) o el límite superior (si R < 0) para estrechar el intervalo del paso de bisección.

El algoritmo converge típicamente en menos de 6 iteraciones con una tolerancia de 10⁻⁷.

---

## 3. Arquitectura del Software y Componentes

La aplicación está diseñada bajo una estructura modular de componentes React.

* **[App.jsx](./src/App.jsx)**: Orquestador principal. Almacena las variables de estado global (T, P, F, componentes de la mezcla, parámetros del solucionador) y ejecuta el motor matemático mediante un gancho `useEffect`. Maneja la exportación a Excel (usando SheetJS) y CSV.
* **[ProcessDiagram.jsx](./src/components/ProcessDiagram.jsx)**: Renderiza la cámara de evaporación SVG. Integra animaciones dinámicas (gotas cayendo, burbujas subiendo, boquilla de aspersión) y diales analógicos funcionales que rotan sus agujas según los valores calculados de T y P.
* **[ComponentTable.jsx](./src/components/ComponentTable.jsx)**: Grilla interactiva para editar componentes. Detecta desbalanceos en las fracciones molar y permite normalizarlas con un botón.
* **[MetricsGrid.jsx](./src/components/MetricsGrid.jsx)**: Tarjetas indicadoras de flujos másicos (V y L en kgmol/h) y de la carga térmica estimativa de la cámara en Mcal/h.
* **[CompositionChart.jsx](./src/components/CompositionChart.jsx)**: Gráfico de barras de Chart.js que compara las composiciones de entrada (z), líquido de fondo (x) y vapor destilado (y) para cada sustancia.
* **[FileUploader.jsx](./src/components/FileUploader.jsx)**: Módulo de carga de archivos CSV/Excel con mapeo tolerante a variaciones en nombres de columnas.
