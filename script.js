(() => {
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

  if (!sections.length) return;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    sections.forEach((el) => el.classList.add("is-visible"));
    return;
  }

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

  // Keep one FAQ open at a time for cleaner reading
  const faq = document.querySelector(".faq");
  if (!faq) return;

  faq.addEventListener("toggle", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLDetailsElement) || !target.open) return;
    for (const item of faq.querySelectorAll("details")) {
      if (item !== target) item.open = false;
    }
  });
})();
