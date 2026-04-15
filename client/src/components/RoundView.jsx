import ReactMarkdown from "react-markdown";
import styles from "./RoundView.module.css";

export default function RoundView({ round }) {
  const label = round.round === 0 ? "Initial responses" : `Critique round ${round.round}`;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>
        <span className={styles.pill}>{label}</span>
      </h2>
      <div className={styles.columns}>
        <ModelCard model="claude" content={round.claude} />
        <ModelCard model="gpt" content={round.gpt} />
      </div>
    </section>
  );
}

function ModelCard({ model, content }) {
  const isClaude = model === "claude";
  const name = isClaude ? "Claude" : "GPT-4";

  return (
    <div className={`${styles.card} ${isClaude ? styles.claudeCard : styles.gptCard}`}>
      <div className={styles.cardHeader}>
        <span className={`${styles.badge} ${isClaude ? styles.claudeBadge : styles.gptBadge}`}>
          {name}
        </span>
      </div>
      <div className={styles.cardBody}>
        {content ? (
          <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          <span className={styles.waiting}>Waiting…</span>
        )}
      </div>
    </div>
  );
}
