export function deepCompareTeams(a = [], b = []) {
  if (a.length !== b.length) return false;
  const mapA = new Map(a.map((t) => [t.id, t]));
  const mapB = new Map(b.map((t) => [t.id, t]));
  if (mapA.size !== mapB.size) return false;
  for (const [id, t1] of mapA.entries()) {
    const t2 = mapB.get(id);
    if (!t2) return false;
    if (
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

