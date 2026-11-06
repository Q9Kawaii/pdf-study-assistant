// Particle background: dots drift around and link up when they get close,
// a small picture of chunks being connected.
(function () {
  const canvas = document.getElementById("particles");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const LINK_DISTANCE = 130;
  let dots = [];

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    // Fewer dots on small screens, which keeps phones smooth.
    const count = Math.min(70, Math.floor(innerWidth / 18));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: (Math.random() - 0.5) * 0.35,
    }));
  }

  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    dots.forEach((dot, index) => {
      // Lines are compared only with later dots, so each pair is drawn once.
      for (const other of dots.slice(index + 1)) {
        const distance = Math.hypot(dot.x - other.x, dot.y - other.y);
        if (distance < LINK_DISTANCE) {
          const strength = 1 - distance / LINK_DISTANCE;
          context.strokeStyle = `rgba(82, 232, 212, ${strength * 0.18})`;
          context.beginPath();
          context.moveTo(dot.x, dot.y);
          context.lineTo(other.x, other.y);
          context.stroke();
        }
      }
      context.fillStyle = "rgba(82, 232, 212, 0.55)";
      context.beginPath();
      context.arc(dot.x, dot.y, 1.6, 0, Math.PI * 2);
      context.fill();
    });
  }

  function step() {
    // Skip the work while the tab is hidden, to save battery.
    if (!document.hidden) {
      for (const dot of dots) {
        dot.x += dot.speedX;
        dot.y += dot.speedY;
        if (dot.x < 0 || dot.x > canvas.width) dot.speedX *= -1;
        if (dot.y < 0 || dot.y > canvas.height) dot.speedY *= -1;
      }
      draw();
    }
    requestAnimationFrame(step);
  }

  addEventListener("resize", () => {
    resize();
    if (REDUCED_MOTION) draw();
  });
  resize();
  if (REDUCED_MOTION) draw(); // one still frame, with no movement
  else step();
})();
