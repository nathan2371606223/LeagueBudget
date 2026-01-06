import { useState } from "react";

function parseBatch(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  return lines.map((line) => {
    // Split by tab, English comma, or Chinese comma
    const parts = line.split(/[\t,，]/).map((p) => p.trim());
    const [teamOut, teamIn, price, ...players] = parts;
    const player = (players && players.length)
      ? players.slice(0, 4).filter(Boolean).join(" / ")
      : "";
    return { teamIn, teamOut, price, player };
  });
}

export default function TransferImport({ onSubmit }) {
  const [mode, setMode] = useState("manual");
  const [entries, setEntries] = useState([{ teamIn: "", teamOut: "", price: "", players: ["", "", "", ""] }]);
  const [batchText, setBatchText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateEntry = (idx, field, value) => {
    setEntries((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const updatePlayer = (idx, playerIdx, value) => {
    setEntries((prev) => {
      const next = [...prev];
      const players = [...next[idx].players];
      players[playerIdx] = value;
      next[idx] = { ...next[idx], players };
      return next;
    });
  };

  const addRow = () => setEntries((prev) => [...prev, { teamIn: "", teamOut: "", price: "", players: ["", "", "", ""] }]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let payload;
      if (mode === "manual") {
        // Convert players array to joined string
        payload = entries.map((e) => ({
          teamIn: e.teamIn,
          teamOut: e.teamOut,
          price: e.price,
          player: e.players.filter(Boolean).join(" / ")
        }));
      } else {
        payload = parseBatch(batchText);
      }
      const res = await onSubmit(payload);
      setResult(res);
    } catch (err) {
      setResult({ error: err?.response?.data?.message || "提交失败" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: "1px solid #eee", padding: 12, marginTop: 16 }}>
      <h3>转会导入</h3>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setMode("manual")} disabled={mode === "manual"}>
          手动输入
        </button>
        <button onClick={() => setMode("batch")} disabled={mode === "batch"} style={{ marginLeft: 8 }}>
          批量导入
        </button>
      </div>
      {mode === "manual" ? (
        <div>
          {entries.map((row, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 8 }}>
              <input
                placeholder="转出球队"
                value={row.teamOut}
                onChange={(e) => updateEntry(idx, "teamOut", e.target.value)}
              />
              <input
                placeholder="转入球队"
                value={row.teamIn}
                onChange={(e) => updateEntry(idx, "teamIn", e.target.value)}
              />
              <input placeholder="价格" value={row.price} onChange={(e) => updateEntry(idx, "price", e.target.value)} />
              <input
                placeholder="球员1"
                value={row.players[0]}
                onChange={(e) => updatePlayer(idx, 0, e.target.value)}
              />
              <input
                placeholder="球员2"
                value={row.players[1]}
                onChange={(e) => updatePlayer(idx, 1, e.target.value)}
              />
              <input
                placeholder="球员3"
                value={row.players[2]}
                onChange={(e) => updatePlayer(idx, 2, e.target.value)}
              />
              <input
                placeholder="球员4"
                value={row.players[3]}
                onChange={(e) => updatePlayer(idx, 3, e.target.value)}
              />
            </div>
          ))}
          <button onClick={addRow}>添加</button>
        </div>
      ) : (
        <div>
          <textarea
            rows={6}
            style={{ width: "100%" }}
            placeholder={"格式: 转出球队,转入球队,价格,球员1[,球员2][,球员3][,球员4]\n（分隔符：制表符/逗号/中文逗号，球员2-4可选）"}
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const target = e.target;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                const value = target.value;
                const newValue = `${value.substring(0, start)}\t${value.substring(end)}`;
                setBatchText(newValue);
                // Restore caret position after inserting tab
                requestAnimationFrame(() => {
                  target.selectionStart = target.selectionEnd = start + 1;
                });
              }
            }}
          />
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "提交中..." : "提交转会记录"}
        </button>
      </div>
      {result && (
        <div style={{ marginTop: 8 }}>
          {result.error && <div style={{ color: "red" }}>{result.error}</div>}
          {result.success && (
            <div>
              <div>处理完成，成功 {result.processed} 条。</div>
              {result.warnings?.length ? (
                <ul>
                  {result.warnings.map((w, i) => (
                    <li key={i}>
                      警告: {w.team} - {w.reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <div>无警告</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

