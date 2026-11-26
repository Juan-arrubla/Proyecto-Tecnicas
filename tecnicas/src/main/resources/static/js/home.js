/* ============================================================
   home.js: página pública (index.html)
   Necesita que api.js se cargue antes (ahí están apiRequest, loadResource, fmt...).
   ============================================================ */

/* ------------------------------------------------------------
   DATOS QUE SE LLENAN AL CARGAR LA PÁGINA
   Los planes y la promoción vienen del backend (/api/plans y /api/promotions).
   ------------------------------------------------------------ */
let activePlans = [];     // solo los planes con active = true
let activePromo = null;   // la promoción vigente hoy, o null si no hay

/* Los equipos de la sección "Equipos para tu instalación" son solo informativos:
   los aparatos que de verdad se entregan los asigna el administrador al instalar
   (eso queda en la tabla equipment_subscription). */
const EQUIPMENT = [
  { name: "Router WiFi 6 doble banda", brand: "TP-Link", price: 0, chargeType: "incluido",
    detail: "Cubre una casa de hasta dos pisos.", icon: "router" },
  { name: "Decodificador de TV HD", brand: "Huawei", price: 15000, chargeType: "mensual",
    detail: "Para ver canales en un televisor.", icon: "tv" },
  { name: "Repetidor de señal", brand: "Mercusys", price: 89000, chargeType: "unico",
    detail: "Lleva el WiFi a cuartos lejanos o al segundo piso.", icon: "mesh" }
];

// Precio mensual del plan con la promoción vigente.
// Usa la misma cuenta que hace el backend al guardar la suscripción (ver discountedPrice en api.js),
// así el precio que ve la persona es el mismo que queda guardado.
function finalPrice(plan) {
  return discountedPrice(plan.price, activePromo ? activePromo.discountPercentage : 0);
}

function planCopy(plan) {
  const s = plan.connectionSpeed;
  if (s <= 150) return { for: "Para 1 o 2 personas que navegan y ven videos.",
    features: ["Ideal para redes y clases virtuales", "Router WiFi 6 incluido", "Soporte técnico local"] };
  if (s <= 400) return { for: "Para familias con varios celulares y un televisor.",
    features: ["Series en HD en varios aparatos a la vez", "Router WiFi 6 incluido", "Soporte técnico local"] };
  if (s <= 700) return { for: "Para casas con muchas personas conectadas al tiempo.",
    features: ["Televisores 4K y videollamadas sin cortes", "Router WiFi 6 incluido", "Visita técnica prioritaria"] };
  return { for: "Para locales, oficinas y casas con cámaras.",
    features: ["Datáfono, cámaras y equipos de oficina", "Router WiFi 6 incluido", "Atención prioritaria por celular"] };
}

const checkIcon = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/* ------------------------------------------------------------
   MAPA TOPOGRÁFICO DEL HERO
   Anillos irregulares alrededor de "picos", como las curvas de nivel de un mapa.
   Las líneas van de rojo a naranja, igual que el símbolo del logo.
   ------------------------------------------------------------ */
function drawTopoMap() {
  const svg = document.getElementById("hero-map");
  const W = 1400, H = 760;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("preserveAspectRatio", "xMaxYMid slice");
  const ns = "http://www.w3.org/2000/svg";

  const defs = document.createElementNS(ns, "defs");
  defs.innerHTML = `
    <linearGradient id="topo-stroke" gradientUnits="userSpaceOnUse" x1="600" y1="0" x2="1400" y2="0">
      <stop offset="0" stop-color="#D41019"/>
      <stop offset=".5" stop-color="#E94F19"/>
      <stop offset="1" stop-color="#F07A10"/>
    </linearGradient>
    <linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity="1"/>
      <stop offset=".42" stop-color="#000" stop-opacity=".85"/>
      <stop offset=".7" stop-color="#000" stop-opacity="0"/>
    </linearGradient>`;
  svg.appendChild(defs);

  const peaks = [
    { x: 1040, y: 330, rings: 22, step: 21, seed: 0.0 },
    { x: 1330, y: 640, rings: 12, step: 19, seed: 2.1 },
    { x: 720,  y: 760, rings: 10, step: 22, seed: 4.3 }
  ];

  peaks.forEach((peak, pi) => {
    for (let k = 1; k <= peak.rings; k++) {
      const r = k * peak.step;
      let d = "";
      for (let i = 0; i <= 90; i++) {
        const t = (i / 90) * Math.PI * 2;
        // Sumar varias ondas seno hace que el anillo se vea natural y no un círculo
        const wobble = 1
          + 0.16 * Math.sin(3 * t + peak.seed + k * 0.17)
          + 0.07 * Math.sin(5 * t + peak.seed * 2 - k * 0.11)
          + 0.04 * Math.sin(9 * t + k * 0.3);
        const x = peak.x + Math.cos(t) * r * wobble * 1.25;
        const y = peak.y + Math.sin(t) * r * wobble * 0.92;
        d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
      }
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", d + "Z");
      path.setAttribute("fill", "none");
      const isIndex = k % 5 === 0;   // cada quinta curva más marcada, como en los mapas reales
      path.setAttribute("stroke", "url(#topo-stroke)");
      path.setAttribute("stroke-opacity", isIndex ? (pi === 0 ? 0.85 : 0.5) : (pi === 0 ? 0.32 : 0.2));
      path.setAttribute("stroke-width", isIndex ? 1.6 : 1);
      svg.appendChild(path);
    }
  });

  // Antena en el pico principal y la señal que se expande
  const g = document.createElementNS(ns, "g");
  g.innerHTML = `
    <circle class="signal-ring" cx="${peaks[0].x}" cy="${peaks[0].y}" r="120"/>
    <circle class="signal-ring" cx="${peaks[0].x}" cy="${peaks[0].y}" r="120"/>
    <circle class="signal-ring" cx="${peaks[0].x}" cy="${peaks[0].y}" r="120"/>
    <circle cx="${peaks[0].x}" cy="${peaks[0].y}" r="7" fill="#F07A10"/>
    <circle cx="${peaks[0].x}" cy="${peaks[0].y}" r="15" fill="none" stroke="#F07A10" stroke-width="2"/>`;
  svg.appendChild(g);

  // Degradado a la izquierda para que el texto siempre se lea sobre el mapa
  const fade = document.createElementNS(ns, "rect");
  fade.setAttribute("width", W);
  fade.setAttribute("height", H);
  fade.setAttribute("fill", "url(#fade)");
  svg.appendChild(fade);
}

/* ------------------------------------------------------------
   PROMOCIÓN Y CUENTA REGRESIVA
   ------------------------------------------------------------ */
function setupPromo() {
  const band = document.getElementById("promo-band");
  if (!activePromo) return;   // no hay promoción vigente: la franja queda oculta

  band.hidden = false;
  const end = parseDate(activePromo.finalDate, true);
  const endText = end.toLocaleDateString("es-CO", { day: "numeric", month: "long" });

  document.getElementById("promo-title").textContent =
    `${activePromo.name}: ${Number(activePromo.discountPercentage)} % de descuento en tu mensualidad`;
  document.getElementById("promo-sub").textContent =
    `Aplica para todos los planes si te suscribes hasta el ${endText}.`;

  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    const diff = Math.max(0, end - new Date());
    const s = Math.floor(diff / 1000);
    document.getElementById("cd-days").textContent = pad(Math.floor(s / 86400));
    document.getElementById("cd-hours").textContent = pad(Math.floor((s % 86400) / 3600));
    document.getElementById("cd-mins").textContent = pad(Math.floor((s % 3600) / 60));
    document.getElementById("cd-secs").textContent = pad(s % 60);
    if (diff === 0) band.hidden = true;
  }
  tick();
  setInterval(tick, 1000);
}

/* ------------------------------------------------------------
   TARJETAS DE PLANES
   ------------------------------------------------------------ */
function renderPlans() {
  const grid = document.getElementById("plans-grid");
  if (activePlans.length === 0) {
    grid.innerHTML = '<p class="plans-note">En este momento no hay planes disponibles. Escríbenos y te contamos cuándo vuelven.</p>';
    return;
  }

  // Si hay al menos tres planes, se destaca el segundo más económico: suele ser el que más se vende
  const featuredId = activePlans.length >= 3 ? activePlans[1].planId : null;

  grid.innerHTML = activePlans.map(plan => {
    const copy = planCopy(plan);
    const featured = plan.planId === featuredId;
    const price = finalPrice(plan);
    const priceHtml = activePromo
      ? `<del>Antes ${fmt(plan.price)}</del>
         <span class="now">${fmt(price)} <small>/ mes</small></span>
         <span class="save">Ahorras ${fmt(plan.price - price)} al mes</span>`
      : `<span class="now">${fmt(price)} <small>/ mes</small></span>`;

    return `
      <article class="plan ${featured ? "plan-featured" : ""}">
        ${featured ? '<span class="plan-tag">El más escogido</span>' : ""}
        <h3 class="plan-name">${escapeHtml(plan.name)}</h3>
        <p class="plan-for">${copy.for}</p>
        <p class="plan-speed"><strong>${plan.connectionSpeed}</strong><span>Mbps</span></p>
        <div class="plan-price">${priceHtml}</div>
        <ul class="plan-features">
          ${copy.features.map(f => `<li>${checkIcon}<span>${f}</span></li>`).join("")}
        </ul>
        <button class="btn ${featured ? "btn-primary" : "btn-dark"}" type="button" data-choose="${plan.planId}">
          Escoger ${escapeHtml(plan.name)}
        </button>
      </article>`;
  }).join("");
}

/* ------------------------------------------------------------
   LISTA DE EQUIPOS
   ------------------------------------------------------------ */
const equipmentIcons = {
  router: '<svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 13V6M17 13V6M7.5 16.5h.01M11 16.5h.01"/></svg>',
  tv: '<svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  mesh: '<svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="16" r="2"/><path d="M8.5 12.5a5 5 0 0 1 7 0M5.5 9.5a9 9 0 0 1 13 0"/></svg>'
};

function chargeLabel(item) {
  if (item.chargeType === "incluido") return '<span class="charge charge-included">Incluido</span>';
  if (item.chargeType === "mensual") return '<span class="charge charge-monthly">Pago mensual</span>';
  return '<span class="charge charge-once">Pago único</span>';
}

function renderEquipment() {
  document.getElementById("equipment-list").innerHTML = EQUIPMENT.map(item => `
    <li class="equipment-item">
      <div class="equipment-icon">${equipmentIcons[item.icon]}</div>
      <div>
        <h3>${item.name}</h3>
        <p>${item.brand}. ${item.detail}</p>
      </div>
      ${chargeLabel(item)}
      <div class="equipment-price">
        ${fmt(item.price)}
        <small>${item.chargeType === "mensual" ? "cada mes" : item.chargeType === "unico" ? "una sola vez" : "con cualquier plan"}</small>
      </div>
    </li>`).join("");
}

/* ------------------------------------------------------------
   RECOMENDADOR
   Suma las megas de los usos marcados, la multiplica por las personas
   (no todas usan todo al tiempo, por eso el 0.7) y deja un 30 % de margen.
   Luego busca el plan más pequeño que alcance.
   ------------------------------------------------------------ */
let recommendedPlanId = null;

function updateRecommendation() {
  const people = Number(document.getElementById("people").value);
  document.getElementById("people-out").textContent = people === 1 ? "1 persona" : `${people} personas`;
  if (activePlans.length === 0) return;

  const perPerson = [...document.querySelectorAll("#uses input:checked")]
    .reduce((total, input) => total + Number(input.dataset.mbps), 0);
  const need = Math.max(10, Math.round(perPerson * Math.max(1, people * 0.7) * 1.3));

  const sorted = [...activePlans].sort((a, b) => a.connectionSpeed - b.connectionSpeed);
  const plan = sorted.find(p => p.connectionSpeed >= need) || sorted[sorted.length - 1];
  recommendedPlanId = plan.planId;

  document.getElementById("need-mbps").textContent = `${need} Mbps`;
  const maxSpeed = sorted[sorted.length - 1].connectionSpeed;
  document.getElementById("need-bar").style.width = Math.min(100, (need / maxSpeed) * 100) + "%";
  document.getElementById("rec-name").innerHTML = `${escapeHtml(plan.name)}`;
  document.getElementById("rec-why").textContent =
    need > plan.connectionSpeed
      ? `Es nuestro plan más rápido. Por ${fmt(finalPrice(plan))} al mes.`
      : `${plan.connectionSpeed} Mbps: te sobra margen para que nadie se quede sin señal. Por ${fmt(finalPrice(plan))} al mes.`;
  document.getElementById("rec-choose").textContent = `Escoger ${plan.name}`;
}

/* ------------------------------------------------------------
   FORMULARIO DE SUSCRIPCIÓN (en tres pasos)

   El paso 1 tiene dos modos:
   - "new":       cliente nuevo. Pide todos sus datos.
   - "returning": "Ya me he suscrito antes". Pide cédula y el correo con el que se
                  registró, y el backend verifica que coincidan (POST /api/customers/verify).
   Los pasos 2 y 3 son iguales para los dos.
   Al confirmar se manda todo a POST /api/subscriptions/request.
   ------------------------------------------------------------ */
const form = document.getElementById("sub-form");
const planSelect = document.getElementById("plan_id");
let currentStep = 1;
let mode = "new";            // "new" o "returning"
let verifiedName = "";       // nombre que devolvió el backend al verificar (para saludar)

function fillPlanSelect() {
  planSelect.innerHTML = '<option value="">Escoge un plan</option>' +
    activePlans.map(p => `<option value="${p.planId}">${escapeHtml(p.name)}, ${p.connectionSpeed} Mbps (${fmt(finalPrice(p))} / mes)</option>`).join("");
}

// Reglas de validación: devuelven true si el valor está bien
const rules = {
  id_card:    v => /^\d{6,10}$/.test(v),
  first_name: v => v.trim().length >= 2,
  last_name:  v => v.trim().length >= 2,
  phone:      v => /^3\d{9}$/.test(v),
  email:      v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  address:    v => v.trim().length >= 8 && v.trim().length <= 45,   // la columna es VARCHAR(45)
  plan_id:    v => v !== ""
};

// La gente escribe la cédula y el celular con puntos o espacios: se los quitamos
function cleanValue(input) {
  if (input.id === "id_card" || input.id === "phone") return input.value.replace(/[\s.\-]/g, "");
  return input.value;
}
const val = (id) => document.getElementById(id).value.trim();
const cedula = () => Number(cleanValue(document.getElementById("id_card")));

function validateField(input) {
  const ok = rules[input.id](cleanValue(input));
  input.closest(".field").classList.toggle("has-error", !ok);
  input.setAttribute("aria-invalid", String(!ok));
  return ok;
}

// Valida solo los campos visibles del paso (en modo "returning" los de cliente nuevo están ocultos)
function validateStep(step) {
  const inputs = [...form.querySelectorAll(`[data-step="${step}"] input[id], [data-step="${step}"] select`)]
    .filter(el => rules[el.id] && !el.closest("[hidden]"));
  const results = inputs.map(validateField);
  const firstBad = inputs[results.indexOf(false)];
  if (firstBad) firstBad.focus();
  return results.every(Boolean);
}

/* ---------- Mensajes dentro del formulario ---------- */
// action (opcional): un botón dentro del mensaje, por ejemplo "Registrarme como cliente nuevo"
function showAlert(text, kind = "error", action = null) {
  const box = document.getElementById("form-alert");
  box.className = `form-alert ${kind === "error" ? "" : "is-" + kind}`;
  box.innerHTML = escapeHtml(text) + (action
    ? ` <button type="button" class="alert-action" data-alert-action="${action.id}">${escapeHtml(action.label)}</button>`
    : "");
  box.hidden = false;
}
function hideAlert() { document.getElementById("form-alert").hidden = true; }

/* ---------- Modo del paso 1 ---------- */
function setMode(newMode) {
  mode = newMode;
  verifiedName = "";
  hideAlert();
  document.querySelectorAll("#mode-switch [data-mode]").forEach(b =>
    b.setAttribute("aria-checked", String(b.dataset.mode === mode)));
  // Los campos de cliente nuevo (nombre, apellido, celular) solo se ven en modo "new"
  document.querySelectorAll('[data-only="new"]').forEach(el => (el.hidden = mode !== "new"));
  document.getElementById("step1-title").textContent = mode === "new" ? "Tus datos" : "Verifica que eres tú";
  document.getElementById("step1-text").textContent = mode === "new"
    ? "Los usamos para el contrato y para llamarte a coordinar."
    : "Escribe tu cédula y el correo con el que te registraste la primera vez.";
  document.getElementById("email-label").textContent = mode === "new" ? "Correo electrónico" : "Correo con el que te registraste";
  form.querySelectorAll(".has-error").forEach(el => el.classList.remove("has-error"));
}

/* ---------- Pasos ---------- */
function showStep(step) {
  currentStep = step;
  form.querySelectorAll(".form-step").forEach(el => (el.hidden = Number(el.dataset.step) !== step));
  document.querySelectorAll("#steps li").forEach((li, i) => {
    li.classList.toggle("is-active", i + 1 === step);
    li.classList.toggle("is-done", i + 1 < step);
  });
  document.getElementById("btn-back").hidden = step === 1;
  document.getElementById("btn-next").textContent = step === 3 ? "Enviar solicitud" : "Continuar";
  document.getElementById("step2-text").textContent = verifiedName
    ? `Hola, ${verifiedName}. Dinos dónde instalamos esta vez y qué plan quieres.`
    : "Dinos dónde instalamos y qué plan quieres.";
  if (step === 3) renderReview();
}

function selectedPlan() {
  return activePlans.find(p => String(p.planId) === planSelect.value) || null;
}

function renderSummary() {
  const plan = selectedPlan();
  const body = document.getElementById("summary-body");

  if (!plan) {
    body.innerHTML = `<p class="summary-empty">Todavía no has escogido un plan. Puedes hacerlo en el paso 2 o desde las tarjetas de planes.</p>
      <div class="sum-total"><span>Total mensual</span><strong>${fmt(0)}</strong></div>`;
    return;
  }

  body.innerHTML = `
    <div class="summary-plan"><strong>${plan.connectionSpeed}</strong><span>Mbps, ${escapeHtml(plan.name)}</span></div>
    <ul class="sum-lines">
      <li><span>Mensualidad del plan</span><span>${fmt(plan.price)}</span></li>
      ${activePromo ? `<li class="discount"><span>${escapeHtml(activePromo.name)} (−${Number(activePromo.discountPercentage)} %)</span><span>−${fmt(plan.price - finalPrice(plan))}</span></li>` : ""}
      <li><span>Router WiFi 6</span><span>Incluido</span></li>
    </ul>
    <div class="sum-total"><span>Total mensual</span><strong>${fmt(finalPrice(plan))}</strong></div>`;
}

function renderReview() {
  const plan = selectedPlan();
  const rows = mode === "new"
    ? [["Nombre", `${val("first_name")} ${val("last_name")}`],
       ["Cédula", String(cedula())],
       ["Celular", cleanValue(document.getElementById("phone"))],
       ["Correo", val("email")]]
    : [["Cliente", `${verifiedName} (ya registrado)`],
       ["Cédula", String(cedula())]];
  rows.push(["Dirección", val("address")],
            ["Plan", plan ? `${plan.name}, ${plan.connectionSpeed} Mbps` : "Sin escoger"],
            ["Total mensual", plan ? fmt(finalPrice(plan)) : fmt(0)]);
  document.getElementById("review").innerHTML = rows
    .map(([k, v]) => `<div class="review-row"><span>${k}</span><span>${escapeHtml(v)}</span></div>`).join("");
}

/* ---------- Pedido 1: verificar al cliente que vuelve ---------- */
async function verifyCustomer() {
  const body = { customerId: cedula(), email: val("email") };
  try {
    const result = await apiRequest(VERIFY_PATH, { method: "POST", body });
    verifiedName = result && result.firstName ? result.firstName : "de nuevo";
    return true;
  } catch (error) {
    if (isMissingEndpoint(error)) {
      // Sin backend (o sin ese endpoint todavía): se verifica contra los clientes de ejemplo
      const match = DEMO_DATA.customers.find(c =>
        c.customerId === body.customerId && c.email.toLowerCase() === body.email.toLowerCase());
      if (match) { verifiedName = match.firstName; return true; }
    }
    if (isMissingEndpoint(error) || error.status === 404) {
      showAlert("Los datos no coinciden con ningún cliente. Revisa la cédula y el correo, o si es tu primera vez, regístrate como cliente nuevo.",
        "error", { id: "to-new", label: "Registrarme como cliente nuevo" });
    } else {
      showAlert("No pudimos verificar tus datos en este momento. Intenta de nuevo en unos minutos.");
    }
    return false;
  }
}

/* ---------- Pedido 2: enviar la solicitud ---------- */
// Lo que se manda al backend. No lleva precio, fecha ni estado: eso lo decide el backend.
function buildPayload() {
  const customer = mode === "new"
    ? { customerId: cedula(), firstName: val("first_name"), lastName: val("last_name"),
        phoneNumber: cleanValue(document.getElementById("phone")), email: val("email") }
    : { customerId: cedula(), email: val("email") };
  return {
    newCustomer: mode === "new",
    customer,
    planId: Number(planSelect.value),
    address: val("address")
  };
}

async function submitSubscription() {
  const accept = document.getElementById("accept");
  const acceptError = document.getElementById("accept-error");
  acceptError.style.display = accept.checked ? "none" : "block";
  if (!accept.checked) { accept.focus(); return; }

  const payload = buildPayload();
  const btn = document.getElementById("btn-next");
  btn.disabled = true;
  btn.textContent = "Enviando...";
  hideAlert();

  try {
    const subscription = await apiRequest(REQUEST_PATH, { method: "POST", body: payload });
    showSuccess(payload, subscription, false);
  } catch (error) {
    if (isMissingEndpoint(error)) {
      // El backend no está o todavía no tiene ese endpoint: se muestra cómo se vería, sin guardar nada
      showSuccess(payload, null, true);
    } else if (error.status === 409) {
      // Cliente nuevo con una cédula que ya existe
      showAlert(error.serverMessage || "Ya estás registrado con esta cédula. Usa la opción \"Ya me he suscrito antes\".",
        "info", { id: "to-returning", label: "Usar \"Ya me he suscrito antes\"" });
    } else if (error.status === 404) {
      // Cliente que vuelve, pero la cédula y el correo no coinciden
      showAlert("Los datos no coinciden con ningún cliente. Vuelve al paso 1 y revisa la cédula y el correo.",
        "error", { id: "to-step1", label: "Volver al paso 1" });
    } else if (error.status === 400) {
      // Plan que ya no existe o que se desactivó
      showAlert(error.serverMessage || "El plan que escogiste ya no está disponible. Escoge otro en el paso 2.",
        "error", { id: "to-step2", label: "Escoger otro plan" });
    } else {
      showAlert("No pudimos enviar tu solicitud en este momento. Intenta de nuevo en unos minutos.");
    }
  } finally {
    btn.disabled = false;
    btn.textContent = "Enviar solicitud";
  }
}

function showSuccess(payload, subscription, demo) {
  const name = mode === "new" ? payload.customer.firstName : verifiedName;
  document.getElementById("success-text").textContent = mode === "new"
    ? `${name}, te llamamos al ${payload.customer.phoneNumber} en las próximas 24 horas para agendar la instalación.`
    : `${name}, te llamamos al celular que tienes registrado en las próximas 24 horas para agendar la instalación.`;
  // El número de radicado es el subscriptionId que le puso MySQL
  document.getElementById("ticket-number").textContent = subscription
    ? `N.º ${subscription.subscriptionId}`
    : "Sin número (modo demostración)";
  document.getElementById("demo-note").hidden = !demo;
  document.getElementById("json-preview").textContent =
    "Pedido:\nPOST " + API_BASE + REQUEST_PATH + "\n" + JSON.stringify(payload, null, 2) +
    (subscription ? "\n\nRespuesta del backend:\n" + JSON.stringify(subscription, null, 2) : "");
  document.getElementById("success-dialog").showModal();
}

function resetForm() {
  form.reset();
  form.querySelectorAll(".has-error").forEach(el => el.classList.remove("has-error"));
  document.getElementById("accept-error").style.display = "none";
  setMode("new");
  showStep(1);
  renderSummary();
}

// Lleva a la persona al formulario con el plan ya escogido
function choosePlan(planId) {
  planSelect.value = String(planId);
  planSelect.closest(".field").classList.remove("has-error");
  renderSummary();
  document.getElementById("suscripcion").scrollIntoView();
  setTimeout(() => {
    const first = currentStep === 1 ? document.getElementById("id_card") : planSelect;
    first.focus({ preventScroll: true });
  }, 450);
}

/* ------------------------------------------------------------
   EVENTOS
   ------------------------------------------------------------ */
function setupEvents() {
  // Menú en celular
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById("main-nav");
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("is-open", !open);
  });
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    }
  });

  document.getElementById("plans-grid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-choose]");
    if (btn) choosePlan(btn.dataset.choose);
  });

  document.getElementById("people").addEventListener("input", updateRecommendation);
  document.getElementById("uses").addEventListener("change", updateRecommendation);
  document.getElementById("rec-choose").addEventListener("click", () => {
    if (recommendedPlanId !== null) choosePlan(recommendedPlanId);
  });

  // "Soy cliente nuevo" / "Ya me he suscrito antes"
  document.getElementById("mode-switch").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mode]");
    if (btn && btn.dataset.mode !== mode) setMode(btn.dataset.mode);
  });

  // Botones que aparecen dentro de los mensajes
  document.getElementById("form-alert").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-alert-action]");
    if (!btn) return;
    const action = btn.dataset.alertAction;
    if (action === "to-new") { setMode("new"); document.getElementById("first_name").focus(); }
    if (action === "to-returning") { setMode("returning"); showStep(1); document.getElementById("email").focus(); }
    if (action === "to-step1") { hideAlert(); showStep(1); }
    if (action === "to-step2") { hideAlert(); showStep(2); planSelect.focus(); }
  });

  planSelect.addEventListener("change", renderSummary);

  // Validar cuando la persona sale del campo (no mientras escribe: eso molesta)
  form.addEventListener("focusout", (e) => {
    if (rules[e.target.id] && e.target.value !== "") validateField(e.target);
  });
  form.addEventListener("input", (e) => {
    const field = e.target.closest(".field");
    if (field && field.classList.contains("has-error") && rules[e.target.id]) validateField(e.target);
  });

  document.getElementById("btn-next").addEventListener("click", async () => {
    if (currentStep === 3) { submitSubscription(); return; }
    if (!validateStep(currentStep)) return;
    hideAlert();

    // En modo "ya me he suscrito antes", antes de pasar al paso 2 se le pregunta al backend
    if (currentStep === 1 && mode === "returning") {
      const btn = document.getElementById("btn-next");
      btn.disabled = true;
      btn.textContent = "Verificando...";
      const ok = await verifyCustomer();
      btn.disabled = false;
      btn.textContent = "Continuar";
      if (!ok) return;
    }
    showStep(currentStep + 1);
  });
  document.getElementById("btn-back").addEventListener("click", () => { hideAlert(); showStep(currentStep - 1); });

  document.getElementById("accept").addEventListener("change", (e) => {
    if (e.target.checked) document.getElementById("accept-error").style.display = "none";
  });

  document.getElementById("close-dialog").addEventListener("click", () => {
    document.getElementById("success-dialog").close();
    resetForm();
  });
}

/* ------------------------------------------------------------
   INICIO
   Primero se dibuja lo que no depende de datos; después se piden los
   planes y las promociones al backend y se llena el resto.
   ------------------------------------------------------------ */
async function init() {
  drawTopoMap();
  renderEquipment();
  setupEvents();
  setMode("new");

  // Las dos peticiones salen al mismo tiempo; Promise.all espera a que terminen ambas
  const [plansResult, promosResult] = await Promise.all([loadResource("plans"), loadResource("promotions")]);

  activePlans = plansResult.data
    .filter(p => p.active)                                     // solo los activos se publican
    .sort((a, b) => a.connectionSpeed - b.connectionSpeed);
  activePromo = findActivePromotion(promosResult.data);

  if (plansResult.demo) {
    const note = document.getElementById("plans-source");
    note.textContent = "Se están mostrando planes de ejemplo porque no se pudo conectar con el backend.";
    note.hidden = false;
  }

  setupPromo();
  renderPlans();
  fillPlanSelect();
  renderSummary();
  updateRecommendation();
}

init();
