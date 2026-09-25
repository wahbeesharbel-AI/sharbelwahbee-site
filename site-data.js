/* ═══════════════════════════════════════════════════════════════
   site-data.js — SINGLE SOURCE OF TRUTH loader
   ───────────────────────────────────────────────────────────────
   Every page includes this ONE line, just before </body>:
       <script defer src="site-data.js"></script>

   It reads content.json and drives, on whatever page includes it:
     • all [data-c="path"] text (stats, album title, dates…)
     • the release strip           (#strip-releases)
     • the inline player tabs       (#player-tabs / #player-frame)
     • the Comet journey timeline   (#comet-journey)
     • the countdown                (#cd-d / #cd-h / #cd-m / #cd-s, from album.releaseDateISO)
     • the Comet single showcase    (#cs-kicker / #cs-cta, pre-save ↔ live flip)

   Every block is guarded (`if (element exists)`), so the same file is
   safe on pages that don't have all of these sections.

   TO CHANGE THE SITE, EDIT content.json — NOT the HTML.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function asArray(releases) {
    if (!releases) return [];
    return Array.isArray(releases)
      ? releases
      : Object.keys(releases).map(function (k) { return releases[k]; });
  }

  function run(data) {
    var releases = asArray(data.releases);
    var albumLive = ((data.album && data.album.status) || '').toLowerCase() === 'live';
    var isEnglish = (document.documentElement.lang || 'en').toLowerCase().indexOf('en') === 0;

    /* 1 ── [data-c] text fills ─────────────────────────────── */
    var get = function (path) {
      return path.split('.').reduce(function (o, k) { return (o || {})[k]; }, data);
    };
    document.querySelectorAll('[data-c]').forEach(function (el) {
      var val = get(el.getAttribute('data-c'));
      if (val !== undefined && val !== null && typeof val !== 'object') el.textContent = val;
    });

    /* 2 ── Release strip ───────────────────────────────────── */
    var strip = document.getElementById('strip-releases');
    if (strip && releases.length) {
      var html = '';
      releases.forEach(function (r) {
        var link = esc(r.link || '#'), label = esc(r.linkLabel || 'Open'), title = esc(r.title || '');
        var status = (r.status || '').toString().trim().toLowerCase();
        if (status === 'live') {
          html += '<div class="strip-card">'
            + '<span class="strip-live-dot"></span>'
            + '<span class="strip-live-txt">Live</span>'
            + '<span class="strip-card-sep">·</span>'
            + '<span class="strip-card-name">' + title + '</span>'
            + '<a href="' + link + '" target="_blank" class="strip-ps-btn">' + label + ' ↗</a>'
            + '</div>';
        } else {
          html += '<div class="strip-card">'
            + '<span class="strip-card-date">' + esc(r.dateShort || '') + '</span>'
            + '<span class="strip-card-sep">·</span>'
            + '<span class="strip-card-name">' + title + '</span>'
            + '<a href="' + link + '" target="_blank" class="strip-ps-btn">' + label + ' ↗</a>'
            + '</div>';
        }
      });
      if (data.album) {
        html += '<div class="strip-card" style="border-color:rgba(255,100,30,.3);background:rgba(255,69,0,.1);">'
          + (albumLive
              ? '<span class="strip-live-dot"></span><span class="strip-live-txt">Live</span>'
              : '<span class="strip-card-date">' + esc(data.album.releaseDateShort || '') + '</span>')
          + '<span class="strip-card-sep">·</span>'
          + '<span class="strip-card-name" style="color:rgba(255,200,120,.9);">' + esc(data.album.title || '') + ' — Full Album</span>'
          + '<a href="' + esc(data.album.link || '#') + '" target="_blank" class="strip-ps-btn" style="color:#ffcc80;border-color:rgba(255,150,60,.5);">' + esc(data.album.linkLabel || 'Notify Me') + ' ↗</a>'
          + '</div>';
      }
      if (data.nextAlbum) {
        var na = data.nextAlbum;
        var naLang = (document.documentElement.lang || 'en').toLowerCase();
        var naDate = (naLang.indexOf('pt')===0 && na.dateLabelPt) || (naLang.indexOf('es')===0 && na.dateLabelEs) || na.dateLabel || 'TBA';
        html += '<div class="strip-card">'
          + '<span class="strip-card-date">' + esc(naDate) + '</span>'
          + '<span class="strip-card-sep">·</span>'
          + '<span class="strip-card-name">' + esc(na.title || '') + ' — Next Album</span>'
          + '<a href="' + esc(na.link || '#') + '" target="_blank" class="strip-ps-btn">' + esc(na.linkLabel || 'Notify Me') + ' ↗</a>'
          + '</div>';
      }
      strip.innerHTML = html;
    }

    /* 3 ── Player tabs ─────────────────────────────────────── */
    var ptabs = document.getElementById('player-tabs');
    if (ptabs && Array.isArray(data.player) && data.player.length) {
      var ph = '';
      data.player.forEach(function (p, i) {
        if (!p.spotifyAlbumId) return;
        var src = 'https://open.spotify.com/embed/album/' + esc(p.spotifyAlbumId) + '?utm_source=generator&theme=0';
        ph += '<button class="ptab' + (i === 0 ? ' active' : '') + '" data-src="' + src + '">' + esc(p.title || 'Untitled') + '</button>';
      });
      ptabs.innerHTML = ph;
      var frame = document.getElementById('player-frame');
      var first = data.player[0];
      if (frame && first && first.spotifyAlbumId) {
        frame.src = 'https://open.spotify.com/embed/album/' + first.spotifyAlbumId + '?utm_source=generator&theme=0';
      }
      ptabs.querySelectorAll('.ptab').forEach(function (btn) {
        btn.addEventListener('click', function () {
          ptabs.querySelectorAll('.ptab').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          if (frame) frame.src = btn.getAttribute('data-src');
        });
      });
    }

    /* 4 ── Comet journey timeline ──────────────────────────── */
    var journey = document.getElementById('comet-journey');
    if (journey && releases.length) {
      var jh = '';
      releases.forEach(function (r) {
        var status = (r.status || '').toString().trim().toLowerCase();
        var dateLine = esc(r.dateMid || '') + ' · ' + esc(r.single || '');
        if (status === 'live') {
          jh += '<div class="comet-tl-item"><div class="comet-tl-dot" style="border-color:#ffaa5c;box-shadow:0 0 8px rgba(255,170,92,.4);"></div>'
            + '<p class="comet-tl-date" style="color:#ffaa5c;">' + dateLine + ' · Live Now</p>'
            + '<p class="comet-tl-title">' + esc(r.title) + '</p>'
            + '<p class="comet-tl-sub">' + esc(r.journeySub || '') + '</p></div>';
        } else {
          var psLink = '';
          if (status === 'presave' && r.link) {
            psLink = '<a href="' + esc(r.link) + '" target="_blank" style="display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-size:8px;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,120,40,.8);text-decoration:none;border-bottom:1px solid rgba(255,100,30,.25);padding-bottom:1px;">' + esc(r.linkLabel || 'Pre-Save') + ' ↗</a>';
          }
          jh += '<div class="comet-tl-item"><div class="comet-tl-dot"></div>'
            + '<p class="comet-tl-date">' + dateLine + '</p>'
            + '<p class="comet-tl-title">' + esc(r.title) + '</p>'
            + '<p class="comet-tl-sub">' + esc(r.journeySub || '') + '</p>' + psLink + '</div>';
        }
      });
      if (data.album) {
        jh += '<div class="comet-tl-item comet-tl-final"><div class="comet-tl-dot final"' + (albumLive ? ' style="border-color:#ffaa5c;box-shadow:0 0 10px rgba(255,170,92,.5);"' : '') + '></div>'
          + '<p class="comet-tl-date"' + (albumLive ? ' style="color:#ffaa5c;"' : '') + '>' + esc(data.album.releaseDateMid || '') + ' · Full Album' + (albumLive ? ' · Live Now' : '') + '</p>'
          + '<p class="comet-tl-title">' + esc(data.album.title || '') + ' — The Complete Journey</p>'
          + '<p class="comet-tl-sub">All seven songs. The full arc. Available everywhere.</p>'
          + (albumLive && data.album.link ? '<a href="' + esc(data.album.link) + '" target="_blank" style="display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-size:8px;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,120,40,.8);text-decoration:none;border-bottom:1px solid rgba(255,100,30,.25);padding-bottom:1px;">Listen on Spotify ↗</a>' : '')
          + '</div>';
      }
      if (data.nextAlbum) {
        jh += '<div class="comet-tl-item"><div class="comet-tl-dot"></div>'
          + '<p class="comet-tl-date">' + esc(data.nextAlbum.dateLabel || 'TBA') + ' · Next Album</p>'
          + '<p class="comet-tl-title">' + esc(data.nextAlbum.title || '') + '</p>'
          + '<p class="comet-tl-sub">' + esc(data.nextAlbum.journeySub || '') + '</p></div>';
      }
      journey.innerHTML = jh;
    }

    /* 5 ── Countdown (derived from album.releaseDateISO) ────── */
    var cdD = document.getElementById('cd-d');
    if (cdD && data.album && data.album.releaseDateISO) {
      var target = new Date(data.album.releaseDateISO).getTime();
      var cdH = document.getElementById('cd-h'),
          cdM = document.getElementById('cd-m'),
          cdS = document.getElementById('cd-s');
      var pad = function (n) { return String(n).padStart(2, '0'); };
      (function tick() {
        var diff = target - Date.now();
        if (diff <= 0) {
          cdD.textContent = cdH.textContent = cdM.textContent = cdS.textContent = '00';
          return;
        }
        cdD.textContent = pad(Math.floor(diff / 86400000));
        if (cdH) cdH.textContent = pad(Math.floor((diff % 86400000) / 3600000));
        if (cdM) cdM.textContent = pad(Math.floor((diff % 3600000) / 60000));
        if (cdS) cdS.textContent = pad(Math.floor((diff % 60000) / 1000));
        setTimeout(tick, 1000);
      })();
    }

    /* 6 ── Comet single showcase (pre-save ↔ live flip) ────── */
    /* Drives the big featured-single block. The CTA link updates on every
       page; the visible copy updates only on the English page so it never
       overwrites the PT/ES translations. */
    var csCta = document.getElementById('cs-cta');
    if (csCta && data.album && data.album.featuredSingle) {
      var feat = releases.filter(function (r) { return r.id === data.album.featuredSingle; })[0];
      if (feat) {
        var live = (feat.status || '').toLowerCase() === 'live';
        csCta.href = feat.link || '#';
        var kicker = document.getElementById('cs-kicker');
        if (live) {
          if (isEnglish) {
            csCta.textContent = 'Listen on Spotify ↗';
            if (kicker) kicker.textContent = 'First Single · Out Now';
          }
        } else {
          if (isEnglish) {
            csCta.textContent = (feat.linkLabel || 'Pre-Save') + ' ↗';
            if (kicker) kicker.textContent = 'First Single · ' + (feat.dateFull || '');
          }
        }
      }
    }

    /* 7 ── data-r fills: release fields by id ("noise.dateMid") ── */
    var byId = {};
    releases.forEach(function (r) { if (r.id) byId[r.id] = r; });
    var lang = (document.documentElement.lang || 'en').toLowerCase();
    var isPt = lang.indexOf('pt') === 0, isEs = lang.indexOf('es') === 0;
    var locMid = function (r) { return (isPt && r.dateMidPt) || (isEs && r.dateMidEs) || r.dateMid || ''; };
    document.querySelectorAll('[data-r]').forEach(function (el) {
      var parts = el.getAttribute('data-r').split('.');
      var r = byId[parts[0]];
      if (r && parts[1] && r[parts[1]] !== undefined) el.textContent = r[parts[1]];
    });

    /* 8 ── Discography timeline: dates + live flip ([data-tl="id"]) ── */
    var LIVE_BADGE = isPt ? 'Single \u00b7 J\u00e1 Dispon\u00edvel' : isEs ? 'Single \u00b7 Ya Disponible' : 'Single \u00b7 Live Now';
    var LIVE_BADGE_ALBUM = isPt ? '\u00c1lbum \u00b7 J\u00e1 Dispon\u00edvel' : isEs ? '\u00c1lbum \u00b7 Ya Disponible' : 'Album \u00b7 Live Now';
    document.querySelectorAll('[data-tl]').forEach(function (wrap) {
      var id = wrap.getAttribute('data-tl');
      var r = id === 'album' ? null : byId[id];
      var isAlbum = id === 'album';
      var dateEl = wrap.querySelector('.tl-card-date');
      var lockEl = wrap.querySelector('.tl-locked');
      var pillEl = wrap.querySelector('.tl-upcoming-pill');
      var badgeEl = wrap.querySelector('.tl-badge');
      if (isAlbum) {
        var aMid = (isPt && data.album.releaseDateMidPt) || (isEs && data.album.releaseDateMidEs) || data.album.releaseDateMid || '';
        if (dateEl) dateEl.textContent = aMid;
        if (albumLive) {
          if (pillEl) pillEl.remove();
          if (lockEl) lockEl.remove();
          if (badgeEl) badgeEl.textContent = LIVE_BADGE_ALBUM;
        } else if (lockEl) {
          lockEl.textContent = lockEl.textContent.replace(/[0-9].*$/, aMid);
        }
        return;
      }
      if (!r) return;
      var live = (r.status || '').toLowerCase() === 'live';
      if (dateEl) dateEl.textContent = r.dateMid || '';
      if (live) {
        if (pillEl) pillEl.remove();
        if (lockEl) lockEl.remove();
        if (badgeEl) badgeEl.textContent = LIVE_BADGE;
        wrap.classList.remove('sm-upcoming');
      } else if (lockEl) {
        lockEl.textContent = lockEl.textContent.replace(/[0-9].*$/, locMid(r));
      }
    });

    /* 9 ── Sound-map mobile upcoming cards ([data-sm="id"]) ── */
    var OUT_NOW = isPt ? 'J\u00e1 Dispon\u00edvel' : isEs ? 'Ya Disponible' : 'Out Now';
    document.querySelectorAll('[data-sm]').forEach(function (card) {
      var id = card.getAttribute('data-sm');
      var lbl = card.querySelector('.sm-card-upcoming-lbl');
      if (id === 'album') {
        if (lbl) lbl.textContent = albumLive ? OUT_NOW : (data.album.releaseDateMid || '');
        return;
      }
      var r = byId[id];
      if (!r || !lbl) return;
      lbl.textContent = ((r.status || '').toLowerCase() === 'live') ? OUT_NOW : (r.dateMid || '');
    });

    /* 10 ── Desktop sound-map canvas (patch data + redraw) ── */
    if (window.__smReleases && typeof window.__smDraw === 'function') {
      var tsMap = {
        'The Portrait of Us': 'portraitOfUs',
        'You Are My Safe Chaos': 'safeChaos',
        'The Weight of Missing You': 'weightOfMissingYou',
        'Under the Skin of Night': 'underSkinOfNight'
      };
      window.__smReleases.forEach(function (n) {
        var slug = tsMap[n.title];
        if (slug && data.trackStats && data.trackStats[slug]) n.streams = data.trackStats[slug];
        var rel = releases.filter(function (r) { return r.title === n.title || (n.title === 'Comet' && r.id === '__album__'); })[0];
        if (n.title === 'Comet') {
          var monthYear = (data.album.releaseDateMid || '').split(' ').slice(1).join(' ');
          if (albumLive) { n.upcoming = false; n.year = 'Album · ' + monthYear; }
          else { n.year = 'Upcoming ' + monthYear; }
        } else if (rel) {
          var live = (rel.status || '').toLowerCase() === 'live';
          if (n.upcoming && live) { n.upcoming = false; n.year = 'Single \u00b7 ' + (rel.dateMid || '').split(' ').slice(1).join(' '); }
          else if (n.upcoming) { n.year = 'Upcoming ' + (rel.dateMid || '').split(' ').slice(1).join(' '); }
        }
      });
      window.__smDraw();
    }

    /* 11 ── comet.html release timeline ([data-rtl="id"]) ── */
    document.querySelectorAll('[data-rtl]').forEach(function (item) {
      var id = item.getAttribute('data-rtl');
      var dateEl = item.querySelector('.rtl-date');
      var dot = item.querySelector('.rtl-dot');
      if (id === 'album') {
        if (dateEl) dateEl.textContent = (data.album.releaseDateMid || '') + ' \u00b7 Full Album' + (albumLive ? ' \u00b7 Live Now' : '');
        if (albumLive && dateEl) dateEl.classList.add('live-label');
        if (albumLive && dot) dot.classList.add('live');
        return;
      }
      var r = byId[id];
      if (!r || !dateEl) return;
      var live = (r.status || '').toLowerCase() === 'live';
      var line = (r.dateMid || '') + ' \u00b7 ' + (r.single || '');
      if (live) {
        dateEl.textContent = line + ' \u00b7 Live Now';
        dateEl.classList.add('live-label');
        if (dot) dot.classList.add('live');
      } else {
        dateEl.textContent = line;
      }
    });
  }

  function boot() {
    fetch('content.json?v=' + Date.now())
      .then(function (res) { if (!res.ok) throw new Error('no content.json'); return res.json(); })
      .then(run)
      .catch(function () { /* fail silent — hardcoded fallbacks in the HTML stay visible */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
