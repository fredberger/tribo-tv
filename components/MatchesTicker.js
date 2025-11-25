// components/MatchesTicker.js
import { useEffect, useState } from "react";

const MATCHES_API_URL = process.env.NEXT_PUBLIC_MATCHES_API_URL;

function isSameDay(d1, d2) {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

const styles = {
    scroller: {
        overflowX: "auto",
        padding: "4px 8px",
        background: "rgba(0, 0, 0, 0.65)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    },
    row: {
        display: "flex",
        alignItems: "stretch",
        gap: "6px",
        paddingBottom: "2px",
    },
    loading: {
        color: "#a0b4e0",
        fontSize: "11px",
        padding: "2px 4px",
    },
    daySeparator: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 4px",
        borderRight: "1px solid rgba(255, 255, 255, 0.3)",
        marginRight: "2px",
    },
    daySeparatorText: {
        writingMode: "vertical-rl",
        textOrientation: "mixed",
        fontSize: "10px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#a8c8ff",
        transform: "rotate(180deg)"
    },
    tile: {
        minWidth: "100px",
        maxWidth: "110px",
        background: "#ffffffff",
        borderRadius: "3px",
        padding: "4px 6px 4px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        color: "#00275eff",
        fontSize: "10px",
    },
    tilePlaceholder: {
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
    },
    placeholderTitle: {
        fontWeight: 600,
        fontSize: "10px",
        lineHeight: 1.2,
        marginBottom: "2px",
    },
    logosRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2px",
    },
    logoWrap: {
        width: "24px",
        height: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    logo: {
        maxWidth: "24px",
        maxHeight: "24px",
        objectFit: "contain",
    },
    namesRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "10px",
        marginBottom: "1px",
    },
    teamShort: {
        maxWidth: "60px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    teamShortLeft: {
        textAlign: "left",
    },
    teamShortRight: {
        textAlign: "right",
    },
    scoreRow: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "11px",
        fontWeight: 700,
        marginBottom: "1px",
    },
    time: {
        fontSize: "9px",
        textAlign: "center",
        color: "#00275eff",
    },
    liveLabel: {
        textAlign: "center",
    }
};

export default function MatchesTicker() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);

    async function fetchMatches() {
        try {
            setLoading(true);

            const res = await fetch(MATCHES_API_URL);
            if (!res.ok) throw new Error("HTTP " + res.status);

            const json = (await res.json()).data;

            // Partidas AO VIVO
            const live = Array.isArray(json.live_matches)
                ? json.live_matches.map((m) => ({ ...m, _isLive: true }))
                : [];

            // Próximos dias
            const flat = [];
            (json.days || []).forEach((day) => {
                (day.matches || []).forEach((m) => {
                    flat.push({
                        ...m,
                        _isLive: false,
                        _dayHeadline: day.headline,
                        _dayDate: day.date,
                    });
                });
            });

            flat.sort((a, b) => (a.time_unix || 0) - (b.time_unix || 0));

            const all = [...live, ...flat];
            setMatches(all);
        } catch (err) {
            console.error("Erro ao buscar partidas:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchMatches();
        const interval = setInterval(fetchMatches, 10000);
        return () => clearInterval(interval);
    }, []);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const items = [];
    let lastDayKey = null;

    matches.forEach((m) => {
        // Primeiro tratamos as AO VIVO
        if (m._isLive) {
            const hasTeams = Array.isArray(m.teams) && m.teams.length === 2;
            const team1 = hasTeams ? m.teams[0] : null;
            const team2 = hasTeams ? m.teams[1] : null;

            // placar: tenta por team.score, depois por match.score
            let score1 =
                team1 && typeof team1.score === "number" ? team1.score : null;
            let score2 =
                team2 && typeof team2.score === "number" ? team2.score : null;
            if (
                (!Number.isFinite(score1) || !Number.isFinite(score2)) &&
                m.score &&
                typeof m.score.team1 === "number" &&
                typeof m.score.team2 === "number"
            ) {
                score1 = m.score.team1;
                score2 = m.score.team2;
            }
            const hasScore =
                typeof score1 === "number" && typeof score2 === "number";

            const mapName =
                Array.isArray(m.maps) && m.maps.length > 0 ? m.maps[0] : null;

            items.push(
                <div
                    key={`live-${m.match_id}`}
                    style={{ ...styles.tile, ...styles.liveTile }}
                >
                    <div style={styles.logosRow}>
                        <div style={styles.logoWrap}>
                            {team1?.logo && (
                                <img
                                    src={team1.logo}
                                    alt={team1.name}
                                    style={styles.logo}
                                />
                            )}
                        </div>
                        <div style={styles.logoWrap}>
                            {team2?.logo && (
                                <img
                                    src={team2.logo}
                                    alt={team2.name}
                                    style={styles.logo}
                                />
                            )}
                        </div>
                    </div>

                    <div style={styles.namesRow}>
                        <span
                            style={{ ...styles.teamShort, ...styles.teamShortLeft }}
                        >
                            {team1?.name || "Time 1"}
                        </span>
                        <span
                            style={{ ...styles.teamShort, ...styles.teamShortRight }}
                        >
                            {team2?.name || "Time 2"}
                        </span>
                    </div>

                    {/* Implementar o placar ao vivo */}
                    {/* {hasScore && (
                        <div style={styles.scoreRow}>
                            <span>{score1}</span>
                            <span>{score2}</span>
                        </div>
                    )} */}

                    <div style={styles.liveLabel}>AO VIVO - {mapName}</div>
                </div>
            );

            return;
        }

        const d = m.time_unix ? new Date(m.time_unix) : null;
        let label = null;

        if (d) {
            const key = d.toISOString().slice(0, 10);
            if (!lastDayKey || lastDayKey !== key) {
                if (isSameDay(d, tomorrow)) {
                    label = "Amanhã";
                } else if (!isSameDay(d, today)) {
                    const dia = String(d.getDate()).padStart(2, "0");
                    const mesRaw = d.toLocaleString("pt-BR", { month: "short" });
                    const mes =
                        mesRaw.charAt(0).toUpperCase() + mesRaw.slice(1);
                    label = `${dia} ${mes}`;
                }
                lastDayKey = key;
            }
        }

        if (label) {
            items.push(
                <div
                    style={styles.daySeparator}
                    key={`sep-${label}-${m.match_id}`}
                >
                    <span style={styles.daySeparatorText}>{label}</span>
                </div>
            );
        }

        const hasTeams = Array.isArray(m.teams) && m.teams.length === 2;
        const team1 = hasTeams ? m.teams[0] : null;
        const team2 = hasTeams ? m.teams[1] : null;

        const score1 =
            team1 && typeof team1.score === "number" ? team1.score : null;
        const score2 =
            team2 && typeof team2.score === "number" ? team2.score : null;
        const hasScore =
            typeof score1 === "number" && typeof score2 === "number";

        const dTime = m.time_unix ? new Date(m.time_unix) : null;
        const timeLabel = dTime
            ? dTime.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Sao_Paulo",
            })
            : m.time || "";

        if (!hasTeams && m.placeholder) {
            items.push(
                <div
                    key={m.match_id}
                    style={{ ...styles.tile, ...styles.tilePlaceholder }}
                >
                    <div style={styles.placeholderTitle}>
                        {m.placeholder.short || "A definir"}
                    </div>
                    <div style={styles.time}>{timeLabel}</div>
                </div>
            );
            return;
        }

        items.push(
            <div key={m.match_id} style={styles.tile}>
                <div style={styles.logosRow}>
                    <div style={styles.logoWrap}>
                        {team1?.logo && (
                            <img
                                src={team1.logo}
                                alt={team1.name}
                                style={styles.logo}
                            />
                        )}
                    </div>
                    <div style={styles.logoWrap}>
                        {team2?.logo && (
                            <img
                                src={team2.logo}
                                alt={team2.name}
                                style={styles.logo}
                            />
                        )}
                    </div>
                </div>

                <div style={styles.namesRow}>
                    <span
                        style={{ ...styles.teamShort, ...styles.teamShortLeft }}
                    >
                        {team1?.name || "Time 1"}
                    </span>
                    <span
                        style={{ ...styles.teamShort, ...styles.teamShortRight }}
                    >
                        {team2?.name || "Time 2"}
                    </span>
                </div>

                <div style={styles.scoreRow}>
                    <span>{hasScore ? score1 : ""}</span>
                    <span>{hasScore ? score2 : ""}</span>
                </div>

                <div style={styles.time}>{timeLabel}</div>
            </div>
        );
    });

    return (
        <div style={styles.scroller}>
            <div style={styles.row}>
                {loading && matches.length === 0 ? (
                    <div style={styles.loading}>Carregando partidas...</div>
                ) : items.length === 0 ? (
                    <div style={styles.loading}>Nenhuma partida encontrada.</div>
                ) : (
                    items
                )}
            </div>
        </div>
    );
}
