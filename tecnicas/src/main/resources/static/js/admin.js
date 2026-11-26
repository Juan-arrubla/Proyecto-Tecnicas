/* ============================================================
   admin.js: panel de administración (CRUD)
   Necesita que api.js se cargue antes.

   Idea general: en vez de escribir una página distinta para cada tabla,
   cada tabla se describe en el objeto RESOURCES (qué columnas mostrar y
   qué campos pedir en el formulario). Las mismas funciones sirven para todas.

   Operaciones del CRUD y su pedido al backend:
     Consultar  -> GET    /api/plans
     Crear      -> POST   /api/plans          (sin id: lo pone MySQL)
     Actualizar -> PUT    /api/plans/{id}
     Borrar     -> DELETE /api/plans/{id}
   ============================================================ */

/* ------------------------------------------------------------
   DESCRIPCIÓN DE CADA TABLA
   columns: lo que se ve en la tabla
   fields:  lo que se pide en el formulario (name = atributo de la clase de Java)
   ------------------------------------------------------------ */
const RESOURCES = {
  plans: {
    tab: "Planes",
    title: "Planes de internet",
    singular: "plan",
    newLabel: "Nuevo plan",
    idField: "planId",
    idGenerated: true,          // lo genera el AUTO_INCREMENT de MySQL
    softDelete: true,           // "borrar" un plan solo lo desactiva (active = false)
    searchIn: ["name", "image"],
    columns: [
      { label: "ID", cls: "id", value: r => r.planId },
      { label: "Nombre", cls: "strong", value: r => r.name },
      { label: "Velocidad", cls: "num", value: r => `${r.connectionSpeed} Mbps` },
      { label: "Precio mensual", cls: "num", value: r => fmt(r.price) },
      { label: "Imagen", cls: "muted", value: r => r.image || "Sin imagen" },
      { label: "Estado", html: r => r.active ? badge("Activo", "ok") : badge("Inactivo", "off") }
    ],
    fields: [
      { name: "name", label: "Nombre del plan", type: "text", required: true, maxLength: 45, placeholder: "Ej. Hogar 300", full: true },
      { name: "connectionSpeed", label: "Velocidad (Mbps)", type: "number", required: true, min: 1, integer: true, placeholder: "300" },
      { name: "price", label: "Precio mensual (pesos)", type: "number", required: true, min: 1, integer: true, placeholder: "79900" },
      { name: "image", label: "Ruta de la imagen", type: "text", maxLength: 255, placeholder: "images/planes/hogar-300.jpg",
        hint: "Opcional. Ruta del archivo dentro de la carpeta static.", full: true },
      { name: "active", label: "Mostrar en la página", type: "switch", default: true,
        hint: "Si lo apagas, el plan deja de aparecer en la página pero no se borra.", full: true }
    ],
    summary: rows => {
      const active = rows.filter(r => r.active).length;
      return `${plural(rows.length, "plan", "planes")}, ${active} ${active === 1 ? "activo" : "activos"} en la página`;
    }
  },

  promotions: {
    tab: "Promociones",
    title: "Promociones",
    singular: "promoción",
    feminine: true,
    newLabel: "Nueva promoción",
    idField: "promotionId",
    idGenerated: true,
    searchIn: ["name"],
    columns: [
      { label: "ID", cls: "id", value: r => r.promotionId },
      { label: "Nombre", cls: "strong", value: r => r.name },
      { label: "Descuento", cls: "num", value: r => `${Number(r.discountPercentage)} %` },
      { label: "Desde", value: r => formatDate(r.startingDate) },
      { label: "Hasta", value: r => formatDate(r.finalDate) },
      { label: "Estado", html: r => promoBadge(r) }
    ],
    fields: [
      { name: "name", label: "Nombre de la promoción", type: "text", required: true, maxLength: 45, placeholder: "Ej. Temporada decembrina", full: true },
      { name: "discountPercentage", label: "Descuento (%)", type: "number", required: true, min: 1, max: 100, integer: true, placeholder: "25" },
      { name: "image", label: "Ruta de la imagen", type: "text", maxLength: 255, placeholder: "images/promos/diciembre.jpg" },
      { name: "startingDate", label: "Fecha inicial", type: "date", required: true },
      { name: "finalDate", label: "Fecha final", type: "date", required: true }
    ],
    // Reglas que dependen de varios campos o de los otros registros
    validate(record, rows) {
      const errors = {};
      if (record.startingDate && record.finalDate && record.finalDate < record.startingDate) {
        errors.finalDate = "La fecha final no puede ser antes de la inicial.";
      }
      // Regla del negocio: nunca hay dos promociones al mismo tiempo
      const overlap = rows.find(p =>
        p.promotionId !== record.promotionId &&
        record.startingDate <= p.finalDate && record.finalDate >= p.startingDate);
      if (overlap && !errors.finalDate) {
        errors.startingDate = `Se cruza con "${overlap.name}" (${formatDate(overlap.startingDate)} a ${formatDate(overlap.finalDate)}). No puede haber dos promociones al mismo tiempo.`;
      }
      return errors;
    },
    summary: rows => {
      const live = findActivePromotion(rows);
      return `${plural(rows.length, "promoción", "promociones")}. ${live ? `Vigente hoy: ${live.name}.` : "Hoy no hay ninguna vigente."}`;
    }
  },

  equipment: {
    tab: "Equipos",
    title: "Equipos",
    singular: "equipo",
    newLabel: "Nuevo equipo",
    idField: "code",
    idGenerated: true,
    searchIn: ["name", "brand"],
    columns: [
      { label: "Código", cls: "id", value: r => r.code },
      { label: "Nombre", cls: "strong", value: r => r.name },
      { label: "Marca", value: r => r.brand || "Sin marca" },
      { label: "Precio", cls: "num", value: r => fmt(r.price) }
    ],
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true, maxLength: 45, placeholder: "Ej. Decodificador HD", full: true },
      { name: "brand", label: "Marca", type: "text", maxLength: 45, placeholder: "Ej. Huawei", hint: "Opcional." },
      { name: "price", label: "Precio (pesos)", type: "number", required: true, min: 0, integer: true, placeholder: "15000" }
    ],
    summary: rows => plural(rows.length, "equipo en el catálogo", "equipos en el catálogo")
  },

  customers: {
    tab: "Clientes",
    title: "Clientes",
    singular: "cliente",
    newLabel: "Nuevo cliente",
    idField: "customerId",
    idGenerated: false,         // la llave es la cédula: la escribe la persona
    searchIn: ["customerId", "firstName", "lastName", "email", "phoneNumber"],
    columns: [
      { label: "Cédula", cls: "id", value: r => r.customerId },
      { label: "Nombre", cls: "strong", value: r => `${r.firstName} ${r.lastName}` },
      { label: "Celular", value: r => r.phoneNumber },
      { label: "Correo", cls: "muted", value: r => r.email }
    ],
    fields: [
      { name: "customerId", label: "Cédula", type: "text", required: true, pattern: /^\d{6,10}$/,
        patternMsg: "Escribe la cédula sin puntos, entre 6 y 10 números.", placeholder: "1035123456",
        hint: "No se puede cambiar después de crear el cliente.", lockOnEdit: true, asNumber: true, full: true },
      { name: "firstName", label: "Nombre", type: "text", required: true, maxLength: 45 },
      { name: "lastName", label: "Apellido", type: "text", required: true, maxLength: 45 },
      { name: "phoneNumber", label: "Celular", type: "text", required: true, maxLength: 15, pattern: /^3\d{9}$/,
        patternMsg: "Debe tener 10 números y empezar por 3.", placeholder: "3001234567" },
      { name: "email", label: "Correo", type: "email", required: true, maxLength: 45,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, patternMsg: "Revisa el correo, parece incompleto.", placeholder: "nombre@correo.com" }
    ],
    validate(record, rows, isNew) {
      if (isNew && rows.some(c => String(c.customerId) === String(record.customerId))) {
        return { customerId: "Ya existe un cliente con esta cédula." };
      }
      return {};
    },
    summary: rows => plural(rows.length, "cliente registrado", "clientes registrados")
  },

  subscriptions: {
    tab: "Suscripciones",
    title: "Suscripciones",
    singular: "suscripción",
    feminine: true,
    newLabel: "Nueva suscripción",
    idField: "subscriptionId",
    idGenerated: true,
    // Botón extra en cada fila: abre la ventana para asignar equipos del catálogo
    extraAction: { action: "equipment", label: "Equipos" },
    // Las columnas del cliente y del plan están "adentro" de la suscripción (por el @ManyToOne),
    // así que la búsqueda se hace con una función y no con una lista de campos
    search: row => [row.subscriptionId, row.address, row.status,
                    row.customer?.customerId, row.customer?.firstName, row.customer?.lastName, row.plan?.name],
    columns: [
      { label: "ID", cls: "id", value: r => r.subscriptionId },
      { label: "Cliente", html: r => r.customer
          ? `<strong>${escapeHtml(r.customer.firstName)} ${escapeHtml(r.customer.lastName)}</strong><br><span class="muted">${escapeHtml(r.customer.customerId)}</span>`
          : "Sin cliente" },
      { label: "Plan", value: r => r.plan ? r.plan.name : "Sin plan" },
      { label: "Precio acordado", cls: "num", value: r => fmt(r.price) },
      { label: "Dirección", cls: "muted", value: r => r.address },
      { label: "Fecha", cls: "muted", value: r => formatDate(r.subscriptionDate) },
      { label: "Estado", html: r => statusBadge(r.status) }
    ],
    fields: [
      { name: "customerId", label: "Cliente", type: "select", required: true, asNumber: true, lockOnEdit: true, full: true,
        options: async () => (await loadResource("customers")).data.map(c =>
          ({ value: c.customerId, label: `${c.firstName} ${c.lastName} (${c.customerId})` })),
        hint: "Si el cliente no aparece, créalo primero en la pestaña Clientes." },
      { name: "planId", label: "Plan", type: "select", required: true, asNumber: true, full: true,
        options: async () => (await loadResource("plans")).data.map(p =>
          ({ value: p.planId, label: `${p.name}, ${fmt(p.price)}${p.active ? "" : " (inactivo)"}` })) },
      { name: "address", label: "Dirección de instalación", type: "text", required: true, maxLength: 45, full: true,
        placeholder: "Ej. Calle 30 # 29-15" },
      { name: "price", label: "Precio mensual acordado (pesos)", type: "number", required: true, min: 1, integer: true,
        hint: "Se llena solo al escoger el plan, con el descuento de la promoción vigente. Lo puedes cambiar." },
      { name: "status", label: "Estado", type: "select", required: true, default: "pendiente",
        options: async () => SUBSCRIPTION_STATUS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })) }
    ],
    // Lo que se lee en el formulario está "plano" (customerId, planId...), pero Spring espera
    // el cliente y el plan como objetos: { customer: { customerId }, plan: { planId } }
    toForm: row => ({ ...row, customerId: row.customer?.customerId, planId: row.plan?.planId }),
    toRecord: (flat, row) => ({
      customer: { customerId: flat.customerId },
      plan: { planId: flat.planId },
      address: flat.address,
      price: flat.price,
      status: flat.status,
      // La fecha no se edita: al crear es hoy; al editar se conserva (el PUT reemplaza todo el objeto).
      // Solo el día ("2026-11-26"), porque la columna es DATE y en Java es LocalDate
      subscriptionDate: row ? row.subscriptionDate : todayISO()
    }),
    // Al escoger un plan, el precio se llena solo: precio del plan con el descuento de la promoción vigente.
    // Es la misma cuenta que hace el backend con la solicitud de la página pública.
    async onFormReady() {
      const [plans, promos] = await Promise.all([loadResource("plans"), loadResource("promotions")]);
      const promo = findActivePromotion(promos.data);
      const planSelect = $("f-planId"), priceInput = $("f-price");
      planSelect.addEventListener("change", () => {
        const plan = plans.data.find(p => String(p.planId) === planSelect.value);
        if (plan) priceInput.value = discountedPrice(plan.price, promo ? promo.discountPercentage : 0);
      });
    },
    summary: rows => {
      const pending = rows.filter(r => r.status === "pendiente").length;
      return `${plural(rows.length, "suscripción", "suscripciones")}, ${pending} ${pending === 1 ? "pendiente" : "pendientes"} por instalar`;
    }
  }
};

const SUBSCRIPTION_STATUS = ["pendiente", "activa", "suspendida", "cancelada"];

function statusBadge(status) {
  const kind = { pendiente: "soon", activa: "ok", suspendida: "live", cancelada: "off" }[status] || "off";
  return badge(status ? status.charAt(0).toUpperCase() + status.slice(1) : "Sin estado", kind);
}

/* En modo demostración, estos registros "tienen suscripciones" (como en el script SQL),
   así se puede ver qué pasa cuando la llave foránea no deja borrar. */
const DEMO_IN_USE = { customers: [1035123456, 1036987654] };

/* ------------------------------------------------------------
   ESTADO DE LA PÁGINA
   ------------------------------------------------------------ */
const state = {
  key: "plans",        // tabla abierta
  rows: [],            // registros de esa tabla
  demo: false,         // true si se trabaja con datos de ejemplo
  query: "",           // texto del buscador
  editingId: null,     // id del registro que se edita (null = creando uno nuevo)
  editingRow: null,    // el registro completo que se edita (para conservar lo que el formulario no muestra)
  pendingAction: null, // lo que hará el botón de la ventana de confirmación
  filters: { status: "", from: "", to: "" }   // filtros de la pestaña Suscripciones
};
const demoStore = {};  // datos de ejemplo de cada tabla, para que los cambios se mantengan al cambiar de pestaña

const $ = (id) => document.getElementById(id);
const res = () => RESOURCES[state.key];

/* ------------------------------------------------------------
   PEQUEÑAS AYUDAS
   ------------------------------------------------------------ */
function plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; }

function badge(text, kind) { return `<span class="badge badge-${kind}">${text}</span>`; }

function promoBadge(p) {
  const now = new Date();
  if (now < parseDate(p.startingDate)) return badge("Programada", "soon");
  if (now > parseDate(p.finalDate, true)) return badge("Vencida", "off");
  return badge("Vigente", "live");
}

// Quita tildes y mayúsculas para que "maria" encuentre a "María"
function normalize(text) {
  return String(text ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

let toastTimer;
function showToast(message, isError = false) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.toggle("is-error", isError);
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), isError ? 6000 : 3200);
}

// Traduce un error del backend a un mensaje que se entienda
function errorMessage(error, action) {
  if (error instanceof TypeError) return "No hay conexión con el backend. Revisa que Spring Boot esté corriendo.";
  // Si el backend mandó su propio mensaje (el de ResponseStatusException), ese es el más claro
  if (error.serverMessage && !isMissingEndpoint(error)) return error.serverMessage;
  if (error.status === 404) return `No se encontró el registro. Puede que otra persona lo haya borrado.`;
  if (error.status === 409 || error.status === 500) {
    return action === "delete"
      ? "No se pudo eliminar: tiene registros relacionados (por ejemplo, suscripciones) y la base de datos no lo permite."
      : `El servidor rechazó los datos (código ${error.status}). ${error.message}`;
  }
  return `Algo falló (código ${error.status}). ${error.message}`;
}

/* ------------------------------------------------------------
   PESTAÑAS
   ------------------------------------------------------------ */
// Las pestañas: una por tabla, más la de informes al final
const TAB_KEYS = [...Object.keys(RESOURCES), "reports"];
const tabLabel = (key) => key === "reports" ? "Informes" : RESOURCES[key].tab;

function renderTabs() {
  $("admin-tabs").innerHTML = TAB_KEYS.map(key => `
    <button class="admin-tab" type="button" role="tab" id="tab-${key}" data-key="${key}"
      aria-selected="${key === state.key}" aria-controls="${key === "reports" ? "reports-panel" : "admin-panel"}"
      tabindex="${key === state.key ? 0 : -1}">
      ${tabLabel(key)}
    </button>`).join("");
}

function selectTab(key) {
  if (!TAB_KEYS.includes(key)) key = "plans";
  state.key = key;
  history.replaceState(null, "", `#${key}`);   // así, si recargas, sigues en la misma pestaña
  renderTabs();

  // La pestaña de informes no es una tabla: muestra su propio panel
  const isReports = key === "reports";
  $("admin-panel").hidden = isReports;
  $("reports-panel").hidden = !isReports;
  if (isReports) {
    document.title = "Informes | Administración Conexión Urrao";
    loadReports();
    return;
  }

  state.query = "";
  $("search").value = "";
  $("filters").hidden = key !== "subscriptions";
  $("admin-panel").setAttribute("aria-labelledby", `tab-${key}`);
  loadRows();
}

/* ------------------------------------------------------------
   CONSULTAR (Read)
   ------------------------------------------------------------ */
async function loadRows() {
  const r = res();
  document.title = `${r.title} | Administración Conexión Urrao`;
  $("resource-title").textContent = r.title;
  $("btn-new").textContent = r.newLabel;
  $("resource-count").textContent = "";
  $("table-head").innerHTML = "";
  $("table-body").innerHTML = `<tr class="table-message"><td>Cargando ${r.title.toLowerCase()}...</td></tr>`;

  const keyAtStart = state.key;
  let result;
  if (demoStore[state.key]) {
    result = { data: demoStore[state.key], demo: true };   // ya estábamos en modo demostración con esta tabla
  } else {
    // En Suscripciones, los filtros viajan en la dirección: ?status=activa&from=...&to=...
    const query = state.key === "subscriptions" ? filterQuery() : "";
    result = await loadResource(state.key, query);
    if (result.demo) demoStore[state.key] = result.data;
  }
  if (keyAtStart !== state.key) return;   // la persona cambió de pestaña mientras cargaba

  state.rows = result.data;
  state.demo = result.demo;
  renderBanner(result.reason);
  renderTable();
}

function renderBanner(reason) {
  $("demo-banner").hidden = !state.demo;
  if (!state.demo) return;
  const url = `${API_BASE}${ENDPOINTS[state.key]}`;
  const why = reason instanceof ApiError && reason.status === 404
    ? `el endpoint <code>${url}</code> todavía no existe en el backend`
    : `no hubo respuesta de <code>${url}</code> (el backend no está corriendo o abriste el archivo directamente)`;
  $("demo-text").innerHTML = `Estás viendo datos de ejemplo porque ${why}. Los cambios solo duran mientras no recargues la página.`;
}

function filteredRows() {
  let rows = state.rows;
  // En modo demostración no hay backend que filtre: los filtros se aplican aquí mismo
  if (state.key === "subscriptions" && state.demo) rows = rows.filter(matchesFilters);
  const q = normalize(state.query.trim());
  if (!q) return rows;
  const r = res();
  const values = row => r.search ? r.search(row) : r.searchIn.map(f => row[f]);
  return rows.filter(row => values(row).some(v => normalize(v).includes(q)));
}

/* ------------------------------------------------------------
   FILTROS DE SUSCRIPCIONES (estado y rango de fechas)
   Se mandan al backend como parámetros de la dirección (@RequestParam en Java)
   ------------------------------------------------------------ */
function filterQuery() {
  const f = state.filters;
  const params = new URLSearchParams();
  if (f.status) params.set("status", f.status);
  if (f.from) params.set("from", f.from);
  if (f.to) params.set("to", f.to);
  const text = params.toString();
  return text ? `?${text}` : "";
}

const hasFilters = () => Boolean(state.filters.status || state.filters.from || state.filters.to);

// La misma regla que aplica el backend (se usa solo en modo demostración)
function matchesFilters(sub) {
  const f = state.filters;
  const day = String(sub.subscriptionDate || "").slice(0, 10);   // "2026-11-22"
  if (f.status && sub.status !== f.status) return false;
  if (f.from && day < f.from) return false;
  if (f.to && day > f.to) return false;
  return true;
}

function applyFilters(event) {
  event.preventDefault();
  const from = $("filter-from").value;
  const to = $("filter-to").value;
  if (from && to && to < from) {
    $("filter-error").textContent = "La fecha \"hasta\" no puede ser antes de la fecha \"desde\".";
    $("filter-error").hidden = false;
    return;
  }
  $("filter-error").hidden = true;
  state.filters = { status: $("filter-status").value, from, to };
  if (state.demo) renderTable(); else loadRows();
}

function clearFilters() {
  $("filters").reset();
  $("filter-error").hidden = true;
  state.filters = { status: "", from: "", to: "" };
  if (state.demo) renderTable(); else loadRows();
}

function renderTable() {
  const r = res();
  const rows = filteredRows();
  const shown = state.key === "subscriptions" && state.demo ? state.rows.filter(matchesFilters) : state.rows;
  $("resource-count").innerHTML = escapeHtml(r.summary(shown)) +
    (state.key === "subscriptions" && hasFilters() ? ' <span class="is-filtered">(con filtros)</span>' : "");

  const headCells = r.columns.map(c => `<th scope="col" class="${c.cls === "num" ? "num" : ""}">${c.label}</th>`).join("");
  $("table-head").innerHTML = `<tr>${headCells}<th scope="col" class="num"><span class="visually-hidden">Acciones</span></th></tr>`;

  const colspan = r.columns.length + 1;
  if (rows.length === 0) {
    $("table-body").innerHTML = state.query
      ? `<tr class="table-message"><td colspan="${colspan}">Ningún registro coincide con "${escapeHtml(state.query)}".</td></tr>`
      : `<tr class="table-message"><td colspan="${colspan}">Todavía no hay registros. Crea el primero con el botón "${r.newLabel}".</td></tr>`;
    return;
  }

  // Los botones guardan el id en data-id. Así no hay que meter los datos dentro de onclick="..."
  $("table-body").innerHTML = rows.map(row => {
    const id = row[r.idField];
    const cells = r.columns.map(c =>
      `<td class="${c.cls || ""}">${c.html ? c.html(row) : escapeHtml(c.value(row))}</td>`).join("");

    let actions = r.extraAction
      ? `<button class="row-btn" type="button" data-action="${r.extraAction.action}" data-id="${escapeHtml(id)}">${r.extraAction.label}</button>`
      : "";
    actions += `<button class="row-btn" type="button" data-action="edit" data-id="${escapeHtml(id)}">Editar</button>`;
    if (r.softDelete) {
      actions += row.active
        ? `<button class="row-btn row-btn-danger" type="button" data-action="delete" data-id="${escapeHtml(id)}">Desactivar</button>`
        : `<button class="row-btn" type="button" data-action="activate" data-id="${escapeHtml(id)}">Activar</button>`;
    } else {
      actions += `<button class="row-btn row-btn-danger" type="button" data-action="delete" data-id="${escapeHtml(id)}">Eliminar</button>`;
    }

    const inactive = r.softDelete && !row.active ? "is-inactive" : "";
    return `<tr class="${inactive}">${cells}<td><div class="row-actions">${actions}</div></td></tr>`;
  }).join("");
}

function findRow(id) {
  return state.rows.find(row => String(row[res().idField]) === String(id));
}

/* ------------------------------------------------------------
   FORMULARIO: CREAR (Create) Y ACTUALIZAR (Update)
   ------------------------------------------------------------ */
async function openForm(row = null) {
  const r = res();
  state.editingId = row ? row[r.idField] : null;
  state.editingRow = row;
  $("form-title").textContent = row ? `Editar ${r.singular}` : r.newLabel;
  $("btn-save").textContent = row ? "Guardar cambios" : `Crear ${r.singular}`;
  $("form-error").hidden = true;

  // Valores del formulario: los del registro (aplanados si hace falta) o los valores por defecto
  const values = row ? (r.toForm ? r.toForm(row) : row) : {};
  if (!row) {
    for (const f of r.fields) {
      values[f.name] = typeof f.default === "function" ? await f.default() : f.default;
    }
  }
  // Opciones de las listas desplegables (por ejemplo, los clientes y los planes)
  const options = {};
  for (const f of r.fields.filter(f => f.type === "select")) options[f.name] = await f.options();

  $("form-fields").innerHTML = r.fields.map(f => {
    const value = values[f.name];
    const full = f.full ? "full" : "";
    const hint = f.hint ? `<p class="hint">${f.hint}</p>` : "";

    if (f.type === "switch") {
      return `
        <div class="admin-field ${full}">
          <label class="switch">
            <input type="checkbox" name="${f.name}" ${value ? "checked" : ""}>
            <span class="track" aria-hidden="true"></span>
            <span>${f.label}<small>${f.hint || ""}</small></span>
          </label>
        </div>`;
    }

    if (f.type === "select") {
      const disabled = row && f.lockOnEdit ? "disabled" : "";
      const opts = options[f.name].map(o =>
        `<option value="${escapeHtml(o.value)}" ${String(o.value) === String(value ?? "") ? "selected" : ""}>${escapeHtml(o.label)}</option>`).join("");
      return `
        <div class="admin-field ${full}">
          <label for="f-${f.name}">${f.label}</label>
          <select id="f-${f.name}" name="${f.name}" ${disabled}>
            <option value="">Escoge una opción</option>${opts}
          </select>
          ${hint}
          <p class="error" id="err-${f.name}"></p>
        </div>`;
    }

    const locked = row && f.lockOnEdit ? "readonly" : "";
    const inputType = f.type === "number" ? "text" : f.type;   // los números se validan a mano (ver readForm)
    const mode = f.type === "number" ? 'inputmode="decimal"' : "";
    return `
      <div class="admin-field ${full}">
        <label for="f-${f.name}">${f.label}</label>
        <input id="f-${f.name}" name="${f.name}" type="${inputType}" ${mode} ${locked}
          value="${escapeHtml(value ?? "")}" placeholder="${escapeHtml(f.placeholder || "")}" autocomplete="off">
        ${hint}
        <p class="error" id="err-${f.name}"></p>
      </div>`;
  }).join("");

  $("form-dialog").showModal();
  const first = $("form-fields").querySelector("input:not([readonly]), select:not([disabled])");
  if (first) first.focus();
  if (r.onFormReady) r.onFormReady();
}

// "Plan creado", "Promoción creada"...
function doneLabel(r, verb) {
  const name = r.singular.charAt(0).toUpperCase() + r.singular.slice(1);
  return `${name} ${verb}${r.feminine ? "a" : "o"}`;
}

// Lee el formulario, convierte cada valor a su tipo y revisa las reglas.
// Devuelve { record, errors }.
function readForm() {
  const r = res();
  const formEl = $("record-form");
  const record = {};
  const errors = {};

  r.fields.forEach(f => {
    const input = formEl.elements[f.name];
    if (f.type === "switch") { record[f.name] = input.checked; return; }

    let raw = input.value.trim();
    if (raw === "") {
      if (f.required) errors[f.name] = "Este campo es obligatorio.";
      record[f.name] = null;   // en MySQL quedará NULL
      return;
    }

    if (f.type === "number") {
      // Aceptamos "79900", "79.900" (puntos de miles) y "12,5" o "12.5" (decimales)
      const clean = /^\d{1,3}(\.\d{3})+$/.test(raw) ? raw.replace(/\./g, "") : raw.replace(",", ".");
      const n = Number(clean);
      if (Number.isNaN(n)) errors[f.name] = "Escribe solo números.";
      else if (f.integer && !Number.isInteger(n)) errors[f.name] = "Debe ser un número entero.";
      else if (f.min !== undefined && n < f.min) errors[f.name] = `El valor mínimo es ${f.min}.`;
      else if (f.max !== undefined && n > f.max) errors[f.name] = `El valor máximo es ${f.max}.`;
      record[f.name] = n;
      return;
    }

    if (f.maxLength && raw.length > f.maxLength) errors[f.name] = `Máximo ${f.maxLength} caracteres.`;
    if (f.pattern && !f.pattern.test(raw)) errors[f.name] = f.patternMsg;
    // La cédula se valida como texto (solo dígitos), pero en la base de datos es INT: se manda como número
    record[f.name] = f.asNumber && !errors[f.name] ? Number(raw) : raw;
  });

  // El id: si estamos editando, va el del registro; si es nuevo y lo genera MySQL, no se manda
  const isNew = state.editingId === null;
  if (r.toRecord && Object.keys(errors).length === 0) {
    const shaped = r.toRecord(record, state.editingRow);
    Object.keys(record).forEach(k => delete record[k]);
    Object.assign(record, shaped);
  }
  if (!isNew) record[r.idField] = state.editingId;

  if (r.validate) {
    const others = state.rows.filter(row => isNew || String(row[r.idField]) !== String(state.editingId));
    Object.assign(errors, Object.fromEntries(
      Object.entries(r.validate(record, others, isNew)).filter(([field]) => !errors[field])));
  }
  return { record, errors, isNew };
}

function showFieldErrors(errors) {
  res().fields.forEach(f => {
    const box = $(`err-${f.name}`);
    if (!box) return;
    box.textContent = errors[f.name] || "";
    box.parentElement.classList.toggle("has-error", Boolean(errors[f.name]));
  });
  const firstBad = res().fields.find(f => errors[f.name]);
  if (firstBad) $(`f-${firstBad.name}`)?.focus();
}

async function saveForm(event) {
  event.preventDefault();   // que el formulario no recargue la página
  const r = res();
  const { record, errors, isNew } = readForm();
  showFieldErrors(errors);
  if (Object.keys(errors).length > 0) return;

  const saveBtn = $("btn-save");
  saveBtn.disabled = true;
  try {
    if (state.demo) {
      saveDemo(record, isNew);
    } else if (isNew) {
      await apiRequest(ENDPOINTS[state.key], { method: "POST", body: record });
    } else {
      await apiRequest(`${ENDPOINTS[state.key]}/${encodeURIComponent(state.editingId)}`, { method: "PUT", body: record });
    }
    $("form-dialog").close();
    showToast(doneLabel(r, isNew ? "cread" : "actualizad"));
    if (!state.demo) await loadRows();   // volvemos a leer la tabla: el backend es el que manda
    else renderTable();
  } catch (error) {
    $("form-error").textContent = errorMessage(error, "save");
    $("form-error").hidden = false;
  } finally {
    saveBtn.disabled = false;
  }
}

/* ------------------------------------------------------------
   BORRAR (Delete) Y ACTIVAR
   ------------------------------------------------------------ */
function askDelete(row) {
  const r = res();
  const id = row[r.idField];
  const label = row.name || (row.firstName ? `${row.firstName} ${row.lastName}` : `la ${r.singular} #${id}`);

  if (r.softDelete) {
    $("confirm-title").textContent = `¿Desactivar ${label}?`;
    $("confirm-text").textContent = "El plan deja de aparecer en la página. No se borra, y los clientes que ya lo tienen siguen igual. Lo puedes volver a activar cuando quieras.";
    $("btn-confirm").textContent = "Desactivar";
  } else {
    $("confirm-title").textContent = `¿Eliminar ${label}?`;
    $("confirm-text").textContent = "Esta acción no se puede deshacer.";
    $("btn-confirm").textContent = "Eliminar";
  }
  state.pendingAction = () => deleteRow(id);
  $("confirm-dialog").showModal();
}

async function deleteRow(id) {
  const r = res();
  try {
    if (state.demo) deleteDemo(id);
    else await apiRequest(`${ENDPOINTS[state.key]}/${encodeURIComponent(id)}`, { method: "DELETE" });
    showToast(r.softDelete ? "Plan desactivado" : doneLabel(r, "eliminad"));
    if (!state.demo) await loadRows(); else renderTable();
  } catch (error) {
    showToast(errorMessage(error, "delete"), true);
  }
}

// Volver a activar un plan es una actualización: se manda el plan con active = true
async function activateRow(row) {
  const updated = { ...row, active: true };
  try {
    if (state.demo) Object.assign(row, updated);
    else await apiRequest(`${ENDPOINTS[state.key]}/${row.planId}`, { method: "PUT", body: updated });
    showToast("Plan activado");
    if (!state.demo) await loadRows(); else renderTable();
  } catch (error) {
    showToast(errorMessage(error, "save"), true);
  }
}

/* ------------------------------------------------------------
   MODO DEMOSTRACIÓN: hace en memoria lo que haría el backend
   ------------------------------------------------------------ */
function saveDemo(record, isNew) {
  const r = res();
  // En una suscripción, Spring devolvería el cliente y el plan completos: aquí los buscamos en los datos de ejemplo
  if (record.customer) {
    const customers = demoStore.customers || DEMO_DATA.customers;
    const plans = demoStore.plans || DEMO_DATA.plans;
    record.customer = customers.find(c => String(c.customerId) === String(record.customer.customerId)) || record.customer;
    record.plan = plans.find(p => String(p.planId) === String(record.plan.planId)) || record.plan;
  }
  if (isNew) {
    if (r.idGenerated) {
      // Igual que AUTO_INCREMENT: el siguiente número después del mayor
      record[r.idField] = Math.max(0, ...state.rows.map(row => Number(row[r.idField]))) + 1;
    }
    state.rows.push(record);
  } else {
    Object.assign(findRow(state.editingId), record);
  }
}

function deleteDemo(id) {
  const r = res();
  if (r.softDelete) { findRow(id).active = false; return; }
  // Simula las llaves foráneas: no se puede borrar algo que otra tabla está usando
  if ((DEMO_IN_USE[state.key] || []).map(String).includes(String(id))) {
    throw new ApiError(409, "Tiene suscripciones asociadas");
  }
  const assigned = demoAssignments();
  if (state.key === "equipment" && assigned.some(a => String(a.equipment.code) === String(id))) {
    throw new ApiError(409, "No se puede eliminar: el equipo está asignado a una suscripción");
  }
  if (state.key === "subscriptions" && assigned.some(a => String(a.subscription.subscriptionId) === String(id))) {
    throw new ApiError(409, "No se puede eliminar: la suscripción tiene equipos asignados");
  }
  const index = state.rows.findIndex(row => String(row[r.idField]) === String(id));
  state.rows.splice(index, 1);
}

/* ------------------------------------------------------------
   EQUIPOS ASIGNADOS A UNA SUSCRIPCIÓN (tabla equipment_subscription)
     Ver:     GET    /api/equipment-subscriptions?subscriptionId=5
     Asignar: POST   /api/equipment-subscriptions   { subscription: { subscriptionId }, equipment: { code } }
   La clase EquipmentxSubscription tiene @ManyToOne hacia Subscription y equipment,
   así que la respuesta trae la suscripción y el equipo completos adentro.
     Quitar:  DELETE /api/equipment-subscriptions/{id}
   El equipo se escoge del catálogo (tabla equipment). El mismo equipo puede ir
   en muchas suscripciones, y una suscripción puede tener el mismo equipo dos veces.
   ------------------------------------------------------------ */
const equipState = {
  subscription: null,  // la suscripción cuya ventana está abierta
  catalog: [],         // el catálogo de equipos (para la lista y para buscar nombres por code)
  demo: false          // true si el backend no tiene todavía este endpoint
};
let demoAssignmentsStore = null;

// Asignaciones de ejemplo (se crean una sola vez y duran mientras no recargues)
function demoAssignments() {
  if (!demoAssignmentsStore) demoAssignmentsStore = demoData("equipmentSubscriptions");
  return demoAssignmentsStore;
}

async function openEquipmentDialog(subscription) {
  equipState.subscription = subscription;
  const customer = subscription.customer
    ? `${subscription.customer.firstName} ${subscription.customer.lastName}` : "Sin cliente";
  $("equip-title").textContent = `Equipos de la suscripción #${subscription.subscriptionId}`;
  $("equip-subtitle").textContent = `${customer}, ${subscription.plan ? subscription.plan.name : "sin plan"}`;
  $("equip-error").hidden = true;

  // El catálogo de equipos para la lista desplegable
  const catalog = (await loadResource("equipment")).data;
  equipState.catalog = catalog;
  $("assign-select").innerHTML = '<option value="">Escoge un equipo del catálogo</option>' +
    catalog.map(e => `<option value="${e.code}">${escapeHtml(e.name)}${e.brand ? ", " + escapeHtml(e.brand) : ""} (${fmt(e.price)})</option>`).join("");

  await loadAssigned();
  $("equip-dialog").showModal();
}

async function loadAssigned() {
  const id = equipState.subscription.subscriptionId;
  let list;
  try {
    list = await apiRequest(`${ENDPOINTS.equipmentSubscriptions}?subscriptionId=${encodeURIComponent(id)}`);
    equipState.demo = false;
  } catch (error) {
    if (!isMissingEndpoint(error)) {
      $("equip-error").textContent = errorMessage(error, "load");
      $("equip-error").hidden = false;
      renderAssigned([]);
      return;
    }
    equipState.demo = true;
    list = demoAssignments().filter(a => String(a.subscription.subscriptionId) === String(id));
  }
  $("equip-demo").hidden = !equipState.demo;
  renderAssigned(list || []);
}

// Busca en el catálogo el equipo que corresponde a un code
function equipmentByCode(code) {
  return equipState.catalog.find(e => String(e.code) === String(code))
    || { name: `Equipo con código ${code}`, brand: "", price: 0 };
}

function renderAssigned(list) {
  // Si alguna asignación no trae el equipo completo, se completa con el catálogo
  list = list.map(a => (a.equipment && a.equipment.name) ? a : { ...a, equipment: equipmentByCode(a.equipment ? a.equipment.code : a.code) });
  if (list.length === 0) {
    $("assigned-list").innerHTML = '<li class="assigned-empty">Esta suscripción todavía no tiene equipos. Escoge uno del catálogo y asígnalo.</li>';
  } else {
    $("assigned-list").innerHTML = list.map(a => `
      <li class="assigned-item">
        <div>
          <strong>${escapeHtml(a.equipment.name)}</strong>
          <span>${escapeHtml(a.equipment.brand || "Sin marca")}, ${fmt(a.equipment.price)}</span>
        </div>
        <button class="row-btn row-btn-danger" type="button" data-remove="${a.equipmentSubscriptionId}">Quitar</button>
      </li>`).join("");
  }
  const total = list.reduce((sum, a) => sum + Number(a.equipment.price || 0), 0);
  $("assigned-total").textContent = list.length
    ? `${plural(list.length, "equipo", "equipos")}, valor total ${fmt(total)}`
    : "";
}

async function assignEquipment(event) {
  event.preventDefault();
  const code = $("assign-select").value;
  if (!code) {
    $("equip-error").textContent = "Escoge un equipo del catálogo.";
    $("equip-error").hidden = false;
    return;
  }
  $("equip-error").hidden = true;
  // Del cliente y del equipo solo va el id: con eso Hibernate sabe a qué filas apuntar
  const body = {
    subscription: { subscriptionId: equipState.subscription.subscriptionId },
    equipment: { code: Number(code) }
  };
  try {
    if (equipState.demo) {
      const store = demoAssignments();
      store.push({
        equipmentSubscriptionId: Math.max(0, ...store.map(a => a.equipmentSubscriptionId)) + 1,
        subscription: body.subscription,
        equipment: equipmentByCode(body.equipment.code)
      });
    } else {
      await apiRequest(ENDPOINTS.equipmentSubscriptions, { method: "POST", body });
    }
    $("assign-select").value = "";
    showToast("Equipo asignado");
    await loadAssigned();
  } catch (error) {
    $("equip-error").textContent = errorMessage(error, "save");
    $("equip-error").hidden = false;
  }
}

async function removeEquipment(assignmentId) {
  try {
    if (equipState.demo) {
      const store = demoAssignments();
      store.splice(store.findIndex(a => String(a.equipmentSubscriptionId) === String(assignmentId)), 1);
    } else {
      await apiRequest(`${ENDPOINTS.equipmentSubscriptions}/${encodeURIComponent(assignmentId)}`, { method: "DELETE" });
    }
    showToast("Equipo quitado");
    await loadAssigned();
  } catch (error) {
    $("equip-error").textContent = errorMessage(error, "save");
    $("equip-error").hidden = false;
  }
}

/* ------------------------------------------------------------
   INFORMES: GET /api/reports/plans
   Responde una lista con una fila por plan:
   { planId, planName, totalSubscriptions, activeSubscriptions, monthlyIncome }
   ------------------------------------------------------------ */
async function loadReports() {
  $("kpis").innerHTML = '<div class="kpi"><span class="kpi-label">Cargando informes...</span></div>';
  $("plan-bars").innerHTML = "";
  $("plan-table").innerHTML = "";

  let rows;
  let demo = false;
  try {
    rows = await apiRequest(ENDPOINTS.planReport);
  } catch (error) {
    if (!isMissingEndpoint(error)) {
      $("kpis").innerHTML = `<div class="kpi"><span class="kpi-label">${escapeHtml(errorMessage(error, "load"))}</span></div>`;
      return;
    }
    demo = true;
    rows = demoPlanReport();
  }

  // El banner de modo demostración también sirve aquí
  $("demo-banner").hidden = !demo;
  if (demo) {
    $("demo-text").innerHTML = `Estás viendo un informe calculado con datos de ejemplo porque el endpoint <code>${API_BASE}${ENDPOINTS.planReport}</code> todavía no existe o el backend no responde.`;
  }
  renderReports(rows || []);
}

// El mismo cálculo que hace el backend, con las suscripciones de ejemplo
function demoPlanReport() {
  const plans = demoStore.plans || DEMO_DATA.plans;
  const subs = demoStore.subscriptions || DEMO_DATA.subscriptions;
  return plans.map(plan => {
    const ofPlan = subs.filter(s => s.plan && String(s.plan.planId) === String(plan.planId));
    const active = ofPlan.filter(s => s.status === "activa");
    return {
      planId: plan.planId,
      planName: plan.name,
      totalSubscriptions: ofPlan.length,
      activeSubscriptions: active.length,
      monthlyIncome: active.reduce((sum, s) => sum + Number(s.price || 0), 0)
    };
  });
}

function renderReports(rows) {
  const total = rows.reduce((sum, r) => sum + Number(r.totalSubscriptions || 0), 0);
  const active = rows.reduce((sum, r) => sum + Number(r.activeSubscriptions || 0), 0);
  const income = rows.reduce((sum, r) => sum + Number(r.monthlyIncome || 0), 0);

  // Cifras principales: el ingreso mensual es la que más importa, por eso va primero y más grande
  $("kpis").innerHTML = `
    <div class="kpi kpi-hero">
      <span class="kpi-label">Ingreso mensual</span>
      <strong class="kpi-value">${fmt(income)}</strong>
      <span class="kpi-sub">de las suscripciones activas</span>
    </div>
    <div class="kpi">
      <span class="kpi-label">Suscripciones activas</span>
      <strong class="kpi-value">${active}</strong>
      <span class="kpi-sub">pagando cada mes</span>
    </div>
    <div class="kpi">
      <span class="kpi-label">Suscripciones en total</span>
      <strong class="kpi-value">${total}</strong>
      <span class="kpi-sub">en cualquier estado</span>
    </div>`;

  // Barras de mayor a menor: así se ve de una vez cuál plan se vende más
  const sorted = [...rows].sort((a, b) => b.totalSubscriptions - a.totalSubscriptions);
  const max = Math.max(1, ...sorted.map(r => r.totalSubscriptions));
  $("plan-bars").innerHTML = sorted.length === 0
    ? '<p class="bars-empty">Todavía no hay planes.</p>'
    : sorted.map(r => `
      <div class="bar-row" tabindex="0" aria-label="${escapeHtml(r.planName)}: ${r.totalSubscriptions} suscripciones, ${r.activeSubscriptions} activas, ingreso ${fmt(r.monthlyIncome)}">
        <span class="bar-name">${escapeHtml(r.planName)}</span>
        <span class="bar-track">
          <span class="bar-fill" style="width: ${(r.totalSubscriptions / max) * 85}%"></span>
          <span class="bar-value">${r.totalSubscriptions}</span>
        </span>
        <span class="bar-tip" hidden>
          <strong>${escapeHtml(r.planName)}</strong><br>
          ${plural(r.totalSubscriptions, "suscripción", "suscripciones")}, ${r.activeSubscriptions} ${r.activeSubscriptions === 1 ? "activa" : "activas"}<br>
          Ingreso mensual: ${fmt(r.monthlyIncome)}
        </span>
      </div>`).join("");

  $("plan-table").innerHTML = sorted.length === 0
    ? '<tr class="table-message"><td colspan="4">Todavía no hay planes.</td></tr>'
    : sorted.map(r => `
      <tr>
        <td class="strong">${escapeHtml(r.planName)}</td>
        <td class="num">${r.totalSubscriptions}</td>
        <td class="num">${r.activeSubscriptions}</td>
        <td class="num">${fmt(r.monthlyIncome)}</td>
      </tr>`).join("") + `
      <tr class="total-row">
        <td class="strong">Total</td>
        <td class="num strong">${total}</td>
        <td class="num strong">${active}</td>
        <td class="num strong">${fmt(income)}</td>
      </tr>`;
}

// Muestra u oculta el recuadro de detalle de una barra
function toggleTip(event, show) {
  const row = event.target.closest(".bar-row");
  if (!row) return;
  if (!show && event.relatedTarget && row.contains(event.relatedTarget)) return;
  row.querySelector(".bar-tip").hidden = !show;
}

/* ------------------------------------------------------------
   EVENTOS
   ------------------------------------------------------------ */
function setupEvents() {
  const tabs = $("admin-tabs");
  tabs.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-key]");
    if (tab && tab.dataset.key !== state.key) selectTab(tab.dataset.key);
  });
  // Flechas izquierda/derecha para moverse entre pestañas con el teclado
  tabs.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const keys = TAB_KEYS;
    const next = keys[(keys.indexOf(state.key) + (e.key === "ArrowRight" ? 1 : keys.length - 1)) % keys.length];
    selectTab(next);
    $(`tab-${next}`).focus();
  });

  $("search").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderTable();
  });

  $("btn-new").addEventListener("click", () => openForm());

  // Un solo "escuchador" para todos los botones de la tabla (Editar, Eliminar, Activar)
  $("table-body").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const row = findRow(btn.dataset.id);
    if (!row) return;
    if (btn.dataset.action === "edit") openForm(row);
    if (btn.dataset.action === "delete") askDelete(row);
    if (btn.dataset.action === "activate") activateRow(row);
    if (btn.dataset.action === "equipment") openEquipmentDialog(row);
  });

  // Ventana de equipos asignados
  $("assigned-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove]");
    if (btn) removeEquipment(btn.dataset.remove);
  });
  $("assign-form").addEventListener("submit", assignEquipment);

  // Filtros e informes
  $("filters").addEventListener("submit", applyFilters);
  $("filter-clear").addEventListener("click", clearFilters);
  $("reports-refresh").addEventListener("click", loadReports);
  $("plan-bars").addEventListener("mouseover", (e) => toggleTip(e, true));
  $("plan-bars").addEventListener("mouseout", (e) => toggleTip(e, false));
  $("plan-bars").addEventListener("focusin", (e) => toggleTip(e, true));
  $("plan-bars").addEventListener("focusout", (e) => toggleTip(e, false));

  $("record-form").addEventListener("submit", saveForm);

  // Cuando la persona corrige un campo con error, el error se quita
  $("form-fields").addEventListener("input", (e) => {
    const field = e.target.closest(".admin-field");
    if (field && field.classList.contains("has-error")) field.classList.remove("has-error");
  });

  // Botones "Cancelar" y "X" de las dos ventanas
  document.querySelectorAll("[data-close]").forEach(btn =>
    btn.addEventListener("click", () => btn.closest("dialog").close()));

  $("btn-confirm").addEventListener("click", async () => {
    $("confirm-dialog").close();
    if (state.pendingAction) await state.pendingAction();
    state.pendingAction = null;
  });

  $("btn-retry").addEventListener("click", () => {
    delete demoStore[state.key];   // olvidar los datos de ejemplo y volver a intentar con el backend
    loadRows();
  });
}

/* ------------------------------------------------------------
   INICIO: abre la pestaña que diga la dirección (admin.html#customers) o Planes
   ------------------------------------------------------------ */
setupEvents();
selectTab(location.hash.slice(1) || "plans");
