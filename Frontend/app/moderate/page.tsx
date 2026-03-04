"use client"

import { useState, useEffect } from "react"

const STORAGE_KEY = "moderation-api-key"

export default function ModeratePage() {
  const [key, setKey] = useState("")
  const [pending, setPending] = useState<{ id: string; author: string; textPreview: string; createdAt: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [actioning, setActioning] = useState<string | null>(null)

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
    if (saved) setKey(saved)
  }, [])

  const saveKey = () => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, key)
  }

  const loadPending = async () => {
    if (!key.trim()) {
      setError("Введите ключ модерации")
      return
    }
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/testimonials/pending", {
        headers: { "x-moderation-key": key.trim() },
      })
      if (res.status === 401) {
        setError("Неверный ключ")
        setPending([])
        return
      }
      if (!res.ok) {
        setError("Ошибка загрузки")
        return
      }
      const data = await res.json()
      setPending(data)
    } catch {
      setError("Ошибка сети")
    } finally {
      setLoading(false)
    }
  }

  const setApproved = async (id: string, approved: boolean) => {
    if (!key.trim()) return
    setActioning(id)
    try {
      const res = await fetch("/api/testimonials/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-moderation-key": key.trim() },
        body: JSON.stringify({ id, approved }),
      })
      if (res.ok) {
        setPending((prev) => prev.filter((p) => p.id !== id))
      } else {
        setError(approved ? "Не удалось одобрить" : "Не удалось отклонить")
      }
    } catch {
      setError("Ошибка сети")
    } finally {
      setActioning(null)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 20, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Модерация отзывов</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        Ключ хранится только в твоём браузере (localStorage). Страница не показывается в навигации сайта.
      </p>

      <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="password"
          placeholder="Ключ модерации (MODERATION_API_KEY)"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onBlur={saveKey}
          style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc" }}
        />
        <button
          type="button"
          onClick={loadPending}
          disabled={loading}
          style={{ padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
        >
          {loading ? "Загрузка…" : "Загрузить на модерации"}
        </button>
      </div>

      {error && <p style={{ color: "#b91c1c", marginBottom: 16 }}>{error}</p>}

      {pending.length === 0 && !loading && key && (
        <p style={{ color: "#666" }}>Нет отзывов на модерации. Нажми «Загрузить на модерации» для проверки.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {pending.map((item) => (
          <li
            key={item.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              background: "#fafafa",
            }}
          >
            <p style={{ margin: "0 0 8px", fontWeight: 600 }}>{item.author}</p>
            <p style={{ margin: "0 0 12px", fontSize: 14, color: "#374151" }}>{item.textPreview}…</p>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "#9ca3af" }}>{new Date(item.createdAt).toLocaleString("ru")}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setApproved(item.id, true)}
                disabled={actioning === item.id}
                style={{ padding: "6px 12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                {actioning === item.id ? "…" : "Одобрить"}
              </button>
              <button
                type="button"
                onClick={() => setApproved(item.id, false)}
                disabled={actioning === item.id}
                style={{ padding: "6px 12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                Отклонить
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
