import { useEffect, useState } from "react";

export default function HistoryViewer({ fetchHistory, token }) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (token) {
      load(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, token]);

  const load = async (p) => {
    const res = await fetchHistory(token, p, pageSize);
    setData(res.data || []);
    setTotal(res.total || 0);
  };

  const prev = () => setPage((p) => Math.max(1, p - 1));
  const next = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div style={{ marginTop: 16 }}>
      <h3>历史记录（只读）</h3>
      <table width="100%" border="1" cellPadding="6">
        <thead>
          <tr>
            <th>时间</th>
            <th>字段</th>
            <th>球队</th>
            <th>变化值</th>
            <th>新值</th>
            <th>球员</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td>{row.timestamp}</td>
              <td>{row.field_name}</td>
              <td>{row.team_name || ""}</td>
              <td>{row.change_value}</td>
              <td>{row.new_value}</td>
              <td>{row.transfer_player || ""}</td>
            </tr>
          ))}
          {!data.length && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center" }}>
                暂无记录
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={prev} disabled={page <= 1}>
          上一页
        </button>
        <span>
          第 {page} / {totalPages} 页（每页 {pageSize} 条，共 {total} 条）
        </span>
        <button onClick={next} disabled={page >= totalPages}>
          下一页
        </button>
      </div>
    </div>
  );
}

