/**
 * portfolio.js
 * Fetches portfolio.json and renders the masonry grid.
 * Depends on: openLightbox(item) defined in index.html
 */

'use strict';

const Portfolio = (() => {

  const FALLBACK_THUMB = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%230f0f1a"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="13" fill="%23374151"%3ENo preview%3C/text%3E%3C/svg%3E';

  const SVG_PLAY = `<svg viewBox="0 0 24 24" width="18" height="18" fill="white" style="margin-left:3px"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
  const SVG_EXP  = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="white" stroke-width="2.2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`;
  const SVG_EXT  = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>`;

  /** Converts any recognisable video URL into an embeddable iframe src. */
  function toEmbedUrl(url) {
    if (!url) return null;

    // Google Drive: .../file/d/<ID>/view  →  .../file/d/<ID>/preview
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;

    // YouTube: watch?v=<ID> or youtu.be/<ID>  →  embed/<ID>
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;

    // Vimeo: vimeo.com/<ID>  →  player.vimeo.com/video/<ID>
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;

    // Already an embed URL or direct video file — use as-is
    return url;
  }

  function buildTile(item, index) {
    const thumb   = item.thumbnail || FALLBACK_THUMB;
    const isVideo = item.type === 'video' && !!item.videoUrl;
    const height  = item.height || '200px';

    const tile = document.createElement('div');
    tile.className = 'tile stag';
    tile.style.cssText = `height:${height};animation-delay:${(0.04 * index).toFixed(2)}s`;
    tile.dataset.id = item.id;

    tile.innerHTML = `
      <img src="${thumb}" alt="${item.title || ''}" loading="lazy" onerror="this.src='${FALLBACK_THUMB}'"/>
      <div class="tg"></div>
      <div class="tt"></div>
      ${isVideo ? `<div class="tplay"><div class="play-btn">${SVG_PLAY}</div></div>` : ''}
      <div class="texp">${SVG_EXP}</div>
      <div class="tlbl">
        <span class="tlbl-tag">${item.category || ''}</span>
        <span class="tlbl-name">${item.title || 'Untitled'}</span>
      </div>`;

    tile.addEventListener('click', () => {
      const embedUrl = isVideo ? toEmbedUrl(item.videoUrl) : null;
      // openLightbox is defined globally in index.html
      window.openLightbox({
        tag:    item.category || '',
        label:  item.title    || 'Untitled',
        type:   item.type,
        src:    embedUrl || item.thumbnail || FALLBACK_THUMB,
        drive:  !!(item.videoUrl && item.videoUrl.includes('drive.google.com') && embedUrl),
      });
    });

    return tile;
  }

  function renderError(container, message) {
    container.innerHTML = `
      <div style="text-align:center;padding:48px 16px;color:#6b7280;font-size:13px;">
        <div style="font-size:28px;margin-bottom:12px;">⚠️</div>
        <p>${message}</p>
      </div>`;
  }

  async function build(containerEl, driveEl) {
    containerEl.innerHTML = `
      <div class="masonry stag" id="portfolio-grid" style="animation-delay:.15s"></div>`;

    let data;
    try {
      const res = await fetch('portfolio.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (err) {
      renderError(containerEl, 'Could not load portfolio data. Please try again later.');
      console.error('[Portfolio] fetch failed:', err);
      return;
    }

    const items = Array.isArray(data.items) ? data.items : [];
    if (items.length === 0) {
      renderError(containerEl, 'No portfolio items found.');
      return;
    }

    const grid = document.getElementById('portfolio-grid');
    items.forEach((item, i) => grid.appendChild(buildTile(item, i)));

    // Update the "View Full Drive" link if element provided
    if (driveEl && data.driveLink) {
      driveEl.href = data.driveLink;
      driveEl.style.display = '';
    }
  }

  return { build };
})();
