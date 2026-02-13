const {
  nominees,
  searchNominees,
  getCategoryById,
  nomineesById,
} = require("../lib/nominees");

/**
 * Execute a server-side tool and return the result.
 * @param {string} toolName
 * @param {Object} args - Parsed arguments from the function call
 * @param {Object} context - { db, uid, ceremonyStarted }
 * @returns {Promise<Object>}
 */
async function executeServerTool(toolName, args, context) {
  switch (toolName) {
    case "get_nominee_info":
      return getNomineeInfo(args);
    case "get_ceremony_status":
      return getCeremonyStatus(context);
    case "get_leaderboard":
      return getLeaderboard(args, context);
    case "search_users":
      return searchUsers(args, context);
    case "get_user_score":
      return getUserScore(args, context);
    case "get_winners":
      return getWinners(context);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function getNomineeInfo(args) {
  const { query, category_id } = args;

  if (category_id) {
    const category = getCategoryById(category_id);
    if (!category) {
      return { error: `Category '${category_id}' not found.` };
    }
    return {
      categoryId: category.id,
      categoryName: category.name,
      nominees: category.nominees,
    };
  }

  if (query) {
    const results = searchNominees(query);
    if (results.length === 0) {
      return { message: `No results found for '${query}'.` };
    }
    return { results };
  }

  // No query or category_id — return all categories with counts
  return {
    totalCategories: nominees.categories.length,
    categories: nominees.categories.map((c) => ({
      id: c.id,
      name: c.name,
      nomineeCount: c.nominees.length,
    })),
  };
}

async function getCeremonyStatus(context) {
  const { db } = context;
  const doc = await db.collection("config").doc("ceremony").get();
  if (!doc.exists) {
    return { isLocked: false, ceremonyStarted: false, lockTime: null };
  }
  const data = doc.data();
  const winnersDoc = await db.collection("config").doc("winners").get();
  const winnersCount = winnersDoc.exists
    ? Object.keys(winnersDoc.data()).length
    : 0;

  return {
    isLocked: data.isLocked || false,
    ceremonyStarted: data.ceremonyStarted || false,
    lockTime: data.lockTime ? data.lockTime.toDate().toISOString() : null,
    winnersAnnounced: winnersCount,
    totalCategories: nominees.categories.length,
  };
}

async function getLeaderboard(args, context) {
  const { db } = context;
  const limit = args.limit || 10;

  // Get winners
  const winnersDoc = await db.collection("config").doc("winners").get();
  const winners = winnersDoc.exists ? winnersDoc.data() : {};
  const winnersCount = Object.keys(winners).length;

  if (winnersCount === 0) {
    return { message: "No winners have been announced yet." };
  }

  // Get all ballots
  const ballotsSnap = await db.collection("ballots").get();
  const scores = [];

  for (const doc of ballotsSnap.docs) {
    const picks = doc.data().picks || {};
    let score = 0;
    for (const catId of Object.keys(winners)) {
      if (picks[catId] === winners[catId]) score++;
    }
    scores.push({ uid: doc.id, score });
  }

  // Sort descending by score
  scores.sort((a, b) => b.score - a.score);
  const topScores = scores.slice(0, limit);

  // Get display names for top scorers
  const uids = topScores.map((s) => s.uid);
  const userDocs = await Promise.all(
    uids.map((uid) => db.collection("users").doc(uid).get())
  );

  const leaderboard = topScores.map((entry, i) => {
    const userData = userDocs[i].exists ? userDocs[i].data() : {};
    return {
      rank: i + 1,
      displayName: userData.displayName || "Unknown",
      score: entry.score,
      outOf: winnersCount,
    };
  });

  return { leaderboard, winnersAnnounced: winnersCount };
}

async function searchUsers(args, context) {
  const { db, ceremonyStarted } = context;
  const { name, include_picks } = args;

  if (!name || name.length < 2) {
    return { error: "Search query must be at least 2 characters." };
  }

  // Firestore range query on displayName for prefix matching
  const snapshot = await db
    .collection("users")
    .where("displayName", ">=", name)
    .where("displayName", "<", name + "\uf8ff")
    .limit(10)
    .get();

  const users = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const user = {
      uid: doc.id,
      displayName: data.displayName,
      email: data.email,
    };

    if (include_picks && ceremonyStarted) {
      const ballotDoc = await db.collection("ballots").doc(doc.id).get();
      if (ballotDoc.exists) {
        const picks = ballotDoc.data().picks || {};
        // Resolve pick IDs to names
        const resolved = {};
        for (const [catId, nomId] of Object.entries(picks)) {
          const entry = nomineesById.get(nomId);
          const cat = getCategoryById(catId);
          if (entry && cat) {
            resolved[cat.name] = entry.nominee.title;
          }
        }
        user.picks = resolved;
      }
    } else if (include_picks && !ceremonyStarted) {
      user.picksNote = "Picks are hidden until the ceremony starts.";
    }

    users.push(user);
  }

  if (users.length === 0) {
    return { message: `No users found matching '${name}'.` };
  }

  return { users };
}

async function getUserScore(args, context) {
  const { db, uid } = context;
  const { include_breakdown } = args;

  const winnersDoc = await db.collection("config").doc("winners").get();
  const winners = winnersDoc.exists ? winnersDoc.data() : {};
  const winnersCount = Object.keys(winners).length;

  const ballotDoc = await db.collection("ballots").doc(uid).get();
  const picks = ballotDoc.exists ? ballotDoc.data().picks || {} : {};

  let score = 0;
  const breakdown = [];

  for (const category of nominees.categories) {
    const winnerId = winners[category.id];
    const pickId = picks[category.id];

    if (winnerId) {
      const correct = pickId === winnerId;
      if (correct) score++;

      if (include_breakdown) {
        const winnerEntry = nomineesById.get(winnerId);
        const pickEntry = pickId ? nomineesById.get(pickId) : null;
        breakdown.push({
          category: category.name,
          yourPick: pickEntry ? pickEntry.nominee.title : "No pick",
          winner: winnerEntry ? winnerEntry.nominee.title : winnerId,
          correct,
        });
      }
    }
  }

  const result = {
    score,
    winnersAnnounced: winnersCount,
    totalCategories: nominees.categories.length,
    picksMade: Object.keys(picks).length,
  };

  if (include_breakdown && breakdown.length > 0) {
    result.breakdown = breakdown;
  }

  return result;
}

async function getWinners(context) {
  const { db } = context;
  const winnersDoc = await db.collection("config").doc("winners").get();

  if (!winnersDoc.exists) {
    return { message: "No winners have been announced yet.", winners: [] };
  }

  const winnersData = winnersDoc.data();
  const announced = [];

  for (const [catId, nomId] of Object.entries(winnersData)) {
    const category = getCategoryById(catId);
    const entry = nomineesById.get(nomId);
    if (category && entry) {
      announced.push({
        category: category.name,
        winner: entry.nominee.title,
        info: entry.nominee.info,
        film: entry.nominee.film,
      });
    }
  }

  return {
    winnersAnnounced: announced.length,
    totalCategories: nominees.categories.length,
    winners: announced,
  };
}

module.exports = { executeServerTool };
