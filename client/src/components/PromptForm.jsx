import { useState, useRef } from "react";
import styles from "./PromptForm.module.css";

export default function PromptForm({ onSubmit, running, onStop }) {
  const [prompt, setPrompt] = useState("");
  const [numRounds, setNumRounds] = useState(1);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const selected = Array.from(e.target.files);
    selected.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        const [prefix, data] = dataUrl.split(",");
        const media_type = prefix.match(/:(.*?);/)[1];
        setFiles((prev) => [
          ...prev,
          { name: file.name, media_type, data },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim()) return;
    onSubmit({ prompt: prompt.trim(), numRounds, files });
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

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((f, i) => (
            <span key={i} className={styles.fileChip}>
              {f.name}
              <button
                type="button"
                className={styles.removeFile}
                onClick={() => removeFile(i)}
                disabled={running}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

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

        <div className={styles.actions}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,text/*,.pdf,.csv,.json,.md"
            style={{ display: "none" }}
            onChange={handleFileChange}
            disabled={running}
          />
          <button
            type="button"
            className={styles.attachBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={running}
            title="Attach files"
          >
            Attach
          </button>

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
      </div>
    </form>
  );
}
