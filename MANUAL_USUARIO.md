# 📖 Manual de Usuario - Control de Gastos

Guía completa para usar la aplicación de Control de Gastos.

---

## 📋 Tabla de Contenidos

1. [Primeros Pasos](#1-primeros-pasos)
2. [Panel](#2-panel)
3. [Gastos](#3-gastos)
4. [Presupuestos](#4-presupuestos)
5. [Análisis](#5-análisis)
6. [Gastos hormiga](#6-gastos-hormiga)
7. [Notificaciones](#7-notificaciones)
8. [Ayuda](#8-ayuda)
9. [Configuración](#9-configuración)
10. [Preguntas Frecuentes](#10-preguntas-frecuentes)

---

## 1. Primeros Pasos

### 1.1 Crear una Cuenta

1. Ve a la página de registro
2. Completa los datos:
   - **Usuario**: Tu nombre de usuario único
   - **Email**: Tu correo electrónico
   - **Contraseña**: Mínimo 8 caracteres
3. Haz clic en **"Crear cuenta"**

### 1.2 Iniciar Sesión

Tienes tres opciones:

**Opción A: Con usuario o email y contraseña**
1. Escribe tu **usuario o tu email** y tu contraseña
2. Haz clic en **"Entrar"**

**Opción B: Google**
1. Haz clic en **"Google"**
2. Selecciona tu cuenta de Google
3. Confirma los permisos

**Opción C: Microsoft**
1. Haz clic en **"Microsoft"**
2. Ingresa tu correo de Microsoft
3. Confirma los permisos

> Si tu cuenta se creó con Google o Microsoft no tiene contraseña: entra siempre con ese botón.

### 1.3 Tus primeros pasos con el asistente

Al entrar por primera vez, el Panel muestra la tarjeta **"Te ayudo a dejar tus datos listos"**. Te acompaña en cuatro pasos, uno por vez:

| Paso | Qué haces |
|------|-----------|
| **Tu moneda** | Eliges la moneda en la que llevas tus gastos. Casi siempre se detecta sola; si falta, aquí la eliges |
| **Tu saldo del mes** | Escribes cuánto quieres gastar como máximo este mes |
| **Tu primer gasto** | Registras una compra de hoy, aunque sea chica |
| **Un presupuesto** | Le pones un tope a una categoría, por ejemplo Alimentación |

Cada paso tiene un botón que te lleva al lugar correcto. La tarjeta avanza sola cuando el dato aparece y desaparece al completarse. Puedes ocultarla con la **✕** cuando quieras. El asistente solo lee lo que ya cargaste: nunca cambia nada por su cuenta.

---

## 2. Panel

El Panel es tu pantalla principal. A la izquierda ves el resumen de tus finanzas y a la derecha, en la columna lateral, registras gastos. En el móvil todo se apila en una sola columna.

### 2.1 Barra superior y navegación

- **Cinta**: la franja de arriba repite datos clave (gastos registrados, total, categoría principal y fecha). En *Gastos hormiga* muestra el resumen de esa sección.
- **Navegación**: Panel, Gastos, Presupuestos, Analíticas y Gastos hormiga.
- **Ayuda (?)**: abre el chat de ayuda (ver [8](#8-ayuda)).
- **Campana**: tus avisos (ver [7](#7-notificaciones)).
- **Tema**: el selector **Oscuro / Claro** (ver [9.1](#91-modo-clarooscuro)).
- **Cuenta**: tu avatar y tu usuario, y **Salir**. En el móvil, toca el avatar para abrir el menú de cuenta.
- **En el móvil**: la navegación pasa a una **barra de pestañas flotante abajo**, con icono y nombre de cada sección, y la activa resaltada.
- **Saltar al contenido**: si navegas con teclado, la primera tecla Tab muestra un enlace para ir directo al contenido.

### 2.2 Resumen del mes

La tarjeta **"Este mes"** muestra lo gastado en el mes actual y, a la derecha, el **gasto diario**: una barra por día, con el día de hoy en el color de acento.

Justo debajo está el **semáforo del saldo**: un estado, una barra de avance y el texto «Gastado $X de $Y. Te quedan $Z.».

- **Verde, «dentro del saldo»:** has gastado menos del 80 % del saldo.
- **Ámbar, «cerca del límite»:** ya llevas el 80 % o más.
- **Rojo, «saldo superado»:** gastaste más que el saldo del mes.

El saldo se cambia en el campo **«Saldo del mes»** (por defecto $300.000). Se guarda en este navegador: en otro dispositivo habrá que volver a escribirlo.

> **Importes y centavos**: todos los importes de la app salen en la **moneda de tu perfil** y muestran centavos solo cuando los hay ($125,50, pero $3.000 si es redondo). Si escaneas un recibo de $125,50 se conserva exacto.

Debajo hay cuatro indicadores:

| Indicador | Qué muestra |
|-----------|-------------|
| **Promedio** | Gasto promedio por transacción |
| **Top categoría** | La categoría donde más gastaste y su monto |
| **Transacciones** | Cuántos gastos tienes registrados |
| **Categorías** | Cuántas de las 10 categorías usas |

### 2.3 Facturas por vencer

- **Escanear:** el botón **Escanear** del panel lee una foto o PDF de una factura, o el código **QR** de la factura o del comprobante de pago. Revisa siempre los datos antes de guardar.
- **Factura por vencer:** si la factura vence más adelante, el panel pregunta qué hacer. **Guardar recordatorio** la añade a **Pendientes de pago**; **Ya la pagué** deja la fecha de hoy para registrarla como gasto.
- **Pendientes de pago:** aparece en el Panel bajo el semáforo. **Pagar** crea el gasto de hoy; **Descartar** quita el recordatorio.
- Los avisos de vencimiento se envían una vez al día, a primera hora.

### 2.4 Gráficos

- **Por categoría**: barras de tus seis categorías con más gasto. Sobre cada barra ves su monto y debajo su porcentaje del total. La escala se indica arriba a la derecha.
- **Distribución**: la misma información como una barra apilada, con el monto y el porcentaje de cada categoría. Las categorías que no entran entre las seis principales se agrupan en **"Resto"**.
- **Tendencia**: tus gastos de los últimos seis meses con datos. Debajo de cada mes ves su total, y arriba a la derecha cuánto subió o bajó el último mes frente al primero.

### 2.5 Historial

Los últimos 20 gastos, agrupados por día (**HOY**, **AYER** y luego la fecha) con el total de cada día. Cada fila tiene un lápiz para editar y una papelera para eliminar. **"Ver todos"** te lleva a la pantalla Gastos.

### 2.6 Último registro

Bajo el formulario, una tarjeta muestra tu gasto más reciente y el total del mes.

---

## 3. Gastos

### 3.1 Registrar un Nuevo Gasto

Usa el panel **"Registrar gasto"** del Panel (en el móvil está debajo de la tendencia):

1. **Monto**: pulsa las teclas del teclado numérico. La tecla **000** agrega tres ceros y la tecla de borrar quita el último dígito. También puedes escribir los números con el teclado de tu computadora.
2. **¿En qué gastaste?**: escribe una descripción, por ejemplo "Supermercado". La categoría se sugiere sola según lo que escribas.
3. **Categoría**: elige un icono de la cuadrícula (o deja la sugerida). El visor muestra el nombre de la categoría elegida.
4. **Fecha**: por defecto es hoy.
5. **Recibo** (opcional): adjunta una foto o un PDF de hasta 4 MB.
6. Haz clic en **"Registrar gasto"** (o pulsa **Enter**).

**Escanear**: el botón "Escanear" lee un recibo (foto, PDF o QR) y rellena monto, descripción, fecha y categoría. Revisa siempre los datos antes de registrar.

> **Registrar desde otras pantallas**: ya no hay un botón flotante. Pulsa **Cmd + N** (Mac) o **Ctrl + N** (Windows/Linux) y se abre un gasto rápido. En Presupuestos también está el botón **"Gasto rápido"**.

> Si algo falta (descripción, monto mayor a 0 o categoría) verás un aviso y el gasto no se guarda.

### 3.2 Categorías Disponibles

| Categoría | Ejemplos |
|-----------|----------|
| **Vivienda** | Alquiler, ferretería, muebles |
| **Alimentación** | Supermercado, restaurantes, café |
| **Transporte** | Nafta, peajes, colectivo, SUBE |
| **Servicios** | Luz, gas, agua, internet |
| **Entretenimiento** | Cine, Netflix, Spotify |
| **Salud** | Farmacia, médico, dentista |
| **Educación** | Cursos, libros, matrícula |
| **Ropa** | Indumentaria y calzado |
| **Tecnología** | Celulares, software, accesorios |
| **Otros** | Todo lo demás |

Las categorías son fijas: no se pueden crear nuevas. Cada una tiene su propio icono, que ves en las listas y en los presupuestos.

### 3.3 Editar un Gasto

1. Busca el gasto en el **Historial** del Panel
2. Haz clic en el lápiz de esa fila
3. El gasto se carga en el panel, que pasa a **"Editar gasto"**
4. Cambia lo que necesites y haz clic en **"Guardar"** (o en **"Cancelar"** para descartar)

### 3.4 Eliminar un Gasto

1. Busca el gasto en el **Historial** (o en la tabla de **Gastos**)
2. Haz clic en la papelera de esa fila
3. En la ventana **"¿Eliminar gasto?"** confirma con **"Eliminar"** (o cancela con **"Cancelar"** o la tecla Esc)

⚠️ **Atención**: Esta acción no se puede deshacer.

### 3.5 Filtrar Gastos

En la pantalla **Gastos** la barra de filtros está sobre la lista. La búsqueda y el período están siempre a la vista; el botón **"Filtros"** despliega el resto. Se aplican al instante y **"Limpiar"** los quita todos:

| Filtro | Uso |
|--------|-----|
| **Buscar** | Busca por descripción |
| **Período** | Todo, hoy, 7 días, este mes, mes anterior o este año |
| **Categorías** (en Filtros) | Una o varias categorías |
| **Desde / Hasta** (en Filtros) | Rango de fechas |
| **Monto mínimo / máximo** (en Filtros) | Rango de importes |

La cabecera de la tabla ordena por descripción, categoría, fecha o monto. En el móvil la categoría y la fecha aparecen debajo de la descripción.

### 3.6 Exportar Gastos

1. Aplica los filtros que necesites
2. Haz clic en **"Exportar"** y elige **CSV** o **Excel**
3. El archivo se descargará automáticamente

**Formatos disponibles:**
- **CSV**: Compatible con Excel, Google Sheets
- **Excel**: Formato .xlsx

### 3.7 Importar Gastos (CSV)

1. Prepara tu archivo CSV con estas columnas (acepta las del archivo que exporta la app, y también nombres en minúsculas o en inglés):
   ```
   Fecha,Descripción,Categoría,Monto
   2026-03-15,Supermercado,Alimentación,1500.50
   ```
   - La fecha va como `AAAA-MM-DD`.
   - El monto lleva punto para los decimales.
   - Máximo **5.000 filas** y **1 MB** por archivo.

2. En **Gastos**, haz clic en **"Importar"**
3. Selecciona tu archivo
4. Los gastos se importan y verás cuántos entraron y cuántas filas tuvieron errores

> ¿Vienes de otra app? Exporta tus gastos desde allí a CSV, ajusta las columnas a las de arriba y súbelo aquí.

---

## 4. Presupuestos

### 4.1 Crear un Presupuesto

Un presupuesto es un tope mensual para una categoría, del mes en curso.

1. Ve a la sección **"Presupuestos"**
2. Haz clic en **"Nuevo presupuesto"**
3. Completa:

   | Campo | Descripción |
   |-------|-------------|
   | **Categoría** | Categoría a presupuestar |
   | **Monto mensual** | Límite de gasto para esa categoría |
   | **Repetir todos los meses** | Opcional: el presupuesto se mantiene cada mes |

4. Haz clic en **"Crear presupuesto"**

Solo puede haber un presupuesto por categoría y mes.

### 4.2 La pantalla de Presupuestos

- **Resumen**: lo gastado sobre el presupuesto total, con la barra de avance, el porcentaje y lo disponible.
- **Una tarjeta por presupuesto**, con el icono de su categoría, el porcentaje y su estado, lo gastado sobre el tope, la barra de avance, cuánto queda y tres acciones: **agregar un gasto** de esa categoría, **editar** y **eliminar**.
- **Compras de hoy**: lo que gastaste hoy, con cuánto te queda en el presupuesto de cada categoría.

### 4.3 Estado del Presupuesto

| Color | Estado | Significado |
|-------|--------|-------------|
| 🟢 **Verde** | En orden | Has gastado menos del 80 % del presupuesto |
| 🟠 **Ámbar** | Cerca del límite | Has gastado entre el 80 % y el 100 % |
| 🔴 **Rojo** | Excedido | Has llegado o superado el presupuesto |

### 4.4 Editar y eliminar

- **Editar**: usa el lápiz de la tarjeta, cambia el monto o la categoría y guarda.
- **Eliminar**: usa la papelera de la tarjeta y confirma. No se puede deshacer.

---

## 5. Análisis

La pantalla **Analíticas** te ayuda a entender tus hábitos de gasto. Arriba a la derecha eliges el período (este mes, mes anterior, 3 o 6 meses, este año o todo).

### 5.1 Resumen del período

Cuatro indicadores: **Total** (con la cantidad de gastos), **Promedio diario** (sobre los días que abarca el período), **Promedio por gasto** y **Gasto mayor** (con el menor debajo).

### 5.2 Comparativa y proyección

- **Comparativa** con el período anterior.
- **Proyección de este mes**: cuánto llegarás a gastar si sigues al ritmo actual.

### 5.3 Claves del período

Observaciones escritas sobre tus gastos: tu categoría principal y su porcentaje, cuánto gastas en promedio por día, cuánto más gastas en una categoría que en otra y qué día de la semana gastas más.

### 5.4 Gráficos

- **Por categoría**: las cinco categorías principales y el resto, con monto y porcentaje.
- **Por día de la semana**: en qué días gastas más (el día más alto va resaltado).
- **Tendencia mensual**: cómo evolucionan tus gastos mes a mes.

---

## 6. Gastos hormiga

Un **gasto hormiga** es una compra chica y repetida: un café, un kiosco, un delivery. Cada una parece nada, pero juntas pesan. Esta sección te muestra cuánto suman, dónde se van y te ayuda a recuperarlas, **sin culpas**.

### 6.1 Bienvenida

La primera vez ves una pantalla de presentación con lo que hace el asistente y una pregunta: **¿qué te gustaría lograr?** (ahorrar para algo, llegar tranquilo a fin de mes, entender tu plata; puedes elegir más de una). Toca **"Empezar"** para entrar. Solo se muestra una vez.

### 6.2 Inicio

- **Tus gastos hormiga**: lo que suman este mes las compras chicas, cuántas fueron, qué parte del gasto del mes representan y su gasto **por semana**.
- **Semáforo y tope**: fijas un **tope del mes** para compras chicas y ves si vas bien, cerca del tope o lo superaste. Avisa desde el 80 %.
- **Es hormiga si cuesta menos de…**: el umbral. Tiene dos modos:
  - **Automático** (por defecto): se calcula con tus propias compras de los últimos 90 días (el 30 % más barato), así se ajusta a tu bolsillo. Mientras tengas pocas compras usa un valor inicial.
  - **Manual**: escribes tú el monto.
- **Dónde se te va**: las tres compras que más suman, con su cantidad y total. En cada una está el botón **"No es hormiga"** (el ojo tachado) para excluirla: deja de contarse en los totales y en los avisos. Las excluidas aparecen debajo y puedes **volver a contarlas** tocándolas.
- **Avisarme cuando vea un patrón**: interruptor para los avisos (ver [6.5](#65-avisos-de-gastos-hormiga)).

### 6.3 Asistente

Un chat para preguntar sobre tus compras chicas. Responde con **tus propios números**, por ejemplo:

- *¿Qué es un gasto hormiga?*
- *¿En qué estoy gastando de más?* (muestra un ticket con tus compras más repetidas)
- *Dame un plan sin dejar todo de golpe*
- *Comparar con el mes anterior*

Puedes tocar las preguntas sugeridas o escribir la tuya. **Solo lee tus gastos: nunca los cambia ni mueve dinero.**

> El asistente no es un modelo de inteligencia artificial: reconoce cuatro tipos de pregunta y responde con plantillas armadas con tus datos. Si le preguntas otra cosa, te lo dice y te ofrece las preguntas sugeridas.

### 6.4 Plan

- **Simulador**: con el deslizador eliges cuánto quieres bajar tus compras chicas (0 a 100 %) y ves cuánto recuperarías **al año** y **al mes**. Es una simulación, no una promesa.
- **Reto de 7 días**: siete casillas que marcas cuando cumples un día con menos compras chicas. Te muestra lo que no gastaste según tu gasto diario real.
- **Lecciones**: *El efecto de lo pequeño* y *Pagarte primero a vos*, de pocos minutos.

### 6.5 Avisos de gastos hormiga

Cuando registras un gasto, la app puede avisarte si detecta un patrón:

- **Una compra se repite**: la misma compra aparece 3 veces en 14 días (y luego cada 5 repeticiones). Por ejemplo: «Café: 3 veces en 14 días. Suman $300».
- **Tope del mes**: llegas al 80 % y al 100 % de tu tope de compras chicas.

Para no molestarte, **como máximo recibes 1 aviso hormiga por día y 2 por semana**. Puedes apagarlos con el interruptor *"Avisarme cuando vea un patrón"* en el Inicio de Gastos hormiga. Los avisos llegan a la campana y, si activaste las notificaciones del navegador, también como notificación del sistema.

**Cómo probarlo:** registra tres veces el mismo gasto, con un monto menor al umbral, y al tercero llega el aviso. Si ya recibiste uno ese día, el siguiente espera al día siguiente.

---

## 7. Notificaciones

### 7.1 La campana

La campana de la barra superior reúne tus avisos: facturas por vencer, que vencen hoy o vencidas, pagos registrados y avisos de gastos hormiga. Toca un aviso para ir al lugar correspondiente, o **"Marcar todo como leído"**.

### 7.2 Notificaciones del navegador

Dentro de la campana, **"Activar notificaciones del navegador"** te permite recibir los avisos como notificaciones del sistema aunque no tengas la app abierta.

1. Toca el botón y, cuando el navegador lo pida, elige **Permitir**.
2. Verás «Notificaciones activadas».

**Si no funciona**, la app te dice en qué paso falló:

| Mensaje | Qué hacer |
|---------|-----------|
| *Permiso denegado* | Habilita las notificaciones del sitio en la configuración del navegador (el candado junto a la dirección) |
| *Brave bloquea el servicio de notificaciones de Google…* | En Brave, busca **"push"** en `brave://settings` y activa **"Usar servicios de Google para mensajería push"**. Reinicia Brave y vuelve a intentarlo. Si tu versión no tiene la opción, usa Chrome, Edge o Firefox |
| *No pudo conectarse con el servicio de notificaciones* | Revisa tu conexión y que ninguna extensión o VPN bloquee a Google |
| *Tu sesión venció* | Vuelve a iniciar sesión |

- **iPhone**: las notificaciones del navegador solo funcionan si instalas la app en la pantalla de inicio.
- **Los avisos de la campana funcionan siempre**, aunque no actives las notificaciones del navegador.

---

## 8. Ayuda

El botón **?** de la barra superior abre un chat de ayuda para resolver dudas de uso. Al abrirlo te sugiere tres preguntas según la pantalla en la que estás, por ejemplo en Gastos: importar, filtrar y editar.

Responde con **pasos** y, cuando corresponde, un botón **"Ir a…"** que te lleva a la pantalla indicada. Cubre registrar gastos, escanear recibos, editar o borrar, importar y exportar, filtros, presupuestos, saldo, recordatorios, notificaciones, gastos hormiga, analíticas, moneda, tema, cuenta y atajos. **Escape** lo cierra. En el móvil ocupa toda la pantalla.

> Como el asistente de gastos hormiga, **no es un modelo de inteligencia artificial**: compara tu pregunta con respuestas preparadas. Si no te entiende, te lo dice y te ofrece preguntas de la pantalla en lugar de inventar una respuesta.

---

## 9. Configuración

### 9.1 Modo Claro/Oscuro

Cambia el tema de la aplicación:
- En la barra superior, elige **Oscuro** o **Claro**. En el móvil, toca el botón con el sol o la luna.
- El tema se guarda en tu navegador: al volver mantendrás tu preferencia.
- Si nunca elegiste uno, se usa el de tu dispositivo.

### 9.2 Moneda

La moneda se detecta sola según tu navegador. Si falta o quieres otra, la tarjeta **"Te ayudo a dejar tus datos listos"** del Panel te deja elegirla.

### 9.3 Perfil de Usuario

En la barra superior ves tu avatar y tu usuario. En el móvil, toca el avatar para abrir el menú de cuenta.

**Cerrar sesión:**
1. Haz clic en **"Salir"** (en el móvil, está dentro del menú de cuenta)
2. Serás redirigido a la página de login

### 9.4 Atajos de teclado

| Atajo | Qué hace |
|-------|----------|
| **Cmd/Ctrl + N** | En el Panel, lleva el cursor al formulario de gasto; en otras pantallas abre un gasto rápido |
| **Esc** | Cierra ventanas y el chat de ayuda |

### 9.5 Recuperar la Contraseña

Si usas usuario y contraseña:

1. Ve a **"¿Olvidaste tu contraseña?"** en la página de login
2. Ingresa tu email
3. Si hay una cuenta con ese correo, te llegará un enlace para elegir una contraseña nueva (vence en 15 minutos)

Por seguridad, la aplicación responde igual exista o no la cuenta, así que el mensaje no confirma si tu correo está registrado. Si tu cuenta se creó con Google o Microsoft no tiene contraseña que recuperar.

---

## 10. Preguntas Frecuentes

### ❓ ¿Puedo usar la aplicación en mi celular?

Sí, la aplicación es **responsiva** y funciona en:
- 📱 Smartphones (iOS y Android)
- 📱 Tablets
- 💻 Computadoras de escritorio y laptops

En el celular la navegación está en una barra de pestañas abajo.

### ❓ ¿Mis datos están seguros?

Sí, tus datos están protegidos:
- 🔐 Conexión HTTPS encriptada
- 🔐 Contraseñas encriptadas con bcrypt
- 🔐 Tokens JWT seguros
- 🔐 OAuth 2.0 para proveedores externos

### ❓ ¿Qué hacen los asistentes con mis datos?

El asistente de gastos hormiga y el de ayuda **solo leen** tus gastos y responden dentro de la propia app. No envían tus datos a ningún servicio de inteligencia artificial y no pueden cambiar ni borrar nada.

### ❓ ¿Puedo eliminar mi cuenta?

Actualmente, la eliminación de cuenta debe solicitarse al administrador.

### ❓ ¿Puedo agregar categorías personalizadas?

Las categorías están predefinidas para mantener la consistencia. Si necesitas una categoría adicional, usa **"Otros"**.

### ❓ ¿Qué navegador debo usar?

La aplicación funciona en cualquier navegador moderno:
- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅
- Brave ✅ (para las notificaciones del sistema hay que activar un ajuste, ver [7.2](#72-notificaciones-del-navegador))

### ❓ ¿Puedo usar la aplicación sin conexión?

No, la aplicación requiere conexión a internet para:
- Guardar gastos en la base de datos
- Sincronizar entre dispositivos
- Usar Google/Microsoft Sign In

### ❓ ¿Hay límite de gastos que puedo registrar?

No, puedes registrar tantos gastos como necesites. Para importar desde CSV el límite es de 5.000 filas por archivo.

### ❓ ¿Puedo exportar todos mis datos?

Sí, usa la función de exportar a CSV/Excel de la pantalla Gastos para obtener una copia de tus datos.

### ❓ ¿Por qué no me llegó un aviso de gastos hormiga?

Revisa lo siguiente:
- Que **"Avisarme cuando vea un patrón"** esté activado.
- Que la compra cueste **menos que el umbral** que ves en "Es hormiga si cuesta menos de…". Con el umbral automático, el valor se ajusta a tus compras y puede quedar por debajo del precio de tu café.
- Que la misma compra se haya repetido **3 veces en 14 días** (o que hayas llegado al 80 % del tope).
- Que no hayas recibido ya un aviso hoy: el máximo es **1 por día y 2 por semana**.
- Que la descripción sea la misma: «Café» y «Cafecito» cuentan como compras distintas.

### ❓ ¿Cómo se calcula el presupuesto?

El presupuesto se calcula sumando todos los gastos de una categoría en el mes y comparándolo con el límite que estableciste.

**Ejemplo:**
- Presupuesto: $5.000 en Alimentación
- Gastos del mes: $3.500
- Estado: 🟢 En línea (70 % usado)

---

## 💡 Consejos de Uso

### Para un mejor control de gastos:

1. **Registra tus gastos diariamente**
   - No dejes pasar muchos días sin registrar
   - Usa el importador CSV para registrar muchos gastos a la vez

2. **Configura presupuestos realistas**
   - Revisa tus gastos históricos
   - Ajusta según tu ingreso mensual

3. **Revisa el análisis semanalmente**
   - Identifica categorías donde puedes reducir
   - Celebra cuando cumplas tus presupuestos

4. **Mira tus gastos hormiga una vez por semana**
   - Fíjate cuáles se repiten más
   - Prueba el reto de 7 días con el que más se repite

5. **Usa las alertas visuales**
   - Cuando veas una barra roja, es hora de reducir gastos
   - El color ámbar es una advertencia

---

## 📞 Soporte

Si tienes problemas o sugerencias:

- 📧 Email: soporte@finanzaflow.com
- 🐛 Reportar bugs: [GitHub Issues](https://github.com/tu-repo/issues)

---

**¡Disfruta controlando tus finanzas!** 💰
