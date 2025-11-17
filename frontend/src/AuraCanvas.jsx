// frontend/src/AuraCanvas.jsx
import React from "react";
import Sketch from "react-p5";

const AuraCanvas = ({ sentiment = "neutral", score = 50 }) => {
  let t = 0;

  const setup = (p5, parent) => {
    p5.createCanvas(window.innerWidth, window.innerHeight).parent(parent);
    p5.noStroke();
  };

  const draw = (p5) => {
    const intensity = Math.min(Math.max(score / 100, 0.05), 1); // 0–1

    // Choose base color by sentiment
    let base = { r: 20, g: 80, b: 200 }; // neutral blue
    if (sentiment === "positive") base = { r: 20, g: 180, b: 140 }; // teal
    if (sentiment === "negative") base = { r: 160, g: 40, b: 80 }; // red/purple

    // Soft background
    p5.background(3, 7, 18); // dark navy

    // Calm water layers
    const bands = 20;
    const bandHeight = p5.height / bands;

    for (let i = 0; i < bands; i++) {
      const y = i * bandHeight;
      const noiseOffset = i * 0.15;
      const alpha = 40 + i * 3;

      p5.fill(base.r, base.g, base.b, alpha);

      p5.beginShape();
      p5.vertex(0, p5.height);

      for (let x = 0; x <= p5.width; x += 15) {
        const n = p5.noise(x * 0.002, t + noiseOffset);
        const wave = (n - 0.5) * bandHeight * 4 * intensity; // taller with stronger emotion
        const yy = y + bandHeight / 2 + wave;
        p5.vertex(x, yy);
      }

      p5.vertex(p5.width, p5.height);
      p5.endShape(p5.CLOSE);
    }

    // small time step; a bit faster when emotion is strong
    t += 0.005 + intensity * 0.01;
  };

  const windowResized = (p5) => {
    p5.resizeCanvas(window.innerWidth, window.innerHeight);
  };

  return <Sketch setup={setup} draw={draw} windowResized={windowResized} />;
};

export default AuraCanvas;
