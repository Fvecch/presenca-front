import { useState, useEffect, useCallback, useMemo } from "react";

const API = "https://sistema-presenca-ddd-t85n.onrender.com";

const normalizeStatus = (s) => {
  if (typeof s === "number") return s;
  if (s === "PRESENT") return 0;
  if (s === "ABSENT")  return 1;
  if (s === "EXCUSED") return 2;
  return 1;
};

const STATUS_LABEL = { 0: "Presente", 1: "Ausente", 2: "Justificado" };
const STATUS_COLOR = {
  0: { bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
  1: { bg: "#fdecea", color: "#c62828", border: "#ef9a9a" },
  2: { bg: "#fff8e1", color: "#f57f17", border: "#ffe082" },
};

const fmt = (d) =>
  new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });


// ── Toast ─────────────────────────────────────────────────────────────────────
function ToastContainer({ toasts }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 3000,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: t.type === "success" ? "#1a1a2e" : t.type === "error" ? "#ef233c" : "#4361ee",
          color: "#fff", padding: "12px 24px", borderRadius: 12,
          fontSize: 14, fontWeight: 500, boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          animation: "slideIn 0.2s ease",
          minWidth: 180,
        }}>
          {t.type === "loading" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}>
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          ) : t.type === "success" ? (
            <span style={{ fontWeight: 700 }}>✓</span>
          ) : (
            <span style={{ fontWeight: 700 }}>✕</span>
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}

let toastId = 0;
async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erro na requisição");
  }
  return res.json();
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const n = normalizeStatus(status);
  const s = STATUS_COLOR[n] || STATUS_COLOR[1];
  return (
    <span style={{
      display: "inline-block",
      fontSize: 12, fontWeight: 600,
      padding: "4px 0", width: 90, textAlign: "center",
      borderRadius: 20, border: `1px solid ${s.border}`,
      background: s.bg, color: s.color, letterSpacing: "0.03em",
    }}>
      {STATUS_LABEL[n]}
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "28px 32px",
        width: "100%", maxWidth: 500, boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#1a1a2e" }}>{title}</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 22, color: "#888" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1.5px solid #e0e0e0", fontSize: 14, outline: "none",
  boxSizing: "border-box", marginTop: 6, fontFamily: "inherit", color: "#1a1a2e",
  background: "#fff",
};

const lightSelectStyle = {
  padding: "7px 12px", borderRadius: 8,
  border: "1.5px solid #ddd", fontSize: 13,
  fontFamily: "inherit", cursor: "pointer", outline: "none",
  background: "#fff", color: "#333", minWidth: 130,
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Botão com hover ───────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", disabled, style = {} }) {
  const [hovered, setHovered] = useState(false);

  const variants = {
    primary: {
      base: { background: "#4361ee", color: "#fff", border: "none" },
      hover: { background: "#3451d1" },
    },
    danger: {
      base: { background: "transparent", color: "#ef233c", border: "1.5px solid #ef233c" },
      hover: { background: "#fdecea" },
    },
    edit: {
      base: { background: "transparent", color: "#444", border: "1.5px solid #ddd" },
      hover: { background: "#f5f5f5" },
    },
    ghost: {
      base: { background: "#f0f0f0", color: "#444", border: "none" },
      hover: { background: "#e0e0e0" },
    },
    justify: {
      base: { background: "#fff", color: "#333", border: "1.5px solid #ddd" },
      hover: { background: "#f5f5f5" },
    },
  };

  const v = variants[variant] || variants.primary;
  const computed = { ...v.base, ...(hovered && !disabled ? v.hover : {}) };

  return (
    <button
      style={{
        padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1, transition: "background 0.15s, border-color 0.15s",
        display: "inline-flex", alignItems: "center", gap: 6,
        whiteSpace: "nowrap", ...computed, ...style,
      }}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}


// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000,
    }} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "28px 32px",
        width: "100%", maxWidth: 380, boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
        <p style={{ margin: "0 0 24px", fontSize: 15, color: "#333", lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn variant="ghost" onClick={onCancel} style={{ minWidth: 100 }}>Cancelar</Btn>
          <Btn variant="danger" onClick={onConfirm} style={{ minWidth: 100, background: "#ef233c", color: "#fff" }}>Confirmar</Btn>
        </div>
      </div>
    </div>
  );
}
// ── Edit ClassLog Modal ───────────────────────────────────────────────────────
function EditClassLogModal({ log, courses, onClose, onSuccess }) {
  const [date, setDate] = useState(log.class_date);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true); setError("");
    try {
      await api(`/api/class-logs/${log.id}`, {
        method: "PUT",
        body: JSON.stringify({ course_id: log.course_id, class_date: date }),
      });
      onSuccess();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Editar diário" onClose={onClose}>
      <Field label="Data da aula">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)} style={inputStyle} />
      </Field>
      {error && <p style={{ color: "#ef233c", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={submit} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Btn>
      </div>
    </Modal>
  );
}

// ── Nova Chamada Modal ────────────────────────────────────────────────────────
function NovaChamadaModal({ courses, students, onClose, onSuccess }) {
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [courseStudents, setCourseStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!courseId) { setCourseStudents([]); setAttendance({}); return; }
    const list = students.filter((s) => s.course_id === courseId);
    setCourseStudents(list);
    const init = {};
    list.forEach((s) => { init[s.id] = 0; });
    setAttendance(init);
  }, [courseId, students]);

  const submit = async () => {
    if (!courseId) return setError("Selecione um curso.");
    if (courseStudents.length === 0) return setError("Nenhum aluno neste curso.");
    setLoading(true); setError("");
    try {
      await api("/api/class-logs", {
        method: "POST",
        body: JSON.stringify({ course_id: courseId, class_date: date, attendance_list: attendance }),
      });
      onSuccess();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Nova chamada" onClose={onClose}>
      <Field label="Curso">
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} style={inputStyle}>
          <option value="">Selecione um curso...</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Data da aula">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)} style={inputStyle} />
      </Field>
      {courseStudents.length > 0 && (
        <Field label="Presença dos alunos">
          <div style={{ marginTop: 8, borderRadius: 10, border: "1.5px solid #e0e0e0", overflow: "hidden" }}>
            {courseStudents.map((s, i) => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", background: i % 2 === 0 ? "#fafafa" : "#fff",
                borderBottom: i < courseStudents.length - 1 ? "1px solid #f0f0f0" : "none",
              }}>
                <span style={{ fontSize: 14, color: "#1a1a2e" }}>{s.name}</span>
                <select value={attendance[s.id] ?? 0}
                  onChange={(e) => setAttendance((a) => ({ ...a, [s.id]: Number(e.target.value) }))}
                  style={{ ...lightSelectStyle, minWidth: "auto", padding: "6px 10px" }}>
                  <option value={0}>Presente</option>
                  <option value={1}>Ausente</option>
                  <option value={2}>Justificado</option>
                </select>
              </div>
            ))}
          </div>
        </Field>
      )}
      {error && <p style={{ color: "#ef233c", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={submit} disabled={loading}>{loading ? "Salvando..." : "Registrar chamada"}</Btn>
      </div>
    </Modal>
  );
}

// ── Justificar Modal ──────────────────────────────────────────────────────────
function JustificarModal({ log, studentId, studentName, onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!reason.trim()) return setError("Informe o motivo da justificativa.");
    setLoading(true); setError("");
    try {
      await api(`/api/class-logs/${log.id}/justify`, {
        method: "POST",
        body: JSON.stringify({ student_id: studentId, reason }),
      });
      onSuccess();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Justificar falta" onClose={onClose}>
      <p style={{ fontSize: 14, color: "#555", marginBottom: 20 }}>
        Justificando falta de <strong>{studentName}</strong> em <strong>{fmt(log.class_date)}</strong>.
      </p>
      <Field label="Motivo">
        <textarea value={reason} onChange={(e) => setReason(e.target.value)}
          rows={4} placeholder="Ex: Atestado médico apresentado."
          style={{ ...inputStyle, resize: "vertical" }} />
      </Field>
      {error && <p style={{ color: "#ef233c", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={submit} disabled={loading}>{loading ? "Salvando..." : "Justificar"}</Btn>
      </div>
    </Modal>
  );
}

// ── Catálogo Modal ────────────────────────────────────────────────────────────
function CatalogoModal({ courses, students, onClose, onRefresh }) {
  const [tab, setTab] = useState("courses");
  const [nome, setNome] = useState("");
  const [courseId, setCourseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addCourse = async () => {
    if (!nome.trim()) return setError("Informe o nome do curso.");
    setLoading(true); setError("");
    try {
      await api("/api/courses", { method: "POST", body: JSON.stringify({ name: nome }) });
      setNome(""); onRefresh();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const addStudent = async () => {
    if (!nome.trim()) return setError("Informe o nome do aluno.");
    if (!courseId) return setError("Selecione um curso.");
    setLoading(true); setError("");
    try {
      await api("/api/students", { method: "POST", body: JSON.stringify({ name: nome, course_id: courseId }) });
      setNome(""); onRefresh();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const [confirmData, setConfirmData] = useState(null);

  const delCourse = (id, name) => {
    setConfirmData({
      message: `Deletar o curso "${name}"? Todos os alunos vinculados serão removidos.`,
      onConfirm: async () => {
        setConfirmData(null);
        try { await api(`/api/courses/${id}`, { method: "DELETE" }); onRefresh(); }
        catch (e) { setError(e.message); }
      }
    });
  };

  const delStudent = (id, name) => {
    setConfirmData({
      message: `Remover o aluno "${name}"?`,
      onConfirm: async () => {
        setConfirmData(null);
        try { await api(`/api/students/${id}`, { method: "DELETE" }); onRefresh(); }
        catch (e) { setError(e.message); }
      }
    });
  };

  const tabStyle = (active) => ({
    padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
    cursor: "pointer", border: "none", transition: "all 0.15s",
    background: active ? "#4361ee" : "transparent", color: active ? "#fff" : "#888",
  });

  return (
    <Modal title="Catálogo" onClose={onClose}>
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f5f5f5", borderRadius: 10, padding: 4 }}>
        <button style={tabStyle(tab === "courses")} onClick={() => { setTab("courses"); setNome(""); setError(""); }}>Cursos</button>
        <button style={tabStyle(tab === "students")} onClick={() => { setTab("students"); setNome(""); setError(""); }}>Alunos</button>
      </div>

      {tab === "courses" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input value={nome} onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do curso..." style={{ ...inputStyle, marginTop: 0, flex: 1 }}
              onKeyDown={(e) => e.key === "Enter" && addCourse()} />
            <Btn onClick={addCourse} disabled={loading}>Adicionar</Btn>
          </div>
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {courses.length === 0 && <p style={{ color: "#aaa", fontSize: 14, textAlign: "center", padding: "20px 0" }}>Nenhum curso cadastrado.</p>}
            {courses.map((c) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, marginBottom: 6, background: "#fafafa", border: "1px solid #f0f0f0" }}>
                <span style={{ fontSize: 14, color: "#1a1a2e" }}>{c.name}</span>
                <button onClick={() => delCourse(c.id, c.name)} style={{ border: "none", background: "none", cursor: "pointer", color: "#ef233c", fontSize: 18 }}>×</button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "students" && (
        <>
          <div style={{ marginBottom: 8 }}>
            <input value={nome} onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do aluno..." style={{ ...inputStyle, marginTop: 0 }} />
          </div>
          <Field label="Curso">
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} style={inputStyle}>
              <option value="">Selecione um curso...</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Btn onClick={addStudent} disabled={loading} style={{ minWidth: 160, justifyContent: "center" }}>
              Adicionar aluno
            </Btn>
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {students.length === 0 && <p style={{ color: "#aaa", fontSize: 14, textAlign: "center", padding: "20px 0" }}>Nenhum aluno cadastrado.</p>}
            {students.map((s) => {
              const course = courses.find((c) => c.id === s.course_id);
              return (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, marginBottom: 6, background: "#fafafa", border: "1px solid #f0f0f0" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, color: "#1a1a2e" }}>{s.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#aaa" }}>{course?.name || "—"}</p>
                  </div>
                  <button onClick={() => delStudent(s.id, s.name)} style={{ border: "none", background: "none", cursor: "pointer", color: "#ef233c", fontSize: 18 }}>×</button>
                </div>
              );
            })}
          </div>
        </>
      )}
      {error && <p style={{ color: "#ef233c", fontSize: 13, marginTop: 12 }}>{error}</p>}
      {confirmData && (
        <ConfirmModal
          message={confirmData.message}
          onConfirm={confirmData.onConfirm}
          onCancel={() => setConfirmData(null)}
        />
      )}
    </Modal>
  );
}

// ── ClassLog Card ─────────────────────────────────────────────────────────────
function ClassLogCard({ log, courses, students, onRefresh }) {
  const [justifyData, setJustifyData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmData, setConfirmData] = useState(null); // { message, onConfirm }
  const course = courses.find((c) => c.id === log.course_id);

  const del = async () => {
    setConfirmData({
      message: "Tem certeza que deseja deletar este diário? Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        setConfirmData(null);
        setDeleting(true);
        try { await api(`/api/class-logs/${log.id}`, { method: "DELETE" }); onRefresh(); }
        catch (e) { alert(e.message); setDeleting(false); }
      }
    });
  };

  const updateStatus = async (studentId, status) => {
    try {
      await api(`/api/class-logs/${log.id}/records/${studentId}`, {
        method: "PUT", body: JSON.stringify({ status }),
      });
      onRefresh();
    } catch (e) { alert(e.message); }
  };

  const removeRecord = (studentId, studentName) => {
    setConfirmData({
      message: `Remover ${studentName} deste diário?`,
      onConfirm: async () => {
        setConfirmData(null);
        try {
          await api(`/api/class-logs/${log.id}/records/${studentId}`, { method: "DELETE" });
          onRefresh();
        } catch (e) { alert(e.message); }
      }
    });
  };

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e8e8e8", padding: "20px 24px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4361ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>{fmt(log.class_date)}</h3>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#999" }}>
            {course ? `Curso: ${course.name}` : `Curso: ${log.course_id.slice(0, 8)}...`}
          </p>

        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="edit" onClick={() => setEditing(true)} style={{ fontSize: 13, padding: "7px 14px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar
          </Btn>
          <Btn variant="danger" onClick={del} disabled={deleting} style={{ fontSize: 13, padding: "7px 14px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
            {deleting ? "..." : "Excluir"}
          </Btn>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
        {log.records.map((r) => {
          const student = students.find((s) => s.id === r.student_id);
          const name = student?.name || r.student_id.slice(0, 8) + "...";
          const statusNum = normalizeStatus(r.status);
          return (
            <div key={r.student_id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 0", borderBottom: "1px solid #f9f9f9",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 14, color: "#1a1a2e", fontWeight: 500 }}>{name}</span>
                <Badge status={statusNum} />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  value={statusNum}
                  onChange={(e) => updateStatus(r.student_id, Number(e.target.value))}
                  style={lightSelectStyle}
                >
                  <option value={0}>Presente</option>
                  <option value={1}>Ausente</option>
                  <option value={2}>Justificado</option>
                </select>
                {statusNum === 1 && (
                  <Btn variant="justify" onClick={() => setJustifyData({ studentId: r.student_id, studentName: name })}
                    style={{ fontSize: 13, padding: "7px 14px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                    </svg>
                    Justificar
                  </Btn>
                )}
                <button
                  onClick={() => removeRecord(r.student_id, name)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#ef233c", fontSize: 20, lineHeight: 1, padding: "0 4px" }}
                >×</button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <EditClassLogModal log={log} courses={courses}
          onClose={() => setEditing(false)}
          onSuccess={() => { setEditing(false); onRefresh(); }} />
      )}
      {justifyData && (
        <JustificarModal
          log={log} studentId={justifyData.studentId} studentName={justifyData.studentName}
          onClose={() => setJustifyData(null)}
          onSuccess={() => { setJustifyData(null); onRefresh(); }} />
      )}
      {confirmData && (
        <ConfirmModal
          message={confirmData.message}
          onConfirm={confirmData.onConfirm}
          onCancel={() => setConfirmData(null)}
        />
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "loading", duration = 2000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (type !== "loading") {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    }
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const fetchAll = useCallback(async (showSpinner = false, silent = false) => {
    if (showSpinner) setLoading(true);
    setRefreshing(true);
    let tid;
    if (!silent) tid = showToast("Atualizando...", "loading");
    try {
      const [logsRes, coursesRes, studentsRes] = await Promise.all([
        api("/api/class-logs"),
        api("/api/courses"),
        api("/api/students"),
      ]);
      setLogs(logsRes.class_logs || []);
      setTotalLogs(logsRes.total || 0);
      setCourses(coursesRes.courses || []);
      setStudents(studentsRes.students || []);
      if (tid) { dismissToast(tid); showToast("Atualizado!", "success"); }
    } catch (e) { 
      console.error(e);
      if (tid) { dismissToast(tid); showToast("Erro ao atualizar", "error"); }
    }
    finally { setLoading(false); setRefreshing(false); }
  }, [showToast, dismissToast]);

  useEffect(() => { fetchAll(true, true); }, [fetchAll]);

  const stats = useMemo(() => ({
    diarios: totalLogs,
    registros: logs.reduce((a, l) => a + (l.records ? l.records.length : 0), 0),
    presentes: logs.reduce((a, l) => a + l.records.filter((r) => normalizeStatus(r.status) === 0).length, 0),
    ausentes:  logs.reduce((a, l) => a + l.records.filter((r) => normalizeStatus(r.status) === 1).length, 0),
    justificados: logs.reduce((a, l) => a + l.records.filter((r) => normalizeStatus(r.status) === 2).length, 0),
  }), [logs, totalLogs]);

  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f9", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{
        background: "#fff", borderBottom: "1.5px solid #ebebeb",
        padding: "14px 40px", display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#4361ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>Sistema de Presença</h1>
            <p style={{ margin: 0, fontSize: 12, color: "#aaa" }}>Controle de frequência escolar — DDD</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="edit" onClick={() => setModal("catalogo")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
            </svg>
            Catálogo
          </Btn>
          <Btn variant="ghost" onClick={() => fetchAll(false)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}>
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Atualizar
          </Btn>
          <Btn onClick={() => setModal("nova")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nova chamada
          </Btn>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 32 }}>
          {[
            { label: "Diários",      value: stats.diarios,      color: "#1a1a2e" },
            { label: "Registros",    value: stats.registros,    color: "#1a1a2e" },
            { label: "Presentes",    value: stats.presentes,    color: "#2e7d32" },
            { label: "Ausentes",     value: stats.ausentes,     color: "#c62828" },
            { label: "Justificados", value: stats.justificados, color: "#f57f17" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #ebebeb", padding: "16px 20px" }}>
              <p style={{ margin: 0, fontSize: 12, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
              <p style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Lista */}
        {loading && logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa", fontSize: 15 }}>Carregando...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#bbb", background: "#fff", borderRadius: 16, border: "1.5px solid #ebebeb" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
            <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Nenhum diário registrado</p>
            <p style={{ fontSize: 14, margin: "8px 0 0" }}>Clique em "+ Nova chamada" para começar.</p>
          </div>
        ) : (
          logs.map((log) => (
            <ClassLogCard key={log.id} log={log} courses={courses} students={students} onRefresh={fetchAll} />
          ))
        )}
      </main>

      {modal === "nova" && (
        <NovaChamadaModal courses={courses} students={students}
          onClose={() => setModal(null)} onSuccess={() => { setModal(null); fetchAll(); }} />
      )}
      {modal === "catalogo" && (
        <CatalogoModal courses={courses} students={students}
          onClose={() => setModal(null)} onRefresh={fetchAll} />
      )}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
