(() => {
  const area = document.querySelector(".hero-role-area");
  const panel = area.querySelector(".hero-role-panel");
  const handle = panel.querySelector("button");
  let drag;

  const movePanel = (x, y) => {
    const maxX = Math.max(0, area.clientWidth - panel.offsetWidth);
    const maxY = Math.max(0, area.clientHeight - panel.offsetHeight);
    panel.style.left = `${Math.min(maxX, Math.max(0, x))}px`;
    panel.style.top = `${Math.min(maxY, Math.max(0, y))}px`;
    panel.style.right = "auto";
  };

  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || drag) return;
    const bounds = panel.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener("pointermove", (event) => {
    if (event.pointerId !== drag?.id) return;
    const bounds = area.getBoundingClientRect();
    movePanel(event.clientX - bounds.left - drag.x, event.clientY - bounds.top - drag.y);
  });

  handle.addEventListener("lostpointercapture", () => { drag = undefined; });

  handle.addEventListener("keydown", (event) => {
    const offsets = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] };
    const offset = offsets[event.key];
    if (event.key === "Home") {
      event.preventDefault();
      ["left", "top", "right"].forEach((property) => panel.style.removeProperty(property));
    } else if (Array.isArray(offset)) {
      event.preventDefault();
      movePanel(panel.offsetLeft + offset[0], panel.offsetTop + offset[1]);
    }
  });

  window.addEventListener("resize", () => {
    if (panel.style.left) movePanel(panel.offsetLeft, panel.offsetTop);
  });

  handle.hidden = false;
})();

(() => {
  const nav = document.querySelector(".floating-nav");
  const links = [...nav.querySelectorAll("a")];
  const sections = links.slice(1).map((link) => document.querySelector(link.hash));
  let currentLink;

  const updateNavigation = () => {
    const readingLine = nav.getBoundingClientRect().bottom + 24;
    let activeLink = links[0];

    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= readingLine) activeLink = links[index + 1];
    });

    const pageHeight = document.documentElement.scrollHeight;
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= pageHeight - 2) {
      activeLink = links[links.length - 1];
    }

    if (activeLink === currentLink) return;
    currentLink?.removeAttribute("aria-current");
    activeLink.setAttribute("aria-current", "location");
    currentLink = activeLink;
  };

  window.addEventListener("scroll", updateNavigation, { passive: true });
  window.addEventListener("resize", updateNavigation);
  window.addEventListener("load", updateNavigation);
  updateNavigation();
})();

(() => {
  const { gsap, ScrollTrigger } = window;
  if (!gsap) return;

  if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  const motion = gsap.matchMedia();
  motion.add("(prefers-reduced-motion: no-preference)", () => {
    if (!ScrollTrigger) return;

    // The content scrolls over the sticky hero. Scrubbing reverses the motion on the way back.
    gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: "#main", start: "top bottom", end: "top top", scrub: true },
    })
      .to(".hero-photo-grid", { yPercent: -7 }, 0)
      .to(".hero-shade", { opacity: 0.72 }, 0)
      .to(".hero-copy", { y: -32, opacity: 0.35 }, 0);

    const progressBar = document.querySelector(".scroll-progress");
    gsap.set(progressBar, { display: "block" });
    gsap.to(progressBar, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: true },
    });

    document.querySelectorAll("[data-reveal]").forEach((section) => {
      gsap.from(section, {
        y: 14,
        opacity: 0.7,
        duration: 0.48,
        ease: "power2.out",
        clearProps: "opacity,transform",
        scrollTrigger: { trigger: section, start: "top 92%", once: true },
      });
    });
  });

  const steppedGallery = "(prefers-reduced-motion: no-preference) and (min-width: 20rem) and (min-height: 35rem)";
  motion.add(steppedGallery, () => {
    if (!ScrollTrigger) return;

    const track = document.querySelector(".project-track");
    const stage = track.querySelector(".project-stage");
    const wipe = track.querySelector(".project-wipe");
    const cards = Array.from(track.querySelectorAll(".project-card"));
    const controls = track.querySelector(".project-controls");
    const previous = controls.querySelector('[data-project-step="-1"]');
    const next = controls.querySelector('[data-project-step="1"]');
    const count = controls.querySelector(".project-count");
    const lastIndex = cards.length - 1;
    let currentIndex = -1;
    let reveal;

    const animateProject = (card, direction) => {
      const forward = direction > 0;
      const nearEdge = "inset(0% 0% 86% 0%)";
      const farEdge = "inset(86% 0% 0% 0%)";
      const content = card.querySelectorAll(".project-content > *");
      const media = card.querySelector(".project-media img");

      const animation = gsap.timeline({ defaults: { ease: "power3.out" } })
        .fromTo(card, {
          y: 22 * direction,
          opacity: 0.62,
          clipPath: forward ? "inset(14% 0% 0% 0%)" : "inset(0% 0% 14% 0%)",
        }, {
          y: 0,
          opacity: 1,
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.48,
          clearProps: "opacity,transform,clipPath",
        }, 0)
        .fromTo(wipe, {
          clipPath: forward ? farEdge : nearEdge,
          opacity: 0.6,
        }, {
          clipPath: forward ? nearEdge : farEdge,
          opacity: 0,
          duration: 0.44,
          ease: "power1.out",
          clearProps: "opacity,clipPath",
        }, 0)
        .from(content, {
          y: 10 * direction,
          opacity: 0.65,
          duration: 0.32,
          stagger: 0.04,
          clearProps: "opacity,transform",
        }, 0.08);

      if (media) {
        animation.from(media, { scale: 1.05, duration: 0.5, clearProps: "transform" }, 0);
      }

      return animation;
    };

    const showProject = (index) => {
      if (index === currentIndex) return;

      const departing = cards[currentIndex];
      const arriving = cards[index];
      const direction = index > currentIndex ? 1 : -1;
      reveal?.revert();

      if (departing) {
        if (departing.contains(document.activeElement)) stage.focus({ preventScroll: true });
        departing.hidden = true;
      }

      arriving.hidden = false;
      if (departing) {
        reveal = animateProject(arriving, direction);
      }

      currentIndex = index;
      count.textContent = `Project ${index + 1} of ${cards.length}`;
      previous.setAttribute("aria-disabled", String(index === 0));
      next.setAttribute("aria-disabled", String(index === lastIndex));
    };

    cards.forEach((card) => { card.hidden = true; });
    track.style.setProperty("--project-count", String(cards.length));
    track.classList.add("is-stepped");
    controls.hidden = false;
    showProject(0);

    const syncProject = ({ progress }) => {
      showProject(Math.min(lastIndex, Math.floor(progress * cards.length)));
    };
    const trigger = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      onUpdate: syncProject,
      onRefresh: syncProject,
    });

    const moveProject = (event) => {
      const target = currentIndex + Number(event.currentTarget.dataset.projectStep);
      if (target < 0 || target > lastIndex) return;
      const stepProgress = (target + 0.5) / cards.length;
      trigger.scroll(trigger.start + stepProgress * (trigger.end - trigger.start));
      ScrollTrigger.update();
    };
    previous.addEventListener("click", moveProject);
    next.addEventListener("click", moveProject);
    ScrollTrigger.refresh(true);

    return () => {
      reveal?.revert();
      previous.removeEventListener("click", moveProject);
      next.removeEventListener("click", moveProject);
      controls.hidden = true;
      track.classList.remove("is-stepped");
      track.style.removeProperty("--project-count");
      cards.forEach((card) => { card.hidden = false; });
      ScrollTrigger.refresh(true);
    };
  });
})();

(() => {
  const preview = document.querySelector(".game-preview");
  const image = preview.querySelector("img");
  const toggle = preview.querySelector("button");
  const poster = image.getAttribute("src");
  const animation = image.dataset.animation;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let inView = !("IntersectionObserver" in window);
  let playRequested = !reducedMotion.matches;
  let animationAvailable = true;

  const updatePreview = () => {
    const playing = inView && playRequested && animationAvailable;
    const source = playing ? animation : poster;
    if (image.getAttribute("src") !== source) image.src = source;
    toggle.textContent = playing ? "Stop preview" : "Play preview";
  };

  toggle.addEventListener("click", () => {
    playRequested = image.getAttribute("src") !== animation;
    updatePreview();
  });

  image.addEventListener("error", () => {
    if (image.getAttribute("src") !== animation) return;
    animationAvailable = false;
    toggle.hidden = true;
    updatePreview();
  });

  reducedMotion.addEventListener("change", (event) => {
    playRequested = !event.matches;
    updatePreview();
  });

  if (!inView) {
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updatePreview();
    });
    observer.observe(preview);
  }

  toggle.hidden = false;
  updatePreview();
})();
