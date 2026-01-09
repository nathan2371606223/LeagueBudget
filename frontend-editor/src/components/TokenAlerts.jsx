import React, { useEffect, useState } from "react";
import { fetchTokenAlerts, resolveTokenAlert, deleteTokenAlert } from "../services/api";

export default function TokenAlerts({ token }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolvedView, setResolvedView] = useState(false);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await fetchTokenAlerts(token, resolvedView);
      setAlerts(data || []);
    } catch (err) {
      alert(err.response?.data?.message || "加载提醒失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [resolvedView]);

  const handleResolve = async (id) => {
    try {
      await resolveTokenAlert(token, id);
      loadAlerts();
    } catch (err) {
      alert(err.response?.data?.message || "处理失败");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTokenAlert(token, id);
      loadAlerts();
    } catch (err) {
      alert(err.response?.data?.message || "删除失败");
    }
  };

  return (
    <div style={{ padding: "10px 0" }}>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
        <h3 style={{ margin: 0 }}>令牌提醒</h3>
        <button onClick={() => setResolvedView(false)} disabled={!resolvedView}>
          待处理
        </button>
        <button onClick={() => setResolvedView(true)} disabled={resolvedView}>
          已处理
        </button>
        <button onClick={loadAlerts} disabled={loading}>
          刷新
        </button>
      </div>
      {loading ? (
        <div>加载中...</div>
      ) : alerts.length === 0 ? (
        <div style={{ color: "#666" }}>暂无提醒</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th style={{ border: "1px solid #ddd", padding: "6px" }}>时间</th>
              <th style={{ border: "1px solid #ddd", padding: "6px" }}>模块</th>
              <th style={{ border: "1px solid #ddd", padding: "6px" }}>球队</th>
              <th style={{ border: "1px solid #ddd", padding: "6px" }}>消息</th>
              <th style={{ border: "1px solid #ddd", padding: "6px" }}>payload</th>
              <th style={{ border: "1px solid #ddd", padding: "6px" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id}>
                <td style={{ border: "1px solid #ddd", padding: "6px" }}>
                  {new Date(a.created_at).toLocaleString("zh-CN")}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "6px" }}>{a.module}</td>
                <td style={{ border: "1px solid #ddd", padding: "6px" }}>{a.team_name || "(无)"}</td>
                <td style={{ border: "1px solid #ddd", padding: "6px" }}>{a.message || ""}</td>
                <td style={{ border: "1px solid #ddd", padding: "6px", fontFamily: "monospace", fontSize: "12px" }}>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(a.payload, null, 2)}</pre>
                </td>
                <td style={{ border: "1px solid #ddd", padding: "6px" }}>
                  {!a.resolved ? (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => handleResolve(a.id)} style={{ fontSize: "12px" }}>
                        标记已处理
                      </button>
                      <button onClick={() => handleDelete(a.id)} style={{ fontSize: "12px", color: "red" }}>
                        删除
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleDelete(a.id)} style={{ fontSize: "12px", color: "red" }}>
                      删除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
