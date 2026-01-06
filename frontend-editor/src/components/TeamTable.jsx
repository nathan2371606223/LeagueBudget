import { useState } from "react";

export default function TeamTable({ teams, onBudgetSave, onSwap }) {
  const [editing, setEditing] = useState({});
  const [dragId, setDragId] = useState(null);

  const grouped = [1, 2, 3].map((level) => ({
    level,
    teams: teams.filter((t) => Number(t.level) === level).sort((a, b) => a.position_order - b.position_order)
  }));

  const handleBlur = (teamId) => {
    const value = editing[teamId];
    if (value === undefined) return;
    const budget = Number(value);
    if (Number.isNaN(budget)) return;
    onBudgetSave(teamId, budget);
    setEditing((prev) => {
      const next = { ...prev };
      delete next[teamId];
      return next;
    });
  };

  const handleDrop = (targetId) => {
    if (dragId && targetId && dragId !== targetId) {
      onSwap(dragId, targetId);
    }
    setDragId(null);
  };

  return (
    <div>
      <h3>球队列表</h3>
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
                  <tr
                    key={team.id}
                    draggable
                    onDragStart={() => setDragId(team.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(team.id)}
                    style={{ cursor: "move" }}
                  >
                    <td>{team.team_name}</td>
                    <td>
                      <input
                        style={{ width: "100%" }}
                        value={editing[team.id] !== undefined ? editing[team.id] : team.budget}
                        onChange={(e) =>
                          setEditing((prev) => ({
                            ...prev,
                            [team.id]: e.target.value
                          }))
                        }
                        onBlur={() => handleBlur(team.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleBlur(team.id);
                        }}
                      />
                    </td>
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

