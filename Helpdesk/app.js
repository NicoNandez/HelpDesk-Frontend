// === CONFIG ===
// Cambia aquí si tu API está en otra URL
const API_BASE = "https://helpdesk-1-oxo6.onrender.com";

// === HELPERS ===
const $ = sel => document.querySelector(sel);
const show = (sel) => $(sel).classList.remove("hidden");
const hide = (sel) => $(sel).classList.add("hidden");
const setMsg = (sel, text, isError=true) => {
  const el = $(sel);
  el.textContent = text || "";
  el.style.color = isError ? "var(--danger)" : "green";
};

// === ELEMENTS ===
const loginSection = "#loginSection";
const dashboardSection = "#dashboard";

// On load
document.addEventListener("DOMContentLoaded", () => {
  const user = getSession();
  renderUserArea(user);
  if (user) {
    hide(loginSection); show(dashboardSection);
    loadCases();
  } else {
    show(loginSection); hide(dashboardSection);
  }
});

// === SESSION (localStorage) ===
function saveSession(user){ localStorage.setItem("helpdesk_user", JSON.stringify(user)); }
function getSession(){ return JSON.parse(localStorage.getItem("helpdesk_user") || "null"); }
function clearSession(){ localStorage.removeItem("helpdesk_user"); renderUserArea(null); }

// === RENDER USER AREA ===
function renderUserArea(user){
  const ua = $("#userArea");
  if (!user) {
    ua.innerHTML = "<em>No autenticado</em>";
    return;
  }
  ua.innerHTML = `Hola <strong>${user.name}</strong> (${user.role}) <button id="logoutBtn" class="secondary">Salir</button>`;
  $("#logoutBtn").addEventListener("click", () => {
    clearSession();
    location.reload();
  });
}

// === LOGIN ===
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg("#loginMsg", "Iniciando...");
  const email = $("#email").value.trim();
  const password = $("#password").value.trim();
  try {
    const res = await fetch(API_BASE + "/auth/login", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg("#loginMsg", data.message || data.error || "Error en login");
      return;
    }
    // guarda usuario simple
    saveSession(data.user);
    setMsg("#loginMsg", "Login correcto", false);
    renderUserArea(data.user);
    hide(loginSection); show(dashboardSection);
    loadCases();
  } catch (err) {
    setMsg("#loginMsg", "No se pudo contactar la API");
    console.error(err);
  }
});

// === LOAD CASES ===
async function loadCases(){
  setMsg("#casesMsg", "Cargando...", false);
  $("#casesList").innerHTML = "";
  try {
    const res = await fetch(API_BASE + "/cases");
    const list = await res.json();
    if (!Array.isArray(list)) {
      setMsg("#casesMsg", "Respuesta inesperada");
      return;
    }
    if (list.length === 0) {
      $("#casesList").innerHTML = "<li>No hay casos</li>";
    } else {
      $("#casesList").innerHTML = list.map(c => 
        `<li>
           <strong>#${c.id} ${escapeHtml(c.title)}</strong><br>
           <small>${escapeHtml(c.description || "")}</small><br>
           <em>Estado: ${c.status || "—"} • Asignado: ${c.assignedTo || c.userId || "—"}</em>
         </li>`
      ).join("");
    }
    setMsg("#casesMsg", "", false);
  } catch (err) {
    console.error(err);
    setMsg("#casesMsg", "Error cargando casos");
  }
}
$("#refreshCases").addEventListener("click", loadCases);

// === CREATE CASE ===
$("#caseForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg("#createMsg", "Creando...", false);
  const title = $("#caseTitle").value.trim();
  const description = $("#caseDesc").value.trim();
  const userId = Number($("#caseUserId").value) || 1;
  try {
    const res = await fetch(API_BASE + "/cases", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ title, description, assignedTo: userId, userId })
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg("#createMsg", data.message || "Error creando caso");
      return;
    }
    setMsg("#createMsg", "Caso creado", false);
    $("#caseTitle").value = ""; $("#caseDesc").value = "";
    loadCases();
  } catch (err) {
    console.error(err);
    setMsg("#createMsg", "Error creando caso");
  }
});

// === REPORT ===
$("#getReport").addEventListener("click", async () => {
  setMsg("#reportMsg", "Generando...", false);
  try {
    const res = await fetch(API_BASE + "/reports");
    const data = await res.json();
    $("#reportArea").textContent = JSON.stringify(data, null, 2);
    setMsg("#reportMsg", "", false);
  } catch (err) {
    console.error(err);
    setMsg("#reportMsg", "Error al generar reporte");
  }
});

// === UTIL ===
function escapeHtml(text){
  return String(text).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}
