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
    const marks = [];
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
        this.size = Math.random() * 1.8 + 0.55;
        this.drift = Math.random() * Math.PI * 2;
        this.twinkleOffset = Math.random() * Math.PI * 2;
        this.parallax = Math.random() * 0.035 + 0.01;
        this.shade = Math.floor(Math.random() * 141) + 115;
        this.opacity = Math.random() * 0.48 + 0.2;
        this.trail = [];
        this.trailElapsed = 0;
        this.markDistance = Math.random() * 120;
      }

      update(delta) {
        const previousX = this.x;
        const previousY = this.y;
        this.x += this.velocityX * delta;
        this.y += this.velocityY * delta;
        this.drift += delta * (0.00008 + this.parallax * 0.001);
        this.twinkleOffset += delta * 0.0008;
        this.x += Math.sin(this.drift) * 0.035 * delta;
        this.y += Math.cos(this.drift * 0.7) * 0.025 * delta;

        const wrapped = this.x < -4 || this.x > width + 4 || this.y < -4 || this.y > height + 4;
        if (this.x < -4) this.x = width + 4;
        else if (this.x > width + 4) this.x = -4;
        if (this.y < -4) this.y = height + 4;
        else if (this.y > height + 4) this.y = -4;

        if (wrapped) {
          this.trail.length = 0;
          this.markDistance = 0;
          return;
        }

        const distance = Math.hypot(this.x - previousX, this.y - previousY);
        this.markDistance += distance;
        this.trailElapsed += delta;
        if (this.trailElapsed >= 80) {
          this.trail.push({ x: this.x, y: this.y });
          this.trailElapsed = 0;
          if (this.trail.length > 14) this.trail.shift();
        }

        if (this.markDistance >= 168) {
          marks.push({
            x: this.x,
            y: this.y,
            size: this.size * (0.55 + Math.random() * 0.55),
            shade: this.shade,
            opacity: this.opacity * 0.4,
            age: 0,
            lifetime: 16000 + Math.random() * 12000,
          });
          this.markDistance = 0;
          if (marks.length > 180) marks.shift();
        }
      }

      draw() {
        const twinkle = (Math.sin(this.twinkleOffset) + 1) / 2;
        const x = this.x + pointer.x * this.parallax;
        const y = this.y + pointer.y * this.parallax;
        const radius = this.size * (0.65 + twinkle * 0.65);
        const opacity = this.opacity * (0.55 + twinkle * 0.45);

        if (this.trail.length > 1) {
          context.beginPath();
          this.trail.forEach((point, index) => {
            const trailX = point.x + pointer.x * this.parallax;
            const trailY = point.y + pointer.y * this.parallax;
            if (index === 0) context.moveTo(trailX, trailY);
            else context.lineTo(trailX, trailY);
          });
          context.strokeStyle = `rgba(${this.shade}, ${this.shade}, ${this.shade}, ${opacity * 0.42})`;
          context.lineWidth = Math.max(0.5, this.size * 0.42);
          context.stroke();
        }

        context.fillStyle = `rgba(${this.shade}, ${this.shade}, ${this.shade}, ${opacity})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
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
      const particleCount = mobileLayout.matches ? 140 : 280;
      particles.length = 0;
      while (particles.length < particleCount) particles.push(new OrbParticle());
      marks.length = 0;
    }

    function renderFrame(delta = 16) {
      context.clearRect(0, 0, width, height);
      marks.forEach((mark) => {
        mark.age += delta;
        const opacity = mark.opacity * Math.max(0, 1 - mark.age / mark.lifetime);
        context.fillStyle = `rgba(${mark.shade}, ${mark.shade}, ${mark.shade}, ${opacity})`;
        context.beginPath();
        context.arc(mark.x, mark.y, mark.size, 0, Math.PI * 2);
        context.fill();
      });
      for (let index = marks.length - 1; index >= 0; index--) {
        if (marks[index].age >= marks[index].lifetime) marks.splice(index, 1);
      }

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

    const revealItems = selectors
      .all(".content-category, .bento-card")
      .filter((item) => item.id !== "inventario" && item.id !== "crafteo");
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
      if (window.matchMedia("(max-width: 768px)").matches) return;
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

    const tableBody = table.tBodies[0];
    function syncHeaderWidth() {
      if (!table.tHead || !tableBody) return;
      const scrollbarWidth = tableBody.offsetWidth - tableBody.clientWidth;
      table.style.setProperty("--table-scrollbar-width", `${scrollbarWidth}px`);
    }
    syncHeaderWidth();
    window.addEventListener("resize", syncHeaderWidth, { passive: true });

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
        const icon = candidate.querySelector(".sort-icon");
        if (icon) icon.textContent = "↕";
      });
      header.classList.add(ascending ? "sorted-asc" : "sorted-desc");
      header.setAttribute("aria-sort", ascending ? "ascending" : "descending");
      const sortIcon = header.querySelector(".sort-icon");
      if (sortIcon) sortIcon.textContent = ascending ? "↑" : "↓";
      if (!header.hasAttribute("tabindex")) header.tabIndex = 0;

      const sortedRows = rows
        .map((row, index) => ({
          row,
          index,
          value: normalizeCellText(
            row.cells[cellIndex]?.dataset.sortValue || row.cells[cellIndex]?.textContent || "",
          ),
        }))
        .sort((a, b) => {
          const aMission = a.row.classList.contains("mission-item-classified");
          const bMission = b.row.classList.contains("mission-item-classified");
          if (aMission !== bMission) return aMission ? 1 : -1;

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
    initTableSpoilers();

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

  function initAchievementCatalog() {
    const grid = selectors.one("#logros .achievements-grid");
    if (!grid) return;

    const achievements = [
      ["Primeros auxilios", "Usa un consumible por primera vez.", "ph:first-aid-kit"],
      ["Sin mirar atrás", "Cruza una zona exterior durante la noche.", "ph:moon-stars-fill"],
      ["La luz aguanta", "Completa un tramo con la misma fuente de luz.", "ph:flashlight-fill"],
      ["Manos ocupadas", "Llena todos los espacios del inventario.", "ph:backpack-fill"],
      ["Nada se desperdicia", "Fabrica un objeto usando materiales recogidos.", "ph:hammer-fill"],
      ["Un lugar seguro", "Descansa por primera vez junto a una hoguera.", "ph:campfire-fill"],
      ["Oído atento", "Evita una amenaza guiándote solo por el sonido.", "ph:ear-fill"],
      ["La isla escribe", "Lee una nota que cambie tu interpretación de una zona.", "ph:notebook-fill"],
      ["Punto de referencia", "Consulta el GPS en tres zonas distintas.", "ph:map-pin-fill"],
      ["Grabado en cinta", "Registra una anomalía con la cámara de vídeo.", "ph:video-camera-fill"],
      ["A oscuras", "Sobrevive a un apagón sin recibir daño.", "ph:lightning-slash-fill"],
      ["Paso ligero", "Cruza una zona vigilada sin hacer ruido.", "ph:footprints-fill"],
      ["Manitas", "Repara un dispositivo en una mesa de trabajo.", "ph:wrench-fill"],
      ["Una mano amiga", "Completa una petición de un superviviente.", "ph:handshake-fill"],
      ["Palabra cumplida", "Mantén una promesa hecha a un NPC.", "ph:seal-check-fill"],
      ["La ruta larga", "Visita todas las zonas exteriores.", "ph:signpost-fill"],
      ["Piedra angular", "Reúne materiales de tres categorías distintas.", "ph:shapes-fill"],
      ["Sin dejar rastro", "Escapa de una persecución sin usar objetos arrojadizos.", "ph:person-simple-run-fill"],
      ["Hilo de Ariadna", "Regresa a una zona segura desde las ruinas.", "ph:git-branch-fill"],
      ["El último fósforo", "Enciende una antorcha cuando la luz esté a punto de agotarse.", "ph:fire-fill"],
      ["Voces conocidas", "Escucha todos los mensajes de una grabadora.", "ph:waveform-fill"],
      ["Testigo incómodo", "Registra una aparición y vuelve a verla en el archivo.", "ph:eye-fill"],
      ["Ojos abiertos", "Detecta una pista antes de que aparezca en el diario.", "ph:eye-fill"],
      ["Todo en orden", "Organiza el inventario sin descartar objetos.", "ph:rows-fill"],
      ["Costura de emergencia", "Repara una prenda durante la expedición.", "ph:needle-fill"],
      ["Calor prestado", "Cocina una ración en una hoguera.", "ph:cooking-pot-fill"],
      ["No era el viento", "Sobrevive a tu primer encuentro con una entidad.", "ph:wind-fill"],
      ["Cinta completa", "Reproduce una grabación hasta el final.", "ph:film-strip-fill"],
      ["Trabajo de campo", "Encuentra una pista en cada tipo de zona.", "ph:magnifying-glass-fill"],
      ["La llave correcta", "Abre una puerta cerrada sin romper la ganzúa.", "ph:key-fill"],
      ["Aguanta un poco más", "Termina un capítulo con la Cordura por debajo del 25%.", "ph:heartbeat-fill"],
      ["Sin perder el hilo", "Completa dos objetivos seguidos sin consultar el diario.", "ph:book-open-fill"],
      ["Recuerdo recuperado", "Completa la misión El Peso del Recuerdo.", "ph:ear-fill"],
      ...Array.from({ length: 12 }, () => ({ hidden: true })),
    ];

    achievements.forEach((achievement) => {
      const hidden = achievement.hidden === true;
      const card = document.createElement("div");
      card.className = hidden
        ? "achievement-card achievement-card-hidden"
        : "achievement-card";

      const iconBox = document.createElement("div");
      iconBox.className = "achievement-icon";
      const icon = document.createElement("iconify-icon");
      icon.setAttribute("icon", hidden ? "ph:lock-fill" : achievement[2]);
      icon.setAttribute("aria-hidden", "true");
      iconBox.append(icon);

      const body = document.createElement("div");
      body.className = "achievement-body";
      const name = document.createElement("div");
      name.className = "achievement-name";
      name.textContent = hidden ? "Logro oculto" : achievement[0];
      const description = document.createElement("div");
      description.className = "achievement-desc";
      description.textContent = hidden
        ? "Se revelará al desbloquearlo."
        : achievement[1];
      body.append(name, description);

      const status = document.createElement("div");
      status.className = "achievement-status";
      const statusIcon = document.createElement("iconify-icon");
      statusIcon.setAttribute("icon", hidden ? "ph:lock-fill" : "ph:circle-fill");
      statusIcon.setAttribute("aria-hidden", "true");
      status.append(statusIcon);
      card.append(iconBox, body, status);
      grid.append(card);
    });

    grid.querySelectorAll(".achievement-card-hidden").forEach((card) => grid.append(card));

    const count = grid.querySelectorAll(".achievement-card").length;
    const summary = selectors.one("#logros .achievement-count");
    if (summary) summary.textContent = String(count);
  }

  function initTableSpoilers() {
    const inventoryRows = selectors.all("#inventoryBody tr");
    const craftRows = selectors.all("#craftBody tr");

    function protectCell(cell, label, column) {
      if (!cell || cell.querySelector("details.table-spoiler")) return;
      cell.dataset.sortValue = cell.textContent.trim();

      const details = document.createElement("details");
      details.className = "table-spoiler";
      const summary = document.createElement("summary");
      summary.textContent = label;
      const content = document.createElement("span");
      content.className = "table-spoiler-content";
      content.dataset.column = column;
      while (cell.firstChild) content.append(cell.firstChild);
      details.append(summary, content);
      cell.append(details);
    }

    function protectMissionRow(row) {
      if (row.dataset.spoilerReady === "true") return;
      row.dataset.spoilerReady = "true";
      row.classList.add("mission-item-classified");

      Array.from(row.cells).forEach((cell) => {
        cell.dataset.sortValue = cell.textContent.trim();
        const content = document.createElement("span");
        content.className = "mission-item-content";
        content.setAttribute("aria-hidden", "true");
        content.inert = true;
        while (cell.firstChild) content.append(cell.firstChild);
        cell.append(content);
      });

      const reveal = document.createElement("button");
      reveal.className = "mission-item-reveal";
      reveal.type = "button";
      reveal.setAttribute("aria-expanded", "false");
      const icon = document.createElement("iconify-icon");
      icon.setAttribute("icon", "ph:lock-key-fill");
      icon.setAttribute("aria-hidden", "true");
      reveal.append(icon, document.createTextNode("Contenido de misión · revelar"));
      row.cells[0].prepend(reveal);

      reveal.addEventListener("click", () => {
        row.classList.add("mission-item-revealed");
        row.querySelectorAll(".mission-item-content").forEach((content) => {
          content.setAttribute("aria-hidden", "false");
          content.inert = false;
        });
        reveal.remove();
      });
    }

    inventoryRows.forEach((row) => {
      const category = normalizeSearchText(row.dataset.category || "");
      if (category === "mision") {
        protectMissionRow(row);
        return;
      }
      const detailLabel = ["consumible", "herramienta"].includes(category)
        ? "Ver uso"
        : "Ver descripción";
      protectCell(row.cells[2], detailLabel, "usage");
      protectCell(row.cells[3], "Ver procedencia", "source");
    });

    craftRows.forEach((row) => {
      if (row.cells[0]?.textContent.trim() === "Casco Balsa") {
        protectMissionRow(row);
        return;
      }
      if (normalizeCellText(row.dataset.category || "") === "receta") {
        protectCell(row.cells[2], "Ver ingredientes", "ingredients");
        protectCell(row.cells[3], "Ver desbloqueo", "unlock");
      }
    });

    [selectors.byId("inventoryBody"), selectors.byId("craftBody")].forEach((body) => {
      body?.querySelectorAll(".mission-item-classified").forEach((row) => body.append(row));
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
    const wrappers = selectors.all(".spoiler-wrapper.locked");
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
      const content = wrapper.querySelector(".spoiler-content");
      wrapper.classList.remove("locked");
      wrapper.classList.add("unlocked");
      if (content) {
        content.inert = false;
        content.setAttribute("aria-hidden", "false");
      }
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
        const title = overlay.querySelector(".spoiler-title")?.textContent.trim();
        const message = overlay.querySelector(".spoiler-text")?.textContent.trim();
        const action = overlay.querySelector(".spoiler-btn")?.textContent.trim();
        overlay.setAttribute(
          "aria-label",
          [title, message, action]
            .filter(Boolean)
            .map((part) => part.replace(/[.!?]+$/, ""))
            .join(". ") || "Revelar contenido oculto",
        );
        overlay.setAttribute(
          "aria-expanded",
          String(wrapper.classList.contains("unlocked")),
        );
      }
      const content = wrapper.querySelector(".spoiler-content");
      if (content) {
        content.inert = true;
        content.setAttribute("aria-hidden", "true");
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
    initScrollReveal();
    initHeroParallax();
    initNavigation();
    initTables();
    initAchievementCatalog();
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
