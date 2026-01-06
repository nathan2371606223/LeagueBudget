import { useState } from "react";

export default function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin(password);
    } catch (err) {
      setError(err?.response?.data?.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 320, margin: "60px auto", padding: 20, border: "1px solid #ddd" }}>
      <h2>登录</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>密码（默认 admin）</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 10 }}>
          {loading ? "登录中..." : "登录"}
        </button>
      </form>
    </div>
  );
}

