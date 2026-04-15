import { useState, useEffect, useRef } from "react";
import styles from "./LandingPage.module.css";

const PASSWORD = "vibecodedforeva82626";
const COLORS = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#c77dff", "#ff9f43", "#00d2ff"];
const NUM_MARKS = 18;

function rand(a, b) { return a + Math.random() * (b - a); }

export default function LandingPage({ onUnlock }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const marksRef = useRef([]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Reinit marks on resize so they're within bounds
      marksRef.current = Array.from({ length: NUM_MARKS }, () => {
        const size = rand(28, 80);
        return {
          x: rand(size, canvas.width - size),
          y: rand(size, canvas.height - size),
          dx: (rand(1.5, 3.5)) * (Math.random() < 0.5 ? 1 : -1),
          dy: (rand(1.5, 3.5)) * (Math.random() < 0.5 ? 1 : -1),
          size,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: rand(0, Math.PI * 2),
          rotSpeed: rand(0.01, 0.04) * (Math.random() < 0.5 ? 1 : -1),
        };
      });
    }

    resize();
    window.addEventListener("resize", resize);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const m of marksRef.current) {
        m.x += m.dx;
        m.y += m.dy;
        m.rotation += m.rotSpeed;

        const half = m.size * 0.6;
        if (m.x - half < 0 || m.x + half > canvas.width) m.dx *= -1;
        if (m.y - half < 0 || m.y + half > canvas.height) m.dy *= -1;

        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.rotation);
        ctx.font = `bold ${m.size}px monospace`;
        ctx.fillStyle = m.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", 0, 0);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (password === PASSWORD) {
      sessionStorage.setItem("unlocked", "1");
      onUnlock();
    } else {
      setError(true);
      setPassword("");
      setTimeout(() => setError(false), 800);
    }
  }

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.overlay}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="password"
            className={`${styles.input} ${error ? styles.shake : ""}`}
            autoFocus
            autoComplete="off"
          />
          <button type="submit" className={styles.btn}>Enter</button>
        </form>
        {error && <p className={styles.errMsg}>wrong password</p>}
      </div>
    </div>
  );
}
