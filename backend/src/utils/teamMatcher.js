function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function normalizeName(name) {
  return (name || "").trim().toLowerCase();
}

function findTeamByName(name, teams) {
  if (!name) return null;
  const norm = normalizeName(name);
  const exact = teams.find((t) => normalizeName(t.team_name) === norm);
  if (exact) return exact;

  let best = null;
  let bestDistance = Infinity;
  teams.forEach((t) => {
    const d = levenshtein(norm, normalizeName(t.team_name));
    if (d < bestDistance) {
      bestDistance = d;
      best = t;
    }
  });
  if (bestDistance <= 1) return best;
  return null;
}

module.exports = { findTeamByName };

