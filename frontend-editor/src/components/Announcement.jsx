import React, { useState, useEffect } from "react";
import { fetchAnnouncement, updateAnnouncement } from "../services/api";

export default function Announcement({ token }) {
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token) {
      loadAnnouncement();
    }
  }, [token]);

  const loadAnnouncement = async () => {
    try {
      setLoading(true);
      const data = await fetchAnnouncement(token);
      setContent(data.content || "");
      setOriginalContent(data.content || "");
    } catch (err) {
      console.error("Failed to load announcement:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");
      await updateAnnouncement(token, content);
      setOriginalContent(content);
      setMessage("公告已保存");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = content !== originalContent;

  if (loading) {
    return <div style={{ padding: "10px", backgroundColor: "#f5f5f5" }}>加载中...</div>;
  }

  return (
    <div style={{ padding: "15px", backgroundColor: "#fff3cd", border: "1px solid #ffc107", marginBottom: "20px", borderRadius: "4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", color: "#856404" }}>公告管理</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {message && (
            <span style={{ color: message.includes("失败") ? "#dc3545" : "#28a745", fontSize: "14px" }}>
              {message}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{
              padding: "5px 15px",
              backgroundColor: hasChanges ? "#28a745" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: hasChanges && !saving ? "pointer" : "not-allowed",
              fontSize: "14px"
            }}
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="输入公告内容..."
        style={{
          width: "100%",
          minHeight: "80px",
          padding: "10px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          fontSize: "14px",
          fontFamily: "inherit",
          resize: "vertical"
        }}
      />
      <div style={{ marginTop: "5px", fontSize: "12px", color: "#666" }}>
        公告将显示在访客端页面顶部
      </div>
    </div>
  );
}
