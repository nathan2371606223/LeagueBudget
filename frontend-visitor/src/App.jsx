import { useEffect, useRef, useState } from "react";
import TeamTable from "./components/TeamTable";
import HistoryViewer from "./components/HistoryViewer";
import { fetchTeams, fetchLevels, fetchHistory } from "./services/api";
import { deepCompareTeams } from "./services/dataComparator";

const BASE_INTERVAL = 600000; // 10 minutes
const MAX_INTERVAL = 28800000; // 8 hours

export default function App() {
  const [teams, setTeams] = useState([]);
  const [levels, setLevels] = useState({ 1: "Level 1", 2: "Level 2", 3: "Level 3" });
  const [intervalMs, setIntervalMs] = useState(BASE_INTERVAL);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [status, setStatus] = useState("");
  const lastDataRef = useRef([]);
  const timerRef = useRef(null);

  const poll = async () => {
    try {
      const [data, lvl] = await Promise.all([fetchTeams(), fetchLevels()]);
      if (!deepCompareTeams(lastDataRef.current, data)) {
        setTeams(data);
        setLevels(lvl);
        lastDataRef.current = data;
        setIntervalMs(BASE_INTERVAL);
        setLastUpdated(new Date());
        setStatus("数据已更新");
      } else {
        setIntervalMs((prev) => Math.min(prev * 2, MAX_INTERVAL));
        setStatus("无更新，自动延长轮询间隔");
      }
    } catch (err) {
      setStatus(err?.response?.data?.message || "获取数据失败");
    }
  };

  useEffect(() => {
    poll();
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(poll, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [intervalMs]);

  const resetInterval = () => {
    setIntervalMs(BASE_INTERVAL);
    poll();
  };

  return (
    <div style={{ padding: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>联赛预算管理 - 访客端</h2>
          <div>状态: {status}</div>
          <div>
            最后更新: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "加载中..."} | 当前间隔:{" "}
            {Math.round(intervalMs / 60000)} 分钟
          </div>
        </div>
        {intervalMs > BASE_INTERVAL && (
          <button onClick={resetInterval}>立即刷新</button>
        )}
      </header>
      <TeamTable teams={teams} levelNames={levels} />
      <HistoryViewer fetchHistory={fetchHistory} />
    </div>
  );
}

