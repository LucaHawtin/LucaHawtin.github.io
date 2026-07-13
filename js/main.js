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
});

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
      iframe.src = src + '?autoplay=1'; 
      iframe.title = caption || 'YouTube video player';
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('allowfullscreen', 'true');
      mediaHost.appendChild(iframe);
    }

    // --- These were the missing lines ---
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
