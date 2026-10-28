// ---------------------------------------------------------------------------
// Sticky nav — adds a hairline border once the page has scrolled
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.site-nav');
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // -------------------------------------------------------------------------
  // Mobile nav toggle
  // -------------------------------------------------------------------------
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close the mobile menu once a link is chosen (e.g. a same-page anchor
    // like "#carbon-layup"), so it doesn't stay open over the page.
    links.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // -------------------------------------------------------------------------
  // Scroll-reveal — fade + rise elements marked with class "reveal"
  // -------------------------------------------------------------------------
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  }

  initLightbox();
  initJustifiedGalleries();
  initResumeModal();
  initHashCentering();
  initContactForm();
  initFooterYear();
  initFigRows();
  initAnalyticsEvents();
});

// ---------------------------------------------------------------------------
// Footer year — keeps the copyright year current without manual edits.
// ---------------------------------------------------------------------------
function initFooterYear() {
  const currentYear = String(new Date().getFullYear());
  document.querySelectorAll('.site-footer p').forEach((p) => {
    p.innerHTML = p.innerHTML.replace(/\b(19|20)\d{2}\b/, currentYear);
  });
}

// ---------------------------------------------------------------------------
// Analytics helper — safely sends a GA4 custom event. No-ops if gtag isn't
// loaded (e.g. an ad blocker stripped it), so this never breaks the page.
// ---------------------------------------------------------------------------
function trackEvent(name, params) {
  if (typeof gtag === 'function') {
    gtag('event', name, params || {});
  }
}

// ---------------------------------------------------------------------------
// Extra engagement events GA4 doesn't pick up automatically:
// mailto: clicks aren't counted as "outbound clicks" by Enhanced Measurement
// (they're not cross-origin http links), so they need an explicit event.
// ---------------------------------------------------------------------------
function initAnalyticsEvents() {
  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    link.addEventListener('click', () => {
      trackEvent('contact_click', { method: 'email' });
    });
  });
}

// ---------------------------------------------------------------------------
// Contact form — submits to Web3Forms (https://web3forms.com) via fetch, so
// the page never reloads. Free, no backend required: just paste your own
// access key into the hidden "access_key" input in contact.html.
// ---------------------------------------------------------------------------
function initContactForm() {
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('contact-form-status');
  if (!form || !statusEl) return;

  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';
    statusEl.textContent = '';
    statusEl.classList.remove('form-status--success', 'form-status--error');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      const result = await response.json();

      if (result.success) {
        form.reset();
        statusEl.textContent = "Thanks — your message is on its way. I'll get back to you soon.";
        statusEl.classList.add('form-status--success');
        trackEvent('generate_lead', { event_category: 'contact_form' });
      } else {
        throw new Error(result.message || 'Submission failed.');
      }
    } catch (err) {
      statusEl.textContent = 'Sorry, something went wrong sending that — please email me directly at lucahawtin@gmail.com instead.';
      statusEl.classList.add('form-status--error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
}

// ---------------------------------------------------------------------------
// Résumé download-confirmation modal
// ---------------------------------------------------------------------------
function initResumeModal() {
  const modal = document.getElementById('resume-modal');
  const openBtn = document.getElementById('resume-download-btn');
  if (!modal || !openBtn) return;

  const cancelBtn = document.getElementById('resume-modal-cancel');
  const downloadLink = modal.querySelector('a[download]');

  const open = () => {
    modal.classList.add('is-open');
    trackEvent('resume_modal_open');
  };
  const close = () => modal.classList.remove('is-open');

  openBtn.addEventListener('click', open);
  if (cancelBtn) cancelBtn.addEventListener('click', close);
  if (downloadLink) {
    downloadLink.addEventListener('click', () => {
      trackEvent('resume_download', { file_name: 'luca_hawtin_resume.pdf' });
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
}

// ---------------------------------------------------------------------------
// Justified gallery layout
// Packs each gallery's photos/videos into rows that fill the full container
// width with one shared height per row (a "justified" layout, like a
// contact sheet) — instead of independent columns, which end at uneven
// heights. Depends on each thumbnail's real aspect ratio, so it runs once
// thumbnails have loaded, and relayouts on resize.
// ---------------------------------------------------------------------------
function initJustifiedGalleries() {
  const galleries = document.querySelectorAll('.gallery');
  if (!galleries.length) return;

  function getEntries(gallery) {
    return Array.from(gallery.querySelectorAll('.gallery-item')).map((item) => {
      const img = item.querySelector('img');
      const ar = (img && img.naturalWidth && img.naturalHeight)
        ? img.naturalWidth / img.naturalHeight
        : 1.5;
      return { item, ar };
    });
  }

  function layoutGallery(gallery, entries) {
    const gap = 6;
    const containerWidth = gallery.clientWidth;
    if (!containerWidth || !entries.length) return;

    const targetRowHeight = window.innerWidth < 640 ? 200
      : window.innerWidth < 1000 ? 260
      : 320;

    const rows = [];
    let row = [];
    let rowAspectSum = 0;

    entries.forEach((entry) => {
      row.push(entry);
      rowAspectSum += entry.ar;
      const widthAtTarget = rowAspectSum * targetRowHeight + (row.length - 1) * gap;
      if (widthAtTarget >= containerWidth) {
        rows.push({ row, rowAspectSum });
        row = [];
        rowAspectSum = 0;
      }
    });
    if (row.length) rows.push({ row, rowAspectSum, isLast: true });

    gallery.innerHTML = '';
    gallery.classList.add('is-justified');

    rows.forEach(({ row, rowAspectSum, isLast }) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'gallery-row';
      const totalGap = (row.length - 1) * gap;
      let rowHeight = (containerWidth - totalGap) / rowAspectSum;
      if (isLast) {
        // don't let a sparse final row blow up in height
        rowHeight = Math.min(rowHeight, targetRowHeight * 1.35);
      }
      rowDiv.style.height = rowHeight + 'px';
      row.forEach(({ item, ar }) => {
        // Flex-grow ratios (rather than computed pixel widths) let the
        // browser's own flex math fill the row exactly, with no
        // float-rounding overflow.
        item.style.flexGrow = ar;
        item.style.flexBasis = '0%';
        item.style.minWidth = '0';
        rowDiv.appendChild(item);
      });
      gallery.appendChild(rowDiv);
    });
  }

  galleries.forEach((gallery) => {
    const items = Array.from(gallery.querySelectorAll('.gallery-item'));
    if (!items.length) return;

    const ready = items.map((item) => {
      const img = item.querySelector('img');
      return new Promise((resolve) => {
        if (!img) { resolve(); return; }
        if (img.complete && img.naturalWidth) {
          resolve();
        } else {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        }
      });
    });

    Promise.all(ready).then(() => {
      gallery.dataset.ready = 'true';
      layoutGallery(gallery, getEntries(gallery));
    });
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      galleries.forEach((gallery) => {
        if (gallery.dataset.ready === 'true') {
          layoutGallery(gallery, getEntries(gallery));
        }
      });
    }, 150);
  });
}

// ---------------------------------------------------------------------------
// Gallery lightbox
// Works on any page that includes elements with class "gallery-item" and a
// matching <div class="lightbox" id="lightbox"> ... </div> markup block.
// Each gallery-item button carries data attributes:
//   data-type    = "image" | "video" | "pdf" | "youtube"
//   data-src     = path to the full-size asset
//   data-caption = text shown under the enlarged media
// ---------------------------------------------------------------------------
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const mediaHost = lightbox.querySelector('.lightbox-media');
  const captionEl = lightbox.querySelector('.lightbox-caption');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const items = document.querySelectorAll('.gallery-item');

  // Zoom buttons are built here rather than in every page's markup; they
  // are only shown while an image is open.
  const zoomBar = document.createElement('div');
  zoomBar.className = 'lightbox-zoom';
  zoomBar.innerHTML =
    '<button type="button" data-zoom="out" aria-label="Zoom out">&minus;</button>' +
    '<button type="button" data-zoom="reset" aria-label="Reset zoom">100%</button>' +
    '<button type="button" data-zoom="in" aria-label="Zoom in">+</button>';
  lightbox.querySelector('.lightbox-inner').appendChild(zoomBar);
  const zoomLabel = zoomBar.querySelector('[data-zoom="reset"]');
  let zoom = null; // controls for the image currently open, if any

  zoomBar.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || !zoom) return;
    if (btn.dataset.zoom === 'in') zoom.step(1.5);
    if (btn.dataset.zoom === 'out') zoom.step(1 / 1.5);
    if (btn.dataset.zoom === 'reset') zoom.reset();
  });

  function openLightbox(item) {
    const type = item.dataset.type;
    const src = item.dataset.src;
    const caption = item.dataset.caption || '';

    mediaHost.innerHTML = '';
    zoom = null;
    lightbox.classList.toggle('is-image', type === 'image');

    if (type === 'image') {
      const img = document.createElement('img');
      img.src = src;
      img.alt = caption;
      img.draggable = false;
      mediaHost.appendChild(img);
      zoom = attachZoom(img, mediaHost, (scale) => {
        zoomLabel.textContent = `${Math.round(scale * 100)}%`;
      });
    } else if (type === 'video') {
      const video = document.createElement('video');
      video.src = src;
      video.controls = true;
      video.autoplay = true;
      mediaHost.appendChild(video);
    } else if (type === 'pdf') {
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.title = caption || 'PDF preview';
      mediaHost.appendChild(iframe);
    } else if (type === 'youtube') {
      const iframe = document.createElement('iframe');

      // 1. Extract the 11-character video ID from ANY YouTube link format
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = src.match(regExp);
      const videoId = (match && match[2].length === 11) ? match[2] : null;

      if (videoId) {
        // 2. Build the exact privacy-safe embed link YouTube demands
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
      } else {
        // Fallback just in case the link was already an embed layout
        iframe.src = src + '?autoplay=1';
      }

      iframe.title = caption || 'YouTube video player';
      iframe.setAttribute('frameborder', '0');

      // 3. Keep the security clearances active
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');

      mediaHost.appendChild(iframe);
    }

    captionEl.textContent = caption;
    lightbox.classList.add('is-open');
    closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    mediaHost.innerHTML = '';
    zoom = null;
  }

  items.forEach((item) => {
    item.addEventListener('click', () => openLightbox(item));
  });

  closeBtn.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (!zoom) return;
    if (e.key === '+' || e.key === '=') zoom.step(1.5);
    if (e.key === '-') zoom.step(1 / 1.5);
    if (e.key === '0') zoom.reset();
  });
}

// ---------------------------------------------------------------------------
// Zoom and pan for an image in the lightbox: scroll wheel or pinch zooms
// towards the pointer, double-click toggles between fit and 2.5x, and
// dragging pans once zoomed in. Returns { step, reset } for the buttons.
// ---------------------------------------------------------------------------
function attachZoom(img, host, onChange) {
  const MAX_SCALE = 6;
  let scale = 1;
  let x = 0;
  let y = 0;
  const pointers = new Map();
  let pinch = null; // { dist, scale } when two fingers are down
  let drag = null;  // { px, py, x, y } when one pointer is panning

  function apply(animate) {
    img.style.transition = animate ? 'transform 0.2s ease' : 'none';
    img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    img.classList.toggle('is-zoomed', scale > 1);
    onChange(scale);
  }

  // stop the image being panned past its own edges
  function clamp() {
    const box = host.getBoundingClientRect();
    const maxX = Math.max(0, (img.offsetWidth * scale - box.width) / 2);
    const maxY = Math.max(0, (img.offsetHeight * scale - box.height) / 2);
    x = Math.min(maxX, Math.max(-maxX, x));
    y = Math.min(maxY, Math.max(-maxY, y));
  }

  // zoom so the point under (cx, cy) stays where it is on screen
  function zoomAt(next, cx, cy, animate) {
    next = Math.min(MAX_SCALE, Math.max(1, next));
    const box = host.getBoundingClientRect();
    const px = cx - (box.left + box.width / 2);
    const py = cy - (box.top + box.height / 2);
    x = px - (px - x) * (next / scale);
    y = py - (py - y) * (next / scale);
    scale = next;
    clamp();
    apply(animate);
  }

  function zoomAtCentre(next, animate) {
    const box = host.getBoundingClientRect();
    zoomAt(next, box.left + box.width / 2, box.top + box.height / 2, animate);
  }

  host.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomAt(scale * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY, false);
  }, { passive: false });

  img.addEventListener('dblclick', (e) => {
    zoomAt(scale > 1 ? 1 : 2.5, e.clientX, e.clientY, true);
  });

  function distance() {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function startDrag() {
    const [p] = [...pointers.values()];
    drag = p ? { px: p.x, py: p.y, x, y } : null;
  }

  img.addEventListener('pointerdown', (e) => {
    img.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      pinch = { dist: distance(), scale };
      drag = null;
    } else {
      startDrag();
    }
  });

  img.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      zoomAt(pinch.scale * (distance() / pinch.dist), (a.x + b.x) / 2, (a.y + b.y) / 2, false);
    } else if (drag && scale > 1) {
      x = drag.x + (e.clientX - drag.px);
      y = drag.y + (e.clientY - drag.py);
      clamp();
      img.classList.add('is-dragging');
      apply(false);
    }
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    img.classList.remove('is-dragging');
    if (pointers.size < 2) pinch = null;
    startDrag(); // a finger left on the screen after a pinch keeps panning
  }

  img.addEventListener('pointerup', endPointer);
  img.addEventListener('pointercancel', endPointer);

  apply(false);

  return {
    step: (factor) => zoomAtCentre(scale * factor, true),
    reset: () => zoomAtCentre(1, true),
  };
}

// ---------------------------------------------------------------------------
// Center-scroll anchor targets — e.g. following a `#carbon-layup` link
// lands the target in the vertical center of the screen, not jammed
// under the fixed nav at the very top. When a target sits too close to
// the top of the document to physically reach center (the browser can't
// scroll past 0), a brief highlight flash marks it instead.
// ---------------------------------------------------------------------------
function scrollHashToCenter(hash, behavior) {
  const id = decodeURIComponent((hash || '').replace('#', ''));
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;

  // Work out the absolute document position the page would need to
  // scroll to in order to put this target dead-center in the viewport.
  const rect = target.getBoundingClientRect();
  const rectTopAbsolute = rect.top + window.scrollY;
  const idealScrollY = rectTopAbsolute - (window.innerHeight / 2 - rect.height / 2);

  // If that ideal position is at or above the very top of the page (as
  // it is for the first row of cards, right under the header), the
  // browser can't scroll any further up to compensate — it'll just clamp
  // to 0, which looks identical to the old "jump to top" behavior. In
  // that case, skip the scroll entirely and rely on the flash alone.
  if (idealScrollY > 0) {
    target.scrollIntoView({ behavior, block: 'center', inline: 'nearest' });
  }

  // Give the target a brief highlight so it's obvious which item was
  // linked to, whether or not any scrolling happened.
  target.classList.remove('anchor-flash'); // restart if triggered twice
  void target.offsetWidth; // force reflow so the animation replays
  target.classList.add('anchor-flash');
  target.addEventListener('animationend', () => {
    target.classList.remove('anchor-flash');
  }, { once: true });
}

function initHashCentering() {
  function handleInitialHash(behavior) {
    if (!window.location.hash) return;
    window.scrollTo(0, 0);
    scrollHashToCenter(window.location.hash, behavior);
  }

  if (window.location.hash) {
    history.scrollRestoration = 'manual';
    // Cancel the browser's own instant top-jump immediately; the real
    // centering happens once we know the page has actually rendered
    // (see the 'load' and 'pageshow' listeners below).
    window.scrollTo(0, 0);
  }

  // Normal, fresh navigation to a page that already has a hash in the URL.
  window.addEventListener('load', () => handleInitialHash('auto'));

  // Fires on every visit, including when the browser restores the page
  // from the back/forward cache (bfcache) instead of reloading it — which
  // 'load' does NOT fire for. Without this, centering only ever works the
  // first time a page is visited.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      handleInitialHash('auto');
    }
  });

  // Any hash link clicked while already on the page (in-page anchors).
  document.querySelectorAll('a[href*="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      let url;
      try {
        url = new URL(link.getAttribute('href'), window.location.href);
      } catch {
        return;
      }
      const samePage = url.pathname === window.location.pathname;
      if (samePage && url.hash) {
        e.preventDefault();
        if (url.hash === window.location.hash) {
          // Hash is unchanged from the current URL (e.g. clicking the
          // same link twice) — pushState wouldn't trigger anything new,
          // so just re-run the scroll/flash directly.
          scrollHashToCenter(url.hash, 'smooth');
        } else {
          history.pushState(null, '', url.hash);
          scrollHashToCenter(url.hash, 'smooth');
        }
      }
    });
  });

  // Catch-all for hash changes not caused by the click handler above,
  // e.g. the browser's native back/forward navigation between hash states.
  window.addEventListener('hashchange', () => {
    if (window.location.hash) scrollHashToCenter(window.location.hash, 'smooth');
  });
}

/* A photo beside a paragraph: scale the photo (never crop it) so it is exactly as
   tall as the text next to it. Each figure carries its aspect ratio in --ar. */
function initFigRows() {
  const rows = Array.from(document.querySelectorAll('.fig-row'));
  if (!rows.length) return;
  const narrow = window.matchMedia('(max-width: 700px)');

  const layout = () => {
    rows.forEach((row) => {
      const fig = row.querySelector('.inline-fig');
      const text = row.querySelector('.fig-text');
      if (!fig || !text) return;
      if (narrow.matches) {
        row.style.removeProperty('--fw');
        row.style.minHeight = '';
        fig.style.height = '';
        fig.style.alignSelf = '';
        return;
      }
      const ar = parseFloat(fig.style.getPropertyValue('--ar')) || 1.333;
            const rowW = row.clientWidth;
      const minW = rowW * 0.42; // never smaller than this
      const maxW = rowW * 0.55;
      let w = rowW * 0.36;
      for (let i = 0; i < 5; i++) {
        row.style.setProperty('--fw', w + 'px');
        const h = text.getBoundingClientRect().height;
        const next = Math.max(minW, Math.min(h * ar, maxW));
        if (Math.abs(next - w) < 1) break;
        w = next;
      }
      row.style.setProperty('--fw', w + 'px');
      // the photo can't always match the text exactly without cropping: if the
      // width is capped, centre the (shorter) photo beside the text; if the text
      // is very short, let the row grow to fit the photo instead
      const h = text.getBoundingClientRect().height;
      const photoH = w / ar;
      row.style.minHeight = photoH > h ? photoH + 'px' : '';
      if (photoH < h - 1) {
        fig.style.height = photoH + 'px';
        fig.style.alignSelf = 'center';
      } else {
        fig.style.height = '';
        fig.style.alignSelf = '';
      }
    });
  };

  layout();
  window.addEventListener('load', layout);
  window.addEventListener('resize', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
}
