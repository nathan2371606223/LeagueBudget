import { useEffect, useState } from "react";
import TeamTable from "./components/TeamTable";
import HistoryViewer from "./components/HistoryViewer";
import { fetchTeams, fetchLevels, fetchHistory } from "./services/api";

export default function App() {
  const [teams, setTeams] = useState([]);
  const [levels, setLevels] = useState({ 1: "Level 1", 2: "Level 2", 3: "Level 3" });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [status, setStatus] = useState("");

  const refresh = async () => {
    try {
      const [data, lvl] = await Promise.all([fetchTeams(), fetchLevels()]);
      setTeams(data);
      setLevels(lvl);
      setStatus("数据已更新");
      setLastUpdated(new Date());
    } catch (err) {
      setStatus(err?.response?.data?.message || "获取数据失败");
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>联赛预算管理 - 访客端</h2>
          <div>状态: {status}</div>
          <div>
            最后更新: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "加载中..."}
          </div>
        </div>
        <button onClick={refresh}>手动刷新</button>
      </header>
      <TeamTable teams={teams} levelNames={levels} />
      <HistoryViewer fetchHistory={fetchHistory} />
    </div>
  );
}

