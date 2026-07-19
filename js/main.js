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

const track = document.getElementById('interestCarousel');
const prevBtn = document.getElementById('carouselPrev');
const nextBtn = document.getElementById('carouselNext');

if (track && prevBtn && nextBtn) {
  const scrollAmount = () => track.querySelector('.interest-card').offsetWidth + 24; // card width + gap

  prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
  });

  const updateButtons = () => {
    prevBtn.disabled = track.scrollLeft <= 4;
    nextBtn.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
  };

  track.addEventListener('scroll', updateButtons);
  updateButtons();
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


const track = document.getElementById('interestCarousel');
const prevBtn = document.getElementById('carouselPrev');
const nextBtn = document.getElementById('carouselNext');

if (track && prevBtn && nextBtn) {
  const scrollAmount = () => track.querySelector('.interest-card').offsetWidth + 24; // card width + gap

  prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
  });

  const updateButtons = () => {
    prevBtn.disabled = track.scrollLeft <= 4;
    nextBtn.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
  };

  track.addEventListener('scroll', updateButtons);
  updateButtons();
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
