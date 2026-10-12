(() => {
  "use strict";

  const selectors = {
    all: (selector, root = document) => Array.from(root.querySelectorAll(selector)),
    one: (selector, root = document) => root.querySelector(selector),
    byId: (id) => document.getElementById(id),
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // ============================================================
  // AMBIENTE: PARTÍCULAS ALEATORIAS
  // ============================================================
  function initOrbitCanvas() {
    const canvas = selectors.byId("orbitCanvas");
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const particles = [];
    let width = window.innerWidth;
    let height = window.innerHeight;
    let lastFrameTime = 0;
    const mobileLayout = window.matchMedia("(max-width: 768px)");
    const pointer = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
    };

    class OrbParticle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.velocityX = (Math.random() - 0.5) * 0.035;
        this.velocityY = (Math.random() - 0.5) * 0.035;
        this.size = Math.random() * 1.15 + 0.45;
        this.drift = Math.random() * Math.PI * 2;
        this.twinkleOffset = Math.random() * Math.PI * 2;
        this.parallax = Math.random() * 0.035 + 0.01;
        this.glow = Math.random() < 0.12;
      }

      update(delta) {
        this.x += this.velocityX * delta;
        this.y += this.velocityY * delta;
        this.drift += delta * (0.00008 + this.parallax * 0.001);
        this.twinkleOffset += delta * 0.0008;
        this.x += Math.sin(this.drift) * 0.035 * delta;
        this.y += Math.cos(this.drift * 0.7) * 0.025 * delta;

        if (this.x < -4) this.x = width + 4;
        else if (this.x > width + 4) this.x = -4;
        if (this.y < -4) this.y = height + 4;
        else if (this.y > height + 4) this.y = -4;
      }

      draw() {
        const twinkle = (Math.sin(this.twinkleOffset) + 1) / 2;
        const x = this.x + pointer.x * this.parallax;
        const y = this.y + pointer.y * this.parallax;
        const radius = this.size * (0.65 + twinkle * 0.65);
        const opacity = 0.16 + twinkle * 0.36;

        context.shadowColor = "rgba(235, 235, 240, 0.7)";
        context.shadowBlur = this.glow ? 8 : 0;
        context.fillStyle = `rgba(245, 245, 248, ${opacity})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      }
    }

    function resizeCanvas() {
      width = window.innerWidth;
      height = window.innerHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      resizeParticles();
    }

    function resizeParticles() {
      const particleCount = mobileLayout.matches ? 90 : 190;
      particles.length = 0;
      while (particles.length < particleCount) particles.push(new OrbParticle());
    }

    function renderFrame(delta = 16) {
      context.clearRect(0, 0, width, height);

      if (!reducedMotion.matches) {
        const easing = 1 - Math.pow(0.94, delta / 16);
        pointer.x += (pointer.targetX - pointer.x) * easing;
        pointer.y += (pointer.targetY - pointer.y) * easing;
      }

      particles.forEach((particle) => {
        if (!reducedMotion.matches) particle.update(delta);
        particle.draw();
      });
    }

    let animationFrame = 0;

    function animate(timestamp) {
      animationFrame = 0;
      if (document.hidden || reducedMotion.matches) return;
      const delta = lastFrameTime ? Math.min(timestamp - lastFrameTime, 40) : 16;
      lastFrameTime = timestamp;
      renderFrame(delta);
      animationFrame = window.requestAnimationFrame(animate);
    }

    function stopAnimation() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      lastFrameTime = 0;
    }

    function startAnimation() {
      if (document.hidden) return;
      if (reducedMotion.matches) {
        renderFrame();
        return;
      }
      if (!animationFrame) animationFrame = window.requestAnimationFrame(animate);
    }

    resizeCanvas();
    renderFrame();
    startAnimation();

    window.addEventListener(
      "resize",
      () => {
        resizeCanvas();
        if (reducedMotion.matches) renderFrame();
      },
      { passive: true },
    );
    mobileLayout.addEventListener?.("change", resizeParticles);
    window.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType === "mouse") {
          pointer.targetX = ((event.clientX / width) - 0.5) * 18;
          pointer.targetY = ((event.clientY / height) - 0.5) * 12;
        }
      },
      { passive: true },
    );
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAnimation();
      else startAnimation();
    });

    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", () => {
        if (reducedMotion.matches) {
          stopAnimation();
          renderFrame();
        } else {
          startAnimation();
        }
      });
    }
  }

  // ============================================================
  // APARICIONES VISUALES, SILENCIOSAS Y ESPORÁDICAS
  // ============================================================
  function initHorrorAppearances() {
    if (reducedMotion.matches) return;

    const layer = document.createElement("div");
    layer.className = "horror-ambience";
    layer.setAttribute("aria-hidden", "true");
    document.body.append(layer);

    const icons = [
      {
        className: "horror-omen--apparition",
        paths: [
          "M12 3a8 8 0 0 0-8 8v9l3-2 3 2 2-2 2 2 3-2 3 2v-9a8 8 0 0 0-8-8Z",
          "M9 10h.01M15 10h.01M9 16q3-2 6 0",
        ],
      },
      {
        className: "horror-omen--watcher",
        paths: [
          "M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z",
          "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
        ],
      },
      {
        className: "horror-omen--hand",
        paths: [
          "M8 21v-6.5a1.5 1.5 0 0 1 3 0V7a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v5-2a1.5 1.5 0 0 1 3 0v5.5A5.5 5.5 0 0 1 14.5 24h-2A4.5 4.5 0 0 1 8 21Z",
        ],
      },
      {
        className: "horror-omen--screamer",
        paths: [
          "M12 3a8 8 0 0 0-8 8c0 3 1.3 5.2 3 6.6V21h10v-3.4c1.7-1.4 3-3.6 3-6.6a8 8 0 0 0-8-8Z",
          "M10 11a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM17 11a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM10 17h4m-4 4v-2m2 2v-2m2 2v-2",
        ],
      },
    ];
    let timer = 0;
    let lastAppearance = 0;
    let lastInteraction = 0;

    function appear() {
      if (document.hidden || reducedMotion.matches || Date.now() - lastAppearance < 9000) return;
      lastAppearance = Date.now();

      const roll = Math.random();
      const omen =
        roll > 0.965
          ? icons[3]
          : roll > 0.76
            ? icons[Math.floor(Math.random() * 3)]
            : icons[0];
      const apparition = document.createElement("span");
      const isRare = omen === icons[3];

      apparition.className = `horror-omen ${omen.className}`;
      apparition.style.setProperty("--omen-left", `${8 + Math.random() * 84}%`);
      apparition.style.setProperty("--omen-top", `${12 + Math.random() * 70}%`);
      apparition.style.setProperty("--omen-duration", `${isRare ? 720 : 1900 + Math.random() * 900}ms`);
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("viewBox", "0 0 24 24");
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("focusable", "false");
      omen.paths.forEach((pathData) => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData);
        icon.append(path);
      });
      apparition.append(icon);
      layer.append(apparition);
      window.setTimeout(() => apparition.remove(), isRare ? 900 : 3100);
    }

    function scheduleAppearance() {
      window.clearTimeout(timer);
      if (document.hidden || reducedMotion.matches) return;
      timer = window.setTimeout(() => {
        if (Math.random() > 0.3) appear();
        scheduleAppearance();
      }, 18000 + Math.random() * 22000);
    }

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const meaningfulInteraction = target.closest(
        ".spoiler-overlay, .mission-accordion-header, .idea-list-item, .hero-shortcuts a, #sideNavLinks a",
      );
      if (!meaningfulInteraction || Date.now() - lastInteraction < 12000) return;

      lastInteraction = Date.now();
      if (Math.random() > 0.78) appear();
    });

    document.addEventListener("visibilitychange", scheduleAppearance);
    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", () => {
        if (reducedMotion.matches) {
          window.clearTimeout(timer);
          layer.replaceChildren();
        } else {
          scheduleAppearance();
        }
      });
    }
    scheduleAppearance();
  }

  // ============================================================
  // REVELADO DE TARJETAS AL DESPLAZARSE
  // ============================================================
  function initScrollReveal() {
    const hero = selectors.one(".hero");
    if (hero && !reducedMotion.matches) {
      hero.classList.add("hero-intro-pending");
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          hero.classList.remove("hero-intro-pending");
          hero.classList.add("hero-intro-visible");
        });
      });
    }

    if (!("IntersectionObserver" in window) || reducedMotion.matches) return;

    const revealItems = selectors.all(".content-category, .bento-card");
    if (revealItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove("reveal-pending");
          entry.target.classList.add("reveal-visible");
          currentObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.05 },
    );

    revealItems.forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${(index % 3) * 0.09}s`);
      item.classList.add("reveal-pending");
      observer.observe(item);
    });
  }

  function initHeroParallax() {
    const visual = selectors.one(".hero-visual");
    if (!visual) return;
    const image = selectors.one(".hero-logo-img", visual);
    if (!image) return;

    let animationFrame = 0;
    let lastOffset = "";

    function updateParallax() {
      animationFrame = 0;
      if (reducedMotion.matches) {
        if (lastOffset !== "0px") {
          image.style.setProperty("--hero-parallax-offset", "0px");
          lastOffset = "0px";
        }
        return;
      }

      const bounds = visual.getBoundingClientRect();
      if (bounds.bottom < -80 || bounds.top > window.innerHeight + 80) {
        if (lastOffset !== "0px") {
          image.style.setProperty("--hero-parallax-offset", "0px");
          lastOffset = "0px";
        }
        return;
      }

      const progress = Math.max(
        0,
        Math.min(1, (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height)),
      );
      const offset = `${Math.round((progress - 0.5) * 14)}px`;
      if (offset === lastOffset) return;

      image.style.setProperty("--hero-parallax-offset", offset);
      lastOffset = offset;
    }

    function scheduleParallax() {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updateParallax);
    }

    window.addEventListener("scroll", scheduleParallax, { passive: true });
    window.addEventListener("resize", scheduleParallax, { passive: true });
    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", scheduleParallax);
    }
    scheduleParallax();
  }

  // ============================================================
  // NAVEGACIÓN LATERAL, BÚSQUEDA Y RESALTADO DE DESTINO
  // ============================================================
  const navigation = {
    drawer: selectors.byId("sideNav"),
    overlay: selectors.byId("navOverlay"),
    trigger: selectors.one(".menu-trigger"),
    search: selectors.byId("navSearch"),
    count: selectors.byId("navResultCount"),
    emptyState: selectors.one(".side-nav-empty"),
    links: selectors.all("#sideNavLinks a"),
    groups: selectors.all(".side-nav-group"),
    previousBodyOverflow: "",
    openFocusFrame: 0,
    pulseTimers: new WeakMap(),
  };

  function setNavigationOpen(isOpen, { restoreFocus = true } = {}) {
    const { drawer, overlay, trigger, search } = navigation;
    if (!drawer || !overlay || !trigger || drawer.classList.contains("open") === isOpen) {
      return;
    }

    drawer.classList.toggle("open", isOpen);
    overlay.classList.toggle("open", isOpen);
    drawer.setAttribute("aria-hidden", String(!isOpen));
    overlay.setAttribute("aria-hidden", String(!isOpen));
    trigger.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) {
      navigation.previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      window.cancelAnimationFrame(navigation.openFocusFrame);
      navigation.openFocusFrame = window.requestAnimationFrame(() => {
        if (drawer.classList.contains("open")) search?.focus();
      });
      return;
    }

    window.cancelAnimationFrame(navigation.openFocusFrame);
    document.body.style.overflow = navigation.previousBodyOverflow;
    if (restoreFocus) trigger.focus();
  }

  function normalizeSearchText(value) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .trim();
  }

  function filterNavigation() {
    const { search, links, groups, count, emptyState } = navigation;
    if (!search || !count || !emptyState) return;

    const query = normalizeSearchText(search.value);
    let visibleCount = 0;

    links.forEach((link) => {
      const text = normalizeSearchText(`${link.textContent} ${link.dataset.search || ""}`);
      link.hidden = !text.includes(query);
      if (!link.hidden) visibleCount++;
    });

    groups.forEach((group) => {
      group.hidden = !group.querySelector("a:not([hidden])");
    });

    emptyState.hidden = visibleCount > 0;
    count.textContent = `${visibleCount} ${visibleCount === 1 ? "sección" : "secciones"}`;
  }

  function setCurrentSection(sectionId) {
    navigation.links.forEach((link) => {
      if (link.hash === `#${sectionId}`) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function pulseNavigationTarget(target) {
    const previousTimer = navigation.pulseTimers.get(target);
    if (previousTimer) window.clearTimeout(previousTimer);

    target.classList.remove("pulse-warning");
    void target.offsetWidth;
    target.classList.add("pulse-warning");

    const timer = window.setTimeout(() => {
      target.classList.remove("pulse-warning");
      navigation.pulseTimers.delete(target);
    }, 2500);
    navigation.pulseTimers.set(target, timer);
  }

  function initNavigation() {
    const { drawer, overlay, trigger, search, links } = navigation;
    if (!drawer || !overlay || !trigger) return;

    trigger.addEventListener("click", () => setNavigationOpen(true));
    overlay.addEventListener("click", () => setNavigationOpen(false));
    drawer.querySelector(".close-btn")?.addEventListener("click", () => setNavigationOpen(false));
    search?.addEventListener("input", filterNavigation);
    filterNavigation();

    links.forEach((link) => {
      link.addEventListener("click", () => {
        setNavigationOpen(false, { restoreFocus: false });
        const target = document.querySelector(link.hash);
        if (!target) return;

        window.setTimeout(() => pulseNavigationTarget(target), 600);
      });
    });

    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        if (drawer.classList.contains("open")) search?.focus();
        else setNavigationOpen(true);
        return;
      }

      if (!drawer.classList.contains("open")) return;
      if (event.key === "Escape") {
        setNavigationOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        drawer.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), a:not([hidden])',
        ),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    });

    if (!("IntersectionObserver" in window)) return;

    const observedSections = links
      .map((link) => document.querySelector(link.hash))
      .filter((section) => section instanceof HTMLElement);

    const currentHashTarget = window.location.hash
      ? document.querySelector(window.location.hash)
      : null;
    if (currentHashTarget) setCurrentSection(currentHashTarget.id);

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (active) setCurrentSection(active.target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 0.1, 0.25, 0.5] },
    );

    observedSections.forEach((section) => sectionObserver.observe(section));
  }

  window.toggleNav = (forceOpen) => {
    const isOpen =
      typeof forceOpen === "boolean"
        ? forceOpen
        : !navigation.drawer?.classList.contains("open");
    setNavigationOpen(isOpen);
  };

  // ============================================================
  // TABLAS: FILTROS, CONTADORES Y ORDENACIÓN
  // ============================================================
  function normalizeCellText(value) {
    return value.trim().toLocaleLowerCase("es");
  }

  function initFilterableTable({ filterId, bodyId, tableId, countId, columns }) {
    const filterContainer = selectors.byId(filterId);
    const body = selectors.byId(bodyId);
    const table = selectors.byId(tableId);
    const count = countId ? selectors.byId(countId) : null;
    if (!filterContainer || !body || !table) return;

    const rows = Array.from(body.rows);
    const filterButtons = Array.from(filterContainer.querySelectorAll("[data-filter]"));

    function applyFilter(activeButton) {
      const category = activeButton?.dataset.filter || "all";
      let visibleRows = 0;

      filterButtons.forEach((button) => {
        const active = button === activeButton;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });

      rows.forEach((row) => {
        const rowCategory = row.dataset.category || "";
        const matches =
          category === "all" || normalizeCellText(rowCategory) === normalizeCellText(category);
        row.hidden = !matches;
        if (matches) visibleRows++;
      });

      if (count) count.textContent = String(visibleRows);
    }

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => applyFilter(button));
    });
    applyFilter(
      filterButtons.find((button) => button.classList.contains("active")) ||
        filterButtons[0],
    );

    const headers = Array.from(table.querySelectorAll("th.sortable[data-sort]"));
    const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });
    let sortState = { column: null, ascending: true };
    headers.forEach((header) => {
      if (!header.hasAttribute("tabindex")) header.tabIndex = 0;
    });

    function sortBy(header) {
      const column = header.dataset.sort;
      const cellIndex = columns[column];
      if (cellIndex === undefined) return;

      const ascending = sortState.column === column ? !sortState.ascending : true;
      sortState = { column, ascending };

      headers.forEach((candidate) => {
        candidate.classList.remove("sorted-asc", "sorted-desc");
        candidate.removeAttribute("aria-sort");
      });
      header.classList.add(ascending ? "sorted-asc" : "sorted-desc");
      header.setAttribute("aria-sort", ascending ? "ascending" : "descending");
      if (!header.hasAttribute("tabindex")) header.tabIndex = 0;

      const sortedRows = rows
        .map((row, index) => ({
          row,
          index,
          value: normalizeCellText(row.cells[cellIndex]?.textContent || ""),
        }))
        .sort((a, b) => {
          const comparison = collator.compare(a.value, b.value);
          return comparison === 0
            ? a.index - b.index
            : ascending
              ? comparison
              : -comparison;
        });

      sortedRows.forEach(({ row }) => body.appendChild(row));
    }

    headers.forEach((header) => {
      header.addEventListener("click", () => sortBy(header));
      header.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        sortBy(header);
      });
    });
  }

  function initTables() {
    initFilterableTable({
      filterId: "inventoryFilters",
      bodyId: "inventoryBody",
      tableId: "inventoryTable",
      countId: "visibleCount",
      columns: { item: 0, category: 1, use: 2, source: 3 },
    });

    initFilterableTable({
      filterId: "craftFilters",
      bodyId: "craftBody",
      tableId: "craftTable",
      countId: "craftVisibleCount",
      columns: { name: 0, category: 1, detail: 2, extra: 3 },
    });
  }

  // ============================================================
  // PESTAÑAS: HABILIDADES Y DISEÑO DE NIVELES
  // ============================================================
  function initTabs({ tabId, panelSelector, datasetKey }) {
    const tabContainer = selectors.byId(tabId);
    if (!tabContainer) return;

    const tabs = Array.from(tabContainer.querySelectorAll(`[data-${datasetKey}]`));
    const panels = selectors.all(panelSelector);
    if (tabs.length === 0 || panels.length === 0) return;

    function activateTab(tab) {
      const value = tab.dataset[datasetKey];
      const activePanel = panels.find((panel) => panel.dataset[datasetKey] === value);
      if (!activePanel) return;

      tabs.forEach((candidate) => {
        const active = candidate === tab;
        candidate.classList.toggle("active", active);
        candidate.setAttribute("aria-pressed", String(active));
        candidate.tabIndex = active ? 0 : -1;
      });

      panels.forEach((panel) => {
        const active = panel === activePanel;
        panel.classList.toggle("active", active);
        panel.hidden = !active;
      });
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => activateTab(tab));
      tab.addEventListener("keydown", (event) => {
        const index = tabs.indexOf(tab);
        let nextIndex = index;

        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          nextIndex = (index + 1) % tabs.length;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          nextIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = tabs.length - 1;
        } else {
          return;
        }

        event.preventDefault();
        tabs[nextIndex].focus();
        activateTab(tabs[nextIndex]);
      });
    });
    activateTab(tabs.find((tab) => tab.classList.contains("active")) || tabs[0]);
  }

  function initInteractiveTabs() {
    initTabs({
      tabId: "skillTabs",
      panelSelector: "#habilidades .skill-branch[data-branch]",
      datasetKey: "branch",
    });
    initTabs({
      tabId: "levelTabs",
      panelSelector: "#niveles .skill-branch[data-level]",
      datasetKey: "level",
    });
  }

  // ============================================================
  // ACORDEONES DE MISIONES
  // ============================================================
  function initMissionAccordions() {
    selectors.all(".mission-accordion").forEach((accordion, index) => {
      const header = accordion.querySelector(".mission-accordion-header");
      const body = accordion.querySelector(".mission-accordion-body");
      if (!header || !body) return;

      if (!body.id) body.id = `mission-accordion-panel-${index + 1}`;
      header.setAttribute("aria-controls", body.id);
      header.setAttribute("aria-expanded", String(accordion.classList.contains("open")));

      header.addEventListener("click", () => {
        const isOpen = accordion.classList.toggle("open");
        header.setAttribute("aria-expanded", String(isOpen));
      });
    });
  }

  // ============================================================
  // SELECTOR INTERACTIVO DE LAS 65 IDEAS
  // ============================================================
  function initIdeaSelector() {
    const list = selectors.one(".ideas-list-scroll");
    const items = selectors.all(".idea-list-item");
    const details = selectors.all(".idea-detail-item");
    if (!list || items.length === 0 || details.length === 0) return;

    const detailById = new Map(details.map((detail) => [detail.dataset.idea, detail]));

    function selectIdea(item) {
      const detail = detailById.get(item.dataset.idea);
      if (!detail) return;

      items.forEach((candidate) => {
        const active = candidate === item;
        candidate.classList.toggle("active", active);
        candidate.setAttribute("aria-pressed", String(active));
        candidate.tabIndex = active ? 0 : -1;
      });

      details.forEach((candidate) => {
        const active = candidate === detail;
        candidate.classList.toggle("active", active);
        candidate.hidden = !active;
      });
    }

    items.forEach((item) => {
      item.tabIndex = item.classList.contains("active") ? 0 : -1;
      item.setAttribute("role", "button");
      item.setAttribute("aria-pressed", String(item.classList.contains("active")));
    });
    details.forEach((detail) => {
      detail.hidden = !detail.classList.contains("active");
    });

    list.addEventListener("click", (event) => {
      const item = event.target.closest(".idea-list-item");
      if (item && list.contains(item)) selectIdea(item);
    });
    list.addEventListener("keydown", (event) => {
      const item = event.target.closest(".idea-list-item");
      if (!item || !list.contains(item)) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectIdea(item);
        return;
      }

      let nextIndex = items.indexOf(item);
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        nextIndex = (nextIndex + 1) % items.length;
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        nextIndex = (nextIndex - 1 + items.length) % items.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = items.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      items[nextIndex].focus();
      selectIdea(items[nextIndex]);
    });
  }

  // ============================================================
  // SPOILERS Y ADAPTACIÓN DEL OVERLAY
  // ============================================================
  function initSpoilers() {
    const wrappers = selectors.all(".spoiler-wrapper");
    if (wrappers.length === 0) return;

    function updateLayout(wrapper) {
      const overlay = wrapper.querySelector(".spoiler-overlay");
      if (!overlay) return;

      const { width, height } = wrapper.getBoundingClientRect();
      const isWide = width > height * 2.5 || (width > 700 && height < 300);
      overlay.classList.toggle("horizontal", isWide);
    }

    let layoutFrame = 0;
    function scheduleLayout() {
      if (layoutFrame) return;
      layoutFrame = window.requestAnimationFrame(() => {
        layoutFrame = 0;
        wrappers.forEach(updateLayout);
      });
    }

    document.addEventListener("click", (event) => {
      const overlay = event.target.closest(".spoiler-overlay");
      if (!overlay) return;

      const wrapper = overlay.closest(".spoiler-wrapper");
      if (!wrapper || wrapper.classList.contains("unlocked")) return;
      wrapper.classList.remove("locked");
      wrapper.classList.add("unlocked");
      overlay.setAttribute("aria-hidden", "true");
      overlay.setAttribute("aria-expanded", "true");
      scheduleLayout();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const overlay = event.target.closest(".spoiler-overlay[role='button']");
      if (!overlay) return;
      event.preventDefault();
      overlay.click();
    });

    wrappers.forEach((wrapper) => {
      const overlay = wrapper.querySelector(".spoiler-overlay");
      if (overlay) {
        overlay.tabIndex = 0;
        overlay.setAttribute("role", "button");
        overlay.setAttribute("aria-label", "Revelar contenido marcado como spoiler");
        overlay.setAttribute(
          "aria-expanded",
          String(wrapper.classList.contains("unlocked")),
        );
      }
    });

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(scheduleLayout);
      wrappers.forEach((wrapper) => resizeObserver.observe(wrapper));
    } else {
      window.addEventListener("resize", scheduleLayout, { passive: true });
    }

    scheduleLayout();
  }

  // ============================================================
  // PROTECCIÓN DE IMÁGENES
  // ============================================================
  function initImageProtection() {
    document.addEventListener("dragstart", (event) => {
      if (event.target instanceof Element && event.target.closest("img")) {
        event.preventDefault();
      }
    });

    document.addEventListener("contextmenu", (event) => {
      if (event.target instanceof Element && event.target.closest("img")) {
        event.preventDefault();
      }
    });
  }

  // ============================================================
  // FOOTER
  // ============================================================
  function initFooter() {
    const year = selectors.byId("footerYear");
    const currentYear = String(new Date().getFullYear());
    if (year) year.textContent = currentYear;
    selectors.all("[data-current-year]").forEach((element) => {
      element.textContent = currentYear;
    });

    selectors.byId("footerOpenIndex")?.addEventListener("click", () => {
      setNavigationOpen(true);
    });
  }

  // ============================================================
  // RASTRO DE BORDE EN HOVER
  // ============================================================
  function initHoverBorderTrails() {
    const cards = selectors.all(
      ".bento-card, .skill-card, .mini-card, .core-item, .mission-card, " +
        ".mission-secondary-item, .mission-tl-body, .mission-hidden-item, " +
        ".punish-card, .npc-profile, .trust-level, .subconscious-card, " +
        ".achievement-card, .achievement-card-hidden, .save-feature, " +
        ".save-feature-gold, .idea-list-item",
    );

    cards.forEach((card) => {
      const trail = document.createElement("span");
      trail.className = "border-trail";
      trail.setAttribute("aria-hidden", "true");
      trail.append(document.createElement("span"));
      card.append(trail);
    });
  }

  // ============================================================
  // COMPORTAMIENTO DE APERTURA DE PORTADA EN MÓVILES
  // ============================================================
  function initMobileHeroLock() {
    if (window.innerWidth > 768 || window.scrollY > 10) return;
    if (!selectors.one(".hero") || !selectors.one(".bento-grid")) return;

    const body = document.body;
    let locked = true;
    body.classList.add("hero-locked");

    function unlock({ scrollToContent = true } = {}) {
      if (!locked) return;
      locked = false;
      body.classList.remove("hero-locked");
      window.removeEventListener("wheel", handleIntent);
      window.removeEventListener("touchmove", handleIntent);
      window.removeEventListener("keydown", handleKeydown);

      if (scrollToContent) {
        selectors.one(".bento-grid")?.scrollIntoView({
          behavior: reducedMotion.matches ? "auto" : "smooth",
          block: "start",
        });
      }
    }

    function handleIntent(event) {
      if (event.target instanceof Element && event.target.closest("#sideNav")) return;
      unlock();
    }

    function handleKeydown(event) {
      if (event.target instanceof HTMLElement && event.target.closest("#sideNav")) return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("a, button, input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }
      if (["ArrowDown", "PageDown", " ", "Spacebar"].includes(event.key)) unlock();
    }

    document.addEventListener(
      "click",
      (event) => {
        if (event.target instanceof Element && event.target.closest('a[href^="#"]')) {
          unlock({ scrollToContent: false });
        }
      },
      { once: true, capture: true },
    );

    window.addEventListener("wheel", handleIntent, { passive: true });
    window.addEventListener("touchmove", handleIntent, { passive: true });
    window.addEventListener("keydown", handleKeydown);
  }

  // ============================================================
  // ARRANQUE
  // ============================================================
  function init() {
    initOrbitCanvas();
    initHorrorAppearances();
    initScrollReveal();
    initHeroParallax();
    initNavigation();
    initTables();
    initInteractiveTabs();
    initMissionAccordions();
    initIdeaSelector();
    initSpoilers();
    initImageProtection();
    initFooter();
    initHoverBorderTrails();
    initMobileHeroLock();
  }

  init();
})();
