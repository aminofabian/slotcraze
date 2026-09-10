(() => {
  const DEST = "https://playltc.com/";
  const DEFAULT_SECONDS = 10;

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const header = document.querySelector(".site-header");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sections = [...document.querySelectorAll(".reveal")];

  if (sections.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      sections.forEach((el) => el.classList.add("is-visible"));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
      );

      for (const section of sections) {
        observer.observe(section);
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
          section.classList.add("is-visible");
          observer.unobserve(section);
        }
      }
    }
  }

  const faq = document.querySelector(".faq");
  if (faq) {
    faq.addEventListener("toggle", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLDetailsElement) || !target.open) return;
      for (const item of faq.querySelectorAll("details")) {
        if (item !== target) item.open = false;
      }
    });
  }

  /* Intentional spotlight showcase — step, pause, center */
  const showcase = document.querySelector("[data-showcase]");
  if (showcase) {
    const track = showcase.querySelector("[data-showcase-track]");
    const nameEl = showcase.querySelector("[data-showcase-name]");
    const meter = showcase.querySelector("[data-showcase-meter]");
    const slides = track ? [...track.children] : [];
    const HOLD_MS = 2800;
    const STEP_MS = 850;

    const setActive = (index) => {
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === index);
        slide.classList.toggle("is-near", Math.abs(i - index) === 1);
        const link = slide.querySelector("a");
        if (link) {
          if (i === index) link.removeAttribute("tabindex");
          else link.setAttribute("tabindex", "-1");
        }
      });

      const active = slides[index];
      if (!active || !track) return;

      const name = active.getAttribute("data-name") || "";
      if (nameEl) nameEl.textContent = name;

      const viewport = showcase.querySelector(".hero-stage__viewport");
      if (!viewport) return;

      const slideCenter = active.offsetLeft + active.offsetWidth / 2;
      const target = viewport.clientWidth / 2 - slideCenter;
      track.style.transform = `translate3d(${target}px, 0, 0)`;
    };

    if (slides.length && track) {
      let index = 0;
      let timerId = 0;
      let paused = false;
      let pauseStarted = 0;
      let remainHold = HOLD_MS;

      const runMeter = (duration) => {
        if (!meter) return;
        meter.style.transition = "none";
        meter.style.transform = "scaleX(0)";
        // Force reflow, then ease the hold bar
        void meter.offsetWidth;
        meter.style.transition = `transform ${duration}ms linear`;
        meter.style.transform = "scaleX(1)";
      };

      const freezeMeter = () => {
        if (!meter) return;
        const t = getComputedStyle(meter).transform;
        let sx = 0;
        if (t && t !== "none") {
          const match = t.match(/matrix\(([^)]+)\)/);
          if (match) sx = Number.parseFloat(match[1].split(",")[0]) || 0;
        }
        meter.style.transition = "none";
        meter.style.transform = `scaleX(${Math.min(1, Math.max(0, sx))})`;
      };

      const goTo = (next) => {
        index = (next + slides.length) % slides.length;
        setActive(index);
      };

      const schedule = (duration = HOLD_MS) => {
        window.clearTimeout(timerId);
        if (reduceMotion || paused) return;
        remainHold = duration;
        pauseStarted = performance.now();
        runMeter(duration);
        timerId = window.setTimeout(() => {
          goTo(index + 1);
          schedule(HOLD_MS);
        }, duration + STEP_MS);
      };

      const pause = () => {
        if (paused || reduceMotion) return;
        paused = true;
        showcase.classList.add("is-paused");
        const elapsed = performance.now() - pauseStarted;
        remainHold = Math.max(400, remainHold - elapsed);
        window.clearTimeout(timerId);
        freezeMeter();
      };

      const resume = () => {
        if (!paused || reduceMotion) return;
        paused = false;
        showcase.classList.remove("is-paused");
        schedule(remainHold);
      };

      setActive(0);

      if (!reduceMotion) {
        const start = () => {
          setActive(0);
          schedule();
        };

        // Recenter after layout/fonts settle
        requestAnimationFrame(() => {
          requestAnimationFrame(start);
        });

        showcase.addEventListener("mouseenter", pause);
        showcase.addEventListener("mouseleave", resume);
        showcase.addEventListener("focusin", pause);
        showcase.addEventListener("focusout", (event) => {
          if (!showcase.contains(event.relatedTarget)) resume();
        });

        let resizeTimer = 0;
        window.addEventListener(
          "resize",
          () => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => setActive(index), 120);
          },
          { passive: true }
        );
      } else {
        slides.forEach((slide) => {
          slide.classList.add("is-active");
          slide.classList.remove("is-near");
        });
        if (meter) meter.style.transform = "scaleX(0)";
      }
    }
  }

  const panel = document.getElementById("redirect");
  if (!panel) return;

  const params = new URLSearchParams(window.location.search);
  if (params.get("noredirect") === "1") {
    panel.remove();
    return;
  }

  const secondsAttr = Number(panel.dataset.seconds);
  const totalSeconds =
    Number.isFinite(secondsAttr) && secondsAttr > 0 ? Math.round(secondsAttr) : DEFAULT_SECONDS;
  const dest = panel.dataset.url || DEST;
  const countEl = panel.querySelector("[data-redirect-count]");
  const progressEl = panel.querySelector("[data-redirect-progress]");
  const cancelBtn = panel.querySelector("[data-redirect-cancel]");
  const statusEl = panel.querySelector(".redirect__text");

  let remaining = totalSeconds;
  let timerId = 0;
  let cancelled = false;

  const render = () => {
    if (countEl) countEl.textContent = String(remaining);
    if (progressEl) {
      const elapsed = totalSeconds - remaining;
      const pct = elapsed / totalSeconds;
      progressEl.style.transform = `scaleX(${Math.min(1, Math.max(0, pct))})`;
    }
  };

  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    window.clearInterval(timerId);
    panel.classList.add("redirect--cancelled");
    if (statusEl) {
      statusEl.textContent = "Auto-redirect cancelled. You can keep reading here.";
    }
    if (cancelBtn) cancelBtn.hidden = true;
  };

  const go = () => {
    if (cancelled) return;
    window.location.replace(dest);
  };

  const tick = () => {
    remaining -= 1;
    if (remaining <= 0) {
      window.clearInterval(timerId);
      if (countEl) countEl.textContent = "0";
      if (progressEl) progressEl.style.transform = "scaleX(1)";
      go();
      return;
    }
    render();
  };

  panel.hidden = false;
  render();

  timerId = window.setInterval(tick, 1000);
  if (cancelBtn) cancelBtn.addEventListener("click", cancel);

  document.querySelectorAll('a[href="#notice"], a[href="#faq"], a[href="#next-steps"], a[href="#games"]').forEach((link) => {
    link.addEventListener("click", cancel, { once: true });
  });
})();
