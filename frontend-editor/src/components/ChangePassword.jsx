import { useState } from "react";

export default function ChangePassword({ onChangePassword }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (newPassword !== confirm) {
      setError("两次输入的新密码不一致");
      return;
    }
    setLoading(true);
    try {
      const res = await onChangePassword(oldPassword, newPassword);
      setMessage(res?.message || "密码修改成功");
      setOldPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError(err?.response?.data?.message || "修改密码失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: "1px solid #eee", padding: 12, marginBottom: 12 }}>
      <h3>修改密码</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>旧密码</label>
          <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
        </div>
        <div>
          <label>新密码</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div>
          <label>确认新密码</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {error && <div style={{ color: "red" }}>{error}</div>}
        {message && <div style={{ color: "green" }}>{message}</div>}
        <button type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "提交中..." : "修改密码"}
        </button>
      </form>
    </div>
  );
}

