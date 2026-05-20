"use client";

import { useEffect, useState } from "react";

export function useCountUp(target: number, duration = 1000, enabled = true) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (target === 0) { setValue(0); return; }

    let startTime: number | null = null;

    function step(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.floor(target * eased));
      if (progress < 1) requestAnimationFrame(step);
      else setValue(target);
    }

    requestAnimationFrame(step);
  }, [target, duration, enabled]);

  return value;
}
