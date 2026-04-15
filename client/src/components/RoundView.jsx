import ReactMarkdown from "react-markdown";
import styles from "./RoundView.module.css";

export default function RoundView({ round, collapsed, onToggle }) {
  const label = round.round === 0 ? "Initial responses" : `Critique round ${round.round}`;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>
        <button className={styles.headingBtn} onClick={onToggle}>
          <span className={styles.pill}>{label}</span>
          <span className={`${styles.chevron} ${collapsed ? styles.chevronDown : styles.chevronUp}`}>
            ›
          </span>
        </button>
      </h2>
      <div className={styles.columns}>
        <ModelCard model="claude" data={round.claude} collapsed={collapsed} />
        <ModelCard model="gpt"    data={round.gpt}    collapsed={collapsed} />
      </div>
    </section>
  );
}

function ModelCard({ model, data, collapsed }) {
  const isClaude = model === "claude";
  const name     = isClaude ? "Claude" : "GPT-4";
  const { content = "", score = null, missing = [] } = data ?? {};

  const hasMeta = score !== null || missing.length > 0;

  return (
    <div className={`${styles.card} ${isClaude ? styles.claudeCard : styles.gptCard}`}>

      {/* ── Always-visible header ──────────────────────────────── */}
      <div className={styles.cardHeader}>
        <div className={styles.headerRow}>
          <span className={`${styles.badge} ${isClaude ? styles.claudeBadge : styles.gptBadge}`}>
            {name}
          </span>
          {score !== null && (
            <span className={`${styles.score} ${scoreClass(score)}`}>
              {score}/10
            </span>
          )}
        </div>

        {missing.length > 0 && (
          <div className={styles.missing}>
            <span className={styles.missingLabel}>
              Gaps found in {isClaude ? "GPT-4" : "Claude"}'s previous response:
            </span>
            <ul className={styles.missingList}>
              {missing.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {hasMeta && <div className={styles.divider} />}
      </div>

      {/* ── Collapsible response body ──────────────────────────── */}
      <div className={`${styles.cardBody} ${collapsed ? styles.cardBodyPreview : ""}`}>
        {content ? (
          <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          <span className={styles.waiting}>Waiting…</span>
        )}
        {collapsed && content && <div className={styles.fade} />}
      </div>

    </div>
  );
}

function scoreClass(score) {
  if (score >= 8) return styles.scoreHigh;
  if (score >= 5) return styles.scoreMid;
  return styles.scoreLow;
}
