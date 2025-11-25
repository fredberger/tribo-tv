// pages/index.js
import { useEffect, useRef, useState } from 'react';

const CHANNEL_SLUG = 'gaules';
const FULLSCREEN_COUNT_KEY = `kick_fullscreen_count_${CHANNEL_SLUG}`;

// --- helpers ---

function formatTimeShort(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
        });
    } catch {
        return iso;
    }
}

// Agrega histórico por minuto / hora / dia pra alimentar o gráfico
function buildSeries(history, mode) {
    const buckets = {};

    for (const ev of history) {
        if (!ev || ev.viewer_count == null) continue;
        const d = new Date(ev.created_at);
        if (Number.isNaN(d.getTime())) continue;

        let key;
        if (mode === 'minute') {
            key = d.toISOString().slice(0, 16); // 2025-11-23T18:42
        } else if (mode === 'hour') {
            key = d.toISOString().slice(0, 13); // 2025-11-23T18
        } else {
            key = d.toISOString().slice(0, 10); // 2025-11-23
        }

        const current = buckets[key];
        const value = ev.viewer_count;
        if (!current || value > current.value) {
            buckets[key] = { key, value, date: d };
        }
    }

    const arr = Object.values(buckets);
    arr.sort((a, b) => a.date - b.date);

    return arr.map((b) => {
        let label;

        if (mode === 'minute') {
            label = b.date.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (mode === 'hour') {
            label = b.date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit'
            });
        } else {
            label = b.date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit'
            });
        }

        return {
            label,
            value: b.value,
            date: b.date
        };
    });
}

// Componente de gráfico SVG
function ViewersChart({ history }) {
    const [mode, setMode] = useState('minute'); // 'minute' | 'hour' | 'day'
    const series = buildSeries(history, mode);
    const hasData = series.length > 0;

    const width = 800;
    const height = 200;
    const paddingLeft = 40;
    const paddingRight = 12;
    const paddingTop = 10;
    const paddingBottom = 30;

    let maxValue = 0;
    for (const p of series) {
        if (p.value > maxValue) maxValue = p.value;
    }

    const points = series.map((p, idx) => {
        const t =
            series.length <= 1 ? 0.5 : idx / (series.length - 1); // 0..1
        const x =
            paddingLeft +
            t * (width - paddingLeft - paddingRight);
        let y;
        if (maxValue === 0) {
            y = height - paddingBottom;
        } else {
            const frac = p.value / maxValue;
            y =
                height -
                paddingBottom -
                frac * (height - paddingTop - paddingBottom);
        }
        return { x, y, label: p.label, value: p.value };
    });

    const pathData =
        points.length === 0
            ? ''
            : points
                .map((pt, idx) =>
                    idx === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`
                )
                .join(' ');

    const xTicks = (() => {
        if (!hasData) return [];
        const count = Math.min(4, series.length);
        if (count === 0) return [];
        const step =
            series.length <= count ? 1 : Math.floor(series.length / (count - 1));
        const ticks = [];
        for (let i = 0; i < series.length; i += step) {
            const s = series[i];
            const pt = points[i];
            if (!s || !pt) continue;
            ticks.push({ x: pt.x, label: s.label });
            if (ticks.length >= count) break;
        }
        return ticks;
    })();

    const yTicks = (() => {
        if (!hasData) return [];
        const steps = 4;
        const ticks = [];
        for (let i = 0; i <= steps; i++) {
            const frac = i / steps;
            const value = Math.round(maxValue * frac);
            const y =
                height -
                paddingBottom -
                frac * (height - paddingTop - paddingBottom);
            ticks.push({ y, value });
        }
        return ticks;
    })();

    return (
        <div className="chart-container">
            <div className="chart-header">
                <h2>Analytics da Tribo</h2>
                <div className="chart-modes">
                    <button
                        className={mode === 'minute' ? 'active' : ''}
                        onClick={() => setMode('minute')}
                    >
                        Minuto
                    </button>
                    <button
                        className={mode === 'hour' ? 'active' : ''}
                        onClick={() => setMode('hour')}
                    >
                        Hora
                    </button>
                    <button
                        className={mode === 'day' ? 'active' : ''}
                        onClick={() => setMode('day')}
                    >
                        Dia
                    </button>
                </div>
            </div>

            {!hasData ? (
                <p className="chart-empty">
                    Ainda sem dados suficientes para o gráfico.
                </p>
            ) : (
                <div className="chart-svg-wrapper">
                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4ac0ff" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#4ac0ff" stopOpacity="0.1" />
                            </linearGradient>
                        </defs>

                        {/* Eixos */}
                        <line
                            x1={paddingLeft}
                            y1={height - paddingBottom}
                            x2={width - paddingRight}
                            y2={height - paddingBottom}
                            stroke="rgba(255,255,255,0.25)"
                            strokeWidth="1"
                        />
                        <line
                            x1={paddingLeft}
                            y1={paddingTop}
                            x2={paddingLeft}
                            y2={height - paddingBottom}
                            stroke="rgba(255,255,255,0.25)"
                            strokeWidth="1"
                        />

                        {/* Grid horizontal */}
                        {yTicks.map((t, idx) => (
                            <line
                                key={idx}
                                x1={paddingLeft}
                                y1={t.y}
                                x2={width - paddingRight}
                                y2={t.y}
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth="1"
                            />
                        ))}

                        {/* Área */}
                        {points.length > 1 && (
                            <path
                                d={
                                    pathData +
                                    ` L ${points[points.length - 1].x} ${height - paddingBottom
                                    } L ${points[0].x} ${height - paddingBottom
                                    } Z`
                                }
                                fill="url(#lineGrad)"
                                stroke="none"
                            />
                        )}

                        {/* Linha */}
                        <path
                            d={pathData}
                            fill="none"
                            stroke="#7dd0ff"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />

                        {/* Pontos */}
                        {points.map((pt, idx) => (
                            <circle
                                key={idx}
                                cx={pt.x}
                                cy={pt.y}
                                r={3}
                                fill="#ffffff"
                                stroke="#021526"
                                strokeWidth="1"
                            />
                        ))}

                        {/* Labels Y */}
                        {yTicks.map((t, idx) => (
                            <text
                                key={idx}
                                x={paddingLeft - 6}
                                y={t.y + 4}
                                textAnchor="end"
                                fontSize="10"
                                fill="rgba(233,242,255,0.8)"
                            >
                                {t.value.toLocaleString('pt-BR')}
                            </text>
                        ))}

                        {/* Labels X */}
                        {xTicks.map((t, idx) => (
                            <text
                                key={idx}
                                x={t.x}
                                y={height - 10}
                                textAnchor="middle"
                                fontSize="10"
                                fill="rgba(233,242,255,0.8)"
                            >
                                {t.label}
                            </text>
                        ))}
                    </svg>
                </div>
            )}

            <style jsx>{`
        .chart-container {
          padding: 10px 16px 20px;
          background: radial-gradient(
            circle at top,
            rgba(15, 40, 90, 0.95),
            rgba(2, 3, 11, 0.98)
          );
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .chart-header h2 {
          margin: 0;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #a8c8ff;
        }
        .chart-modes button {
          background: transparent;
          border-radius: 16px;
          border: 1px solid rgba(148, 190, 255, 0.6);
          color: #dfe9ff;
          font-size: 11px;
          padding: 4px 10px;
          margin-left: 6px;
          cursor: pointer;
        }
        .chart-modes button.active {
          background: #4ac0ff;
          color: #021526;
          border-color: #4ac0ff;
        }
        .chart-modes button:focus {
          outline: none;
        }
        .chart-empty {
          margin: 6px 0 0;
          font-size: 12px;
          color: #a0b4e0;
        }
        .chart-svg-wrapper {
          width: 100%;
          max-width: 900px;
          margin-top: 4px;
        }
        .chart-svg-wrapper svg {
          width: 100%;
          height: 200px;
          display: block;
        }
      `}</style>
        </div>
    );
}

// --- Página principal ---

export default function HomePage() {
    const iframeRef = useRef(null);
    const [viewerCount, setViewerCount] = useState(null);
    const [isLive, setIsLive] = useState(null);
    const [history, setHistory] = useState([]);
    const [fullscreenCount, setFullscreenCount] = useState(0);

    // Carrega contagem fullscreen local
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const storedCount = parseInt(
                localStorage.getItem(FULLSCREEN_COUNT_KEY) || '0',
                10
            );
            setFullscreenCount(Number.isNaN(storedCount) ? 0 : storedCount);
        } catch (e) {
            console.error('Erro ao ler fullscreen count do localStorage', e);
        }
    }, []);

    // Carrega histórico centralizado do backend
    useEffect(() => {
        async function loadHistory() {
            try {
                const res = await fetch(
                    `/api/view-events?channel=${CHANNEL_SLUG}&limit=500`
                );
                if (!res.ok) return;
                const json = await res.json();
                setHistory(json.events || []);
            } catch (err) {
                console.error('Erro ao carregar histórico:', err);
            }
        }

        loadHistory();
    }, []);

    // Busca viewers da Kick e registra a cada 60s
    useEffect(() => {
        let abort = false;

        async function fetchDataAndTrack() {
            try {
                // Novo endpoint que realmente traz informações do livestream
                const res = await fetch(
                    `https://kick.com/api/v2/channels/${CHANNEL_SLUG}/livestream`,
                    { headers: { Accept: "application/json" } }
                );

                // Se o canal não estiver ao vivo, Kick retorna 404 ou 204
                if (!res.ok) {
                    if (!abort) {
                        setIsLive(false);
                        setViewerCount(null);
                    }
                    return;
                }

                const data = await res.json();
                // A estrutura pode variar, então tentamos achar os campos dinamicamente
                const livestream = data.livestream || data.data?.livestream || data;
                const live = !!(livestream && (livestream.is_live ?? true));

                let viewers = null;
                if (typeof livestream.viewer_count === "number") {
                    viewers = livestream.viewer_count;
                } else if (typeof livestream.viewers === "number") {
                    viewers = livestream.viewers;
                } else if (typeof data.viewers === "number") {
                    viewers = data.viewers;
                }

                if (!abort) {
                    setIsLive(live);
                    setViewerCount(viewers);

                    // Envia evento pro backend (Supabase)
                    try {
                        await fetch("/api/view-events", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                channel: CHANNEL_SLUG,
                                viewerCount: viewers,
                                isLive: live,
                            }),
                        });
                    } catch (err) {
                        console.error("Erro ao enviar evento pro backend:", err);
                    }

                    // Atualiza histórico localmente
                    setHistory((prev) => {
                        const newItem = {
                            id: `local-${Date.now()}`,
                            channel: CHANNEL_SLUG,
                            viewer_count: viewers,
                            is_live: live,
                            created_at: new Date().toISOString(),
                        };
                        return [newItem, ...prev].slice(0, 500);
                    });
                }
            } catch (err) {
                if (!abort) {
                    console.error("Erro ao buscar dados da Kick:", err);
                    setIsLive(null);
                    setViewerCount(null);
                }
            }
        }


        fetchDataAndTrack();
        const interval = setInterval(fetchDataAndTrack, 60000);

        return () => {
            abort = true;
            clearInterval(interval);
        };
    }, []);

    const handleFullscreen = () => {
        const el = iframeRef.current;
        if (!el) return;

        const requestFs =
            el.requestFullscreen ||
            el.webkitRequestFullscreen ||
            el.msRequestFullscreen;

        if (requestFs) {
            requestFs.call(el);

            setFullscreenCount((prev) => {
                const next = prev + 1;
                if (typeof window !== 'undefined') {
                    localStorage.setItem(FULLSCREEN_COUNT_KEY, String(next));
                }
                return next;
            });
        } else {
            alert(
                'Seu navegador não suporta fullscreen via botão. Use o fullscreen do próprio player.'
            );
        }
    };

    return (
        <div className="page">
            {/* Header com logo da Tribo (elmo) */}
            <header className="header">
                <div className="logo-area">
                    <img
                        src="https://static-cdn.jtvnw.net/jtv_user_pictures/f4b12683-57ff-4b57-926a-67512b43a7ff-profile_image-300x300.png"
                        alt="Tribo"
                        className="tribo-logo"
                    />
                    <div className="title-text">
                        <h1>Tribo TV</h1>
                        <p>Canal: {CHANNEL_SLUG}</p>
                    </div>
                </div>
            </header>

            <button className="fs-button" onClick={handleFullscreen}>
                Entrar em FullScreen
            </button>

            <div className="info-bar">
                <div>
                    Status:{' '}
                    <strong className={isLive ? 'live' : 'offline'}>
                        {isLive === null
                            ? 'Carregando...'
                            : isLive
                                ? 'AO VIVO'
                                : 'Offline'}
                    </strong>
                </div>

                <div>
                    Viewers agora:{' '}
                    <strong>
                        {viewerCount === null
                            ? '—'
                            : viewerCount.toLocaleString('pt-BR')}
                    </strong>
                </div>
            </div>

            <div className="video-wrapper">
                <iframe
                    ref={iframeRef}
                    src="https://player.kick.com/gaules?autoplay=true"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    frameBorder="0"
                />
            </div>

            {/* Gráfico logo abaixo do vídeo */}
            <ViewersChart history={history} />

            <style jsx>{`
        .page {
          min-height: 100vh;
          margin: 0;
          padding: 0;
          background: radial-gradient(circle at top, #102040 0, #02030b 55%);
          color: #e9f2ff;
          font-family: system-ui, -apple-system, BlinkMacSystemFont,
            'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
        }

        .header {
          padding: 12px 16px 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: linear-gradient(
            90deg,
            rgba(10, 25, 60, 0.95),
            rgba(5, 10, 25, 0.98)
          );
        }

        .logo-area {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .tribo-logo {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
        }

        .title-text h1 {
          margin: 0;
          font-size: 20px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .title-text p {
          margin: 2px 0 0;
          font-size: 13px;
          opacity: 0.85;
        }

        .fs-button {
          width: 100%;
          height: 70px;
          font-size: 22px;
          font-weight: 700;
          border: none;
          outline: none;
          background: linear-gradient(90deg, #4ac0ff, #7dd0ff);
          color: #021526;
          cursor: pointer;
          text-shadow: 0 0 3px rgba(255, 255, 255, 0.4);
        }

        .fs-button:active {
          filter: brightness(0.9);
        }

        .info-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding: 10px 16px;
          font-size: 14px;
          background: rgba(0, 0, 0, 0.42);
        }

        .info-bar > div {
          margin-right: 16px;
        }

        .live {
          color: #ff6b7b;
        }

        .offline {
          color: #9ca8c4;
        }

        .history {
          padding: 4px 16px 10px;
          font-size: 13px;
        }

        .history h2 {
          margin: 6px 0 4px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #a8c8ff;
        }

        .history ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .history li {
          margin-bottom: 4px;
          opacity: 0.9;
        }

        .history-time {
          color: #a0b4e0;
        }

        .history-viewers {
          color: #ffffff;
          font-weight: 500;
        }

        .history-status {
          color: #ffb199;
        }

        .video-wrapper {
          margin-top: auto;
          width: 100%;
          position: relative;
          aspect-ratio: 16 / 9;
          background: #000;
          box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.7);
        }

        .video-wrapper iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        @media (min-width: 768px) {
          .title-text h1 {
            font-size: 22px;
          }
          .info-bar {
            font-size: 15px;
          }
          .history {
            font-size: 14px;
          }
        }
      `}</style>
        </div>
    );
}
