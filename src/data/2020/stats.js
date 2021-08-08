// const weeks = import.meta.glob('./raw/weeks/*.json');
import espn from './espn.json';
import draft from './draft.json';
import teams from './raw/teams.json';
import weeks from './raw/week16.json';



// utility functions
function groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
         const key = keyGetter(item);
         const collection = map.get(key);
         if (!collection) {
             map.set(key, [item]);
         } else {
             collection.push(item);
         }
    });
    return map;
}

// data functions
function getGameSlim(team, week, game, projectedPoints, winProjection, didWin) {
    if (game.rosterForCurrentScoringPeriod == undefined) {
        return {
            didWin,
            slug: team.slug,
            teamId: game.teamId,
            teamName: team.teamName,
            totalPoints: game.totalPoints,
            week,
            winProjection
        };
    }

    let starters = game.rosterForCurrentScoringPeriod.entries.filter(e => e.lineupSlotId !== espn.lineupSlots.bench);
    let mvpPoints = Math.max.apply(this, starters.map(s => s.playerPoolEntry.appliedStatTotal));
    let mvps = starters.filter(s => s.playerPoolEntry.appliedStatTotal === mvpPoints);
    let mvpNames = mvps.map(m => m.playerPoolEntry.player.fullName).join(", ");
    let lvpPoints = Math.min.apply(this, starters.map(s => s.playerPoolEntry.appliedStatTotal));
    let lvps = starters.filter(s => s.playerPoolEntry.appliedStatTotal === lvpPoints);
    let lvpNames = lvps.map(m => m.playerPoolEntry.player.fullName).join(", ");
    let bench = game.rosterForCurrentScoringPeriod.entries.filter(e => e.lineupSlotId === espn.lineupSlots.bench);
    let benchMvpPoints = Math.max.apply(this, bench.map(s => s.playerPoolEntry.appliedStatTotal));
    let benchMvps = bench.filter(s => s.playerPoolEntry.appliedStatTotal === benchMvpPoints);
    let benchMvpNames = benchMvps.map(m => m.playerPoolEntry.player.fullName).join(", ");
    
    let positionPoints = Object.keys(espn.lineupSlots).map(position => { 
        let players = game.rosterForCurrentScoringPeriod.entries.filter(e => e.lineupSlotId === espn.lineupSlots[position]);
        let points = players.reduce( (acc, cur) => acc += cur.playerPoolEntry.appliedStatTotal, 0);
        
        return {
            position, 
            points: points.toFixed(2)
        };
    });

    return {
        benchMvpNames,
        benchMvpPoints,
        didWin,
        lvpNames,
        lvpPoints,
        mvpNames,
        mvpPoints,
        positionPoints,
        projectedPoints,
        slug: team.slug,
        teamId: game.teamId,
        teamName: team.teamName,
        totalPoints: game.totalPoints,
        week
    };
}

function getProjectedPoints (game) {
    // TODO: retrieve each week so we have the rosterForCurrentScoringPeriod for each week
    if (game.rosterForCurrentScoringPeriod == undefined) {
        return 0;
    }

    let starters = game.rosterForCurrentScoringPeriod.entries.filter(e => e.lineupSlotId !== espn.lineupSlots.bench);
    let projected = starters.map(e => e.playerPoolEntry.player.stats.find(s => s.proTeamId === 0));
    let projectedPoints = projected.reduce( (acc, cur) => acc += cur.appliedTotal, 0);
    return projectedPoints;
}


const teamsSlim = teams[0].teams.map(team => ({
    abbrev: team.abbrev, 
    draftOrder: draft.teams.find(t => t.id === team.id).draftOrder,
    id: team.id, 
    owner: teams[0].members.find(m => m.id === team.owners[0]),
    slug: team.abbrev.toLowerCase(),
    teamName: `${team.location} ${team.nickname}`
}));

const weeksSlim = weeks.schedule.map(game => {
    let homeProjectedPoints = getProjectedPoints(game.home);
    let awayProjectedPoints = getProjectedPoints(game.away);
    let homeTeam = teamsSlim.find(t => t.id === game.home.teamId);
    let home = getGameSlim(homeTeam, game.matchupPeriodId, game.home, homeProjectedPoints, 
        homeProjectedPoints - awayProjectedPoints, game.winner === "HOME");
    let awayTeam = teamsSlim.find(t => t.id === game.away.teamId);
    let away = getGameSlim(awayTeam, game.matchupPeriodId, game.away, awayProjectedPoints,
        awayProjectedPoints - homeProjectedPoints, game.winner === "AWAY");
    
    return {
        away,
        home,
        week: away.week
    };
});
const weeksGrouped = groupBy(weeksSlim, week => week.week);



export default {
    teams: teamsSlim,
    weeks: weeksGrouped
}