// pages/index.js
import { useEffect, useRef, useState } from 'react';
import MatchesTicker from "../components/MatchesTicker";

const CHANNEL_SLUG = 'gaules';
const FULLSCREEN_COUNT_KEY = `kick_fullscreen_count_${CHANNEL_SLUG}`;

// --- Página principal ---
const styles = {
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 16px",
        background: "rgba(0, 0, 0, 0.6)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    },
    logoArea: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    triboLogo: {
        width: "40px",
        height: "40px",
        borderRadius: "8px",
    },
    titleText: {
        display: "flex",
        flexDirection: "column",
        lineHeight: "1.1",
    },
    titleH1: {
        margin: 0,
        fontSize: "18px",
        color: "#e9f2ff",
    },
    titleP: {
        margin: 0,
        fontSize: "12px",
        color: "#a0b4e0",
    },
    ghLink: {
        display: "flex",
        alignItems: "center",
    },
    ghBtn: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        textDecoration: "none",
        color: "#e9f2ff",
        fontWeight: 600,
        fontSize: "14px",
        background: "rgba(255, 255, 255, 0.1)",
        padding: "6px 10px",
        borderRadius: "6px",
        transition: "background 0.2s",
    },
    ghBtnHover: {
        background: "rgba(255, 255, 255, 0.2)",
    },
    ghImg: {
        width: "18px",
        height: "18px",
        filter: "invert(1)",
    },
};

export default function HomePage() {
    const iframeRef = useRef(null);
    const [fullscreenCount, setFullscreenCount] = useState(0);

    useEffect(() => {
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.backgroundColor = "#000";
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
            <header style={styles.header}>
                <div style={styles.logoArea}>
                    <img
                        src="https://static-cdn.jtvnw.net/jtv_user_pictures/f4b12683-57ff-4b57-926a-67512b43a7ff-profile_image-300x300.png"
                        alt="Tribo"
                        style={styles.triboLogo}
                    />
                    <div style={styles.titleText}>
                        <h1 style={styles.titleH1}>Tribo TV</h1>
                        <p style={styles.titleP}>Canal: {CHANNEL_SLUG}</p>
                    </div>
                </div>

                <div>
                    <button className="fs-button" onClick={handleFullscreen}>
                        Abrir FullScreen
                    </button>
                </div>

                <div style={styles.ghLink}>
                    <a
                        href="https://github.com/fredberger/tribo-tv"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.ghBtn}
                    >
                        <img
                            src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
                            alt="GitHub"
                            style={styles.ghImg}
                        />
                        <span>⭐ Contribua</span>
                    </a>
                </div>
            </header>

            <MatchesTicker />

            <div className="video-wrapper">
                <iframe
                    ref={iframeRef}
                    src="https://player.kick.com/gaules?autoplay=true"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    frameBorder="0"
                />
            </div>

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
