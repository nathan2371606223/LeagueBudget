import { fetchTeams, exportHistoryCsv, clearHistory } from "../services/api";

function downloadCsv(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportButtons({ token }) {
  const exportBudget = async () => {
    const teams = await fetchTeams();
    const headers = ["级别", "球队名称", "预算"];
    const rows = teams.map((t) => [t.level, t.team_name, t.budget]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    downloadCsv(`预算导出_${new Date().toISOString().slice(0, 10)}.csv`, blob);
  };

  const exportHistory = async () => {
    const data = await exportHistoryCsv();
    const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
    downloadCsv(`历史记录_${new Date().toISOString().slice(0, 10)}.csv`, blob);
  };

  const handleClear = async () => {
    if (!window.confirm("确定要清空所有历史记录吗？")) return;
    await clearHistory(token);
    alert("历史记录已清空");
  };

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <button onClick={exportBudget}>导出预算</button>
      <button onClick={exportHistory}>导出历史</button>
      <button onClick={handleClear}>清空历史</button>
    </div>
  );
}

