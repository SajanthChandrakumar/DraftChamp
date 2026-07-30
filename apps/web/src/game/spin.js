const REEL_LENGTH = 16;

/** A slot-machine reel of random labels from `pool`, ending on `landedLabel`. */
export function buildSpinReel(pool, landedLabel) {
  const reel = Array.from(
    { length: REEL_LENGTH - 1 },
    () => pool[Math.floor(Math.random() * pool.length)]
  );
  reel.push(landedLabel);
  return reel;
}
