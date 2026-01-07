import { useState, useEffect } from "react";

export default function TeamTable({ teams, levelNames, onBudgetSave, onNameSave, onSwap, onLevelNameSave }) {
  const [editingBudget, setEditingBudget] = useState({});
  const [editingName, setEditingName] = useState({});
  const [levelTitle, setLevelTitle] = useState(levelNames || {});
  const [dragId, setDragId] = useState(null);

  // Sync levelTitle with levelNames prop when it updates
  useEffect(() => {
    if (levelNames && Object.keys(levelNames).length > 0) {
      setLevelTitle(levelNames);
    }
  }, [levelNames]);

  const grouped = [1, 2, 3].map((level) => ({
    level,
    teams: teams.filter((t) => Number(t.level) === level).sort((a, b) => a.position_order - b.position_order)
  }));

  const saveBudget = (teamId) => {
    const value = editingBudget[teamId];
    if (value === undefined) return;
    const budget = Number(value);
    if (Number.isNaN(budget)) return;
    onBudgetSave(teamId, budget);
    setEditingBudget((prev) => {
      const next = { ...prev };
      delete next[teamId];
      return next;
    });
  };

  const saveName = (teamId) => {
    const value = editingName[teamId];
    if (value === undefined) return;
    onNameSave(teamId, value);
    setEditingName((prev) => {
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

  const handleLevelBlur = (level) => {
    const newName = levelTitle[level];
    onLevelNameSave(level, newName);
  };

  return (
    <div>
      <h3>球队列表</h3>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {grouped.map((group) => (
          <div key={group.level} style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>级别名称：</span>
              <input
                style={{ width: "100%" }}
                value={levelTitle[group.level] || ""}
                onChange={(e) => setLevelTitle((prev) => ({ ...prev, [group.level]: e.target.value }))}
                onBlur={() => handleLevelBlur(group.level)}
              />
            </div>
            <table width="100%" border="1" cellPadding="6" style={{ marginTop: 8 }}>
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
                    <td>
                      <input
                        style={{ width: "100%" }}
                        value={editingName[team.id] !== undefined ? editingName[team.id] : team.team_name}
                        onChange={(e) =>
                          setEditingName((prev) => ({
                            ...prev,
                            [team.id]: e.target.value
                          }))
                        }
                        onBlur={() => saveName(team.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveName(team.id);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        style={{ width: "100%" }}
                        value={editingBudget[team.id] !== undefined ? editingBudget[team.id] : team.budget}
                        onChange={(e) =>
                          setEditingBudget((prev) => ({
                            ...prev,
                            [team.id]: e.target.value
                          }))
                        }
                        onBlur={() => saveBudget(team.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveBudget(team.id);
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

