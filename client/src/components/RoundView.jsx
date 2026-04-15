import { useState } from "react";
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
      {!collapsed && (
        <div className={styles.columns}>
          <ModelCard model="claude" content={round.claude} />
          <ModelCard model="gpt" content={round.gpt} />
        </div>
      )}
      {collapsed && (
        <div className={styles.columns}>
          <ModelCard model="claude" content={round.claude} preview />
          <ModelCard model="gpt" content={round.gpt} preview />
        </div>
      )}
    </section>
  );
}

function ModelCard({ model, content, preview = false }) {
  const isClaude = model === "claude";
  const name = isClaude ? "Claude" : "GPT-4";

  return (
    <div className={`${styles.card} ${isClaude ? styles.claudeCard : styles.gptCard}`}>
      <div className={styles.cardHeader}>
        <span className={`${styles.badge} ${isClaude ? styles.claudeBadge : styles.gptBadge}`}>
          {name}
        </span>
      </div>
      <div className={`${styles.cardBody} ${preview ? styles.cardBodyPreview : ""}`}>
        {content ? (
          <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          <span className={styles.waiting}>Waiting…</span>
        )}
        {preview && content && <div className={styles.fade} />}
      </div>
    </div>
  );
}
