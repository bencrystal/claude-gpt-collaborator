import { useState, useRef } from "react";
import LandingPage from "./components/LandingPage.jsx";
import PromptForm from "./components/PromptForm.jsx";
import RoundView from "./components/RoundView.jsx";
import Synthesis from "./components/Synthesis.jsx";
import StatusBar from "./components/StatusBar.jsx";
import styles from "./App.module.css";

const INITIAL_STATE = {
  running: false,
  status: "",
  rounds: [],        // [{round, claude, gpt}]
  collapsedRounds: new Set(),
  synthesis: "",
  error: "",
};

export default function App() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem("unlocked") === "1"
  );
  const [state, setState] = useState(INITIAL_STATE);
  const abortRef = useRef(null);

  if (!unlocked) return <LandingPage onUnlock={() => setUnlocked(true)} />;

  async function handleSubmit({ prompt, numRounds }) {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setState({ ...INITIAL_STATE, running: true, status: "Starting…" });

    try {
      const res = await fetch("/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, num_rounds: numRounds }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        let msg = "Request failed";
        try { msg = (await res.json()).detail ?? msg; } catch {}
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const lines = buf.split("\n");
        buf = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6));
          handleEvent(event);
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setState((s) => ({ ...s, running: false, error: err.message }));
      }
    }
  }

  function handleEvent(event) {
    setState((s) => {
      switch (event.type) {
        case "round_start": {
          // Collapse the previous round when the next one begins
          const collapsedRounds = new Set(s.collapsedRounds);
          if (event.round > 0) collapsedRounds.add(event.round - 1);
          return {
            ...s,
            collapsedRounds,
            status:
              event.round === 0
                ? "Round 0 — initial responses…"
                : `Round ${event.round} — cross-critique…`,
          };
        }

        case "response": {
          const rounds = [...s.rounds];
          const idx = rounds.findIndex((r) => r.round === event.round);
          const emptyModel = { content: "", score: null, missing: [] };
          if (idx === -1) {
            rounds.push({ round: event.round, claude: { ...emptyModel }, gpt: { ...emptyModel } });
          }
          const entryIdx = idx === -1 ? rounds.length - 1 : idx;
          rounds[entryIdx] = {
            ...rounds[entryIdx],
            [event.model]: {
              content: event.content,
              score: event.score,
              missing: event.missing ?? [],
            },
          };
          return { ...s, rounds };
        }

        case "synthesis":
          return { ...s, status: "Synthesizing…", synthesis: event.content };

        case "done": {
          // Collapse all rounds except the last when done
          const collapsedRounds = new Set(s.collapsedRounds);
          s.rounds.forEach((r) => {
            if (r.round < s.rounds.length - 1) collapsedRounds.add(r.round);
          });
          return { ...s, running: false, status: "Complete", collapsedRounds };
        }

        default:
          return s;
      }
    });
  }

  function toggleRound(roundNum) {
    setState((s) => {
      const collapsedRounds = new Set(s.collapsedRounds);
      collapsedRounds.has(roundNum)
        ? collapsedRounds.delete(roundNum)
        : collapsedRounds.add(roundNum);
      return { ...s, collapsedRounds };
    });
  }

  function handleStop() {
    abortRef.current?.abort();
    setState((s) => ({ ...s, running: false, status: "Stopped" }));
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1>LLM GAN</h1>
        <p className={styles.subtitle}>
          Claude &amp; GPT-4 cross-critique each other until neither can improve the other's response
        </p>
      </header>

      <main className={styles.main}>
        <PromptForm onSubmit={handleSubmit} running={state.running} onStop={handleStop} />

        {state.error && <div className={styles.error}>{state.error}</div>}

        {(state.running || state.rounds.length > 0) && (
          <StatusBar status={state.status} running={state.running} />
        )}

        {state.rounds.map((round) => (
          <RoundView
            key={round.round}
            round={round}
            collapsed={state.collapsedRounds.has(round.round)}
            onToggle={() => toggleRound(round.round)}
          />
        ))}

        {state.synthesis && <Synthesis content={state.synthesis} />}
      </main>
    </div>
  );
}
