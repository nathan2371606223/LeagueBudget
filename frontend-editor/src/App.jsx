import { useEffect, useState } from "react";
import Login from "./components/Login";
import ChangePassword from "./components/ChangePassword";
import TeamTable from "./components/TeamTable";
import TransferImport from "./components/TransferImport";
import ExportButtons from "./components/ExportButtons";
import HistoryViewer from "./components/HistoryViewer";
import TokenAlerts from "./components/TokenAlerts";
import Announcement from "./components/Announcement";
import {
  login as apiLogin,
  changePassword,
  fetchTeams,
  fetchLevels,
  initCheck,
  initializeTeams,
  updateTeam,
  swapTeams,
  processTransfers,
  updateLevels,
  fetchHistory
} from "./services/api";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [teams, setTeams] = useState([]);
  const [levels, setLevels] = useState({ 1: "Level 1", 2: "Level 2", 3: "Level 3" });
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!token) return;
    const bootstrap = async () => {
      await ensureInitialized();
      await Promise.all([loadTeams(), loadLevels()]);
    };
    bootstrap().catch((err) => setStatus(err?.response?.data?.message || "加载失败"));
  }, [token]);

  const ensureInitialized = async () => {
    const check = await initCheck();
    if (!check.initialized) {
      await initializeTeams();
    }
  };

  const loadTeams = async () => {
    const data = await fetchTeams(token);
    setTeams(data);
    setStatus("数据已更新");
  };

  const handleLogin = async (password) => {
    const res = await apiLogin(password);
    const tk = res.token;
    localStorage.setItem("token", tk);
    setToken(tk);
  };

  const loadLevels = async () => {
    const data = await fetchLevels();
    setLevels(data);
  };

  const handleChangePassword = (oldPassword, newPassword) => changePassword(token, oldPassword, newPassword);

  const handleBudgetSave = async (teamId, budget) => {
    await updateTeam(token, teamId, { budget });
    await loadTeams();
  };

  const handleNameSave = async (teamId, name) => {
    await updateTeam(token, teamId, { team_name: name });
    await loadTeams();
  };

  const handleSwap = async (id1, id2) => {
    await swapTeams(token, id1, id2);
    await loadTeams();
  };

  const handleTransfers = async (records) => {
    const res = await processTransfers(token, records);
    await loadTeams();
    return res;
  };

  const handleLevelNameSave = async (level, name) => {
    const payload = {};
    if (level === 1) payload.level1 = name;
    if (level === 2) payload.level2 = name;
    if (level === 3) payload.level3 = name;
    await updateLevels(token, payload);
    await loadLevels();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div style={{ padding: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>联赛预算管理 - 编辑端</h2>
          <div>{status}</div>
        </div>
        <div>
          <button onClick={logout}>退出登录</button>
        </div>
      </header>

      <ChangePassword onChangePassword={handleChangePassword} />
      <Announcement token={token} />
      <TeamTable
        teams={teams}
        levelNames={levels}
        onBudgetSave={handleBudgetSave}
        onNameSave={handleNameSave}
        onSwap={handleSwap}
        onLevelNameSave={handleLevelNameSave}
      />
      <TransferImport onSubmit={handleTransfers} />
      <ExportButtons token={token} />
      <HistoryViewer fetchHistory={fetchHistory} token={token} />
      <TokenAlerts token={token} />
    </div>
  );
}

