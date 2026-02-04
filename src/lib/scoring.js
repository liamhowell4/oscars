/**
 * Calculate score based on picks and winners
 * @param {Object} picks - User's picks { categoryId: nomineeId }
 * @param {Object} winners - Winning nominees { categoryId: nomineeId }
 * @returns {number} Total correct picks
 */
export function calculateScore(picks, winners) {
  let score = 0;
  for (const categoryId of Object.keys(winners)) {
    if (picks[categoryId] === winners[categoryId]) {
      score++;
    }
  }
  return score;
}

/**
 * Get detailed score breakdown
 * @param {Object} picks - User's picks
 * @param {Object} winners - Winning nominees
 * @param {Array} categories - All categories from nominees data
 * @returns {Array} Array of { category, pick, winner, correct }
 */
export function getScoreBreakdown(picks, winners, categories) {
  return categories.map((category) => {
    const pick = picks[category.id];
    const winner = winners[category.id];
    return {
      categoryId: category.id,
      categoryName: category.name,
      pickId: pick,
      winnerId: winner,
      correct: pick && winner && pick === winner,
      announced: !!winner,
    };
  });
}

/**
 * Generate 6-character join code
 * @returns {string} Uppercase alphanumeric code
 */
export function generateJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed I, O, 1, 0 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Format time remaining until lock
 * @param {Date} lockTime - When ballots lock
 * @returns {string} Formatted time string
 */
export function formatTimeRemaining(lockTime) {
  const now = new Date();
  const diff = lockTime - now;

  if (diff <= 0) return 'Locked';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}
