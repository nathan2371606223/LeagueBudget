export default function TeamTable({ teams }) {
  const grouped = [1, 2, 3].map((level) => ({
    level,
    teams: teams.filter((t) => Number(t.level) === level).sort((a, b) => a.position_order - b.position_order)
  }));

  return (
    <div>
      <h3>球队预算</h3>
      <div style={{ display: "flex", gap: 16 }}>
        {grouped.map((group) => (
          <div key={group.level} style={{ flex: 1 }}>
            <h4>级别 {group.level}</h4>
            <table width="100%" border="1" cellPadding="6">
              <thead>
                <tr>
                  <th>球队名称</th>
                  <th>预算</th>
                </tr>
              </thead>
              <tbody>
                {group.teams.map((team) => (
                  <tr key={team.id}>
                    <td>{team.team_name}</td>
                    <td>{team.budget}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

