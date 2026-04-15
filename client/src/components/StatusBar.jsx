import styles from "./StatusBar.module.css";

export default function StatusBar({ status, running }) {
  return (
    <div className={`${styles.bar} ${running ? styles.active : ""}`}>
      {running && <span className={styles.spinner} />}
      <span className={styles.text}>{status}</span>
    </div>
  );
}
