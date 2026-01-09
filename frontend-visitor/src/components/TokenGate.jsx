import React, { useState } from "react";
import { validateToken, setStoredToken } from "../services/api";

export default function TokenGate({ onValidated, initialToken = "" }) {
  const [tokenInput, setTokenInput] = useState(initialToken || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError("请输入令牌");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await validateToken(tokenInput.trim());
      setStoredToken(tokenInput.trim());
      onValidated(tokenInput.trim());
    } catch (err) {
      const msg = err.response?.data?.message || "令牌无效或已失效";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "400px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}
      >
        <h2 style={{ marginTop: 0 }}>请输入团队令牌</h2>
        <p style={{ fontSize: "13px", color: "#555" }}>
          每个球队对应一个令牌，请输入后即可继续使用。令牌验证通过后会保存在本地。
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="团队令牌"
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
            autoFocus
          />
          {error && (
            <div style={{ color: "red", marginBottom: "10px", fontSize: "13px" }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            {loading ? "验证中..." : "验证并进入"}
          </button>
        </form>
      </div>
    </div>
  );
}
