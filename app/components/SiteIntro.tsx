"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

type SiteIntroProps = {
  onDone: () => void;
};

const SOUTH_AFRICAN_GREETINGS = [
  "Sawbona",
  "Hello",
  "Hallo",
  "Molo",
  "Dumela",
  "Lumela",
  "Dumela",
  "Sawubona",
  "Ndaa",
  "Avuxeni",
  "Lotjhani",
  "Hello",
  "👋",
  "Sawubona",
  "Molo",
  "Dumela",
  "Lumela",
  "Dumela",
  "Sawubona",
  "Ndaa",
  "Avuxeni",
  "Lotjhani",
] as const;

const INTRO_DURATION_SECONDS = 5;

export default function SiteIntro({ onDone }: SiteIntroProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const overlay = overlayRef.current;

    if (!overlay) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const totalDurationMs = INTRO_DURATION_SECONDS * 500;
    const perGreetingDurationMs = totalDurationMs / SOUTH_AFRICAN_GREETINGS.length;

    gsap.set(overlay, { clipPath: "inset(0% 0% 0% 0%)" });

    const greetingInterval = window.setInterval(() => {
      setActiveIndex((previous) =>
        previous === SOUTH_AFRICAN_GREETINGS.length - 1 ? 0 : previous + 1
      );
    }, perGreetingDurationMs);

    const revealTimeout = window.setTimeout(() => {
      window.clearInterval(greetingInterval);
      gsap.to(overlay, {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: 0.9,
        ease: "power4.inOut",
        onComplete: () => {
          document.body.style.overflow = previousOverflow;
          onDone();
        },
      });
    }, totalDurationMs);

    return () => {
      window.clearInterval(greetingInterval);
      window.clearTimeout(revealTimeout);
      gsap.killTweensOf(overlay);
      document.body.style.overflow = previousOverflow;
    };
  }, [onDone]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center price text-white"
    >
      <div className="text-center">
        <p className="text-sm  tracking-tight">
          {SOUTH_AFRICAN_GREETINGS[activeIndex]}
        </p>
      </div>
    </div>
  );
}
