const root = document.documentElement;
const themeButtons = document.querySelectorAll(".theme-toggle");
const menuButton = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
const copyButton = document.querySelector("[data-copy]");
const certificateDialog = document.querySelector("[data-certificate-dialog]");
const certificateCards = document.querySelectorAll(".cert-pdf-card, [data-certificate-preview]");
const recommendationDialog = document.querySelector("[data-recommendation-dialog]");
const recommendationCards = document.querySelectorAll("[data-recommendation-card]");
const githubDotGraph = document.querySelector(".github-dot-graph");
const githubActivityCount = document.querySelector(".github-activity-count");
const soundToggleButtons = document.querySelectorAll("[data-sound-toggle]");
const themes = ["system", "light", "dark"];
const soundStorageKey = "sanity-interface-sounds-v2";
let interfaceSoundsEnabled = localStorage.getItem(soundStorageKey) !== "false";
let audioContext;

window.lucide?.createIcons({ attrs: { "aria-hidden": "true", focusable: "false" } });

function getAudioContext() {
  if (audioContext) return audioContext;
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return null;
  audioContext = new Context();
  return audioContext;
}

function playTone(context, frequency, duration, volume, offset = 0, glideTo) {
  const start = context.currentTime + offset;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  if (glideTo) oscillator.frequency.exponentialRampToValueAtTime(glideTo, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function playNoise(context, frequency, duration, volume, offset = 0) {
  const start = context.currentTime + offset;
  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  data.forEach((_, index) => { data[index] = Math.random() * 2 - 1; });
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = 1.5;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(gain).connect(context.destination);
  source.start(start);
}

function playInterfaceSound(kind = "chime") {
  if (!interfaceSoundsEnabled) return;
  const context = getAudioContext();
  if (!context) return;

  const play = () => {
    if (kind === "tick") playNoise(context, 5400, 0.018, 0.035);
    if (kind === "press") playNoise(context, 1700, 0.02, 0.04);
    if (kind === "release") { playNoise(context, 4600, 0.016, 0.035); playTone(context, 3200, 0.045, 0.01, 0.006); }
    if (kind === "toggle") { playNoise(context, 2200, 0.016, 0.035); playNoise(context, 3800, 0.02, 0.028, 0.024); }
    if (kind === "droplet") playTone(context, 1200, 0.16, 0.045, 0, 550);
    if (kind === "bloom") { playTone(context, 528, 0.28, 0.035); playTone(context, 540, 0.3, 0.025); }
    if (kind === "success") { playTone(context, 880, 0.09, 0.038); playTone(context, 1108.73, 0.1, 0.038, 0.06); playTone(context, 1318.51, 0.16, 0.04, 0.12); }
    if (kind === "chime") { playTone(context, 1046.5, 0.2, 0.04); playTone(context, 1568, 0.24, 0.035, 0.09); }
  };

  if (context.state === "running") play();
  else context.resume().then(play).catch(() => {});
}

function updateSoundControls() {
  soundToggleButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(interfaceSoundsEnabled));
    button.setAttribute("aria-label", interfaceSoundsEnabled ? "Mute interface sounds" : "Enable interface sounds");
    button.title = interfaceSoundsEnabled ? "Sounds on" : "Sounds off";
    button.querySelector("[data-sound-on]")?.toggleAttribute("hidden", !interfaceSoundsEnabled);
    button.querySelector("[data-sound-off]")?.toggleAttribute("hidden", interfaceSoundsEnabled);
  });
}

function setInterfaceSounds(enabled, announce = false) {
  interfaceSoundsEnabled = enabled;
  localStorage.setItem(soundStorageKey, String(enabled));
  updateSoundControls();
  if (enabled && announce) playInterfaceSound("chime");
}

window.siteSound = { play: playInterfaceSound, setEnabled: setInterfaceSounds, isEnabled: () => interfaceSoundsEnabled };

function storedTheme() {
  return localStorage.getItem("sanity-theme") || "system";
}

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem("sanity-theme", theme);
}

function cycleTheme(event) {
  const current = root.dataset.theme || storedTheme();
  const nextTheme = themes[(themes.indexOf(current) + 1) % themes.length];
  const trigger = event?.currentTarget;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const applyTheme = () => setTheme(nextTheme);

  trigger?.classList.add("is-theme-switching");
  window.setTimeout(() => trigger?.classList.remove("is-theme-switching"), 400);

  if (!reducedMotion && typeof document.startViewTransition === "function") {
    const bounds = trigger?.getBoundingClientRect();
    if (bounds) {
      root.style.setProperty("--theme-reveal-x", `${bounds.left + bounds.width / 2}px`);
      root.style.setProperty("--theme-reveal-y", `${bounds.top + bounds.height / 2}px`);
    }

    document.startViewTransition(applyTheme).finished.finally(() => {
      root.style.removeProperty("--theme-reveal-x");
      root.style.removeProperty("--theme-reveal-y");
    });
  } else {
    applyTheme();
  }

  playInterfaceSound("toggle");
}

function closeMenu() {
  if (!mobileMenu || !menuButton) return;
  mobileMenu.hidden = true;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "open menu");
}

function toggleMenu() {
  if (!mobileMenu || !menuButton) return;
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  mobileMenu.hidden = isOpen;
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "open menu" : "close menu");
}

function openCertificate(card) {
  if (!certificateDialog || typeof certificateDialog.showModal !== "function") return;

  const title = card.querySelector("h3, .cert-main strong");
  const issuer = card.querySelector(".cert-pdf-meta span, .cert-main > span");
  const date = card.querySelector("time");
  const preview = card.querySelector(".cert-pdf-frame, .cert-featured-image");
  const links = card.querySelectorAll(".cert-pdf-actions a");
  const dialogTitle = certificateDialog.querySelector("#certificate-dialog-title");
  const dialogIssuer = certificateDialog.querySelector(".certificate-dialog-issuer");
  const dialogImage = certificateDialog.querySelector(".certificate-dialog-image");
  const pdfLink = certificateDialog.querySelector(".certificate-dialog-pdf");
  const verifyLink = certificateDialog.querySelector(".certificate-dialog-verify");

  if (!title || !issuer || !preview || !dialogTitle || !dialogIssuer || !dialogImage || !pdfLink || !verifyLink) return;

  dialogTitle.textContent = title.textContent;
  dialogIssuer.textContent = `${issuer.textContent} | ${date ? date.textContent : ""}`;
  dialogImage.src = preview.currentSrc || preview.src;
  dialogImage.alt = preview.alt;
  pdfLink.href = card.dataset.pdfUrl || (card.matches("[data-certificate-preview]") ? card.href : links[0]?.href) || "#";
  verifyLink.href = card.dataset.verifyUrl || links[1]?.href || "#";
  certificateDialog.showModal();
  playInterfaceSound("bloom");
  certificateDialog.querySelector(".certificate-dialog-close")?.focus();
}

function closeDialogWithAnimation(dialog) {
  if (!dialog?.open || dialog.dataset.closing) return;

  dialog.dataset.closing = "true";
  dialog.classList.add("is-closing");
  playInterfaceSound("droplet");
  window.setTimeout(() => {
    dialog.close();
    dialog.classList.remove("is-closing");
    delete dialog.dataset.closing;
  }, 180);
}

setTheme(storedTheme());
updateSoundControls();

function renderGithubGraph(weeks) {
  if (!githubDotGraph) return;

  githubDotGraph.replaceChildren();
  weeks.slice(-53).forEach((week) => {
    week.contributionDays.forEach((day) => {
      const dot = document.createElement("span");
      const levels = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 2, FOURTH_QUARTILE: 3 };

      dot.className = "github-dot";
      dot.dataset.level = String(levels[day.contributionLevel] ?? 0);
      githubDotGraph.append(dot);
    });
  });
}

function renderGithubFallback() {
  const levels = ["NONE", "FIRST_QUARTILE", "SECOND_QUARTILE", "THIRD_QUARTILE", "FOURTH_QUARTILE"];
  const weeks = Array.from({ length: 53 }, (_, week) => ({
    contributionDays: Array.from({ length: 7 }, (_, day) => {
      const seed = Math.abs(Math.sin((week + 1) * 12.9898 + (day + 1) * 78.233) * 43758.5453) % 1;
      const activePeriod = (week >= 2 && week <= 8) || (week >= 15 && week <= 20) || (week >= 23 && week <= 38) || (week >= 42 && week <= 51);
      const threshold = week >= 23 && week <= 38 ? 0.26 : 0.48;
      const level = !activePeriod || seed < threshold ? 0 : Math.min(4, Math.ceil((seed - threshold) * 6));

      return { contributionLevel: levels[level] };
    }),
  }));

  renderGithubGraph(weeks);
}

async function loadGithubActivity() {
  if (!githubDotGraph) return;

  try {
    const response = await fetch("/api/github-contributions");
    if (!response.ok) return;

    const calendar = await response.json();
    renderGithubGraph(calendar.weeks);

    if (githubActivityCount) {
      githubActivityCount.textContent = `${calendar.totalContributions.toLocaleString()} contributions in the last year`;
    }
  } catch {
    // The section keeps its fallback snapshot when the private API is unavailable.
  }
}

renderGithubFallback();
loadGithubActivity();

themeButtons.forEach((button) => button.addEventListener("click", cycleTheme));

soundToggleButtons.forEach((button) => {
  button.addEventListener("click", () => setInterfaceSounds(!interfaceSoundsEnabled, true));
});

let lastHoverSoundAt = 0;
document.addEventListener("pointerover", (event) => {
  if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const target = event.target.closest("a[href], button:not([disabled]), [role=button], [tabindex=\"0\"]");
  if (!target || target.contains(event.relatedTarget) || target.matches("[data-sound-toggle]")) return;
  const now = performance.now();
  if (now - lastHoverSoundAt < 150) return;
  lastHoverSoundAt = now;
  playInterfaceSound("tick");
});

document.addEventListener("pointerdown", (event) => {
  const target = event.target.closest("a[href], button:not([disabled]), [role=button], [tabindex=\"0\"]");
  if (target && !target.matches("[data-sound-toggle], .theme-toggle")) playInterfaceSound("press");
});

document.addEventListener("pointerup", (event) => {
  const target = event.target.closest("a[href], button:not([disabled]), [role=button], [tabindex=\"0\"]");
  if (target && !target.matches("[data-sound-toggle], .theme-toggle")) playInterfaceSound("release");
});

if (menuButton) {
  menuButton.addEventListener("click", toggleMenu);
}

if (mobileMenu) {
  mobileMenu.addEventListener("click", (event) => {
    if (event.target.matches("a")) closeMenu();
  });
}

function scrollToReadingPosition(target, behavior) {
  const top = target.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.28;
  window.scrollTo({ top: Math.max(0, top), behavior });
}

document.querySelectorAll('.rail-nav-plain a[href="#projects"], .rail-nav-plain a[href="#experience"], .mobile-menu a[href="#projects"], .mobile-menu a[href="#experience"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;

    event.preventDefault();
    window.history.pushState(null, "", link.getAttribute("href"));
    scrollToReadingPosition(target, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
  });
});

window.addEventListener("load", () => {
  const target = document.querySelector(window.location.hash);
  if (target?.matches("#projects, #experience")) {
    window.requestAnimationFrame(() => scrollToReadingPosition(target, "auto"));
  }
});

certificateCards.forEach((card) => {
  const isPreview = card.matches("[data-certificate-preview]");
  const cardTitle = card.querySelector("h3, .cert-main strong")?.textContent || "certificate";
  if (!isPreview) {
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open ${cardTitle}`);
  }
  card.addEventListener("click", (event) => {
    if (isPreview) {
      event.preventDefault();
      openCertificate(card);
    } else if (!event.target.closest("a")) {
      openCertificate(card);
    }
  });
  if (!isPreview) card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openCertificate(card);
    }
  });
});

if (certificateDialog) {
  certificateDialog.querySelector(".certificate-dialog-close")?.addEventListener("click", () => closeDialogWithAnimation(certificateDialog));
  certificateDialog.addEventListener("click", (event) => {
    if (event.target === certificateDialog) closeDialogWithAnimation(certificateDialog);
  });
  certificateDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialogWithAnimation(certificateDialog);
  });
}

recommendationCards.forEach((card) => {
  card.addEventListener("click", () => {
    if (recommendationDialog?.showModal) {
      recommendationDialog.showModal();
      playInterfaceSound("bloom");
      recommendationDialog.querySelector(".recommendation-dialog-close")?.focus();
    }
  });
});

if (recommendationDialog) {
  recommendationDialog.querySelector(".recommendation-dialog-close")?.addEventListener("click", () => closeDialogWithAnimation(recommendationDialog));
  recommendationDialog.addEventListener("click", (event) => {
    if (event.target === recommendationDialog) closeDialogWithAnimation(recommendationDialog);
  });
  recommendationDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialogWithAnimation(recommendationDialog);
  });
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

if (copyButton) {
  copyButton.addEventListener("click", async () => {
    const value = copyButton.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
      copyButton.textContent = "Copied";
      playInterfaceSound("success");
      window.setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1800);
    } catch {
      copyButton.textContent = "Copy failed";
      playInterfaceSound("droplet");
    }
  });
}
