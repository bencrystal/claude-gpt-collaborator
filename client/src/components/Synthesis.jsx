import ReactMarkdown from "react-markdown";
import styles from "./Synthesis.module.css";

export default function Synthesis({ content }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>
        <span className={styles.pill}>Final synthesis</span>
      </h2>
      <div className={styles.card}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </section>
  );
}
