/**
 * Tournament Engine — Americano & Mexicano format algorithms
 *
 * Americano: All rounds generated upfront. Each player partners with different
 * players each round. Fixed total points per match (e.g. 24).
 *
 * Mexicano: Round 1 is random. Each subsequent round is generated dynamically
 * based on current standings (#1+#3 vs #2+#4, etc.).
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  notifyTournamentStart,
  notifyNextRound,
  notifyTournamentComplete,
} = require("./notifications");

// ─── Helpers ────────────────────────────────────────────────

/**
 * Shuffle an array in-place (Fisher-Yates)
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generate all unique combinations of k elements from array
 */
function combinations(arr, k) {
  if (k === 1) return arr.map((v) => [v]);
  const result = [];
  for (let i = 0; i <= arr.length - k; i++) {
    const rest = combinations(arr.slice(i + 1), k - 1);
    for (const combo of rest) {
      result.push([arr[i], ...combo]);
    }
  }
  return result;
}

// ─── Americano Round Generation ─────────────────────────────

/**
 * Generate ALL rounds for Americano format.
 *
 * Algorithm:
 * 1. Get all unique pairs (combinations of 2 from N players)
 * 2. For each round, pick C matches (C = courts) such that:
 *    - No player appears twice in the same round
 *    - Each player partners with as many different players as possible
 * 3. Use a greedy approach with pair usage tracking
 *
 * @param {number[]} playerIds - Array of registered player IDs
 * @param {number} courts - Number of available courts
 * @returns {Array<Array<{team1: [id, id], team2: [id, id], court: number}>>} rounds
 */
function generateAmericanoRounds(playerIds, courts) {
  const N = playerIds.length;
  if (N < 4) throw new Error("Минимум 4 игрока для Americano");

  const playersPerRound = Math.min(courts * 4, N);
  const matchesPerRound = Math.floor(playersPerRound / 4);

  // Generate all possible pairs
  const allPairs = combinations(playerIds, 2);

  // Track how many times each pair has played together
  const pairUsage = {};
  const pairKey = (a, b) => `${Math.min(a, b)}_${Math.max(a, b)}`;
  for (const pair of allPairs) {
    pairUsage[pairKey(pair[0], pair[1])] = 0;
  }

  // Track how many times each player has "sat out"
  const sitOutCount = {};
  playerIds.forEach((id) => (sitOutCount[id] = 0));

  // Track opponent history — each pair of opponents
  const opponentUsage = {};
  const oppKey = (a, b) => `opp_${Math.min(a, b)}_${Math.max(a, b)}`;

  const rounds = [];
  const maxRounds = Math.min(
    Math.ceil(allPairs.length / matchesPerRound),
    N * 2 // safety limit
  );

  for (let r = 0; r < maxRounds; r++) {
    // Select players for this round (prefer those who sat out more)
    let roundPlayers;
    if (playersPerRound >= N) {
      roundPlayers = [...playerIds];
    } else {
      // Sort by sit-out count DESC, pick top playersPerRound
      const sorted = [...playerIds].sort((a, b) => sitOutCount[b] - sitOutCount[a]);
      roundPlayers = sorted.slice(0, playersPerRound);
    }

    // Generate matches for this round using greedy pair selection
    const matches = [];
    const usedInRound = new Set();

    for (let m = 0; m < matchesPerRound; m++) {
      // Find best team1 pair (least used together)
      const availablePlayers = roundPlayers.filter((p) => !usedInRound.has(p));
      if (availablePlayers.length < 4) break;

      const availablePairs = combinations(availablePlayers, 2);
      availablePairs.sort((a, b) => {
        return pairUsage[pairKey(a[0], a[1])] - pairUsage[pairKey(b[0], b[1])];
      });

      // Pick least-used pair as team1
      const team1 = availablePairs[0];
      usedInRound.add(team1[0]);
      usedInRound.add(team1[1]);

      // Pick least-used pair from remaining as team2
      const remaining = availablePlayers.filter(
        (p) => !usedInRound.has(p)
      );
      const remainingPairs = combinations(remaining, 2);
      remainingPairs.sort((a, b) => {
        const usageA = pairUsage[pairKey(a[0], a[1])];
        const usageB = pairUsage[pairKey(b[0], b[1])];
        if (usageA !== usageB) return usageA - usageB;
        // Tie-break: prefer opponents we haven't faced
        const oppA = (opponentUsage[oppKey(team1[0], a[0])] || 0) +
                     (opponentUsage[oppKey(team1[0], a[1])] || 0) +
                     (opponentUsage[oppKey(team1[1], a[0])] || 0) +
                     (opponentUsage[oppKey(team1[1], a[1])] || 0);
        const oppB = (opponentUsage[oppKey(team1[0], b[0])] || 0) +
                     (opponentUsage[oppKey(team1[0], b[1])] || 0) +
                     (opponentUsage[oppKey(team1[1], b[0])] || 0) +
                     (opponentUsage[oppKey(team1[1], b[1])] || 0);
        return oppA - oppB;
      });

      if (remainingPairs.length === 0) break;

      const team2 = remainingPairs[0];
      usedInRound.add(team2[0]);
      usedInRound.add(team2[1]);

      // Update usage
      pairUsage[pairKey(team1[0], team1[1])]++;
      pairUsage[pairKey(team2[0], team2[1])]++;
      for (const t1p of team1) {
        for (const t2p of team2) {
          opponentUsage[oppKey(t1p, t2p)] = (opponentUsage[oppKey(t1p, t2p)] || 0) + 1;
        }
      }

      matches.push({
        team1: [team1[0], team1[1]],
        team2: [team2[0], team2[1]],
        court: (m % courts) + 1,
      });
    }

    if (matches.length === 0) break;

    // Update sit-out counts
    const playedThisRound = new Set();
    for (const match of matches) {
      match.team1.forEach((p) => playedThisRound.add(p));
      match.team2.forEach((p) => playedThisRound.add(p));
    }
    for (const id of playerIds) {
      if (!playedThisRound.has(id)) {
        sitOutCount[id]++;
      }
    }

    rounds.push(matches);

    // Check if all pairs have played together at least once
    const unusedPairs = Object.values(pairUsage).filter((v) => v === 0).length;
    if (unusedPairs === 0 && rounds.length >= N - 1) break;
  }

  return rounds;
}

// ─── Mexicano Round Generation ──────────────────────────────

/**
 * Generate a single Mexicano round based on current standings.
 *
 * Round 1: random matchups.
 * Round N (N > 1): sort by points DESC, then:
 *   #1+#3 vs #2+#4, #5+#7 vs #6+#8, etc.
 *
 * @param {Array<{userId: number, points: number}>} standings - Sorted by points DESC
 * @param {number} courts - Number of available courts
 * @param {boolean} isFirstRound - Whether this is round 1
 * @returns {Array<{team1: [id, id], team2: [id, id], court: number}>} matches
 */
function generateMexicanoRound(standings, courts, isFirstRound = false) {
  const N = standings.length;
  if (N < 4) throw new Error("Минимум 4 игрока для Mexicano");

  const playersPerRound = Math.min(courts * 4, N);
  const matchesPerRound = Math.floor(playersPerRound / 4);

  let orderedPlayers;

  if (isFirstRound) {
    // Random for first round
    orderedPlayers = shuffle(standings.map((s) => s.userId));
  } else {
    // Sorted by points DESC (standings should already be sorted)
    orderedPlayers = standings.map((s) => s.userId);
  }

  // Take only players who will play this round
  const activePlayers = orderedPlayers.slice(0, playersPerRound);

  const matches = [];
  for (let m = 0; m < matchesPerRound; m++) {
    const offset = m * 4;
    if (offset + 3 >= activePlayers.length) break;

    // #1+#3 vs #2+#4 pattern (within each group of 4)
    matches.push({
      team1: [activePlayers[offset], activePlayers[offset + 2]],
      team2: [activePlayers[offset + 1], activePlayers[offset + 3]],
      court: (m % courts) + 1,
    });
  }

  return matches;
}

// ─── DB Operations ──────────────────────────────────────────

/**
 * Start a tournament: validate, generate rounds, create standings.
 */
async function startTournament(tournamentId) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      registrations: {
        include: {
          player1: { select: { id: true } },
          player2: { select: { id: true } },
        },
      },
    },
  });

  if (!tournament) throw new Error("Турнир не найден");
  if (tournament.status !== "REGISTRATION") throw new Error("Турнир не в статусе регистрации");

  const format = tournament.format.toLowerCase();
  const isIndividual = format === "americano" || format === "mexicano";

  // Collect player IDs
  let playerIds;
  if (isIndividual) {
    // Individual registration — each registration = 1 player
    playerIds = tournament.registrations.map((r) => r.player1Id);
  } else {
    // Team registration — each registration = 2 players
    playerIds = [];
    for (const reg of tournament.registrations) {
      playerIds.push(reg.player1Id);
      if (reg.player2Id) playerIds.push(reg.player2Id);
    }
  }

  // Remove duplicates
  playerIds = [...new Set(playerIds)];

  if (playerIds.length < 4) {
    throw new Error(`Минимум 4 игрока для старта. Сейчас: ${playerIds.length}`);
  }

  const courts = tournament.courtsCount || 1;

  // Generate rounds based on format
  if (format === "americano") {
    const rounds = generateAmericanoRounds(playerIds, courts);

    // Create all rounds and matches in DB
    for (let i = 0; i < rounds.length; i++) {
      const round = await prisma.tournamentRound.create({
        data: {
          tournamentId,
          roundNumber: i + 1,
          status: i === 0 ? "IN_PROGRESS" : "PENDING",
        },
      });

      for (const match of rounds[i]) {
        await prisma.tournamentMatch.create({
          data: {
            tournamentId,
            roundId: round.id,
            courtNumber: match.court,
            team1Player1Id: match.team1[0],
            team1Player2Id: match.team1[1],
            team2Player1Id: match.team2[0],
            team2Player2Id: match.team2[1],
            status: i === 0 ? "IN_PROGRESS" : "PENDING",
          },
        });
      }
    }
  } else if (format === "mexicano") {
    // Mexicano: generate only first round
    const standings = playerIds.map((id) => ({ userId: id, points: 0 }));
    const matches = generateMexicanoRound(standings, courts, true);

    const round = await prisma.tournamentRound.create({
      data: {
        tournamentId,
        roundNumber: 1,
        status: "IN_PROGRESS",
      },
    });

    for (const match of matches) {
      await prisma.tournamentMatch.create({
        data: {
          tournamentId,
          roundId: round.id,
          courtNumber: match.court,
          team1Player1Id: match.team1[0],
          team1Player2Id: match.team1[1],
          team2Player1Id: match.team2[0],
          team2Player2Id: match.team2[1],
          status: "IN_PROGRESS",
        },
      });
    }
  } else {
    throw new Error(`Формат '${format}' не поддерживает live-режим`);
  }

  // Create standings for all players
  for (const playerId of playerIds) {
    await prisma.tournamentStanding.create({
      data: {
        tournamentId,
        userId: playerId,
        points: 0,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        position: 0,
      },
    });
  }

  // Update tournament status
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      status: "IN_PROGRESS",
      currentRound: 1,
    },
  });

  // Send notifications to all players
  try {
    const tournamentWithVenue = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { venue: true },
    });
    const firstRound = await prisma.tournamentRound.findUnique({
      where: { tournamentId_roundNumber: { tournamentId, roundNumber: 1 } },
      include: {
        matches: {
          include: {
            team1Player1: { select: { id: true, firstName: true, telegramId: true } },
            team1Player2: { select: { id: true, firstName: true, telegramId: true } },
            team2Player1: { select: { id: true, firstName: true, telegramId: true } },
            team2Player2: { select: { id: true, firstName: true, telegramId: true } },
          },
        },
      },
    });

    const players = await prisma.user.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, firstName: true, telegramId: true },
    });

    for (const player of players) {
      // Find player's match in round 1
      const match = firstRound?.matches?.find(m =>
        [m.team1Player1Id, m.team1Player2Id, m.team2Player1Id, m.team2Player2Id].includes(player.id)
      );

      let matchInfo = null;
      if (match) {
        const isTeam1 = match.team1Player1Id === player.id || match.team1Player2Id === player.id;
        const partnerId = isTeam1
          ? (match.team1Player1Id === player.id ? match.team1Player2Id : match.team1Player1Id)
          : (match.team2Player1Id === player.id ? match.team2Player2Id : match.team2Player1Id);
        const partner = isTeam1
          ? (match.team1Player1Id === player.id ? match.team1Player2 : match.team1Player1)
          : (match.team2Player1Id === player.id ? match.team2Player2 : match.team2Player1);
        const opp1 = isTeam1 ? match.team2Player1 : match.team1Player1;
        const opp2 = isTeam1 ? match.team2Player2 : match.team1Player2;
        matchInfo = {
          court: match.courtNumber,
          partner: partner?.firstName || "?",
          opponents: `${opp1?.firstName || "?"} + ${opp2?.firstName || "?"}`,
        };
      }

      await notifyTournamentStart(player.telegramId.toString(), tournamentWithVenue, matchInfo);
    }
  } catch (notifErr) {
    console.error("Tournament start notification error:", notifErr);
  }

  return { success: true, playerCount: playerIds.length };
}

/**
 * Submit score for a tournament match.
 * Updates standings after each score.
 */
async function submitScore(tournamentId, matchId, team1Score, team2Score) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) throw new Error("Турнир не найден");
  if (tournament.status !== "IN_PROGRESS") throw new Error("Турнир не активен");

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
  });
  if (!match) throw new Error("Матч не найден");
  if (match.tournamentId !== tournamentId) throw new Error("Матч не принадлежит этому турниру");
  if (match.status === "COMPLETED") throw new Error("Счёт уже записан");

  // Validate score sum = pointsPerMatch
  if (team1Score + team2Score !== tournament.pointsPerMatch) {
    throw new Error(`Сумма очков должна быть ${tournament.pointsPerMatch}. Получено: ${team1Score + team2Score}`);
  }

  if (team1Score < 0 || team2Score < 0) {
    throw new Error("Очки не могут быть отрицательными");
  }

  // Update match
  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: {
      team1Score,
      team2Score,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  // Determine winner
  const team1Won = team1Score > team2Score;
  const allPlayers = [
    { id: match.team1Player1Id, team: 1 },
    { id: match.team1Player2Id, team: 1 },
    { id: match.team2Player1Id, team: 2 },
    { id: match.team2Player2Id, team: 2 },
  ];

  // Update standings for each player
  for (const player of allPlayers) {
    const isTeam1 = player.team === 1;
    const myScore = isTeam1 ? team1Score : team2Score;
    const oppScore = isTeam1 ? team2Score : team1Score;
    const won = isTeam1 ? team1Won : !team1Won;

    await prisma.tournamentStanding.update({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: player.id,
        },
      },
      data: {
        points: { increment: myScore },
        pointsFor: { increment: myScore },
        pointsAgainst: { increment: oppScore },
        wins: won ? { increment: 1 } : undefined,
        losses: !won ? { increment: 1 } : undefined,
      },
    });
  }

  // Recalculate positions
  await recalculatePositions(tournamentId);

  // Check if round is complete
  const round = await prisma.tournamentRound.findUnique({
    where: { id: match.roundId },
    include: { matches: true },
  });

  const allCompleted = round.matches.every(
    (m) => m.id === matchId ? true : m.status === "COMPLETED"
  );

  if (allCompleted) {
    await prisma.tournamentRound.update({
      where: { id: round.id },
      data: { status: "COMPLETED" },
    });

    // For Americano: auto-advance to next round
    const format = tournament.format.toLowerCase();
    if (format === "americano") {
      const nextRound = await prisma.tournamentRound.findUnique({
        where: {
          tournamentId_roundNumber: {
            tournamentId,
            roundNumber: round.roundNumber + 1,
          },
        },
      });

      if (nextRound) {
        await prisma.tournamentRound.update({
          where: { id: nextRound.id },
          data: { status: "IN_PROGRESS" },
        });

        await prisma.tournamentMatch.updateMany({
          where: { roundId: nextRound.id },
          data: { status: "IN_PROGRESS" },
        });

        await prisma.tournament.update({
          where: { id: tournamentId },
          data: { currentRound: round.roundNumber + 1 },
        });
      }
      // If no next round — tournament can be completed by admin
    }
  }

  return { success: true, roundCompleted: allCompleted };
}

/**
 * Generate next round for Mexicano format.
 */
async function generateNextRound(tournamentId) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) throw new Error("Турнир не найден");
  if (tournament.status !== "IN_PROGRESS") throw new Error("Турнир не активен");
  if (tournament.format.toLowerCase() !== "mexicano") {
    throw new Error("Следующий раунд генерируется только для Mexicano");
  }

  // Check current round is completed
  const currentRound = await prisma.tournamentRound.findUnique({
    where: {
      tournamentId_roundNumber: {
        tournamentId,
        roundNumber: tournament.currentRound,
      },
    },
    include: { matches: true },
  });

  if (!currentRound) throw new Error("Текущий раунд не найден");

  const allCompleted = currentRound.matches.every((m) => m.status === "COMPLETED");
  if (!allCompleted) {
    throw new Error("Не все матчи текущего раунда завершены");
  }

  // Get current standings sorted by points DESC
  const standings = await prisma.tournamentStanding.findMany({
    where: { tournamentId },
    orderBy: [{ points: "desc" }, { pointsFor: "desc" }],
  });

  const courts = tournament.courtsCount || 1;
  const newRoundNumber = tournament.currentRound + 1;

  // Generate matches based on standings
  const matches = generateMexicanoRound(standings, courts, false);

  // Create round in DB
  const round = await prisma.tournamentRound.create({
    data: {
      tournamentId,
      roundNumber: newRoundNumber,
      status: "IN_PROGRESS",
    },
  });

  for (const match of matches) {
    await prisma.tournamentMatch.create({
      data: {
        tournamentId,
        roundId: round.id,
        courtNumber: match.court,
        team1Player1Id: match.team1[0],
        team1Player2Id: match.team1[1],
        team2Player1Id: match.team2[0],
        team2Player2Id: match.team2[1],
        status: "IN_PROGRESS",
      },
    });
  }

  // Update tournament current round
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { currentRound: newRoundNumber },
  });

  // Notify players about new round
  try {
    const tournamentWithVenue = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { venue: true },
    });
    const roundWithPlayers = await prisma.tournamentRound.findUnique({
      where: { id: round.id },
      include: {
        matches: {
          include: {
            team1Player1: { select: { id: true, firstName: true, telegramId: true } },
            team1Player2: { select: { id: true, firstName: true, telegramId: true } },
            team2Player1: { select: { id: true, firstName: true, telegramId: true } },
            team2Player2: { select: { id: true, firstName: true, telegramId: true } },
          },
        },
      },
    });

    // Get all tournament players
    const allStandings = await prisma.tournamentStanding.findMany({
      where: { tournamentId },
      include: { user: { select: { id: true, firstName: true, telegramId: true } } },
    });

    const playingThisRound = new Set();
    for (const m of roundWithPlayers.matches) {
      [m.team1Player1Id, m.team1Player2Id, m.team2Player1Id, m.team2Player2Id].forEach(id => playingThisRound.add(id));
    }

    for (const standing of allStandings) {
      const player = standing.user;
      const match = roundWithPlayers.matches.find(m =>
        [m.team1Player1Id, m.team1Player2Id, m.team2Player1Id, m.team2Player2Id].includes(player.id)
      );

      let matchInfo = null;
      if (match) {
        const isTeam1 = match.team1Player1Id === player.id || match.team1Player2Id === player.id;
        const partner = isTeam1
          ? (match.team1Player1Id === player.id ? match.team1Player2 : match.team1Player1)
          : (match.team2Player1Id === player.id ? match.team2Player2 : match.team2Player1);
        const opp1 = isTeam1 ? match.team2Player1 : match.team1Player1;
        const opp2 = isTeam1 ? match.team2Player2 : match.team1Player2;
        matchInfo = {
          court: match.courtNumber,
          partner: partner?.firstName || "?",
          opponents: `${opp1?.firstName || "?"} + ${opp2?.firstName || "?"}`,
        };
      }

      await notifyNextRound(player.telegramId.toString(), tournamentWithVenue, newRoundNumber, matchInfo);
    }
  } catch (notifErr) {
    console.error("Next round notification error:", notifErr);
  }

  return { success: true, roundNumber: newRoundNumber, matchCount: matches.length };
}

/**
 * Complete a tournament: calculate rating changes.
 */
async function completeTournament(tournamentId) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      matches: true,
      standings: {
        orderBy: [{ points: "desc" }, { pointsFor: "desc" }],
      },
    },
  });

  if (!tournament) throw new Error("Турнир не найден");
  if (tournament.status !== "IN_PROGRESS") throw new Error("Турнир не активен");

  // Check all matches completed
  const pendingMatches = tournament.matches.filter((m) => m.status !== "COMPLETED");
  // Only check current round's matches
  const currentRound = await prisma.tournamentRound.findUnique({
    where: {
      tournamentId_roundNumber: {
        tournamentId,
        roundNumber: tournament.currentRound,
      },
    },
    include: { matches: true },
  });

  if (currentRound) {
    const currentPending = currentRound.matches.filter((m) => m.status !== "COMPLETED");
    if (currentPending.length > 0) {
      throw new Error(`Не все матчи текущего раунда завершены (осталось: ${currentPending.length})`);
    }
  }

  // Calculate Elo rating changes for each completed match
  const { getKFactor, getExpectedScore } = require("./rating");
  const completedMatches = tournament.matches.filter((m) => m.status === "COMPLETED");

  // Accumulate rating changes per player
  const ratingDeltas = {}; // userId -> total delta
  const playerCache = {}; // userId -> { rating, matchesPlayed }

  // Load all players involved
  const playerIds = [...new Set(
    completedMatches.flatMap((m) => [
      m.team1Player1Id, m.team1Player2Id,
      m.team2Player1Id, m.team2Player2Id,
    ])
  )];

  const players = await prisma.user.findMany({
    where: { id: { in: playerIds } },
    select: { id: true, rating: true, matchesPlayed: true },
  });

  for (const p of players) {
    playerCache[p.id] = { rating: p.rating, matchesPlayed: p.matchesPlayed };
    ratingDeltas[p.id] = 0;
  }

  // Process each match
  for (const match of completedMatches) {
    if (match.team1Score === null || match.team2Score === null) continue;

    const t1p1 = playerCache[match.team1Player1Id];
    const t1p2 = playerCache[match.team1Player2Id];
    const t2p1 = playerCache[match.team2Player1Id];
    const t2p2 = playerCache[match.team2Player2Id];

    if (!t1p1 || !t1p2 || !t2p1 || !t2p2) continue;

    const team1Avg = ((t1p1.rating + ratingDeltas[match.team1Player1Id]) +
                      (t1p2.rating + ratingDeltas[match.team1Player2Id])) / 2;
    const team2Avg = ((t2p1.rating + ratingDeltas[match.team2Player1Id]) +
                      (t2p2.rating + ratingDeltas[match.team2Player2Id])) / 2;

    const team1Won = match.team1Score > match.team2Score;

    const matchPlayers = [
      { id: match.team1Player1Id, team: 1 },
      { id: match.team1Player2Id, team: 1 },
      { id: match.team2Player1Id, team: 2 },
      { id: match.team2Player2Id, team: 2 },
    ];

    for (const mp of matchPlayers) {
      const isTeam1 = mp.team === 1;
      const myAvg = isTeam1 ? team1Avg : team2Avg;
      const oppAvg = isTeam1 ? team2Avg : team1Avg;
      const won = isTeam1 ? team1Won : !team1Won;

      const expected = getExpectedScore(myAvg, oppAvg);
      const K = getKFactor(playerCache[mp.id].matchesPlayed);
      const score = won ? 1 : 0;
      // Apply tournament multiplier
      let delta = Math.round(K * (score - expected) * (tournament.ratingMultiplier || 1.0));
      if (delta === 0) delta = won ? 1 : -1;

      ratingDeltas[mp.id] += delta;
    }
  }

  // Save rating changes and update users
  for (const playerId of playerIds) {
    const player = playerCache[playerId];
    const delta = ratingDeltas[playerId];
    const newRating = Math.max(0, player.rating + delta);

    await prisma.tournamentRatingChange.create({
      data: {
        tournamentId,
        userId: playerId,
        oldRating: player.rating,
        newRating,
        change: delta,
      },
    });

    // Count wins/losses from tournament matches
    const playerMatches = completedMatches.filter(
      (m) =>
        m.team1Player1Id === playerId ||
        m.team1Player2Id === playerId ||
        m.team2Player1Id === playerId ||
        m.team2Player2Id === playerId
    );

    let tWins = 0;
    let tLosses = 0;
    for (const m of playerMatches) {
      const isTeam1 = m.team1Player1Id === playerId || m.team1Player2Id === playerId;
      const won = isTeam1 ? m.team1Score > m.team2Score : m.team2Score > m.team1Score;
      if (won) tWins++;
      else tLosses++;
    }

    await prisma.user.update({
      where: { id: playerId },
      data: {
        rating: newRating,
        matchesPlayed: { increment: playerMatches.length },
        wins: { increment: tWins },
        losses: { increment: tLosses },
      },
    });

    // Add rating history entry
    await prisma.ratingHistory.create({
      data: {
        userId: playerId,
        oldRating: player.rating,
        newRating,
        change: delta,
        reason: "tournament",
        note: `Турнир: ${tournament.name}`,
      },
    });
  }

  // Update final positions
  await recalculatePositions(tournamentId);

  // Update tournament status
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "COMPLETED" },
  });

  // Notify all players about completion
  try {
    const tournamentWithVenue = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { venue: true },
    });
    const finalStandings = await prisma.tournamentStanding.findMany({
      where: { tournamentId },
      orderBy: [{ points: "desc" }, { pointsFor: "desc" }],
      include: { user: { select: { id: true, firstName: true, telegramId: true } } },
    });

    for (let i = 0; i < finalStandings.length; i++) {
      const standing = finalStandings[i];
      const change = ratingDeltas[standing.userId] || 0;
      await notifyTournamentComplete(
        standing.user.telegramId.toString(),
        tournamentWithVenue,
        i + 1,
        change
      );
    }
  } catch (notifErr) {
    console.error("Tournament complete notification error:", notifErr);
  }

  return { success: true, ratingChanges: ratingDeltas };
}

/**
 * Get full live data for a tournament.
 */
async function getLiveData(tournamentId) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      venue: true,
      rounds: {
        orderBy: { roundNumber: "asc" },
        include: {
          matches: {
            include: {
              team1Player1: { select: { id: true, firstName: true, lastName: true, photoUrl: true, rating: true } },
              team1Player2: { select: { id: true, firstName: true, lastName: true, photoUrl: true, rating: true } },
              team2Player1: { select: { id: true, firstName: true, lastName: true, photoUrl: true, rating: true } },
              team2Player2: { select: { id: true, firstName: true, lastName: true, photoUrl: true, rating: true } },
            },
          },
        },
      },
      standings: {
        orderBy: [{ points: "desc" }, { pointsFor: "desc" }],
        include: {
          user: { select: { id: true, firstName: true, lastName: true, photoUrl: true, rating: true } },
        },
      },
      ratingChanges: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      registrations: {
        include: {
          player1: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
          player2: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        },
      },
    },
  });

  if (!tournament) throw new Error("Турнир не найден");

  return tournament;
}

/**
 * Recalculate position field in standings.
 */
async function recalculatePositions(tournamentId) {
  const standings = await prisma.tournamentStanding.findMany({
    where: { tournamentId },
    orderBy: [{ points: "desc" }, { pointsFor: "desc" }],
  });

  for (let i = 0; i < standings.length; i++) {
    if (standings[i].position !== i + 1) {
      await prisma.tournamentStanding.update({
        where: { id: standings[i].id },
        data: { position: i + 1 },
      });
    }
  }
}

module.exports = {
  generateAmericanoRounds,
  generateMexicanoRound,
  startTournament,
  submitScore,
  generateNextRound,
  completeTournament,
  getLiveData,
  recalculatePositions,
};
