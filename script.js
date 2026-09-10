(() => {
  "use strict";

  const DEST = "https://playltc.com/";
  const DEFAULT_SECONDS = 10;

  /* ---------- Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Header scroll state ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Scroll reveal ---------- */
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

  /* ---------- FAQ: one open at a time ---------- */
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

  /* ---------- Hero stage: spotlight carousel ---------- */
  const stage = document.querySelector("[data-stage]");

  if (stage) {
    const track = stage.querySelector("[data-stage-track]");
    const viewport = stage.querySelector(".hero-stage__viewport");
    const lists = [...stage.querySelectorAll("[data-stage-list]")];
    const nameEl = stage.querySelector("[data-stage-name]");
    const labelEl = stage.querySelector("[data-stage-label]");
    const meter = stage.querySelector("[data-stage-meter]");
    const count = lists[0] ? lists[0].children.length : 0;

    if (!track || !viewport || !count) {
      /* stage markup missing — nothing to drive */
    } else if (reduceMotion) {
      if (labelEl) labelEl.textContent = "Popular on PlayLTC";
      if (nameEl) nameEl.textContent = "10+ titles";
    } else {
      const INTERVAL = 2800;
      const SLIDE_MS = 850;
      const names = [...lists[0].children].map((li) => {
        const span = li.querySelector("span");
        return span ? span.textContent.trim() : "";
      });

      let idx = 0;
      let timerId = 0;
      let snapTimerId = 0;

      const paint = () => {
        const active = ((idx % count) + count) % count;
        for (const list of lists) {
          [...list.children].forEach((li, i) => {
            li.classList.toggle("is-active", i === active);
            const d = (i - active + count) % count;
            li.classList.toggle("is-near", d === 1 || d === count - 1);
          });
        }
        if (nameEl && names[active]) nameEl.textContent = names[active];
      };

      const center = (animate) => {
        const k = ((idx % count) + count) % count;
        const source = idx >= count && lists[1] ? lists[1] : lists[0];
        const target = source.children[k];
        if (!target) return;
        const offset =
          target.offsetLeft + target.offsetWidth / 2 - viewport.clientWidth / 2;
        if (!animate) track.style.transition = "none";
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
        if (!animate) {
          void track.offsetWidth;
          track.style.transition = "";
        }
      };

      const runMeter = () => {
        if (!meter) return;
        meter.style.animation = "none";
        void meter.offsetWidth;
        meter.style.animation = `stage-meter ${INTERVAL}ms linear forwards`;
      };

      const tick = () => {
        if (lists[1]) {
          idx += 1;
          paint();
          center(true);
          runMeter();
          if (idx === count) {
            /* the clone list looks identical to the start — snap back invisibly */
            window.clearTimeout(snapTimerId);
            snapTimerId = window.setTimeout(() => {
              idx = 0;
              paint();
              center(false);
            }, SLIDE_MS + 100);
          }
        } else {
          idx = (idx + 1) % count;
          paint();
          center(true);
          runMeter();
        }
      };

      const stop = () => {
        if (timerId) window.clearInterval(timerId);
        timerId = 0;
        stage.classList.add("is-paused");
      };

      const start = () => {
        if (timerId || document.hidden) return;
        stage.classList.remove("is-paused");
        timerId = window.setInterval(tick, INTERVAL);
      };

      paint();
      center(false);
      runMeter();
      start();

      stage.addEventListener("mouseenter", stop);
      stage.addEventListener("mouseleave", start);
      stage.addEventListener("focusin", stop);
      stage.addEventListener("focusout", start);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop();
        else start();
      });
      window.addEventListener("resize", () => center(false), { passive: true });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => center(false));
      }
      window.addEventListener("load", () => center(false));
    }
  }

  /* ---------- Redirect countdown ---------- */
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

  // Reading intent cancels the redirect
  document
    .querySelectorAll('a[href="#notice"], a[href="#faq"], a[href="#next-steps"], a[href="#games"]')
    .forEach((link) => {
      link.addEventListener("click", cancel, { once: true });
    });
})();
