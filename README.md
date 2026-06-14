# Manual de Usuario: Simulador de Evaporador Flash Multicomponente

¡Bienvenido al **Simulador de Evaporador Flash Multicomponente**! Esta aplicación web interactiva está diseñada para modelar, calcular y visualizar el equilibrio físico líquido-vapor de mezclas complejas que se vaporizan instantáneamente por reducción de presión (isoterma).

---

## 1. ¿Qué es este Simulador y para qué sirve?

El simulador permite evaluar el comportamiento de mezclas en una **cámara flash (o evaporador instantáneo)**. 

### ¿Cómo funciona el proceso físico?
Una mezcla multicomponente líquida caliente se expande a través de una válvula de estrangulamiento al entrar a una cámara de separación que opera a menor presión. Al descender bruscamente la presión, la mezcla se separa espontáneamente en dos fases en equilibrio térmico y mecánico:
1. **Fase Vapor (Tope)**: Enriquecida en los componentes más volátiles (los que hierven a menor temperatura, como el propano).
2. **Fase Líquida (Fondo)**: Enriquecida en los componentes pesados o menos volátiles (como el n-hexano).

El simulador resuelve matemáticamente las ecuaciones de equilibrio de fase en tiempo real, calculando la **fracción vaporizada (V/F)** mediante el método de Newton-Raphson, los flujos resultantes de líquido y vapor (L y V) y sus composiciones molares exactas.

---

## 2. Guía de Interfaz y Variables

La interfaz se divide en dos secciones principales en un tema oscuro industrial premium:

### A. Panel de Control (Izquierda)
* **Temperatura de la Cámara (T)**: Controla la temperatura de operación de la cámara (rango: 0 °C a 150 °C). Modificarla recalcula las presiones de saturación y las constantes K.
* **Presión de la Cámara (P)**: Controla la presión de operación de la cámara (rango: 50 kPa a 1000 kPa).
* **Flujo de Alimentación (F)**: Regula la corriente molar total de entrada (rango: 100 kgmol/h a 5000 kgmol/h).
* **Selector de Modo K (K Manual vs. Antoine)**:
  * **K Manual**: Permite editar manualmente los valores K_i en la tabla para resolver problemas de libros de texto (por ejemplo, el **Ejemplo 2-2** con K_propano = 7.0, K_butano = 2.4, etc.).
  * **Antoine (Auto)**: Calcula dinámicamente las constantes K en función de T y P usando la ecuación de Antoine para hidrocarburos.

### B. Panel de Resultados (Derecha)
* **Diagrama SVG de la Cámara**:
  * **Válvula y Manómetro**: Representan la entrada del flujo a la cámara.
  * **Cono de Aspersión (Mist Spray)**: Simula la atomización del fluido al expandirse.
  * **Gotas y Burbujas**: Animaciones en tiempo real proporcionales a las corrientes calculadas de vapor y líquido.
  * **Nivel de Líquido (Sight Glass)**: Columna transparente lateral que muestra el volumen de líquido acumulado en el fondo.
  * **Instrumentos Analógicos**: Relojes dinámicos que marcan la Presión (kPa) y Temperatura (°C) del tanque.
* **Tarjetas de Métricas**: Muestran la fracción V/F (%), flujos de vapor (V) y líquido (L) en kgmol/h, y la carga térmica del proceso en Mcal/h.
* **Gráfico Comparativo**: Gráfico de barras que contrasta las composiciones z (alimentación) frente a x (líquido de fondo) e y (vapor de tope).

---

## 3. Instrucciones de Operación Paso a Paso

### Paso 1: Configurar los Componentes de la Mezcla
1. **Modificación Manual**: Modifique las celdas de la tabla para cambiar los nombres de las sustancias, sus composiciones de alimentación z, coeficientes Antoine o valores K.
2. **Carga desde Plantilla**: Descargue el archivo de ejemplo haciendo clic en el botón **"Plantilla"** en la barra de carga. Puede usar ese archivo como base, modificar sus valores en Excel e importarlo arrastrándolo al recuadro o haciendo clic en **"Cargar"** para rellenar la mezcla automáticamente.
3. **Suma de Alimentaciones**: Las fracciones molar z de alimentación deben sumar exactamente 1.0. Si no suman 1.0, el simulador muestra un aviso naranja y permite hacer clic en el botón **"Normalizar"** para ajustarlas proporcionalmente en un clic.

### Paso 2: Operar la Simulación
* Ajuste las barras de Temperatura, Presión y Alimentación para observar la respuesta del sistema.
* En la parte inferior de la columna de resultados, puede inspeccionar el **Historial del Resolvedor Rachford-Rice**, que muestra paso a paso cómo converge el método numérico de Newton-Raphson.

### Paso 3: Exportar Reportes de Ingeniería
* Presione los botones de descarga **"Excel"** o **"CSV"** para obtener la hoja de especificaciones completa. El reporte incluye:
  * **Resumen global**: Presión, temperatura, flujos globales de alimentación, vapor y líquido, y carga térmica.
  * **Resultados detallados**: Componente, composición de entrada (z), flujo de entrada individual (kgmol/h), constante K, fracciones de equilibrio (x, y), flujos de salida en equilibrio (L_i, V_i), Cp, entalpía de vaporización y coeficientes de Antoine.

