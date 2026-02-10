/* ============================
   Mkhathini Plumbers & Building Construction
   File: js/main.js
   ============================ */

(() => {
  "use strict";

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  // Smooth-scroll with header offset
  const header = $("#siteHeader");
  const headerHeight = () => (header ? header.getBoundingClientRect().height : 0);

  function scrollToId(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const y = window.scrollY + target.getBoundingClientRect().top - headerHeight() - 12;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  // ---------- Year in footer ----------
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ---------- Progress bar ----------
  const progressBar = $("#progressBar");
  function updateProgressBar() {
    if (!progressBar) return;
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const scrollHeight = (doc.scrollHeight || 0) - (doc.clientHeight || 0);
    const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressBar.style.width = `${clamp(pct, 0, 100).toFixed(2)}%`;
  }
  updateProgressBar();
  window.addEventListener("scroll", updateProgressBar, { passive: true });
  window.addEventListener("resize", updateProgressBar);

  // ---------- Header (always visible) ----------
  if (header) header.style.transform = "translateY(0)";

  // ---------- Prevent mobile load from jumping to contact ----------
  const isMobile = window.matchMedia("(max-width: 820px)").matches;
  if (isMobile && (window.location.hash === "#contact" || window.location.hash === "#contactForm")) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  // ---------- Mobile menu ----------
  const burger = $("#burger");
  const mobileMenu = $("#mobileMenu");

  function setMobileMenu(open) {
    if (!burger || !mobileMenu) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    mobileMenu.setAttribute("aria-hidden", open ? "false" : "true");
    mobileMenu.dataset.open = open ? "true" : "false";
  }

  if (burger && mobileMenu) {
    setMobileMenu(false);

    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") === "true";
      setMobileMenu(!open);
    });

    // Close on link click
    $$(".mobileLink", mobileMenu).forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href") || "";
        if (href.startsWith("#") && href.length > 1) {
          e.preventDefault();
          setMobileMenu(false);
          scrollToId(href.slice(1));
        }
      });
    });

    // Close on escape
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMobileMenu(false);
    });
  }

  // ---------- Top nav smooth scroll ----------
  $$(".menuLink, .footerLink, .backTop").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (!href.startsWith("#") || href === "#") return;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const id = href.slice(1);
      scrollToId(id);
    });
  });

  // ---------- Hero carousel ----------
  const carousel = $("#heroCarousel");
  const viewport = $("#carouselViewport");
  const prevBtn = $("#carouselPrev");
  const nextBtn = $("#carouselNext");
  const dotsWrap = $("#carouselDots");
  const barFill = $("#carouselBarFill");

  let slides = [];
  let dots = [];
  let activeIndex = 0;
  let timer = null;
  const intervalMs = 5200;
  let barStart = 0;

  function setActiveSlide(index, userAction = false) {
    if (!viewport) return;
    slides = $$(".carouselSlide", viewport);
    if (slides.length === 0) return;

    const max = slides.length - 1;
    const nextIndex = clamp(index, 0, max);

    slides.forEach((s, i) => s.classList.toggle("isActive", i === nextIndex));

    if (dotsWrap) {
      dots = $$(".dot", dotsWrap);
      dots.forEach((d, i) => d.classList.toggle("isActive", i === nextIndex));
    }

    activeIndex = nextIndex;
    barStart = performance.now();

    // If user clicked, restart autoplay
    if (userAction) restartAutoplay();
  }

  function nextSlide(userAction = false) {
    if (!viewport) return;
    slides = $$(".carouselSlide", viewport);
    if (slides.length === 0) return;
    const i = (activeIndex + 1) % slides.length;
    setActiveSlide(i, userAction);
  }

  function prevSlide(userAction = false) {
    if (!viewport) return;
    slides = $$(".carouselSlide", viewport);
    if (slides.length === 0) return;
    const i = (activeIndex - 1 + slides.length) % slides.length;
    setActiveSlide(i, userAction);
  }

  function updateCarouselBar(now) {
    if (!barFill) return;
    const elapsed = now - barStart;
    const pct = clamp((elapsed / intervalMs) * 100, 0, 100);
    barFill.style.width = `${pct.toFixed(2)}%`;
  }

  function startAutoplay() {
    stopAutoplay();
    barStart = performance.now();
    timer = window.setInterval(() => nextSlide(false), intervalMs);
    const rafTick = (t) => {
      if (!timer) return; // stopped
      updateCarouselBar(t);
      requestAnimationFrame(rafTick);
    };
    requestAnimationFrame(rafTick);
  }

  function stopAutoplay() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
    if (barFill) barFill.style.width = "0%";
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  if (carousel && viewport) {
    setActiveSlide(0);

    if (nextBtn) nextBtn.addEventListener("click", () => nextSlide(true));
    if (prevBtn) prevBtn.addEventListener("click", () => prevSlide(true));

    if (dotsWrap) {
      dots = $$(".dot", dotsWrap);
      dots.forEach((d) => {
        d.addEventListener("click", () => {
          const go = Number(d.dataset.go || "0");
          setActiveSlide(go, true);
        });
      });
    }

    // Pause on hover/focus for accessibility
    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", startAutoplay);

    // Keyboard controls
    window.addEventListener("keydown", (e) => {
      // Only when carousel is visible-ish
      const rect = carousel.getBoundingClientRect();
      const inView = rect.bottom > 0 && rect.top < window.innerHeight;
      if (!inView) return;

      if (e.key === "ArrowRight") nextSlide(true);
      if (e.key === "ArrowLeft") prevSlide(true);
    });

    startAutoplay();
  }

  // ---------- Gallery filtering ----------
  const galleryGrid = $("#galleryGrid");
  const filterBtns = $$(".filterBtn");

  function normalizeCategoryString(s) {
    return (s || "")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
  }

  function applyGalleryFilter(filter) {
    if (!galleryGrid) return;
    const items = $$(".galleryItem", galleryGrid);

    items.forEach((item) => {
      const categories = normalizeCategoryString(item.dataset.category || "");
      const show = filter === "all" ? true : categories.includes(filter);
      if (show) {
        item.removeAttribute("data-filtered");
      } else {
        item.setAttribute("data-filtered", "out");
      }
    });

    filterBtns.forEach((b) => b.classList.toggle("isActive", b.dataset.filter === filter));
  }

  if (filterBtns.length && galleryGrid) {
    applyGalleryFilter("all");
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const f = btn.dataset.filter || "all";
        applyGalleryFilter(f);
      });
    });
  }

  // ---------- Lightbox ----------
  const lightbox = $("#lightbox");
  const lightboxImg = $("#lightboxImg");
  const lightboxClose = $("#lightboxClose");

  let lightboxSources = [];
  let lightboxIndex = 0;

  function openLightbox(src) {
    if (!lightbox || !lightboxImg) return;
    lightbox.setAttribute("aria-hidden", "false");
    lightbox.classList.add("isOpen");
    lightboxImg.src = src;
    lightboxImg.alt = "Project image";
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox || !lightboxImg) return;
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.classList.remove("isOpen");
    lightboxImg.src = "";
    document.body.style.overflow = "";
  }

  function moveLightbox(delta) {
    if (!lightboxSources.length) return;
    lightboxIndex = (lightboxIndex + delta + lightboxSources.length) % lightboxSources.length;
    const src = lightboxSources[lightboxIndex];
    if (lightboxImg) lightboxImg.src = src;
  }

  if (galleryGrid && lightbox && lightboxImg) {
    const thumbs = $$(".galleryThumb", galleryGrid);

    lightboxSources = thumbs
      .map((t) => t.dataset.lightbox)
      .filter((s) => typeof s === "string" && s.length > 0);

    thumbs.forEach((t) => {
      t.addEventListener("click", () => {
        const src = t.dataset.lightbox || "";
        const idx = lightboxSources.indexOf(src);
        lightboxIndex = idx >= 0 ? idx : 0;
        openLightbox(src);
      });
    });

    if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    window.addEventListener("keydown", (e) => {
      const open = lightbox.classList.contains("isOpen");
      if (!open) return;

      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") moveLightbox(1);
      if (e.key === "ArrowLeft") moveLightbox(-1);
    });
  }

  // ---------- Reviews rail controls ----------
  const reviewRail = $("#reviewRail");
  const reviewPrev = $("#reviewPrev");
  const reviewNext = $("#reviewNext");

  function railStep() {
    if (!reviewRail) return 320;
    const card = $(".reviewCard", reviewRail);
    if (!card) return 320;
    const rect = card.getBoundingClientRect();
    return Math.max(260, Math.round(rect.width + 12));
  }

  function scrollRail(dx) {
    if (!reviewRail) return;
    reviewRail.scrollBy({ left: dx, behavior: "smooth" });
  }

  if (reviewRail) {
    if (reviewPrev) reviewPrev.addEventListener("click", () => scrollRail(-railStep()));
    if (reviewNext) reviewNext.addEventListener("click", () => scrollRail(railStep()));

    // Drag to scroll (mouse)
    let isDown = false;
    let startX = 0;
    let startScroll = 0;

    reviewRail.addEventListener("mousedown", (e) => {
      isDown = true;
      startX = e.pageX;
      startScroll = reviewRail.scrollLeft;
      reviewRail.style.cursor = "grabbing";
    });

    window.addEventListener("mouseup", () => {
      isDown = false;
      if (reviewRail) reviewRail.style.cursor = "";
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDown || !reviewRail) return;
      const dx = e.pageX - startX;
      reviewRail.scrollLeft = startScroll - dx;
    });

    // Keyboard scroll
    reviewRail.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") scrollRail(railStep());
      if (e.key === "ArrowLeft") scrollRail(-railStep());
    });
  }

  // ---------- Contact form (frontend-only) ----------
  const quoteForm = $("#quoteForm");
  const toast = $("#formToast");

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("isShow");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => toast.classList.remove("isShow"), 3800);
  }

  function validateField(el) {
    if (!el) return true;
    const isRequired = el.hasAttribute("required");
    const value = (el.value || "").trim();
    if (!isRequired) return true;
    return value.length > 0;
  }

  function markInvalid(el, invalid) {
    if (!el) return;
    el.style.borderColor = invalid ? "rgba(255,122,45,.95)" : "";
    el.style.boxShadow = invalid ? "0 12px 30px rgba(255,122,45,.22)" : "";
  }

  if (quoteForm) {
    quoteForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const fields = $$("input, select, textarea", quoteForm);
      let ok = true;

      fields.forEach((f) => {
        const valid = validateField(f);
        markInvalid(f, !valid);
        if (!valid) ok = false;
      });

      if (!ok) {
        showToast("Please fill in the required fields.");
        return;
      }

      // Build a WhatsApp-style message (no sending here; just ready)
      const formData = new FormData(quoteForm);
      const name = String(formData.get("name") || "").trim();
      const phone = String(formData.get("phone") || "").trim();
      const area = String(formData.get("area") || "").trim();
      const service = String(formData.get("service") || "").trim();
      const message = String(formData.get("message") || "").trim();

      const msg =
        `Mkhathini Quote Request%0A` +
        `Name: ${encodeURIComponent(name)}%0A` +
        `Phone: ${encodeURIComponent(phone)}%0A` +
        `Area: ${encodeURIComponent(area)}%0A` +
        `Service: ${encodeURIComponent(service)}%0A` +
        `Details: ${encodeURIComponent(message)}`;

      // You can wire this to WhatsApp or email later:
      // const waUrl = `https://wa.me/27746862188?text=${msg}`;

      showToast("Request captured. Call/WhatsApp 074 686 2188 for fastest response.");
      quoteForm.reset();

      // Keep the message available in console for devs
      console.log("Prepared message (URL encoded):", msg);
    });

    // Live validation
    $$("input[required], select[required], textarea[required]", quoteForm).forEach((el) => {
      el.addEventListener("input", () => {
        const valid = validateField(el);
        markInvalid(el, !valid);
      });
      el.addEventListener("change", () => {
        const valid = validateField(el);
        markInvalid(el, !valid);
      });
    });
  }

  // Copy phone button
  const copyBtn = $("#copyPhoneBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const val = copyBtn.dataset.copy || "+27746862188";
      try {
        await navigator.clipboard.writeText(val);
        showToast("Phone number copied.");
      } catch {
        // Fallback
        const temp = document.createElement("input");
        temp.value = val;
        document.body.appendChild(temp);
        temp.select();
        try {
          document.execCommand("copy");
          showToast("Phone number copied.");
        } catch {
          showToast("Copy failed. Please copy manually: " + val);
        }
        document.body.removeChild(temp);
      }
    });
  }
})();
