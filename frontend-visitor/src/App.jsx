import { useEffect, useState } from "react";
import TeamTable from "./components/TeamTable";
import HistoryViewer from "./components/HistoryViewer";
import TokenGate from "./components/TokenGate";
import Announcement from "./components/Announcement";
import { fetchTeams, fetchLevels, fetchHistory, getStoredToken, setStoredToken } from "./services/api";

export default function App() {
  const [teams, setTeams] = useState([]);
  const [levels, setLevels] = useState({ 1: "Level 1", 2: "Level 2", 3: "Level 3" });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [status, setStatus] = useState("");
  // Check for admin token (JWT) first, then team token
  const adminToken = localStorage.getItem("token"); // JWT token from editor login
  const teamToken = getStoredToken(); // Team token
  const [tokenReady, setTokenReady] = useState(!!(adminToken || teamToken));
  const [prefillToken, setPrefillToken] = useState("");

  // Support ?token=... URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setPrefillToken(urlToken);
    }
  }, []);

  // Listen for admin token changes (when user logs in/out from editor site)
  useEffect(() => {
    const checkAdminToken = () => {
      const currentAdminToken = localStorage.getItem("token");
      const currentTeamToken = getStoredToken();
      const shouldBeReady = !!(currentAdminToken || currentTeamToken);
      
      // Update tokenReady state if it changed
      if (shouldBeReady !== tokenReady) {
        setTokenReady(shouldBeReady);
        if (!shouldBeReady) {
          setStatus("管理员已登出，请重新输入团队令牌");
        }
      }
    };

    // Check on storage change (when token is added/removed in another tab)
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        checkAdminToken();
      }
    };

    // Check on window focus (catch cases where storage events don't fire)
    const handleFocus = () => {
      checkAdminToken();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [tokenReady]);

  const refresh = async () => {
    try {
      const [data, lvl] = await Promise.all([fetchTeams(), fetchLevels()]);
      setTeams(data);
      setLevels(lvl);
      setStatus("数据已更新");
      setLastUpdated(new Date());
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setTokenReady(false);
        setStatus("令牌无效，请重新输入");
      } else {
        setStatus(err?.response?.data?.message || "获取数据失败");
      }
    }
  };

  useEffect(() => {
    if (tokenReady) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenReady]);

  const handleTokenValidated = (token) => {
    setStoredToken(token);
    setTokenReady(true);
  };


  if (!tokenReady) {
    return <TokenGate initialToken={prefillToken} onValidated={handleTokenValidated} />;
  }

  return (
    <div style={{ padding: 20 }}>
      <Announcement />
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

