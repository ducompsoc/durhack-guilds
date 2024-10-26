export function getPositionMedal(rank: number) {
    if (rank === 0) return "🥇";
    if (rank === 1) return "🥈";
    if (rank === 2) return "🥉";
    return `(#${rank + 1})`;
}

export function getHackerEmoji(points: number) {
    if (points < 0) return "🚨";
    if (points < 100) return "💻";
    if (points < 250) return "📈";
    if (points < 500) return "🎉";
    if (points < 1000) return "🤯";
    return "🏆";
}

