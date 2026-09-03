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
});

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

  const open = () => modal.classList.add('is-open');
  const close = () => modal.classList.remove('is-open');

  openBtn.addEventListener('click', open);
  if (cancelBtn) cancelBtn.addEventListener('click', close);

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

  function openLightbox(item) {
    const type = item.dataset.type;
    const src = item.dataset.src;
    const caption = item.dataset.caption || '';

    mediaHost.innerHTML = '';

    if (type === 'image') {
      const img = document.createElement('img');
      img.src = src;
      img.alt = caption;
      mediaHost.appendChild(img);
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
  }

  items.forEach((item) => {
    item.addEventListener('click', () => openLightbox(item));
  });

  closeBtn.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
      closeLightbox();
    }
  });
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
