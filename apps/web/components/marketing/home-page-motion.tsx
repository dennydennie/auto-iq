"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function HomePageMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([gsapModule, scrollTriggerModule]) => {
        const root = rootRef.current;
        if (cancelled || !root) return;
        const gsap = gsapModule.gsap;
        gsap.registerPlugin(scrollTriggerModule.ScrollTrigger);
        cleanup = setupHomeMotion(gsap, root);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div ref={rootRef} className="contents" data-home-motion>
      {children}
    </div>
  );
}

function setupHomeMotion(
  gsap: typeof import("gsap").gsap,
  root: HTMLElement,
) {
  const media = gsap.matchMedia(root);

  media.add(
    {
      isMobile: "(max-width: 767px)",
      reduceMotion: "(prefers-reduced-motion: reduce)",
    },
    ({ conditions }) => {
      if (conditions?.reduceMotion) return;

      const isMobile = Boolean(conditions?.isMobile);
      animateHero(gsap, root, isMobile);
      animateScrollGroups(gsap, root, isMobile);
      animateHeader(gsap, root);
    },
  );

  return () => media.revert();
}

function animateHero(
  gsap: typeof import("gsap").gsap,
  root: HTMLElement,
  isMobile: boolean,
) {
  const copy = root.querySelector<HTMLElement>("[data-gsap-hero-copy]");
  const car = root.querySelector<HTMLElement>("[data-gsap-hero-car]");
  const search = root.querySelector<HTMLElement>("[data-gsap-hero-search]");
  const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

  if (copy) {
    timeline.fromTo(
      copy.children,
      { autoAlpha: 0, y: isMobile ? 16 : 24 },
      { autoAlpha: 1, y: 0, duration: 0.58, stagger: isMobile ? 0.07 : 0.11 },
    );
  }
  if (car) {
    timeline.fromTo(
      car,
      { autoAlpha: 0, x: isMobile ? 22 : 48, clipPath: "inset(0 0 0 35%)" },
      {
        autoAlpha: 1,
        x: 0,
        clipPath: "inset(0 0 0 0%)",
        duration: isMobile ? 0.65 : 0.82,
      },
      copy ? "-=0.34" : 0,
    );
  }
  if (search) {
    timeline.fromTo(
      search,
      { autoAlpha: 0, y: isMobile ? 12 : 20 },
      { autoAlpha: 1, y: 0, duration: 0.46 },
      "-=0.28",
    );
  }
}

function animateHeader(gsap: typeof import("gsap").gsap, root: HTMLElement) {
  const items = root.querySelectorAll<HTMLElement>("[data-gsap-header-item]");
  gsap.fromTo(
    items,
    { autoAlpha: 0, y: -10 },
    { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.06, ease: "power2.out" },
  );
}

function animateScrollGroups(
  gsap: typeof import("gsap").gsap,
  root: HTMLElement,
  isMobile: boolean,
) {
  root
    .querySelectorAll<HTMLElement>("[data-gsap-stagger]")
    .forEach((group) => animateStagger(gsap, group, isMobile));
  root
    .querySelectorAll<HTMLElement>("[data-gsap-reveal]")
    .forEach((target) => animateReveal(gsap, target, isMobile));
  root
    .querySelectorAll<HTMLElement>("[data-gsap-stagger-children]")
    .forEach((group) => animateNestedChildren(gsap, group, isMobile));
}

function animateStagger(
  gsap: typeof import("gsap").gsap,
  group: HTMLElement,
  isMobile: boolean,
) {
  const mode = group.dataset.gsapStagger;
  const from = getStaggerStart(mode, isMobile);

  gsap.fromTo(
    group.children,
    { ...from, autoAlpha: 0 },
    {
      autoAlpha: 1,
      x: 0,
      y: 0,
      scale: 1,
      duration: isMobile ? 0.46 : 0.62,
      stagger: isMobile ? 0.065 : 0.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: group,
        start: isMobile ? "top 94%" : "top 88%",
        once: true,
      },
    },
  );
}

function getStaggerStart(mode: string | undefined, isMobile: boolean) {
  if (mode === "slide") return { x: isMobile ? 14 : 26, y: 0 };
  if (mode === "scale") return { scale: 0.97, y: isMobile ? 8 : 12 };
  return { x: 0, y: isMobile ? 18 : 28 };
}

function animateReveal(
  gsap: typeof import("gsap").gsap,
  target: HTMLElement,
  isMobile: boolean,
) {
  gsap.fromTo(
    target,
    { autoAlpha: 0, y: isMobile ? 12 : 20 },
    {
      autoAlpha: 1,
      y: 0,
      duration: isMobile ? 0.44 : 0.6,
      ease: "power3.out",
      scrollTrigger: {
        trigger: target,
        start: isMobile ? "top 94%" : "top 88%",
        once: true,
      },
    },
  );
}

function animateNestedChildren(
  gsap: typeof import("gsap").gsap,
  group: HTMLElement,
  isMobile: boolean,
) {
  const trigger = group.closest<HTMLElement>("[data-gsap-stagger]") ?? group;
  gsap.fromTo(
    group.children,
    { autoAlpha: 0, y: isMobile ? 7 : 10 },
    {
      autoAlpha: 1,
      y: 0,
      duration: isMobile ? 0.34 : 0.42,
      stagger: isMobile ? 0.045 : 0.06,
      ease: "power2.out",
      scrollTrigger: {
        trigger,
        start: isMobile ? "top 94%" : "top 88%",
        once: true,
      },
    },
  );
}
