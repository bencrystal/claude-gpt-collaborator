import { useState } from "react";
import styles from "./PromptForm.module.css";

export default function PromptForm({ onSubmit, running, onStop }) {
  const [prompt, setPrompt] = useState("");
  const [numRounds, setNumRounds] = useState(1);

  function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim()) return;
    onSubmit({ prompt: prompt.trim(), numRounds });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <textarea
        className={styles.textarea}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask anything…  Both models will answer, then critique each other, then a final synthesis is produced."
        rows={4}
        disabled={running}
      />

      <div className={styles.controls}>
        <label className={styles.roundsLabel}>
          Critique rounds
          <select
            value={numRounds}
            onChange={(e) => setNumRounds(Number(e.target.value))}
            disabled={running}
            className={styles.select}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        {running ? (
          <button type="button" className={styles.stopBtn} onClick={onStop}>
            Stop
          </button>
        ) : (
          <button type="submit" className={styles.submitBtn} disabled={!prompt.trim()}>
            Run
          </button>
        )}
      </div>
    </form>
  );
}
