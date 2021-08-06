// const weeks = import.meta.glob('./raw/weeks/*.json');
import weeks from './raw/weeks.json';

export default {
    weeks: weeks.map(w => ({
        schedule: w.schedule.map(s => ({
            matchupPeriodId: s.matchupPeriodId,
            winner: s.winner,
            away: {
                teamId: s.away.teamId,
                totalPoints: s.away.totalPoints
            },
            home: {
                teamId: s.home.teamId,
                totalPoints: s.home.totalPoints
            },
        })
    })
}