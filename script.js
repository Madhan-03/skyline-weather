// ============================================================
// Skyline — Weather App (Open-Meteo edition, Accurate + World Map)
// No API key. No backend. Works straight from the browser.
// Accuracy: elevation-corrected + nearest grid cell + best model
// ============================================================

// ---- DOM ----
const els = {
  searchForm: document.getElementById("searchForm"),
  cityInput: document.getElementById("cityInput"),
  locateBtn: document.getElementById("locateBtn"),
  suggestions: document.getElementById("suggestions"),
  unitToggle: document.getElementById("unitToggle"),

  emptyState: document.getElementById("emptyState"),
  loadingState: document.getElementById("loadingState"),
  loadingText: document.getElementById("loadingText"),
  errorState: document.getElementById("errorState"),
  errorTitle: document.getElementById("errorTitle"),
  errorMessage: document.getElementById("errorMessage"),
  retryBtn: document.getElementById("retryBtn"),
  content: document.getElementById("content"),
  sky: document.getElementById("sky"),

  cityName: document.getElementById("cityName"),
  cityMeta: document.getElementById("cityMeta"),
  lastUpdated: document.getElementById("lastUpdated"),
  heroIcon: document.getElementById("heroIcon"),
  currentTemp: document.getElementById("currentTemp"),
  conditionDesc: document.getElementById("conditionDesc"),
  feelsLike: document.getElementById("feelsLike"),
  statHighLow: document.getElementById("statHighLow"),
  statHumidity: document.getElementById("statHumidity"),
  statWind: document.getElementById("statWind"),
  statPressure: document.getElementById("statPressure"),

  hourlyStrip: document.getElementById("hourlyStrip"),
  forecastGrid: document.getElementById("forecastGrid"),

  insightIcon: document.getElementById("insightIcon"),
  insightTitle: document.getElementById("insightTitle"),
  insightBody: document.getElementById("insightBody"),

  // Map
  mapToggleBtn: document.getElementById("mapToggleBtn"),
  mapPanel: document.getElementById("mapPanel"),
  mapCloseBtn: document.getElementById("mapCloseBtn"),
  mapCoords: document.getElementById("mapCoords"),
  mapUseBtn: document.getElementById("mapUseBtn"),
};

// ---- State ----
const state = {
  unit: "C",
  lastCoords: null,
  lastData: null,
  lastPlace: null,
};

let debounceTimer = null;

// ============================================================
// WMO Weather Code → description + emoji
// ============================================================
const WMO = {
  0: { desc: "Clear sky", icon: "☀️", theme: "Clear" },
  1: { desc: "Mainly clear", icon: "🌤️", theme: "Clear" },
  2: { desc: "Partly cloudy", icon: "⛅", theme: "Clouds" },
  3: { desc: "Overcast", icon: "☁️", theme: "Clouds" },
  45: { desc: "Fog", icon: "🌫️", theme: "Mist" },
  48: { desc: "Depositing rime fog", icon: "🌫️", theme: "Mist" },
  51: { desc: "Light drizzle", icon: "🌦️", theme: "Drizzle" },
  53: { desc: "Moderate drizzle", icon: "🌦️", theme: "Drizzle" },
  55: { desc: "Dense drizzle", icon: "🌧️", theme: "Drizzle" },
  56: { desc: "Light freezing drizzle", icon: "🌧️", theme: "Drizzle" },
  57: { desc: "Dense freezing drizzle", icon: "🌧️", theme: "Drizzle" },
  61: { desc: "Slight rain", icon: "🌧️", theme: "Rain" },
  63: { desc: "Moderate rain", icon: "🌧️", theme: "Rain" },
  65: { desc: "Heavy rain", icon: "🌧️", theme: "Rain" },
  66: { desc: "Light freezing rain", icon: "🌧️", theme: "Rain" },
  67: { desc: "Heavy freezing rain", icon: "🌧️", theme: "Rain" },
  71: { desc: "Slight snow", icon: "🌨️", theme: "Snow" },
  73: { desc: "Moderate snow", icon: "❄️", theme: "Snow" },
  75: { desc: "Heavy snow", icon: "❄️", theme: "Snow" },
  77: { desc: "Snow grains", icon: "🌨️", theme: "Snow" },
  80: { desc: "Slight rain showers", icon: "🌦️", theme: "Rain" },
  81: { desc: "Moderate rain showers", icon: "🌧️", theme: "Rain" },
  82: { desc: "Violent rain showers", icon: "⛈️", theme: "Rain" },
  85: { desc: "Slight snow showers", icon: "🌨️", theme: "Snow" },
  86: { desc: "Heavy snow showers", icon: "❄️", theme: "Snow" },
  95: { desc: "Thunderstorm", icon: "⛈️", theme: "Thunderstorm" },
  96: { desc: "Thunderstorm with hail", icon: "⛈️", theme: "Thunderstorm" },
  99: {
    desc: "Thunderstorm with heavy hail",
    icon: "⛈️",
    theme: "Thunderstorm",
  },
};

function weatherInfo(code) {
  return WMO[code] || { desc: "Unknown", icon: "🌡️", theme: "default" };
}

// ---- Sky themes ----
const SKY_THEMES = {
  Clear: {
    a: "#ffb86b",
    b: "#4d96ff",
    bg: "linear-gradient(180deg, #0b0e1a 0%, #161229 100%)",
  },
  Clouds: {
    a: "#7fa0c9",
    b: "#4d6fa1",
    bg: "linear-gradient(180deg, #0b0e1a 0%, #11152a 100%)",
  },
  Rain: {
    a: "#4d96ff",
    b: "#2a4d7a",
    bg: "linear-gradient(180deg, #090b14 0%, #0e1424 100%)",
  },
  Drizzle: {
    a: "#4d96ff",
    b: "#7fe7e0",
    bg: "linear-gradient(180deg, #090b14 0%, #0e1424 100%)",
  },
  Thunderstorm: {
    a: "#6c5ce7",
    b: "#1a1530",
    bg: "linear-gradient(180deg, #07080f 0%, #0c0a1a 100%)",
  },
  Snow: {
    a: "#e8ecff",
    b: "#7fe7e0",
    bg: "linear-gradient(180deg, #0c0e1a 0%, #141a2a 100%)",
  },
  Mist: {
    a: "#9aa5c9",
    b: "#6c5ce7",
    bg: "linear-gradient(180deg, #0b0e1a 0%, #11152a 100%)",
  },
  default: {
    a: "#6c5ce7",
    b: "#4d96ff",
    bg: "linear-gradient(180deg, #0b0e1a 0%, #11152a 100%)",
  },
};

function applySkyTheme(themeKey) {
  const t = SKY_THEMES[themeKey] || SKY_THEMES.default;
  els.sky.style.background = t.bg;
  document.documentElement.style.setProperty("--aurora", t.a);
  document.documentElement.style.setProperty("--electric", t.b);
}

// ---- Unit helpers ----
function cToF(c) {
  return (c * 9) / 5 + 32;
}
function displayTemp(celsius) {
  const v = state.unit === "C" ? celsius : cToF(celsius);
  return Math.round(v);
}
function unitSuffix() {
  return state.unit === "C" ? "°C" : "°F";
}

// ---- View switching ----
function showState(name) {
  els.emptyState.hidden = name !== "empty";
  els.loadingState.hidden = name !== "loading";
  els.errorState.hidden = name !== "error";
  els.content.hidden = name !== "content";
}
function showError(title, message) {
  els.errorTitle.textContent = title;
  els.errorMessage.textContent = message;
  showState("error");
}

// ============================================================
// Open-Meteo API calls — with accuracy enhancements
// ============================================================

// 1) Geocoding — city name → { name, country, admin1, lat, lon }
async function geocodeCity(name) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", name);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding service unavailable.");
  const data = await res.json();
  return data.results || [];
}

// 2) Elevation — exact ground height at a coordinate (90 m resolution, free)
async function fetchElevation(lat, lon) {
  try {
    const url = new URL("https://api.open-meteo.com/v1/elevation");
    url.searchParams.set("latitude", lat);
    url.searchParams.set("longitude", lon);

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    return data.elevation?.[0] ?? null;
  } catch {
    return null;
  }
}

// 3) Forecast — lat/lon → current + hourly + daily, ACCURACY-OPTIMIZED
async function fetchWeather(lat, lon) {
  const elevation = await fetchElevation(lat, lon);

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);

  // Accuracy: nearest grid cell (no interpolation smoothing)
  url.searchParams.set("cell_selection", "nearest");

  // Accuracy: pass exact elevation for temperature downscaling
  if (elevation !== null) {
    url.searchParams.set("elevation", elevation);
  }

  // Accuracy: best available model for this location
  url.searchParams.set("models", "best_match");

  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure",
  );

  url.searchParams.set(
    "hourly",
    "temperature_2m,weather_code,precipitation_probability",
  );

  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );

  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather service unavailable.");
  const data = await res.json();

  data._requestedElevation = elevation;
  return data;
}

// ---- High-level loader ----
async function loadWeatherFor(lat, lon, placeLabel) {
  showState("loading");
  els.loadingText.textContent = placeLabel
    ? `Reading the sky over ${placeLabel}…`
    : "Reading the sky…";

  try {
    const data = await fetchWeather(lat, lon);
    state.lastCoords = { lat: Number(lat), lon: Number(lon) };
    state.lastData = data;
    state.lastPlace = placeLabel || null;

    renderAll();
    showState("content");
  } catch (err) {
    console.error(err);
    showError(
      "Couldn’t load weather",
      err.message || "Check your internet and try again.",
    );
  }
}

// ============================================================
// Rendering
// ============================================================
function renderAll() {
  const d = state.lastData;
  renderHero(d);
  renderHourly(d);
  renderForecast(d);
  renderInsight(d);
  applySkyTheme(weatherInfo(d.current.weather_code).theme);
}

function renderHero(d) {
  const cur = d.current;
  const day = d.daily;
  const info = weatherInfo(cur.weather_code);

  const cityLabel =
    state.lastPlace || `${d.latitude.toFixed(2)}°, ${d.longitude.toFixed(2)}°`;
  els.cityName.textContent = cityLabel;

  const realElevation = d.elevation ?? d._requestedElevation;
  const elevText =
    realElevation !== null && realElevation !== undefined
      ? ` · ⛰️ ${Math.round(realElevation)} m`
      : "";
  els.cityMeta.textContent = `${info.desc} · ${d.timezone}${elevText}`;

  els.lastUpdated.textContent = `Updated ${new Date(cur.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  els.heroIcon.textContent = info.icon;
  els.currentTemp.textContent = displayTemp(cur.temperature_2m);
  els.conditionDesc.textContent = info.desc;
  els.feelsLike.textContent = `${displayTemp(cur.apparent_temperature)}${unitSuffix()}`;

  els.statHighLow.textContent = `${displayTemp(day.temperature_2m_max[0])}° / ${displayTemp(day.temperature_2m_min[0])}°`;
  els.statHumidity.textContent = `${cur.relative_humidity_2m}%`;
  els.statWind.textContent = `${Math.round(cur.wind_speed_10m)} km/h`;
  els.statPressure.textContent = `${Math.round(cur.surface_pressure)} hPa`;
}

function renderHourly(d) {
  const now = new Date(d.current.time);
  const hours = d.hourly.time;

  let startIdx = hours.findIndex((t) => new Date(t) >= now);
  if (startIdx < 0) startIdx = 0;

  const slice = [];
  for (let i = startIdx; i < Math.min(startIdx + 12, hours.length); i++) {
    slice.push({
      time: hours[i],
      temp: d.hourly.temperature_2m[i],
      code: d.hourly.weather_code[i],
      pop: d.hourly.precipitation_probability[i],
    });
  }

  els.hourlyStrip.innerHTML = slice
    .map((h) => {
      const t = new Date(h.time).toLocaleTimeString([], { hour: "numeric" });
      const info = weatherInfo(h.code);
      return `
      <div class="hour-card" title="${info.desc} · ${h.pop ?? 0}% rain">
        <div class="hour-time">${t}</div>
        <div class="hour-icon">${info.icon}</div>
        <div class="hour-temp">${displayTemp(h.temp)}°</div>
      </div>
    `;
    })
    .join("");
}

function renderForecast(d) {
  const days = d.daily;

  els.forecastGrid.innerHTML = days.time
    .map((dateStr, i) => {
      const date = new Date(dateStr + "T00:00:00");
      const label =
        i === 0
          ? "Today"
          : i === 1
            ? "Tomorrow"
            : date.toLocaleDateString([], { weekday: "short" });

      const info = weatherInfo(days.weather_code[i]);
      const high = days.temperature_2m_max[i];
      const low = days.temperature_2m_min[i];
      const pop = days.precipitation_probability_max[i] ?? 0;

      let trend = "steady";
      let trendLabel = "→ steady";
      if (i > 0) {
        const diff = high - days.temperature_2m_max[i - 1];
        if (diff > 1) {
          trend = "rising";
          trendLabel = "↑ warmer";
        } else if (diff < -1) {
          trend = "falling";
          trendLabel = "↓ cooler";
        }
      } else {
        trendLabel = "—";
      }

      return `
      <div class="day-card">
        <div class="day-name">${label}</div>
        <div class="day-icon">${info.icon}</div>
        <div class="day-temps">
          <span class="high">${displayTemp(high)}°</span> /
          <span class="low">${displayTemp(low)}°</span>
        </div>
        <div class="day-pop">💧 ${pop}%</div>
        ${i > 0 ? `<span class="day-trend ${trend}">${trendLabel}</span>` : ""}
      </div>
    `;
    })
    .join("");
}

function renderInsight(d) {
  const days = d.daily;
  if (!days || days.time.length < 2) {
    els.insightTitle.textContent = "Outlook";
    els.insightBody.textContent = "Not enough data yet to spot a trend.";
    return;
  }

  const today = {
    high: days.temperature_2m_max[0],
    pop: days.precipitation_probability_max[0] ?? 0,
  };
  const rest = days.temperature_2m_max.slice(1);
  const restMax = Math.max(...rest);
  const restMin = Math.min(...rest);

  const maxPop = Math.max(...days.precipitation_probability_max);
  const rainiestIdx = days.precipitation_probability_max.indexOf(maxPop);

  let icon = "📈",
    title = "Steady week ahead";
  let body = `Highs stay near ${displayTemp(today.high)}° all week with no major swings.`;

  if (maxPop >= 60) {
    icon = "🌧️";
    title = "Rain on the way";
    const dLabel =
      rainiestIdx === 0
        ? "Today"
        : new Date(days.time[rainiestIdx] + "T00:00:00").toLocaleDateString(
            [],
            { weekday: "long" },
          );
    body = `${dLabel} has the highest chance of precipitation this week at ${maxPop}%. An umbrella might help.`;
  } else if (restMax - today.high > 2) {
    icon = "🌡️";
    title = "Warming trend";
    body = `Expect it to feel warmer later this week — highs climb toward ${displayTemp(restMax)}°.`;
  } else if (today.high - restMin > 2) {
    icon = "❄️";
    title = "Cooling trend";
    body = `Temperatures ease down to around ${displayTemp(restMin)}° in the coming days. Keep a layer handy.`;
  }

  els.insightIcon.textContent = icon;
  els.insightTitle.textContent = title;
  els.insightBody.textContent = body;
}

// ============================================================
// Search + suggestions
// ============================================================
els.cityInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const q = els.cityInput.value.trim();
  if (q.length < 2) {
    hideSuggestions();
    return;
  }
  debounceTimer = setTimeout(() => fetchSuggestions(q), 350);
});

async function fetchSuggestions(q) {
  try {
    const results = await geocodeCity(q);
    renderSuggestions(results);
  } catch {
    hideSuggestions();
  }
}

function renderSuggestions(results) {
  if (!results.length) {
    hideSuggestions();
    return;
  }

  els.suggestions.innerHTML = results
    .map((loc) => {
      const region = [loc.admin1, loc.country].filter(Boolean).join(", ");
      return `
      <li data-lat="${loc.latitude}" data-lon="${loc.longitude}" data-name="${loc.name}">
        <strong>${loc.name}</strong>${region ? " — " + region : ""}
      </li>
    `;
    })
    .join("");
  els.suggestions.hidden = false;
}

function hideSuggestions() {
  els.suggestions.hidden = true;
  els.suggestions.innerHTML = "";
}

els.suggestions.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;
  const { lat, lon, name } = li.dataset;
  els.cityInput.value = name;
  hideSuggestions();
  loadWeatherFor(lat, lon, name);
});

document.addEventListener("click", (e) => {
  if (!els.suggestions.contains(e.target) && e.target !== els.cityInput) {
    hideSuggestions();
  }
});

// ============================================================
// Submit search
// ============================================================
els.searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = els.cityInput.value.trim();
  if (!q) return;

  hideSuggestions();
  showState("loading");
  els.loadingText.textContent = `Looking up ${q}…`;

  try {
    const results = await geocodeCity(q);
    if (!results.length) {
      showError(
        "City not found",
        `We couldn't find “${q}”. Try a different spelling.`,
      );
      return;
    }
    const top = results[0];
    loadWeatherFor(top.latitude, top.longitude, top.name);
  } catch (err) {
    showError(
      "Search failed",
      err.message || "Could not reach the search service.",
    );
  }
});

// ============================================================
// Geolocation
// ============================================================
els.locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showError(
      "Location unavailable",
      "Your browser does not support geolocation.",
    );
    return;
  }
  showState("loading");
  els.loadingText.textContent = "Finding your location…";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      // If map is open, recenter + drop pin too
      if (map && !els.mapPanel.hidden) {
        map.setView([lat, lon], 12);
        setPin(lat, lon);
      }

      loadWeatherFor(lat, lon, "Your location");
    },
    () =>
      showError(
        "Location blocked",
        "We couldn’t access your location. Search a city instead.",
      ),
    { timeout: 10000 },
  );
});

// ============================================================
// Unit toggle
// ============================================================
els.unitToggle.addEventListener("click", (e) => {
  const btn = e.target.closest(".unit-btn");
  if (!btn) return;
  state.unit = btn.dataset.unit;
  [...els.unitToggle.querySelectorAll(".unit-btn")].forEach((b) =>
    b.classList.toggle("is-active", b === btn),
  );
  if (state.lastData) renderAll();
});

// ============================================================
// Retry
// ============================================================
els.retryBtn.addEventListener("click", () => {
  if (state.lastCoords) {
    loadWeatherFor(state.lastCoords.lat, state.lastCoords.lon, state.lastPlace);
  } else {
    showState("empty");
  }
});

// ============================================================
// Auto-refresh every 10 minutes
// ============================================================
setInterval(
  () => {
    if (state.lastCoords) {
      loadWeatherFor(
        state.lastCoords.lat,
        state.lastCoords.lon,
        state.lastPlace,
      );
    }
  },
  10 * 60 * 1000,
);

// ============================================================
// World Map Picker — Leaflet.js
// Lets the user pin ANY spot on Earth for hyper-accurate weather.
// ============================================================

let map = null;
let marker = null;
let pickedLatLng = null;

// Custom pin icon (blue glow, matches Skyline theme)
const PIN_ICON = L.divIcon({
  className: "skyline-pin",
  html: `
    <div style="
      width: 22px; height: 22px;
      background: #4d96ff;
      border: 3px solid #e8ecff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 0 12px rgba(77, 150, 255, 0.9);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

// Initialize map once, lazily
function initMap() {
  if (map) return;

  map = L.map("worldMap", {
    center: [20, 0],
    zoom: 2,
    worldCopyJump: true,
    minZoom: 2,
    maxZoom: 18,
    zoomControl: true,
  });

  // ✅ FREE tiles — OpenStreetMap standard (no API key ever needed)
  L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    subdomains: "abc",
    maxZoom: 17,
    crossOrigin: true,
  }).addTo(map);

  // Click anywhere → drop pin
  map.on("click", (e) => setPin(e.latlng.lat, e.latlng.lng));

  // If we already have last coords, drop a pin there
  if (state.lastCoords) {
    setPin(state.lastCoords.lat, state.lastCoords.lon, false);
    map.setView([state.lastCoords.lat, state.lastCoords.lon], 8);
  }
}

// Drop or move the pin
function setPin(lat, lon, shouldPan = true) {
  pickedLatLng = { lat, lon };

  if (!marker) {
    marker = L.marker([lat, lon], {
      draggable: true,
      icon: PIN_ICON,
    }).addTo(map);

    // Allow dragging the pin to fine-tune
    marker.on("dragend", () => {
      const p = marker.getLatLng();
      setPin(p.lat, p.lng, false);
    });
  } else {
    marker.setLatLng([lat, lon]);
  }

  if (shouldPan) {
    map.setView([lat, lon], Math.max(map.getZoom(), 6));
  }

  els.mapCoords.textContent = `📍 ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
  els.mapUseBtn.disabled = false;
}

// Toggle map panel
els.mapToggleBtn.addEventListener("click", () => {
  const willOpen = els.mapPanel.hidden;
  els.mapPanel.hidden = !willOpen;
  els.mapToggleBtn.classList.toggle("is-active", willOpen);

  if (!willOpen) return; // closing

  initMap();

  // Leaflet needs a moment after the container becomes visible
  // Also trigger a full re-measure to show the whole world map
  setTimeout(() => {
    map.invalidateSize(true);
    // If no pin yet, show the whole world
    if (!pickedLatLng) {
      map.setView([20, 0], 2);
    }
  }, 150);
});

// Close button
els.mapCloseBtn.addEventListener("click", () => {
  els.mapPanel.hidden = true;
  els.mapToggleBtn.classList.remove("is-active");
});

// "Use this location" → fetch weather for pinned spot
els.mapUseBtn.addEventListener("click", () => {
  if (!pickedLatLng) return;
  const { lat, lon } = pickedLatLng;

  els.mapPanel.hidden = true;
  els.mapToggleBtn.classList.remove("is-active");

  loadWeatherFor(lat, lon, `${lat.toFixed(3)}°, ${lon.toFixed(3)}°`);
});

// ============================================================
// Initial load
// ============================================================
(function init() {
  showState("empty");
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (pos) =>
      loadWeatherFor(
        pos.coords.latitude,
        pos.coords.longitude,
        "Your location",
      ),
    () => {
      /* denied — leave empty state visible */
    },
    { timeout: 6000 },
  );
})();
