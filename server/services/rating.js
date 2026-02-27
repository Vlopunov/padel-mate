const config = require("../config/app");

function getKFactor(matchesPlayed) {
  if (matchesPlayed <= config.RATING.CALIBRATION_MATCHES) return config.RATING.K_CALIBRATION;
  if (matchesPlayed <= config.RATING.INTERMEDIATE_MATCHES) return config.RATING.K_INTERMEDIATE;
  return config.RATING.K_ESTABLISHED;
}

function getExpectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function getLevel(rating) {
  const level = config.LEVELS.find((l) => rating >= l.min && rating <= l.max);
  return level || config.LEVELS[0];
}

function getXpLevel(xp) {
  let current = config.XP_LEVELS[0];
  for (const level of config.XP_LEVELS) {
    if (xp >= level.min) current = level;
  }
  const idx = config.XP_LEVELS.indexOf(current);
  const next = config.XP_LEVELS[idx + 1] || null;
  return { current, next, progress: next ? (xp - current.min) / (next.min - current.min) : 1 };
}

function calculateSetModifiers(sets) {
  let multiplier = 1.0;
  const hasBlowout = sets.some(
    (s) => (s.team1Score === 6 && s.team2Score <= 1) || (s.team2Score === 6 && s.team1Score <= 1)
  );
  const hasTight = sets.some(
    (s) => (s.team1Score === 7 && s.team2Score === 6) || (s.team2Score === 7 && s.team1Score === 6)
  );

  if (hasBlowout) multiplier *= config.RATING.BLOWOUT_MULTIPLIER;
  if (hasTight) multiplier *= config.RATING.TIGHT_MULTIPLIER;
  if (sets.length >= 3) multiplier *= config.RATING.THREE_SET_MULTIPLIER;

  return multiplier;
}

function determineWinner(sets) {
  let team1Wins = 0;
  let team2Wins = 0;
  for (const s of sets) {
    if (s.team1Score > s.team2Score) team1Wins++;
    else team2Wins++;
  }
  return team1Wins > team2Wins ? 1 : 2;
}

function calculateRatingChanges(team1Players, team2Players, sets, tournamentMultiplier = 1.0) {
  const team1Avg = (team1Players[0].rating + team1Players[1].rating) / 2;
  const team2Avg = (team2Players[0].rating + team2Players[1].rating) / 2;

  const winningTeam = determineWinner(sets);
  const setModifier = calculateSetModifiers(sets);

  const changes = [];

  const allPlayers = [
    ...team1Players.map((p) => ({ ...p, team: 1 })),
    ...team2Players.map((p) => ({ ...p, team: 2 })),
  ];

  for (const player of allPlayers) {
    const isTeam1 = player.team === 1;
    const myTeamAvg = isTeam1 ? team1Avg : team2Avg;
    const oppTeamAvg = isTeam1 ? team2Avg : team1Avg;
    const won = player.team === winningTeam;

    const expected = getExpectedScore(myTeamAvg, oppTeamAvg);
    const K = getKFactor(player.matchesPlayed);
    const score = won ? 1 : 0;
    let delta = Math.round(K * (score - expected) * setModifier * tournamentMultiplier);

    if (delta === 0) delta = won ? 1 : -1;

    changes.push({
      userId: player.id,
      oldRating: player.rating,
      newRating: player.rating + delta,
      change: delta,
      won,
    });
  }

  return { changes, winningTeam };
}

function calculateInitialElo(answers) {
  const weights = [0.30, 0.15, 0.20, 0.25, 0.05, 0.05];
  const maxOptions = [4, 4, 4, 4, 3, 1];

  let weighted = 0;
  for (let i = 0; i < answers.length; i++) {
    weighted += (answers[i] / maxOptions[i]) * weights[i];
  }

  return Math.round(1000 + weighted * 1500);
}

function convertExternalRating(system, value) {
  const num = parseFloat(value);
  if (isNaN(num)) return 1500;

  let rating = 1500;

  if (system === "raceto" || system === "playtomic") {
    // NTRP-based conversion: D(≤2.5)→0-2500, C(3.0-3.5)→2501-3500, B(4.0-4.5)→3501-4500, A(5.0+)→4501+
    const clamped = Math.max(1, Math.min(8, num));
    if (clamped <= 2.5) rating = 500 + (clamped - 1) * 1333;
    else if (clamped <= 3.5) rating = 2501 + (clamped - 3.0) * 2000;
    else if (clamped <= 4.5) rating = 3501 + (clamped - 4.0) * 2000;
    else rating = 4501 + (clamped - 5.0) * 166;
  } else {
    rating = Math.round(num);
  }

  // Clamp final rating to 0–5000
  return Math.max(0, Math.min(5000, rating));
}

module.exports = {
  getKFactor,
  getExpectedScore,
  getLevel,
  getXpLevel,
  calculateSetModifiers,
  determineWinner,
  calculateRatingChanges,
  calculateInitialElo,
  convertExternalRating,
};
