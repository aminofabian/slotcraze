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
      const pct = (elapsed / totalSeconds) * 100;
      progressEl.style.width = `${Math.min(100, Math.max(0, pct))}%`;
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
      if (progressEl) progressEl.style.width = "100%";
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
  document.querySelectorAll('a[href="#notice"], a[href="#faq"], a[href="#next-steps"]').forEach((link) => {
    link.addEventListener("click", cancel, { once: true });
  });
})();
