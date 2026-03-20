Chart.register(ChartDataLabels);
const API = "https://ulsabox-backend.onrender.com";
let chart;

async function checkAuth() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("auth") === "success") {
    window.history.replaceState({}, document.title, window.location.pathname);
    loadUser();
    analyzeEmails();
  } else {
    try {
      const res = await fetch(API + "/usuario", { credentials: "include" });
      if (res.ok) {
        loadUser();
        analyzeEmails();
      } else {
        showLogin();
      }
    } catch {
      showLogin();
    }
  }
}

function showLogin() {
  document.getElementById("login-section").style.display = "flex";
  document.getElementById("main-content").style.display = "none";
}

function connectGmail() {
  window.location.href = API + "/login";
}

async function loadUser() {
  try {
    const res = await fetch(API + "/usuario", { credentials: "include" });
    const data = await res.json();
    document.getElementById("user-email").textContent = data.email;
    document.getElementById("user-name").textContent = data.nombre;
    document.getElementById("login-section").style.display = "none";
    document.getElementById("main-content").style.display = "block";
  } catch {
    showLogin();
  }
}

async function analyzeEmails() {
  addActivity("Conectando con Gmail...");
  try {
    const res = await fetch(API + "/correos", { credentials: "include" });
    const correos = await res.json();

    let important = 0;
    let promotions = 0;
    const categorias = {};
    const remitentes = {};

    correos.forEach(correo => {
      const cat = correo.categoria;
      categorias[cat] = (categorias[cat] || 0) + 1;
      if (cat === "Trabajo" || cat === "Banco" || cat === "Universidad") important++;
      else if (cat === "Promociones") promotions++;

      const remitente = correo.remitente.replace(/<.*?>/g, "").trim();
      remitentes[remitente] = (remitentes[remitente] || 0) + 1;
    });

    animate("total", correos.length);
    animate("important", important);
    animate("deleted", promotions);

    createChart(categorias, correos.length);
    createRemitentes(remitentes);

    correos.forEach(correo => {
      addActivity("📧 [" + correo.categoria + "] " + correo.asunto);
    });

  } catch (error) {
    addActivity("❌ Error conectando con el servidor.");
  }
}

function createChart(categorias, total) {
  const ctx = document.getElementById("chart");
  if (chart) chart.destroy();

  const labels = Object.keys(categorias);
  const values = Object.values(categorias);
  const colors = ["#facc15","#34d399","#60a5fa","#f87171","#a78bfa","#fb923c","#10b981"];

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: "#fff"
      }]
    },
    options: {
      cutout: "60%",
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: "#374151",
            font: { size: 12 },
            generateLabels: (chart) => {
              return chart.data.labels.map((label, i) => ({
                text: label + "   " + Math.round(values[i] / total * 100) + "%",
                fillStyle: colors[i],
                strokeStyle: colors[i],
                lineWidth: 0,
                index: i
              }));
            }
          }
        },
        datalabels: {
          color: "#fff",
          font: { weight: "bold", size: 11 },
          formatter: (value) => Math.round(value / total * 100) + "%"
        }
      }
    }
  });
}

function createRemitentes(remitentes) {
  const sorted = Object.entries(remitentes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const max = sorted[0]?.[1] || 1;
  const container = document.getElementById("remitentes-container");

  container.innerHTML = sorted.map(([nombre, count]) => {
    const pct = Math.round(count / max * 100);
    return "<div style='margin-bottom:14px'><div style='display:flex;justify-content:space-between;margin-bottom:4px'><span style='font-size:13px;color:#374151'>" + nombre.substring(0, 28) + "</span><span style='font-size:13px;font-weight:600;color:#374151'>" + count + "</span></div><div style='background:#e5e7eb;border-radius:10px;height:8px'><div style='background:#3b82f6;width:" + pct + "%;height:8px;border-radius:10px;transition:width 0.8s'></div></div></div>";
  }).join("");
}

function cleanPromotions() {
  addActivity("🧹 Limpiando promociones...");
}

function addActivity(text) {
  const li = document.createElement("li");
  li.style = "padding:10px 12px;border-radius:10px;background:#f9fafb;font-size:13px;color:#374151;border:1px solid #e5e7eb";
  li.innerText = text;
  document.getElementById("activity").prepend(li);
}

function animate(id, value) {
  let el = document.getElementById(id);
  let start = 0;
  let interval = setInterval(() => {
    start += Math.ceil(value / 20);
    if (start >= value) { start = value; clearInterval(interval); }
    el.innerText = start;
  }, 30);
}

checkAuth();
