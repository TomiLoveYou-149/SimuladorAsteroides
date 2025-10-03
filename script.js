const asteroidSelect = document.getElementById("asteroid");
const velocityInput = document.getElementById("velocityInput");
const densityInput = document.getElementById("densityInput");
const simulateBtn = document.getElementById("simulateBtn");

const inputDiameter = document.getElementById("inputDiameter");
const inputVelocity = document.getElementById("inputVelocity");
const inputDensity = document.getElementById("inputDensity");

const impactEnergyEl = document.getElementById("impactEnergy");
const craterDiameterEl = document.getElementById("craterDiameter");
const riskEl = document.getElementById("risk");
const consequenceText = document.getElementById("consequenceText");
const mitigationText = document.getElementById("mitigationText");

const canvas = document.getElementById("viz");
const ctx = canvas.getContext("2d");

const worldMap = new Image();
worldMap.src = "https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg";

const apiKey = "WN7UDKL6yLacEyLQPw66ewRt4ryJabeE8YAWNPoQ";

let craterX = canvas.width/2;
let craterY = canvas.height/2;
let craterDiameterGlobal = 0;
let isDragging = false;

async function loadAsteroids() {
  try {
    const res = await fetch(`https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=${apiKey}`);
    const data = await res.json();

    asteroidSelect.innerHTML = '<option value="">--Selecciona un asteroide--</option>';
    window.asteroidMap = {};

    data.near_earth_objects.forEach(a => {
      if(!a.name) return;
      const option = document.createElement("option");
      option.value = a.id;
      option.textContent = a.name;
      asteroidSelect.appendChild(option);
      window.asteroidMap[a.id] = a;
    });

  } catch(err) {
    console.error("Error cargando asteroides:", err);
    asteroidSelect.innerHTML = '<option value="">Error al cargar asteroides</option>';
  }
}

function simulateImpact() {
  const asteroidId = asteroidSelect.value;
  if (!asteroidId) return alert("Selecciona un asteroide.");

  const asteroid = window.asteroidMap[asteroidId];

  const diameter = (asteroid.estimated_diameter.meters.estimated_diameter_min +
                    asteroid.estimated_diameter.meters.estimated_diameter_max) / 2;

  let velocity = Number(velocityInput.value);
  let density = Number(densityInput.value);
  if (isNaN(velocity) || velocity <= 0) velocity = 1;
  if (isNaN(density) || density <= 0) density = 1;

  inputDiameter.textContent = `Diámetro ingresado: ${diameter.toFixed(1)} m (${(diameter/1000).toFixed(2)} km)`;
  inputVelocity.textContent = `Velocidad: ${velocity.toFixed(0)} m/s`;
  inputDensity.textContent = `Densidad: ${density.toFixed(0)} kg/m³`;

  const mass = (4/3) * Math.PI * Math.pow(diameter/2, 3) * density;
  const energy = 0.5 * mass * velocity * velocity;
  const energyMt = energy / 4.184e15;
  const craterDiameter = 1.5 * Math.pow(energy, 0.25);

  craterDiameterGlobal = craterDiameter;

  impactEnergyEl.textContent = `Energía liberada: ${energyMt.toFixed(2)} Mt TNT`;
  craterDiameterEl.textContent = `Diámetro estimado del cráter: ${craterDiameter.toFixed(1)} m (${(craterDiameter/1000).toFixed(2)} km)`;

  let riskLevel = "";
  if (craterDiameter > 5000) riskLevel = "Catastrófico";
  else if (craterDiameter > 1000) riskLevel = "Alto";
  else if (craterDiameter > 100) riskLevel = "Moderado";
  else riskLevel = "Bajo";

  const riskColors = {
    "Bajo":"#b3ffcc",
    "Moderado":"#fff3b3",
    "Alto":"#ffb3b3",
    "Catastrófico":"#ff4d4d"
  };
  riskEl.style.background = riskColors[riskLevel];
  riskEl.textContent = `Nivel de riesgo: ${riskLevel}`;

  let consequence = "";
  let mitigation = "";
  if(riskLevel==="Catastrófico") {
    consequence="Destrucción global: incendios masivos, tsunamis, alteración climática severa, pérdida de infraestructura crítica y riesgo de extinción masiva.";
    mitigation="Evacuación global, desviación del asteroide, preparación de infraestructura crítica y cooperación internacional inmediata.";
  } else if (riskLevel==="Alto") {
    consequence="Daños regionales: ciudades destruidas, incendios y tsunamis si impacta en océano.";
    mitigation="Planes de evacuación regional, monitoreo constante, misiones de desviación y preparación de servicios esenciales.";
  } else if (riskLevel==="Moderado") {
    consequence="Daños locales: explosión aérea, vidrios rotos y heridos leves.";
    mitigation="Alertas tempranas locales, evacuaciones puntuales y preparación de servicios de emergencia.";
  } else {
    consequence="Daños mínimos: efecto muy localizado.";
    mitigation="Monitoreo básico y planes de seguridad locales.";
  }

  consequenceText.textContent = consequence;
  mitigationText.textContent = mitigation;

  drawImpact();
}

function drawImpact() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(worldMap,0,0,canvas.width,canvas.height);

  if(craterDiameterGlobal <= 0) return;

  const minPx = 20;
  const maxPx = 400;
  let radius = craterDiameterGlobal / 50;
  radius = Math.max(radius, minPx);
  radius = Math.min(radius, maxPx);

  const gradient = ctx.createRadialGradient(craterX, craterY, 0, craterX, craterY, radius);
  gradient.addColorStop(0,"rgba(255,0,0,0.9)");
  gradient.addColorStop(0.5,"rgba(255,140,0,0.7)");
  gradient.addColorStop(0.8,"rgba(255,255,0,0.5)");
  gradient.addColorStop(1,"rgba(255,255,0,0.2)");

  ctx.beginPath();
  ctx.arc(craterX, craterY, radius, 0, 2*Math.PI);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.closePath();
}

canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const dx = mouseX - craterX;
  const dy = mouseY - craterY;
  const radius = Math.max(craterDiameterGlobal/50, 20);
  if(Math.sqrt(dx*dx + dy*dy) <= radius) isDragging = true;
});

canvas.addEventListener("mouseup", () => isDragging = false);
canvas.addEventListener("mouseleave", () => isDragging = false);
canvas.addEventListener("mousemove", e => {
  if(!isDragging) return;
  const rect = canvas.getBoundingClientRect();
  craterX = e.clientX - rect.left;
  craterY = e.clientY - rect.top;
  drawImpact();
});

simulateBtn.addEventListener("click", simulateImpact);
worldMap.onload = () => loadAsteroids();
