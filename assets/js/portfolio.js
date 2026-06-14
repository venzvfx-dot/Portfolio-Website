/**
 * portfolio.js
 * ─────────────────────────────────────────────────────────────────
 * Fetches portfolio.json, renders the masonry grid, handles the
 * video modal with watermark, and manages error states.
 *
 * Public API (called from index.html):
 *   Portfolio.build(gridRootEl, driveLinkEl)
 *
 * To add a new project, edit portfolio.json only — no HTML changes needed.
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

const Portfolio = (() => {

  /* ─────────────────────────────────────────────
     WATERMARK CONFIG
     Edit these two values to change appearance.
  ───────────────────────────────────────────── */
  const WATERMARK = {
    src:     'assets/images/watermark.png',
    opacity: 0.25,   // 0 – 1
    margin:  '24px', // CSS value applied to bottom & right
  };

  /* ─────────────────────────────────────────────
     FALLBACK THUMBNAIL
     Inline SVG shown when a thumbnail is missing
     or fails to load. No network request needed.
  ───────────────────────────────────────────── */
  const FALLBACK_THUMB =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' " +
    "width='400' height='300' viewBox='0 0 400 300'%3E" +
    "%3Crect width='400' height='300' fill='%230f0f1a'/%3E" +
    "%3Ccircle cx='200' cy='130' r='28' fill='none' stroke='%23374151' stroke-width='1.5'/%3E" +
    "%3Cpolygon points='191,118 191,142 215,130' fill='%23374151'/%3E" +
    "%3Ctext x='200' y='175' text-anchor='middle' font-family='sans-serif' " +
    "font-size='12' fill='%23374151'%3ENo Preview%3C/text%3E%3C/svg%3E";

  /* ─────────────────────────────────────────────
     SVG ICONS (inline, no external dependency)
  ───────────────────────────────────────────── */
  const SVG_PLAY =
    `<svg viewBox="0 0 24 24" width="18" height="18" fill="white" style="margin-left:3px">` +
    `<polygon points="5 3 19 12 5 21 5 3"/></svg>`;

  const SVG_EXP =
    `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="white" stroke-width="2.2">` +
    `<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`;

  const SVG_EXT =
    `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">` +
    `<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>`;

  const SVG_WARN =
    `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5">` +
    `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>` +
    `<line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  /* ─────────────────────────────────────────────
     ASPECT RATIO → TILE HEIGHT
     Produces visually balanced masonry columns.
     Adjust height values to tune the layout.
  ───────────────────────────────────────────── */
  function calcTileHeight(width, height) {
    if (!width || !height || width <= 0 || height <= 0) return '210px';
    const r = width / height;
    if (r >= 2.0)  return '160px';  // ultra-wide  (21:9, 2:1)
    if (r >= 1.6)  return '195px';  // landscape   (16:9 = 1.78)
    if (r >= 1.2)  return '215px';  // mild-land   (4:3  = 1.33)
    if (r >= 0.9)  return '235px';  // near-square (5:4, 1:1)
    if (r >= 0.7)  return '275px';  // portrait    (4:5  = 0.80)
    return '330px';                  // tall-port   (9:16 = 0.56)
  }

  /* ─────────────────────────────────────────────
     BUILD A SINGLE TILE
  ───────────────────────────────────────────── */
  function buildTile(item, index) {
    const thumb   = item.thumbnail || FALLBACK_THUMB;
    const isVideo = item.type === 'video' && !!item.videoUrl;
    const height  = calcTileHeight(item.width, item.height);

    const tile = document.createElement('div');
    tile.className = 'tile stag';
    tile.style.cssText = `height:${height};animation-delay:${(0.04 * index).toFixed(2)}s`;
    tile.dataset.id = item.id;

    tile.innerHTML =
      `<img src="${thumb}" alt="${escHtml(item.title || '')}" loading="lazy"` +
      ` onerror="this.src='${FALLBACK_THUMB}'"/>` +
      `<div class="tg"></div><div class="tt"></div>` +
      (isVideo
        ? `<div class="tplay"><div class="play-btn">${SVG_PLAY}</div></div>`
        : '') +
      `<div class="texp">${SVG_EXP}</div>` +
      `<div class="tlbl">` +
      `<span class="tlbl-tag">${escHtml(item.category || '')}</span>` +
      `<span class="tlbl-name">${escHtml(item.title || 'Untitled')}</span>` +
      `</div>`;

    tile.addEventListener('click', () => openItem(item));
    return tile;
  }

  /* ─────────────────────────────────────────────
     OPEN ITEM IN LIGHTBOX
     Calls the global openLightbox() defined in index.html.
  ───────────────────────────────────────────── */
  function openItem(item) {
    if (typeof window.openLightbox !== 'function') return;

    if (item.type === 'video' && item.videoUrl) {
      /* Open lightbox first so the media wrap exists in the DOM */
      window.openLightbox({
        tag:   item.category || '',
        label: item.title    || 'Untitled',
        mediaHtml: '<div class="lbv-wrap" id="lbv-active"></div>',
      });

      const wrap = document.getElementById('lbv-active');
      if (!wrap) return;

      /* Build video element in JS so we can attach loadedmetadata */
      const video = document.createElement('video');
      video.src         = item.videoUrl;
      video.controls    = true;
      video.autoplay    = true;
      video.playsInline = true;
      video.preload     = 'metadata';
      video.onerror     = () => Portfolio._onVideoError(video);

      /* Set volume to 10% on every open; ignore errors (some browsers block it) */
      try { video.volume = 0.1; } catch (_) {}

      /* Once dimensions are known, size the wrap to fit the viewport */
      video.addEventListener('loadedmetadata', () => {
        try { video.volume = 0.1; } catch (_) {}
        _sizeWrap(wrap, video.videoWidth, video.videoHeight);
      });

      /* Watermark */
      const wm = document.createElement('img');
      wm.className       = 'video-watermark';
      wm.src             = WATERMARK.src;
      wm.alt             = '';
      wm.draggable       = false;
      wm.style.cssText   =
        `--wm-opacity:${WATERMARK.opacity};--wm-margin:${WATERMARK.margin}`;
      wm.onerror = () => { wm.style.display = 'none'; };

      wrap.appendChild(video);
      wrap.appendChild(wm);

      /* Resize wrap if window is resized while modal is open */
      function onResize() {
        if (video.videoWidth) _sizeWrap(wrap, video.videoWidth, video.videoHeight);
      }
      window.addEventListener('resize', onResize);
      /* Clean up listener when lightbox closes */
      video.addEventListener('emptied', () => window.removeEventListener('resize', onResize));

    } else {
      /* Image or video-less item — show thumbnail fullscreen */
      window.openLightbox({
        tag:   item.category || '',
        label: item.title    || 'Untitled',
        type:  'image',
        src:   item.thumbnail || FALLBACK_THUMB,
      });
    }
  }

  /* Size .lbv-wrap to fit video's natural aspect ratio within the viewport */
  function _sizeWrap(wrap, vw, vh) {
    if (!vw || !vh) return;
    const isMobile   = window.innerWidth < 768;
    const maxW       = isMobile ? window.innerWidth        : window.innerWidth  * 0.90;
    const maxH       = window.innerHeight * 0.90;
    const ratio      = vw / vh;
    let   w          = maxW;
    let   h          = w / ratio;
    if (h > maxH) { h = maxH; w = h * ratio; }
    wrap.style.width  = w + 'px';
    wrap.style.height = h + 'px';
  }

  /* Called via onerror on the <video> element */
  function _onVideoError(videoEl) {
    const wrap = videoEl.closest('.lbv-wrap');
    if (!wrap) return;
    wrap.innerHTML =
      `<div class="lbv-error">` +
      `<div class="lbv-error-icon">${SVG_WARN}</div>` +
      `<span>Video could not be loaded.<br>Please check the file path in portfolio.json.</span>` +
      `</div>`;
  }

  /* ─────────────────────────────────────────────
     RENDER ERROR INSIDE THE GRID CONTAINER
  ───────────────────────────────────────────── */
  function renderGridError(container, message) {
    container.innerHTML =
      `<div style="text-align:center;padding:52px 16px;color:#6b7280;font-size:13px;` +
      `font-family:'DM Sans',sans-serif;line-height:1.7">` +
      `<div style="font-size:30px;margin-bottom:14px;color:#374151">${SVG_WARN}</div>` +
      `<p>${escHtml(message)}</p>` +
      `</div>`;
  }

  /* ─────────────────────────────────────────────
     XSS-SAFE HTML ESCAPING
  ───────────────────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ─────────────────────────────────────────────
     PUBLIC: BUILD THE PORTFOLIO GRID
     Called by buildPortfolio() in index.html.

     @param {HTMLElement} containerEl  — #portfolio-tiles-root
     @param {HTMLElement|null} driveEl — #portfolio-drive-link
  ───────────────────────────────────────────── */
  async function build(containerEl, driveEl) {
    /* Show the masonry wrapper immediately so the page doesn't jump */
    containerEl.innerHTML =
      `<div class="masonry stag" id="portfolio-grid" style="animation-delay:.15s"></div>`;

    let data;
    try {
      const res = await fetch('portfolio.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
      data = await res.json();
    } catch (err) {
      renderGridError(
        containerEl,
        'Could not load portfolio data. Please try again later.'
      );
      console.error('[Portfolio] Failed to fetch portfolio.json:', err);
      return;
    }

    const items = Array.isArray(data.items) ? data.items : [];
    if (items.length === 0) {
      renderGridError(containerEl, 'No portfolio items found in portfolio.json.');
      return;
    }

    const grid = document.getElementById('portfolio-grid');
    items.forEach((item, i) => grid.appendChild(buildTile(item, i)));

    /* Update "View Full Drive" link from JSON if present */
    if (driveEl && data.driveLink) {
      driveEl.href        = data.driveLink;
      driveEl.style.display = '';
    }
  }

  /* Expose _onVideoError so the onerror attribute can call it */
  return { build, _onVideoError };

})();
