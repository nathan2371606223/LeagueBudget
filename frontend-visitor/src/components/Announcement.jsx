import React, { useState, useEffect } from "react";
import { fetchAnnouncement } from "../services/api";

export default function Announcement() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncement();
  }, []);

  const loadAnnouncement = async () => {
    try {
      setLoading(true);
      const data = await fetchAnnouncement();
      setContent(data.content || "");
    } catch (err) {
      console.error("Failed to load announcement:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!content || !content.trim()) {
    return null;
  }

  return (
    <div style={{ padding: "15px", backgroundColor: "#fff3cd", border: "1px solid #ffc107", marginBottom: "20px", borderRadius: "4px" }}>
      <div style={{ fontSize: "14px", color: "#856404", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
        {content}
      </div>
    </div>
  );
}
