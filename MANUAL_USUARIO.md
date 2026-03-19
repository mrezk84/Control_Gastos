# 📖 Manual de Usuario - FinanzaFlow

Guía completa para usar la aplicación de Control de Gastos.

---

## 📋 Tabla de Contenidos

1. [Primeros Pasos](#1-primeros-pasos)
2. [Dashboard](#2-dashboard)
3. [Gastos](#3-gastos)
4. [Presupuestos](#4-presupuestos)
5. [Análisis](#5-análisis)
6. [Configuración](#6-configuración)
7. [Preguntas Frecuentes](#7-preguntas-frecuentes)

---

## 1. Primeros Pasos

### 1.1 Crear una Cuenta

1. Ve a la página de registro
2. Completa los datos:
   - **Usuario**: Tu nombre de usuario único
   - **Email**: Tu correo electrónico
   - **Contraseña**: Mínimo 6 caracteres
3. Haz clic en **"Crear Cuenta"**

### 1.2 Iniciar Sesión

Tienes tres opciones:

**Opción A: Con email y contraseña**
1. Ingresa tu usuario y contraseña
2. Haz clic en **"Iniciar Sesión"**

**Opción B: Google Sign In**
1. Haz clic en **"Continuar con Google"**
2. Selecciona tu cuenta de Google
3. Confirma los permisos

**Opción C: Microsoft Sign In**
1. Haz clic en **"Continuar con Microsoft"**
2. Ingresa tu correo de Microsoft
3. Confirma los permisos

---

## 2. Dashboard

El Dashboard es tu pantalla principal donde ves un resumen de tus finanzas.

### 2.1 Tarjetas de Resumen

En la parte superior encontrarás 4 tarjetas:

| Tarjeta | Descripción |
|---------|-------------|
| **Total del Mes** | Suma de todos los gastos del mes actual |
| **Gastos Hoy** | Total de gastos registrados hoy |
| **Presupuesto** | Estado de tu presupuesto mensual |
| **Categoría Principal** | La categoría donde más gastaste |

### 2.2 Gráficos

**Gráfico de Barras**
- Muestra tus gastos por categoría
- Las barras más altas indican más gastos
- Haz clic en una barra para ver detalles

**Gráfico de Líneas**
- Muestra la tendencia de tus gastos
- Cada punto representa un día
- Útil para identificar patrones de gasto

---

## 3. Gastos

### 3.1 Registrar un Nuevo Gasto

1. Haz clic en **"+ Nuevo Gasto"** (botón flotante o en la esquina superior derecha)
2. Completa el formulario:

   | Campo | Descripción | Ejemplo |
   |-------|-------------|---------|
   | **Descripción** | Qué compraste | "Supermercado" |
   | **Monto** | Cuánto gastaste | 1500.00 |
   | **Categoría** | Tipo de gasto | Alimentación |
   | **Fecha** | Cuándo fue | 2024-03-15 |

3. Haz clic en **"Guardar"**

### 3.2 Categorías Disponibles

- 🛒 **Alimentación**: Supermercado, restaurantes, comida
- 🏠 **Vivienda**: Alquiler, servicios, expensas
- 🚗 **Transporte**: Nafta, peajes, transporte público
- 🏥 **Salud**: Farmacia, médico, seguros médicos
- 🎮 **Entretenimiento**: Cine, juegos, suscripciones
- 👕 **Ropa**: Indumentaria y calzado
- 📱 **Tecnología**: Electrónica, software, apps
- 🎓 **Educación**: Cursos, libros, matrícula
- 💼 **Trabajo**: Transporte al trabajo, útiles
- 🎁 **Regalos**: Regalos para otros
- 🏖️ **Vacaciones**: Viajes, hotelería
- 💊 **Farmacia**: Medicamentos y productos de higiene
- 📦 **Otros**: Categoría general

### 3.3 Editar un Gasto

1. Busca el gasto en la lista
2. Haz clic en el ícono de lápiz ✏️
3. Modifica los campos necesarios
4. Haz clic en **"Guardar"**

### 3.4 Eliminar un Gasto

1. Busca el gasto en la lista
2. Haz clic en el ícono de papelera 🗑️
3. Confirma la eliminación

⚠️ **Atención**: Esta acción no se puede deshacer.

### 3.5 Filtrar Gastos

Usa los filtros para encontrar gastos específicos:

| Filtro | Uso |
|--------|-----|
| **Búsqueda** | Busca por descripción |
| **Categoría** | Filtra por tipo de gasto |
| **Fecha desde/hasta** | Rango de fechas |
| **Monto mínimo/máximo** | Rango de importes |

### 3.6 Exportar Gastos

1. Aplica los filtros que necesites
2. Haz clic en **"Exportar CSV"** o **"Exportar Excel"**
3. El archivo se descargará automáticamente

**Formatos disponibles:**
- **CSV**: Compatible con Excel, Google Sheets
- **Excel**: Formato .xlsx con formato incluido

### 3.7 Importar Gastos (CSV)

1. Prepara tu archivo CSV con las columnas:
   ```
   descripcion,monto,categoria,fecha
   Supermercado,1500,Alimentación,2024-03-15
   ```

2. Haz clic en **"Importar CSV"**
3. Selecciona tu archivo
4. Los gastos se importarán automáticamente

---

## 4. Presupuestos

### 4.1 Crear un Presupuesto

1. Ve a la sección **"Presupuestos"**
2. Haz clic en **"+ Nuevo Presupuesto"**
3. Completa:

   | Campo | Descripción |
   |-------|-------------|
   | **Mes** | Mes del presupuesto (ej: Marzo) |
   | **Año** | Año del presupuesto (ej: 2024) |
   | **Categoría** | Categoría a presupuestar |
   | **Monto** | Límite de gasto para esa categoría |

4. Haz clic en **"Guardar"**

### 4.2 Estado del Presupuesto

Los presupuestos tienen estados visuales:

| Color | Estado | Significado |
|-------|--------|-------------|
| 🟢 **Verde** | En Línea | Has gastado menos del 80% del presupuesto |
| 🟡 **Amarillo** | Precaución | Has gastado entre 80% y 100% |
| 🔴 **Rojo** | Excedido | Has superado el presupuesto |

### 4.3 Editar un Presupuesto

1. Haz clic en el presupuesto que quieres modificar
2. Cambia el monto o la categoría
3. Haz clic en **"Guardar"**

### 4.4 Eliminar un Presupuesto

1. Haz clic en el ícono de papelera 🗑️
2. Confirma la eliminación

---

## 5. Análisis

La sección de análisis te ayuda a entender tus hábitos de gasto.

### 5.1 Distribución por Categoría

- Gráfico circular que muestra qué porcentaje de tus gastos va a cada categoría
- Haz clic en una porción para ver el monto exacto
- Identifica rápidamente dónde estás gastando más dinero

### 5.2 Tendencias Mensuales

- Gráfico de línea que muestra la evolución de tus gastos
- Compara diferentes meses
- Identifica patrones estacionales

### 5.3 Gastos Promedio

- Promedio diario de gastos
- Promedio mensual
- Compara con el mes anterior

---

## 6. Configuración

### 6.1 Modo Claro/Oscuro

Cambia el tema de la aplicación:
- Haz clic en el ícono de sol/luna ☀️🌙 en la barra superior
- El tema se guarda automáticamente
- Vuelve a la aplicación y mantendrás tu preferencia

### 6.2 Perfil de Usuario

**Ver tu perfil:**
1. Haz clic en tu nombre o avatar
2. Se muestra tu información de cuenta

**Cerrar sesión:**
1. Haz clic en **"Cerrar Sesión"**
2. Serás redirigido a la página de login

### 6.3 Cambiar Contraseña

Si usas email/contraseña:

1. Ve a **"¿Olvidaste tu contraseña?"** en la página de login
2. Ingresa tu email
3. Recibirás un enlace para restablecer tu contraseña

---

## 7. Preguntas Frecuentes

### ❓ ¿Puedo usar la aplicación en mi celular?

Sí, la aplicación es **100% responsiva** y funciona en:
- 📱 Smartphones (iOS y Android)
- 📱 Tablets
- 💻 Computadoras de escritorio
- 💻 Laptops

### ❓ ¿Mis datos están seguros?

Sí, tus datos están protegidos:
- 🔐 Conexión HTTPS encriptada
- 🔐 Contraseñas encriptadas con bcrypt
- 🔐 Tokens JWT seguros
- 🔐 OAuth 2.0 para proveedores externos

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

### ❓ ¿Puedo usar la aplicación sin conexión?

No, la aplicación requiere conexión a internet para:
- Guardar gastos en la base de datos
- Sincronizar entre dispositivos
- Usar Google/Microsoft Sign In

### ❓ ¿Hay límite de gastos que puedo registrar?

No, puedes registrar tantos gastos como necesites.

### ❓ ¿Puedo exportar todos mis datos?

Sí, usa la función de exportar a CSV/Excel para obtener una copia de tus datos.

### ❓ ¿Cómo se calcula el presupuesto?

El presupuesto se calcula sumando todos los gastos de una categoría en un mes específico y comparándolo con el límite que estableciste.

**Ejemplo:**
- Presupuesto: $5,000 en Alimentación para Marzo
- Gastos actuales: $3,500
- Estado: 🟢 En línea (70% usado)

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

4. **Usa las alertas visuales**
   - Cuando veas una barra roja, es hora de reducir gastos
   - El color amarillo es una advertencia

---

## 📞 Soporte

Si tienes problemas o sugerencias:

- 📧 Email: soporte@finanzaflow.com
- 🐛 Reportar bugs: [GitHub Issues](https://github.com/tu-repo/issues)

---

**¡Disfruta controlando tus finanzas!** 💰
