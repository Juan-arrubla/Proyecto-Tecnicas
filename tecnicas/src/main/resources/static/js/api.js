/* ============================================================
   api.js: lo usan las dos páginas (index.html y admin.html)

   - Funciones para hablar con el backend de Spring Boot con fetch.
   - Datos de ejemplo por si el backend no está corriendo.
   - Pequeñas utilidades: formato de pesos, fechas, etc.

   Los nombres de los campos van en camelCase (planId, connectionSpeed...)
   porque el JSON lo arma Spring a partir de los atributos de las clases de Java,
   no de las columnas de MySQL.
   ============================================================ */

// Como esta página va dentro de la carpeta static de Spring Boot, el backend
// está en el mismo servidor: basta con escribir la ruta, sin "http://localhost:8080".
const API_BASE = "/api";

// Dirección de cada tabla en el backend (lo que pusieron en @RequestMapping de cada Controller)
const ENDPOINTS = {
  plans: "/plans",
  promotions: "/promotions",
  equipment: "/equipment",
  customers: "/customers",
  subscriptions: "/subscriptions",
  equipmentSubscriptions: "/equipment-subscriptions",  // equipos asignados a cada suscripción
  planReport: "/reports/plans"                         // informe: suscripciones e ingreso por plan
};

// Endpoints especiales del formulario público (el "contrato" que acordamos)
const VERIFY_PATH = "/customers/verify";          // POST { customerId, email } -> { firstName }
const REQUEST_PATH = "/subscriptions/request";    // POST { newCustomer, customer, planId, address } -> la suscripción creada

// Error con el código HTTP (404, 409, 500...) para poder mostrar un mensaje claro
class ApiError extends Error {
  constructor(status, message) {
    super(message || `El servidor respondió con el código ${status}`);
    this.status = status;
    this.serverMessage = message || "";   // el texto que mandó Spring (el de ResponseStatusException)
  }
}

/* ¿El error es porque ese endpoint todavía no existe (o el backend está apagado)?
   - TypeError: fetch no encontró a nadie (backend apagado o archivo abierto directamente).
   - 404 con el mensaje de Spring "No static resource ...": ningún @...Mapping coincide.
   - 405: la dirección existe, pero no con ese método (por ejemplo, falta el @PostMapping).
   Un 404 con un mensaje nuestro (como "Los datos no coinciden...") NO es esto: es una respuesta real. */
function isMissingEndpoint(error) {
  if (error instanceof TypeError) return true;
  if (!(error instanceof ApiError)) return false;
  if (error.status === 405) return true;
  return error.status === 404 && (!error.serverMessage || /no static resource|not found/i.test(error.serverMessage));
}

/**
 * Hace un pedido al backend y devuelve el JSON de la respuesta.
 * Ejemplos:
 *   apiRequest("/plans")                                   -> GET  /api/plans
 *   apiRequest("/plans", { method: "POST", body: plan })   -> POST /api/plans
 *   apiRequest("/plans/3", { method: "DELETE" })           -> DELETE /api/plans/3
 */
async function apiRequest(path, { method = "GET", body } = {}) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);   // el objeto de JavaScript se convierte en texto JSON
  }

  const response = await fetch(API_BASE + path, options);

  if (!response.ok) {
    // Spring suele mandar un JSON con "message" o "error" cuando algo falla
    let detail = "";
    try {
      const data = await response.json();
      detail = data.message || "";
    } catch { /* la respuesta no era JSON */ }
    throw new ApiError(response.status, detail);
  }

  // 204 (No Content) no trae nada, por ejemplo después de un DELETE
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/* ------------------------------------------------------------
   DATOS DE EJEMPLO
   Son los mismos del script conexionurrao.sql (más dos planes extra).
   Se usan solo si el backend no responde, para que la página se pueda
   ver abriendo el archivo directamente.
   ------------------------------------------------------------ */
const DEMO_DATA = {
  plans: [
    { planId: 1, name: "Esencial 100", connectionSpeed: 100, price: 59900,  active: true,  image: "images/planes/esencial-100.jpg" },
    { planId: 2, name: "Hogar 300",    connectionSpeed: 300, price: 79900,  active: true,  image: "images/planes/hogar-300.jpg" },
    { planId: 3, name: "Familia 500",  connectionSpeed: 500, price: 99900,  active: true,  image: "images/planes/familia-500.jpg" },
    { planId: 4, name: "Negocio 900",  connectionSpeed: 900, price: 139900, active: true,  image: "images/planes/negocio-900.jpg" },
    { planId: 5, name: "Básico 50",    connectionSpeed: 50,  price: 49900,  active: false, image: null }
  ],
  promotions: [
    { promotionId: 1, name: "Regreso a clases",     discountPercentage: 15, startingDate: "2026-01-15", finalDate: "2026-02-28", image: "images/promos/clases.jpg" },
    { promotionId: 2, name: "Temporada decembrina", discountPercentage: 25, startingDate: "2026-11-01", finalDate: "2026-12-31", image: "images/promos/diciembre.jpg" }
  ],
  equipment: [
    { code: 1, name: "Router WiFi 6",      brand: "TP-Link",  price: 150000 },
    { code: 2, name: "Decodificador HD",   brand: "Huawei",   price: 15000 },
    { code: 3, name: "Repetidor de señal", brand: "Mercusys", price: 89000 }
  ],
  customers: [
    { customerId: 1035123456, firstName: "Juan",  lastName: "Pérez", phoneNumber: "3001234567", email: "juan.perez@correo.com" },
    { customerId: 1036987654, firstName: "María", lastName: "Gómez", phoneNumber: "3109876543", email: "maria.gomez@correo.com" }
  ]
};

// Suscripciones de ejemplo: igual que las arma Spring con @ManyToOne, traen el cliente y el plan completos.
// price es el precio acordado al suscribirse (ya con el descuento de la promoción de ese momento).
DEMO_DATA.subscriptions = [
  { subscriptionId: 1, price: 59925, address: "Calle 30 # 29-15", status: "activa",
    subscriptionDate: "2026-11-03", customer: DEMO_DATA.customers[0], plan: DEMO_DATA.plans[1] },
  { subscriptionId: 2, price: 44925, address: "Vereda La Encarnación", status: "pendiente",
    subscriptionDate: "2026-11-20", customer: DEMO_DATA.customers[1], plan: DEMO_DATA.plans[0] }
];

// Equipos asignados de ejemplo: la suscripción 1 tiene un router y un decodificador del catálogo
DEMO_DATA.equipmentSubscriptions = [
  { equipmentSubscriptionId: 1, subscription: { subscriptionId: 1 }, equipment: DEMO_DATA.equipment[0] },
  { equipmentSubscriptionId: 2, subscription: { subscriptionId: 1 }, equipment: DEMO_DATA.equipment[1] }
];

// Devuelve una copia de los datos de ejemplo (así los cambios no dañan el original)
function demoData(key) {
  return structuredClone(DEMO_DATA[key]);
}

/**
 * Intenta leer una tabla del backend. Si no se puede (backend apagado,
 * endpoint que todavía no existe, página abierta como archivo), usa los datos de ejemplo.
 * Devuelve { data, demo, reason }.
 */
async function loadResource(key, query = "") {
  try {
    const data = await apiRequest(ENDPOINTS[key] + query);
    return { data: Array.isArray(data) ? data : [], demo: false };
  } catch (error) {
    console.warn(`No se pudo leer ${API_BASE}${ENDPOINTS[key]}. Se usan datos de ejemplo.`, error);
    return { data: demoData(key), demo: true, reason: error };
  }
}

/* ------------------------------------------------------------
   UTILIDADES
   ------------------------------------------------------------ */

// 79900 -> "$ 79.900"
const moneyFormat = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const fmt = (n) => moneyFormat.format(Number(n) || 0);

// Convierte "2026-12-31" en fecha local. new Date("2026-12-31") la tomaría en hora UTC
// y en Colombia podría quedar en el día anterior.
function parseDate(text, endOfDay = false) {
  const [y, m, d] = String(text).split("-").map(Number);
  return endOfDay ? new Date(y, m - 1, d, 23, 59, 59) : new Date(y, m - 1, d);
}

// "2026-11-01" -> "1 nov 2026"
function formatDate(text) {
  if (!text) return "";
  return parseDate(text).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

// Fecha de hoy en formato "2026-11-13" (el mismo que usa MySQL y LocalDate)
function todayISO() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

// Precio con descuento, con la MISMA cuenta que hace Java con enteros:
// primero multiplica, luego divide, y se descartan los decimales.
// Ej.: 79900 con 25 %  ->  79900 * 75 / 100 = 59925
function discountedPrice(price, discount) {
  return Math.trunc(Number(price) * (100 - Number(discount || 0)) / 100);
}

// La promoción vigente es la que tiene la fecha de hoy entre su inicio y su fin
function findActivePromotion(promotions) {
  const now = new Date();
  return promotions.find(p => now >= parseDate(p.startingDate) && now <= parseDate(p.finalDate, true)) || null;
}

// Evita que un texto escrito por alguien (por ejemplo un nombre con "<script>")
// se interprete como HTML al meterlo en la página
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
