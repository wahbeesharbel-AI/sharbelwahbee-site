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
          + '<span class="strip-card-date">' + esc(data.album.releaseDateShort || '') + '</span>'
          + '<span class="strip-card-sep">·</span>'
          + '<span class="strip-card-name" style="color:rgba(255,200,120,.9);">' + esc(data.album.title || '') + ' — Full Album</span>'
          + '<a href="' + esc(data.album.link || '#') + '" target="_blank" class="strip-ps-btn" style="color:#ffcc80;border-color:rgba(255,150,60,.5);">' + esc(data.album.linkLabel || 'Notify Me') + ' ↗</a>'
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
        jh += '<div class="comet-tl-item comet-tl-final"><div class="comet-tl-dot final"></div>'
          + '<p class="comet-tl-date">' + esc(data.album.releaseDateMid || '') + ' · Full Album</p>'
          + '<p class="comet-tl-title">' + esc(data.album.title || '') + ' — The Complete Journey</p>'
          + '<p class="comet-tl-sub">All seven songs. The full arc. Available everywhere.</p></div>';
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
