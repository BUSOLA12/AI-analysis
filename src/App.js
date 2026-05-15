import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";

// ─── DESIGN SYSTEM ────────────────────────────────────────────────────────────
const C = {
  bg: "#f4f7fb",
  surface: "#ffffff",
  panel: "#eef2f8",
  border: "#d0dcea",
  accent: "#0077cc",
  accentDim: "#0095e0",
  warn: "#e67e00",
  danger: "#d32f2f",
  safe: "#2e7d32",
  text: "#1a2d45",
  muted: "#6b87a2",
  grid: "#eef2f8",
};

const font = {
  display: "'Orbitron', 'Courier New', monospace",
  mono: "'Share Tech Mono', 'Courier New', monospace",
  body: "'Exo 2', 'Segoe UI', sans-serif",
};

// ─── MOCK COMMUNITY DATA ──────────────────────────────────────────────────────
const COMMUNITIES = [
  { id: 1, name: "Gwagwalada Lowlands", lat: 9.07, lon: 7.40, pop: 120000, vuln: "HIGH", type: "Flood Plain", x: 52, y: 44 },
  { id: 2, name: "Kuje Valley", lat: 9.05, lon: 7.44, pop: 85000, vuln: "CRITICAL", type: "Low-lying", x: 68, y: 55 },
  { id: 3, name: "Maitama District", lat: 9.10, lon: 7.35, pop: 230000, vuln: "MEDIUM", type: "Urban", x: 38, y: 28 },
  { id: 4, name: "Garki Market Zone", lat: 9.08, lon: 7.40, pop: 310000, vuln: "LOW", type: "Commercial", x: 55, y: 35 },
  { id: 5, name: "Jabi Lowlands", lat: 9.04, lon: 7.36, pop: 95000, vuln: "HIGH", type: "Low-lying", x: 42, y: 62 },
  { id: 6, name: "Apo Waterfront", lat: 9.04, lon: 7.34, pop: 65000, vuln: "CRITICAL", type: "Riverine", x: 28, y: 50 },
  { id: 7, name: "Kubwa Highlands", lat: 9.15, lon: 7.43, pop: 180000, vuln: "LOW", type: "Elevated Urban", x: 62, y: 16 },
  { id: 8, name: "Wuse Residential", lat: 9.07, lon: 7.28, pop: 145000, vuln: "MEDIUM", type: "Residential", x: 18, y: 38 },
];

const VULN_COLOR = { CRITICAL: C.danger, HIGH: C.warn, MEDIUM: "#ff9800", LOW: C.safe };

// ─── OPEN-METEO FETCH ─────────────────────────────────────────────────────────
async function fetchClimateData() {
  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=9.08&longitude=7.40" +
    "&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code" +
    "&hourly=temperature_2m,precipitation_probability,precipitation,wind_speed_10m" +
    "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code" +
    "&timezone=Africa%2FLagos&forecast_days=7";
  const r = await fetch(url);
  return r.json();
}

// ─── ANTHROPIC AI ANALYSIS ────────────────────────────────────────────────────
async function analyzeRisk(climateData, community) {
  const prompt = `You are a climate risk analyst. Analyze this real-time weather data for Abuja, Nigeria and predict risks for the community.

CURRENT CONDITIONS:
- Temperature: ${climateData.current.temperature_2m}°C
- Humidity: ${climateData.current.relative_humidity_2m}%
- Precipitation: ${climateData.current.precipitation}mm
- Wind Speed: ${climateData.current.wind_speed_10m} km/h
- Weather Code: ${climateData.current.weather_code}

7-DAY FORECAST (daily precipitation sum mm): ${climateData.daily.precipitation_sum.join(", ")}
7-DAY MAX TEMPS (°C): ${climateData.daily.temperature_2m_max.join(", ")}
7-DAY MAX WINDS (km/h): ${climateData.daily.wind_speed_10m_max.join(", ")}

TARGET COMMUNITY: ${community.name}
- Population: ${community.pop.toLocaleString()}
- Type: ${community.type}
- Current Vulnerability: ${community.vuln}

Respond ONLY in this exact JSON format, no markdown, no explanation:
{
  "riskScore": 0-100,
  "primaryThreat": "one short phrase",
  "floodRisk": "LOW|MEDIUM|HIGH|CRITICAL",
  "heatRisk": "LOW|MEDIUM|HIGH|CRITICAL",
  "windRisk": "LOW|MEDIUM|HIGH|CRITICAL",
  "alerts": ["alert 1 max 12 words", "alert 2 max 12 words", "alert 3 max 12 words"],
  "recommendation": "one sentence action recommendation max 20 words",
  "outlook": "72-hour outlook max 15 words"
}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  const data = await response.json();
  const text = data.choices[0].message.content;
  return JSON.parse(text);
}

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ data, color, label }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.slice(0, 24).map((v, i) => {
    const x = (i / 23) * 140;
    const y = 28 - ((v - min) / range) * 24;
    return `${x},${y}`;
  });
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px" }}>
      <div style={{ fontFamily: font.body, fontSize: 10, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <svg width="140" height="32" viewBox="0 0 140 32">
        <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx={pts[pts.length - 1]?.split(",")[0]} cy={pts[pts.length - 1]?.split(",")[1]} r="2.5" fill={color} />
      </svg>
      <div style={{ fontFamily: font.mono, fontSize: 13, color, marginTop: 4 }}>
        {data[0]?.toFixed(1)} <span style={{ color: C.muted, fontSize: 10 }}>now</span>
      </div>
    </div>
  );
}

// ─── RISK GAUGE ───────────────────────────────────────────────────────────────
function RiskGauge({ score }) {
  const angle = -135 + (score / 100) * 270;
  const color = score >= 75 ? C.danger : score >= 50 ? C.warn : score >= 25 ? "#ff9800" : C.safe;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="120" height="70" viewBox="0 0 120 70">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={C.safe} />
            <stop offset="50%" stopColor={C.warn} />
            <stop offset="100%" stopColor={C.danger} />
          </linearGradient>
        </defs>
        <path d="M15 65 A 50 50 0 0 1 105 65" fill="none" stroke={C.border} strokeWidth="6" strokeLinecap="round" />
        <path d="M15 65 A 50 50 0 0 1 105 65" fill="none" stroke="url(#gaugeGrad)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(score / 100) * 157} 157`} />
        <g transform={`rotate(${angle} 60 65)`}>
          <line x1="60" y1="65" x2="60" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <circle cx="60" cy="65" r="4" fill={color} />
        </g>
      </svg>
      <div style={{ fontFamily: font.display, fontSize: 22, color, marginTop: -8 }}>{score}</div>
      <div style={{ fontFamily: font.body, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Risk Score</div>
    </div>
  );
}

// ─── ALERT BADGE ──────────────────────────────────────────────────────────────
function AlertBadge({ level }) {
  const color = VULN_COLOR[level] || C.muted;
  return (
    <span style={{
      fontFamily: font.mono, fontSize: 9, color, border: `1px solid ${color}`,
      padding: "2px 6px", borderRadius: 3, letterSpacing: 1,
      background: `${color}18`, display: "inline-block"
    }}>{level}</span>
  );
}

// ─── COMMUNITY MAP ────────────────────────────────────────────────────────────
function CommunityMap({ communities, selected, onSelect, analysis }) {
  const center = [9.08, 7.40];
  return (
    <div className="map-wrapper" style={{ position: "relative", width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <MapContainer center={center} zoom={12} style={{ width: "100%", height: "100%" }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {communities.map((c) => {
            const col = VULN_COLOR[c.vuln];
            const isSelected = selected?.id === c.id;
            const hasAnalysis = analysis?.community?.id === c.id;
            return (
              <CircleMarker
                key={c.id}
                center={[c.lat, c.lon]}
                radius={isSelected ? 14 : 9}
                pathOptions={{
                  color: isSelected ? "#fff" : col,
                  fillColor: col,
                  fillOpacity: 0.88,
                  weight: isSelected ? 3 : 1.5,
                  ...(hasAnalysis && { dashArray: "4 2" }),
                }}
                eventHandlers={{ click: () => onSelect(c) }}
              >
                <Tooltip permanent={isSelected} direction="top" offset={[0, -12]}>
                  <span style={{ fontFamily: font.mono, fontSize: 11, color: col, fontWeight: isSelected ? 700 : 400 }}>
                    {c.name} — {c.vuln}
                  </span>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
        {/* Zone label overlay */}
        <div style={{
          position: "absolute", bottom: 28, left: 8, zIndex: 1000, pointerEvents: "none",
          fontFamily: font.mono, fontSize: 9, color: C.muted,
          background: `${C.surface}dd`, padding: "3px 8px", borderRadius: 4,
          border: `1px solid ${C.border}`,
        }}>
          ABUJA METROPOLITAN ZONE — 9.08°N 7.40°E
        </div>
      </div>
    </div>
  );
}

// ─── ALERT FEED ───────────────────────────────────────────────────────────────
function AlertFeed({ alerts }) {
  const icons = ["⚡", "🌊", "🌡", "💨", "⚠️"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {alerts.map((a, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          background: `${a.color}10`, border: `1px solid ${a.color}40`,
          borderLeft: `3px solid ${a.color}`, borderRadius: 6, padding: "10px 12px",
          animation: i === 0 ? "fadeIn 0.5s ease" : "none",
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>{icons[i % icons.length]}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: font.mono, fontSize: 11, color: a.color, marginBottom: 3 }}>{a.title}</div>
            <div style={{ fontFamily: font.body, fontSize: 11, color: C.text, lineHeight: 1.4 }}>{a.msg}</div>
          </div>
          <div style={{ fontFamily: font.mono, fontSize: 9, color: C.muted, flexShrink: 0 }}>{a.time}</div>
        </div>
      ))}
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, color, icon }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px", flex: 1 }}>
      <div style={{ fontFamily: font.body, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        {icon} {label}
      </div>
      <div style={{ fontFamily: font.display, fontSize: 22, color: color || C.accent }}>
        {value}<span style={{ fontSize: 12, marginLeft: 3, color: C.muted }}>{unit}</span>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ClimateRiskDashboard() {
  const [climate, setClimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [tab, setTab] = useState("map");
  const [tick, setTick] = useState(0);
  const tickRef = useRef(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Fetch real climate data on mount
  useEffect(() => {
    fetchClimateData()
      .then((d) => { setClimate(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Simulate real-time ticking clock + auto-alerts
  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current += 1;
      setTick(tickRef.current);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Seed initial alerts
  useEffect(() => {
    if (!climate) return;
    const seed = [
      { title: "SYSTEM ONLINE", msg: "Climate Risk Intelligence Platform connected to live data feeds.", color: C.safe, time: "NOW" },
      { title: "DATA SYNC", msg: "Open-Meteo API: Real-time atmospheric data loaded for Abuja Metro.", color: C.accent, time: "-1m" },
      { title: "SCAN COMPLETE", msg: `${COMMUNITIES.length} communities mapped. 2 CRITICAL, 2 HIGH vulnerability zones detected.`, color: C.warn, time: "-2m" },
    ];
    setLiveAlerts(seed);
  }, [climate]);

  // Auto-inject rolling alerts
  useEffect(() => {
    if (tickRef.current === 0 || !climate) return;
    const pool = [
      { title: "PRECIP ALERT", msg: `Rainfall intensity rising. ${(Math.random() * 20 + 5).toFixed(1)}mm/hr detected over Coastal Ward 5.`, color: C.warn },
      { title: "HEAT ADVISORY", msg: `Surface temp ${climate?.current?.temperature_2m}°C. Vulnerable populations advised to shelter.`, color: "#ff7043" },
      { title: "WIND MONITOR", msg: `Gusts up to ${(Math.random() * 30 + 25).toFixed(0)} km/h tracking toward Apapa Waterfront.`, color: C.accentDim },
      { title: "FLOOD RISK UPDATE", msg: "Badia Lowlands water table rising. Evacuation route pre-alert issued.", color: C.danger },
    ];
    const pick = pool[tickRef.current % pool.length];
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setLiveAlerts((prev) => [{ ...pick, time: now }, ...prev.slice(0, 9)]);
  }, [tick, climate]);

  const handleSelectCommunity = useCallback(async (c) => {
    setSelected(c);
    if (!climate) return;
    setAnalyzing(true);
    setTab("analysis");
    try {
      const result = await analyzeRisk(climate, c);
      setAnalysis({ ...result, community: c });
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const newAlerts = result.alerts?.map((a, i) => ({
        title: `AI RISK ALERT [${c.name.toUpperCase()}]`,
        msg: a, color: i === 0 ? C.danger : C.warn, time: now,
      })) || [];
      setLiveAlerts((prev) => [...newAlerts, ...prev.slice(0, 7)]);
    } catch (e) {
      console.error(e);
    }
    setAnalyzing(false);
  }, [climate]);

  const headerTime = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: font.body, position: "relative", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600&display=swap');
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(1.5)} }
        @keyframes ping { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2.5);opacity:0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scan { 0%{transform:translateY(0)} 100%{transform:translateY(100vh)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${C.bg}; } ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        .leaflet-container { z-index: 1; }
        .map-wrapper { padding-top: 65%; }
        @media (min-width: 768px) { .map-wrapper { padding-top: 0 !important; height: 420px !important; } }
      `}</style>

      {/* Dot grid background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `radial-gradient(circle, ${C.border} 1px, transparent 1px)`,
        backgroundSize: "28px 28px", opacity: 0.6 }} />

      {/* ── HEADER ── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: isMobile ? "10px 16px" : "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent}40, ${C.accent}10)`, border: `1.5px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🌍</div>
          <div>
            <div style={{ fontFamily: font.display, fontSize: isMobile ? 11 : 14, color: C.accent, letterSpacing: 2 }}>CLIMATE RISK INTEL</div>
            {!isMobile && <div style={{ fontFamily: font.mono, fontSize: 9, color: C.muted, letterSpacing: 1 }}>ABUJA METROPOLITAN REGION — AI-POWERED MONITORING</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.safe, animation: "blink 2s infinite" }} />
            <span style={{ fontFamily: font.mono, fontSize: 10, color: C.safe }}>LIVE</span>
          </div>
          {!isMobile && <div style={{ fontFamily: font.mono, fontSize: 10, color: C.muted }}>{headerTime}</div>}
        </div>
      </div>

      {/* ── CURRENT CONDITIONS BAR ── */}
      <div style={{ padding: isMobile ? "8px 16px" : "10px 24px", background: `${C.panel}80`, borderBottom: `1px solid ${C.border}`, display: "flex", gap: isMobile ? 10 : 12, flexWrap: "wrap" }}>
        {loading ? (
          <span style={{ fontFamily: font.mono, fontSize: 11, color: C.muted }}>● Connecting to Open-Meteo live feed…</span>
        ) : climate ? (
          <>
            {[
              { k: "TEMP", v: `${climate.current.temperature_2m}°C`, c: C.warn },
              { k: "HUMIDITY", v: `${climate.current.relative_humidity_2m}%`, c: C.accent },
              { k: "PRECIP", v: `${climate.current.precipitation}mm`, c: "#4fc3f7" },
              { k: "WIND", v: `${climate.current.wind_speed_10m} km/h`, c: C.safe },
              { k: "ZONE", v: "Abuja, NG", c: C.muted },
              { k: "SOURCE", v: "Open-Meteo API", c: C.muted },
            ].map(({ k, v, c }) => (
              <div key={k} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontFamily: font.mono, fontSize: 9, color: C.muted, textTransform: "uppercase" }}>{k}:</span>
                <span style={{ fontFamily: font.mono, fontSize: 11, color: c }}>{v}</span>
              </div>
            ))}
          </>
        ) : (
          <span style={{ fontFamily: font.mono, fontSize: 11, color: C.warn }}>⚠ Using simulated data — check API connection</span>
        )}
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 0, height: isMobile ? "auto" : "calc(100vh - 120px)", overflow: isMobile ? "visible" : "hidden" }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ overflowY: isMobile ? "visible" : "auto", padding: isMobile ? 12 : 20, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            {["map", "analysis", "forecast"].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: isMobile ? "10px 4px" : "10px 0", fontFamily: font.mono, fontSize: isMobile ? 10 : 11, letterSpacing: isMobile ? 0 : 1,
                textTransform: "uppercase", border: "none", cursor: "pointer",
                background: tab === t ? `${C.accent}15` : "transparent",
                color: tab === t ? C.accent : C.muted,
                borderBottom: tab === t ? `2px solid ${C.accent}` : "2px solid transparent",
                transition: "all 0.2s",
              }}>{t === "map" ? (isMobile ? "🗺 Map" : "🗺 Community Map") : t === "analysis" ? (isMobile ? "🤖 AI" : "🤖 AI Analysis") : (isMobile ? "📈 Fcst" : "📈 Forecast")}</button>
            ))}
          </div>

          {/* MAP TAB */}
          {tab === "map" && (
            <>
              <div style={{ fontFamily: font.mono, fontSize: 10, color: C.muted, letterSpacing: 1 }}>
                ● TAP A COMMUNITY NODE TO TRIGGER AI RISK ANALYSIS
              </div>
              <CommunityMap communities={COMMUNITIES} selected={selected} onSelect={handleSelectCommunity} analysis={analysis} />

              {/* Legend */}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {Object.entries(VULN_COLOR).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: v, boxShadow: `0 0 6px ${v}` }} />
                    <span style={{ fontFamily: font.mono, fontSize: 10, color: C.muted }}>{k}</span>
                  </div>
                ))}
              </div>

              {/* Community table */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: 320 }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontFamily: font.display, fontSize: 11, color: C.accent, letterSpacing: 2, flexShrink: 0 }}>
                  COMMUNITY VULNERABILITY INDEX
                </div>
                <div style={{ overflowY: "auto", flex: 1 }}>
                {COMMUNITIES.map((c, i) => (
                  <div key={c.id} onClick={() => handleSelectCommunity(c)} style={{
                    display: "flex", alignItems: "center", padding: "10px 16px", gap: 12,
                    borderBottom: i < COMMUNITIES.length - 1 ? `1px solid ${C.border}` : "none",
                    cursor: "pointer", background: selected?.id === c.id ? `${C.accent}08` : "transparent",
                    transition: "background 0.15s",
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: VULN_COLOR[c.vuln], flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: font.body, fontSize: 12, color: C.text }}>{c.name}</div>
                      <div style={{ fontFamily: font.mono, fontSize: 9, color: C.muted }}>{c.type}</div>
                    </div>
                    <div style={{ fontFamily: font.mono, fontSize: 10, color: C.muted }}>{c.pop.toLocaleString()}</div>
                    <AlertBadge level={c.vuln} />
                  </div>
                ))}
                </div>
              </div>
            </>
          )}

          {/* ANALYSIS TAB */}
          {tab === "analysis" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {!selected ? (
                <div style={{ textAlign: "center", padding: 60, color: C.muted, fontFamily: font.mono, fontSize: 12 }}>
                  ← Go to Map and select a community node to run AI analysis
                </div>
              ) : analyzing ? (
                <div style={{ textAlign: "center", padding: 60 }}>
                  <div style={{ fontFamily: font.display, fontSize: 14, color: C.accent, marginBottom: 16, letterSpacing: 2 }}>
                    ANALYZING…
                  </div>
                  <div style={{ fontFamily: font.mono, fontSize: 11, color: C.muted }}>
                    Claude AI is processing live climate data for {selected.name}
                  </div>
                </div>
              ) : analysis ? (
                <>
                  <button
                    onClick={() => setTab("map")}
                    style={{
                      alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6,
                      background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6,
                      padding: "6px 14px", cursor: "pointer", fontFamily: font.mono, fontSize: 11,
                      color: C.muted, transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = C.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
                  >
                    ← COMMUNITY MAP
                  </button>
                  {/* Header */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: font.display, fontSize: 16, color: C.accent, letterSpacing: 1 }}>{analysis.community.name}</div>
                      <div style={{ fontFamily: font.mono, fontSize: 10, color: C.muted, marginTop: 4 }}>
                        {analysis.community.type} · Pop {analysis.community.pop.toLocaleString()} · <AlertBadge level={analysis.community.vuln} />
                      </div>
                      <div style={{ fontFamily: font.body, fontSize: 12, color: C.warn, marginTop: 8 }}>⚡ {analysis.primaryThreat}</div>
                    </div>
                    <RiskGauge score={analysis.riskScore} />
                  </div>

                  {/* Risk breakdown */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Flood Risk", val: analysis.floodRisk, icon: "🌊" },
                      { label: "Heat Risk", val: analysis.heatRisk, icon: "🌡" },
                      { label: "Wind Risk", val: analysis.windRisk, icon: "💨" },
                    ].map(({ label, val, icon }) => (
                      <div key={label} style={{ background: C.surface, border: `1px solid ${VULN_COLOR[val] || C.border}`, borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                        <div style={{ fontFamily: font.mono, fontSize: 9, color: C.muted, marginBottom: 4, textTransform: "uppercase" }}>{label}</div>
                        <AlertBadge level={val} />
                      </div>
                    ))}
                  </div>

                  {/* AI Alerts */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontFamily: font.display, fontSize: 10, color: C.accent, letterSpacing: 2, marginBottom: 12 }}>AI-GENERATED ALERTS</div>
                    {analysis.alerts?.map((a, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                        <span style={{ color: i === 0 ? C.danger : C.warn, fontSize: 12, flexShrink: 0 }}>{i === 0 ? "🔴" : "🟡"}</span>
                        <span style={{ fontFamily: font.body, fontSize: 12, color: C.text, lineHeight: 1.5 }}>{a}</span>
                      </div>
                    ))}
                  </div>

                  {/* Recommendation */}
                  <div style={{ background: `${C.safe}10`, border: `1px solid ${C.safe}40`, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontFamily: font.mono, fontSize: 10, color: C.safe, marginBottom: 8 }}>✅ RECOMMENDED ACTION</div>
                    <div style={{ fontFamily: font.body, fontSize: 13, color: C.text }}>{analysis.recommendation}</div>
                  </div>

                  {/* Outlook */}
                  <div style={{ background: `${C.accent}08`, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontFamily: font.mono, fontSize: 10, color: C.accent, marginBottom: 8 }}>⏱ 72-HOUR OUTLOOK</div>
                    <div style={{ fontFamily: font.body, fontSize: 13, color: C.text }}>{analysis.outlook}</div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* FORECAST TAB */}
          {tab === "forecast" && climate && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <button
                onClick={() => setTab("map")}
                style={{
                  alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6,
                  background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6,
                  padding: "6px 14px", cursor: "pointer", fontFamily: font.mono, fontSize: 11,
                  color: C.muted, transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = C.accent; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
              >
                ← COMMUNITY MAP
              </button>
              {/* Sparklines */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                <Sparkline data={climate.hourly.temperature_2m} color={C.warn} label="Temperature 24h (°C)" />
                <Sparkline data={climate.hourly.precipitation} color="#4fc3f7" label="Precipitation 24h (mm)" />
                <Sparkline data={climate.hourly.precipitation_probability} color={C.accent} label="Precip Probability %" />
                <Sparkline data={climate.hourly.wind_speed_10m} color={C.safe} label="Wind Speed 24h (km/h)" />
              </div>

              {/* 7-day bars */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontFamily: font.display, fontSize: 10, color: C.accent, letterSpacing: 2, marginBottom: 16 }}>7-DAY PRECIPITATION FORECAST</div>
                {climate.daily.time.map((day, i) => {
                  const val = climate.daily.precipitation_sum[i];
                  const maxVal = Math.max(...climate.daily.precipitation_sum);
                  const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                  const col = val > 20 ? C.danger : val > 10 ? C.warn : C.safe;
                  return (
                    <div key={day} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div style={{ fontFamily: font.mono, fontSize: 10, color: C.muted, width: 60 }}>
                        {new Date(day).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
                      </div>
                      <div style={{ flex: 1, background: C.panel, borderRadius: 3, height: 8, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 3, transition: "width 0.5s ease" }} />
                      </div>
                      <div style={{ fontFamily: font.mono, fontSize: 10, color: col, width: 40, textAlign: "right" }}>{val?.toFixed(1)}mm</div>
                    </div>
                  );
                })}
              </div>

              {/* Temp range */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontFamily: font.display, fontSize: 10, color: C.accent, letterSpacing: 2, marginBottom: 16 }}>7-DAY TEMPERATURE RANGE</div>
                {climate.daily.time.map((day, i) => {
                  const min = climate.daily.temperature_2m_min[i];
                  const max = climate.daily.temperature_2m_max[i];
                  return (
                    <div key={day} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div style={{ fontFamily: font.mono, fontSize: 10, color: C.muted, width: 60 }}>
                        {new Date(day).toLocaleDateString("en", { weekday: "short" })}
                      </div>
                      <div style={{ fontFamily: font.mono, fontSize: 10, color: "#4fc3f7" }}>{min?.toFixed(0)}°</div>
                      <div style={{ flex: 1, background: C.panel, borderRadius: 3, height: 6, position: "relative", overflow: "visible" }}>
                        <div style={{
                          position: "absolute", left: `${((min - 20) / 20) * 100}%`,
                          width: `${((max - min) / 20) * 100}%`,
                          height: "100%", background: `linear-gradient(90deg, #4fc3f7, ${C.warn})`, borderRadius: 3
                        }} />
                      </div>
                      <div style={{ fontFamily: font.mono, fontSize: 10, color: C.warn }}>{max?.toFixed(0)}°</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {tab === "forecast" && !climate && (
            <div style={{ textAlign: "center", padding: 60, color: C.muted, fontFamily: font.mono, fontSize: 12 }}>Loading climate data…</div>
          )}
        </div>

        {/* ── RIGHT PANEL: ALERTS ── */}
        <div style={{ borderLeft: isMobile ? "none" : `1px solid ${C.border}`, borderTop: isMobile ? `1px solid ${C.border}` : "none", background: C.surface, display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: isMobile ? 480 : "none" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: font.display, fontSize: 11, color: C.accent, letterSpacing: 2 }}>ALERT FEED</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.danger, animation: "blink 1s infinite" }} />
              <span style={{ fontFamily: font.mono, fontSize: 9, color: C.danger }}>LIVE</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ padding: "12px 12px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <StatCard label="Critical Zones" value={COMMUNITIES.filter(c => c.vuln === "CRITICAL").length} color={C.danger} icon="🔴" />
            <StatCard label="High Risk" value={COMMUNITIES.filter(c => c.vuln === "HIGH").length} color={C.warn} icon="🟡" />
            <StatCard label="Total Pop." value={(COMMUNITIES.reduce((a, c) => a + c.pop, 0) / 1e6).toFixed(2)} unit="M" color={C.accent} icon="👥" />
            <StatCard label="Alerts Sent" value={liveAlerts.length} color={C.safe} icon="📡" />
          </div>

          {/* Alert feed */}
          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            <AlertFeed alerts={liveAlerts} />
          </div>

          {/* Send alert button */}
          <div style={{ padding: 12, borderTop: `1px solid ${C.border}` }}>
            <button
              onClick={() => {
                const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                setLiveAlerts(prev => [{
                  title: "📣 MANUAL BROADCAST",
                  msg: `Emergency alert broadcast to all ${COMMUNITIES.length} monitored communities. Authorities notified.`,
                  color: C.danger, time: now
                }, ...prev.slice(0, 9)]);
              }}
              style={{
                width: "100%", padding: "12px", fontFamily: font.display, fontSize: 11, letterSpacing: 2,
                background: `${C.danger}20`, border: `1px solid ${C.danger}`, color: C.danger,
                borderRadius: 8, cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => e.target.style.background = `${C.danger}35`}
              onMouseLeave={e => e.target.style.background = `${C.danger}20`}
            >
              ⚡ BROADCAST ALERT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}