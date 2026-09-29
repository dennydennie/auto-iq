"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

type MotionGsap = typeof import("gsap").gsap;

export function HomePageMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  useHomePageMotion(rootRef);

  return (
    <div ref={rootRef} className="contents" data-home-motion>
      {children}
    </div>
  );
}

function useHomePageMotion(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    initializeMotion(rootRef.current, () => cancelled).then((dispose) => {
      if (cancelled) dispose?.();
      else cleanup = dispose;
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [rootRef]);
}

async function initializeMotion(
  root: HTMLDivElement | null,
  isCancelled: () => boolean,
) {
  try {
    const [gsapModule, scrollTriggerModule] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]);
    if (!root || isCancelled()) return;
    gsapModule.gsap.registerPlugin(scrollTriggerModule.ScrollTrigger);
    return createMotion(gsapModule.gsap, root);
  } catch (error) {
    console.error("Landing page motion failed to initialize.", error);
  }
}

function createMotion(gsap: MotionGsap, root: HTMLElement) {
  const media = gsap.matchMedia(root);
  media.add(
    {
      mobile: "(max-width: 767px)",
      reduceMotion: "(prefers-reduced-motion: reduce)",
    },
    ({ conditions }) => {
      if (conditions?.reduceMotion) return;
      const mobile = Boolean(conditions?.mobile);
      animateHero(gsap, root, mobile);
      animateScenes(gsap, root, mobile);
      animateHeader(gsap, root);
    },
  );
  return () => media.revert();
}

function animateHero(gsap: MotionGsap, root: HTMLElement, mobile: boolean) {
  const timeline = gsap.timeline({ defaults: { ease: "power4.out" } });
  timeline.fromTo(
    root.querySelectorAll<HTMLElement>("[data-motion-headline-line]"),
    { yPercent: 112 },
    { yPercent: 0, duration: mobile ? 0.52 : 0.68, stagger: 0.1 },
    0.12,
  );
  revealHeroCopy(timeline, root, mobile);
  revealHeroCar(timeline, root, mobile);
  revealHeroSearch(timeline, root, mobile);
}

function revealHeroCopy(
  timeline: gsap.core.Timeline,
  root: HTMLElement,
  mobile: boolean,
) {
  timeline.fromTo(
    root.querySelectorAll<HTMLElement>("[data-motion-hero-copy]"),
    { autoAlpha: 0, y: mobile ? 9 : 14 },
    { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.08 },
    0.28,
  );
}

function revealHeroCar(
  timeline: gsap.core.Timeline,
  root: HTMLElement,
  mobile: boolean,
) {
  const car = root.querySelector<HTMLElement>("[data-motion-car]");
  if (!car) return;
  timeline.fromTo(car, { autoAlpha: 0, x: mobile ? 18 : 36, clipPath: "inset(0 100% 0 0)" }, {
    autoAlpha: 1, x: 0, clipPath: "inset(0 0% 0 0)", duration: mobile ? 0.68 : 0.86,
  }, 0.38);
  revealHeroGlow(timeline, root, mobile);
}

function revealHeroGlow(
  timeline: gsap.core.Timeline,
  root: HTMLElement,
  mobile: boolean,
) {
  const glow = root.querySelector<HTMLElement>("[data-motion-car-glow]");
  if (!glow || mobile) return;
  timeline.fromTo(
    glow,
    { autoAlpha: 0, scale: 0.78 },
    { autoAlpha: 1, scale: 1, duration: 0.9 },
    0.4,
  );
}

function revealHeroSearch(
  timeline: gsap.core.Timeline,
  root: HTMLElement,
  mobile: boolean,
) {
  const search = root.querySelector<HTMLElement>("[data-motion-search]");
  if (!search) return;
  timeline.fromTo(
    search,
    { autoAlpha: 0, y: mobile ? 10 : 18, clipPath: "inset(0 0 100% 0 round 18px)" },
    { autoAlpha: 1, y: 0, clipPath: "inset(0 0 0% 0 round 18px)", duration: 0.52 },
    0.82,
  );
}

function animateHeader(gsap: MotionGsap, root: HTMLElement) {
  gsap.fromTo(
    root.querySelectorAll<HTMLElement>("[data-motion-header-item]"),
    { autoAlpha: 0, y: -8 },
    { autoAlpha: 1, y: 0, duration: 0.38, stagger: 0.045, ease: "power3.out" },
  );
}

function animateScenes(gsap: MotionGsap, root: HTMLElement, mobile: boolean) {
  animateTrustStrip(gsap, root, mobile);
  animateChoices(gsap, root, mobile);
  animateHowItWorks(gsap, root, mobile);
  animateProof(gsap, root, mobile);
  animateJourney(gsap, root, mobile);
  animateSeller(gsap, root, mobile);
  animateClosing(gsap, root, mobile);
  animateFooter(gsap, root, mobile);
}

function sceneTimeline(gsap: MotionGsap, trigger: Element | null, mobile: boolean) {
  if (!trigger) return null;
  return gsap.timeline({
    defaults: { ease: "power4.out" },
    scrollTrigger: { trigger, start: mobile ? "top 95%" : "top 88%", once: true },
  });
}

function animateTrustStrip(gsap: MotionGsap, root: HTMLElement, mobile: boolean) {
  const items = root.querySelectorAll<HTMLElement>("[data-motion-trust-item]");
  const timeline = sceneTimeline(gsap, root.querySelector("[data-motion-trust]"), mobile);
  timeline?.fromTo(
    items,
    { autoAlpha: 0, y: mobile ? 12 : 20, clipPath: "inset(0 0 100% 0)" },
    { autoAlpha: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 0.56, stagger: 0.1 },
  );
}

function animateChoices(gsap: MotionGsap, root: HTMLElement, mobile: boolean) {
  const items = root.querySelectorAll<HTMLElement>("[data-motion-choice]");
  const timeline = sceneTimeline(gsap, root.querySelector("[data-motion-choices]"), mobile);
  items.forEach((item, index) => {
    timeline?.fromTo(
      item,
      { autoAlpha: 0, x: mobile ? 0 : index === 0 ? -22 : 22, y: mobile ? 14 : 0, clipPath: "inset(0 100% 0 0 round 18px)" },
      { autoAlpha: 1, x: 0, y: 0, clipPath: "inset(0 0% 0 0 round 18px)", duration: 0.58 },
      index * 0.13,
    );
  });
  revealIntro(timeline, root.querySelector("[data-motion-choices-intro]"), mobile, 0);
}

function animateHowItWorks(gsap: MotionGsap, root: HTMLElement, mobile: boolean) {
  const items = root.querySelectorAll<HTMLElement>("[data-motion-step]");
  const timeline = sceneTimeline(gsap, root.querySelector("[data-motion-steps]"), mobile);
  revealIntro(timeline, root.querySelector("[data-motion-steps-intro]"), mobile, 0);
  timeline?.fromTo(
    items,
    { autoAlpha: 0, y: mobile ? 14 : 24, clipPath: "inset(0 0 100% 0 round 16px)" },
    { autoAlpha: 1, y: 0, clipPath: "inset(0 0 0% 0 round 16px)", duration: 0.55, stagger: 0.13 },
    0.2,
  );
}

function animateProof(gsap: MotionGsap, root: HTMLElement, mobile: boolean) {
  const items = root.querySelectorAll<HTMLElement>("[data-motion-proof-item]");
  const icons = root.querySelectorAll<HTMLElement>("[data-motion-proof-icon]");
  const timeline = sceneTimeline(gsap, root.querySelector("[data-motion-proof]"), mobile);
  revealIntro(timeline, root.querySelector("[data-motion-proof-intro]"), mobile, 0);
  timeline?.fromTo(
    items,
    { autoAlpha: 0, clipPath: "inset(0 0 100% 0 round 16px)" },
    { autoAlpha: 1, clipPath: "inset(0 0 0% 0 round 16px)", duration: 0.5, stagger: 0.1 },
    0.18,
  );
  timeline?.fromTo(
    icons,
    { scale: 0.72, rotate: -9 },
    { scale: 1, rotate: 0, duration: 0.42, stagger: 0.1 },
    0.28,
  );
}

function animateJourney(gsap: MotionGsap, root: HTMLElement, mobile: boolean) {
  const signals = root.querySelectorAll<HTMLElement>("[data-motion-signal]");
  const timeline = sceneTimeline(gsap, root.querySelector("[data-motion-journey]"), mobile);
  revealIntro(timeline, root.querySelector("[data-motion-journey-copy]"), mobile, 0);
  timeline?.fromTo(
    signals,
    { autoAlpha: 0, x: mobile ? 0 : 22, y: mobile ? 10 : 0, clipPath: "inset(0 0 0 100% round 16px)" },
    { autoAlpha: 1, x: 0, y: 0, clipPath: "inset(0 0 0 0% round 16px)", duration: 0.5, stagger: 0.12 },
    0.22,
  );
  timeline?.fromTo(
    root.querySelectorAll("[data-motion-signal-number]"),
    { scale: 0.65, rotate: -12 },
    { scale: 1, rotate: 0, duration: 0.35, stagger: 0.12 },
    0.34,
  );
}

function animateSeller(gsap: MotionGsap, root: HTMLElement, mobile: boolean) {
  const steps = root.querySelectorAll<HTMLElement>("[data-motion-seller-step]");
  const bodyTypes = root.querySelectorAll<HTMLElement>("[data-motion-body-type]");
  const timeline = sceneTimeline(gsap, root.querySelector("[data-motion-seller]"), mobile);
  revealIntro(timeline, root.querySelector("[data-motion-seller-intro]"), mobile, 0);
  timeline?.fromTo(
    steps,
    { autoAlpha: 0, x: mobile ? -10 : -18 },
    { autoAlpha: 1, x: 0, duration: 0.42, stagger: 0.09 },
    0.18,
  );
  timeline?.fromTo(
    bodyTypes,
    { autoAlpha: 0, scale: 0.88, y: 9 },
    { autoAlpha: 1, scale: 1, y: 0, duration: 0.42, stagger: 0.07 },
    0.38,
  );
}

function animateClosing(gsap: MotionGsap, root: HTMLElement, mobile: boolean) {
  const panel = root.querySelector<HTMLElement>("[data-motion-closing]");
  const timeline = sceneTimeline(gsap, panel, mobile);
  timeline?.fromTo(
    panel,
    { clipPath: "inset(0 100% 0 0 round 24px)" },
    { clipPath: "inset(0 0% 0 0 round 24px)", duration: 0.72 },
  );
  revealIntro(timeline, panel?.querySelector("[data-motion-closing-copy]") ?? null, mobile, 0.14);
  const action = panel?.querySelector("[data-motion-closing-action]");
  if (action) {
    timeline?.fromTo(action, { autoAlpha: 0, x: 14 }, { autoAlpha: 1, x: 0, duration: 0.42 }, 0.42);
  }
}

function animateFooter(gsap: MotionGsap, root: HTMLElement, mobile: boolean) {
  const groups = root.querySelectorAll<HTMLElement>("[data-motion-footer-group]");
  const timeline = sceneTimeline(gsap, root.querySelector("[data-motion-footer]"), mobile);
  timeline?.fromTo(
    groups,
    { autoAlpha: 0, y: mobile ? 8 : 14 },
    { autoAlpha: 1, y: 0, duration: 0.36, stagger: 0.08 },
  );
}

function revealIntro(
  timeline: gsap.core.Timeline | null,
  target: Element | null,
  mobile: boolean,
  position: number,
) {
  if (!timeline || !target) return;
  timeline.fromTo(target, { autoAlpha: 0, y: mobile ? 10 : 16 }, { autoAlpha: 1, y: 0, duration: 0.46 }, position);
}
