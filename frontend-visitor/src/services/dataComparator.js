export function deepCompareTeams(a = [], b = []) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x.id - y.id);
  const sortedB = [...b].sort((x, y) => x.id - y.id);
  for (let i = 0; i < sortedA.length; i += 1) {
    const t1 = sortedA[i];
    const t2 = sortedB[i];
    if (
      t1.id !== t2.id ||
      Number(t1.level) !== Number(t2.level) ||
      t1.team_name !== t2.team_name ||
      Number(t1.budget) !== Number(t2.budget) ||
      Number(t1.position_order) !== Number(t2.position_order)
    ) {
      return false;
    }
  }
  return true;
}

