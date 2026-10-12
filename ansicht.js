/* ansicht.js — zeichnet den Turnierbaum und das Seitenblatt. Rechnet nichts selbst:
 * alle Plätze kommen aus logik.js, alle Angaben aus daten.js.
 */
(function () {
  'use strict';

  var T = window.TURNIER;
  var erg = window.TurnierLogik.berechne(T);
  var ALS_DATEI = location.protocol === 'file:';

  // Linien wie auf der Vorlage gezeichnet. Sie sind Zierde: wer wohin kommt, steht in
  // daten.js unter „besetzung“ und kann von diesen Linien abweichen (H1 bekommt Q1, Q3, Q5, Q7).
  var LINIEN = [
    ['F1', ['H1', 'H2', 'H3', 'H4']],
    ['H1', ['Q1', 'Q2']],
    ['H2', ['Q3', 'Q4']],
    ['H3', ['Q5', 'Q6']],
    ['H4', ['Q7', 'Q8']]
  ];
  var PLATZ_WORT = { 1: 'Erster', 2: 'Zweiter', 3: 'Dritter', 4: 'Vierter', 5: 'Fünfter' };
  var OFFEN = '<span class="offen">noch offen</span>';

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function $(id) { return document.getElementById(id); }
  function teilnehmer(name) {
    for (var i = 0; i < T.teilnehmer.length; i++) if (T.teilnehmer[i].name === name) return T.teilnehmer[i];
    return null;
  }
  function zahl(n, einheit) { return n == null ? einheit + ' ' + OFFEN : n + ' ' + einheit; }
  function kanalKurz(url) { var m = /\/(@[^/?#]+)/.exec(url || ''); return m ? m[1] : url; }
  function ytLink(id) { return 'https://www.youtube.com/watch?v=' + encodeURIComponent(id); }

  // ------------------------------------------------------------------ Kopf, Fuß, Hinweise
  function kopf() {
    document.title = T.kurz + ' Turnierbaum';
    $('titel').textContent = T.kurz + ' · Turnierbaum';
    $('kopfzeile').innerHTML = esc(T.titel) + ' · Stand ' + esc(T.stand) +
      ' · <a href="' + esc(T.kanal) + '" target="_blank" rel="noopener">Kanal auf YouTube</a>';
    $('modus').innerHTML = ALS_DATEI
      ? 'Als Datei geöffnet: Ein Klick aufs Video öffnet YouTube. <b>Zum Abspielen hier: starten.cmd doppelklicken.</b>'
      : 'Videos spielen direkt in der Seite. Auf einen Namen oder einen Gruppenkopf klicken.';
    $('fuss').textContent = (T.oeffentlich
      ? 'Inoffizielle Übersicht, nicht vom EPC-Team · Daten aus den öffentlichen EPC-Playlists'
      : 'EPC - Turnierbaum · Prototyp') +
      ' · Daten Stand ' + T.stand + ' · Plätze werden aus den Punkten gerechnet';
    var h = $('hinweise');
    if (erg.hinweise.length) {
      h.innerHTML = '<b>Datenprüfung: ' + erg.hinweise.length + ' Hinweis' +
        (erg.hinweise.length > 1 ? 'e' : '') + '</b><ul>' +
        erg.hinweise.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      h.hidden = false;
    } else {
      h.hidden = true;
    }
  }

  // ------------------------------------------------------------------ Baum
  function zeileHtml(gr, z) {
    var klasse = 'zeile' + (z.weiter ? ' weiter' : '');
    var tag = z.herkunft
      ? '<span class="herkunft" title="' + esc(PLATZ_WORT[z.herkunft.platz] + ' ' + z.herkunft.gruppe) + '">' +
        z.herkunft.platz + '. ' + esc(z.herkunft.gruppe) + '</span>'
      : '';
    if (z.teilnehmer) {
      return '<li class="' + klasse + '" data-name="' + esc(z.teilnehmer.name) + '">' +
        '<button type="button" class="name" data-name="' + esc(z.teilnehmer.name) + '" title="' +
        esc(z.teilnehmer.name) + '">' + tag + esc(z.teilnehmer.name) + '</button></li>';
    }
    var text = 'noch offen';
    if (z.herkunft) {
      text = PLATZ_WORT[z.herkunft.platz] + ' ' + z.herkunft.gruppe + ' · noch offen';
      var quelle = erg.gruppen[z.herkunft.gruppe];
      if (quelle && quelle.gleichstand) text += ' (Gleichstand)';
    }
    return '<li class="' + klasse + ' leer"><span class="offen">' + esc(text) + '</span></li>';
  }

  function gruppeHtml(gid) {
    var gr = erg.gruppen[gid];
    return '<section class="gruppe" data-gruppe="' + esc(gid) + '">' +
      '<h2 class="gruppe-kopf"><button type="button" class="gruppe-knopf" data-gruppe="' + esc(gid) + '">Gruppe ' +
      esc(gid) + '</button></h2><ol class="zeilen">' +
      gr.zeilen.map(function (z) { return zeileHtml(gr, z); }).join('') + '</ol></section>';
  }

  function siegerHtml() {
    var s = erg.sieger;
    var zeile = s
      ? '<li class="zeile" data-name="' + esc(s.name) + '"><button type="button" class="name" data-name="' +
        esc(s.name) + '">' + esc(s.name) + '</button></li>'
      : '<li class="zeile leer">' + OFFEN + '</li>';
    return '<section class="gruppe sieger-kasten" data-sieger="1"><h2 class="gruppe-kopf">Sieger</h2>' +
      '<ol class="zeilen">' + zeile + '</ol></section>';
  }

  function baum() {
    var html = '';
    // Von oben nach unten wie auf der Vorlage: Finale, Halbfinale, Vorauswahl.
    T.runden.slice().reverse().forEach(function (runde, i) {
      html += '<h2 class="runden-titel">' + esc(runde.name) + '</h2>';
      runde.gruppen.forEach(function (g) { html += gruppeHtml(g); });
      if (i === 0) html += siegerHtml();
    });
    var b = $('baum');
    b.innerHTML = '<svg class="linien" id="linien" aria-hidden="true"></svg>' + html;
  }

  function linien() {
    var svg = $('linien');
    if (!svg) return;
    if (getComputedStyle(svg).display === 'none') { svg.innerHTML = ''; return; }
    var b = $('baum').getBoundingClientRect();
    function kasten(sel) {
      var el = $('baum').querySelector(sel);
      if (!el) return null;
      var r = el.getBoundingClientRect();
      return { l: r.left - b.left, r: r.right - b.left, o: r.top - b.top, u: r.bottom - b.top,
        m: (r.left + r.right) / 2 - b.left, h: r.height };
    }
    var d = '';
    LINIEN.forEach(function (paar) {
      var e = kasten('[data-gruppe="' + paar[0] + '"]');
      var ks = paar[1].map(function (g) { return kasten('[data-gruppe="' + g + '"]'); }).filter(Boolean);
      if (!e || !ks.length) return;
      var oben = Math.min.apply(null, ks.map(function (k) { return k.o; }));
      var y = Math.round((e.u + oben) / 2);
      var xs = ks.map(function (k) { return k.m; }).concat([e.m]);
      d += 'M' + e.m + ' ' + e.u + 'V' + y;
      d += 'M' + Math.min.apply(null, xs) + ' ' + y + 'H' + Math.max.apply(null, xs);
      ks.forEach(function (k) { d += 'M' + k.m + ' ' + y + 'V' + k.o; });
    });
    var f = kasten('[data-gruppe="F1"]'), s = kasten('[data-sieger]');
    if (f && s) { var ys = Math.round(s.o + s.h / 2); d += 'M' + f.r + ' ' + ys + 'H' + s.l; }
    svg.setAttribute('width', b.width);
    svg.setAttribute('height', b.height);
    svg.innerHTML = '<path d="' + d + '"/>';
  }

  // Nach jeder Verschiebung des Baums (Blatt auf/zu) sofort und nach dem nächsten Bild neu zeichnen;
  // auf den Größen-Beobachter allein ist nicht in jedem Browser Verlass, bevor gezeichnet wird.
  function neuZeichnen() {
    linien();
    if (window.requestAnimationFrame) window.requestAnimationFrame(linien);
  }

  // ------------------------------------------------------------------ Video
  var api = null;
  function ladeApi() {
    if (api) return api;
    api = new Promise(function (fertig, fehler) {
      if (window.YT && window.YT.Player) { fertig(); return; }
      var vorher = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { if (vorher) vorher(); fertig(); };
      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.onerror = function () { api = null; fehler(); };
      document.head.appendChild(s);
    });
    return api;
  }

  function videoHtml(id, titel) {
    if (!id) return '<p>' + OFFEN + '</p>';
    var bild = '<img src="https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/mqdefault.jpg" alt="" loading="lazy">' +
      '<span class="play" aria-hidden="true"></span>';
    if (ALS_DATEI) {
      return '<a class="video" href="' + ytLink(id) + '" target="_blank" rel="noopener" aria-label="Auf YouTube ansehen: ' +
        esc(titel) + '">' + bild + '</a>';
    }
    return '<div class="video" data-video="' + esc(id) + '"><button type="button" class="video-start" aria-label="Video abspielen: ' +
      esc(titel) + '">' + bild + '</button></div>';
  }

  function nurAufYoutube(huelle, id, warum) {
    huelle.innerHTML = '<div class="video-meldung"><span>' + esc(warum) + '</span><a href="' + ytLink(id) +
      '" target="_blank" rel="noopener">Auf YouTube ansehen ↗</a></div>';
  }

  function videoStarten(knopf) {
    var huelle = knopf.closest('.video');
    var id = huelle.getAttribute('data-video');
    ladeApi().then(function () {
      var ziel = document.createElement('div');
      huelle.innerHTML = '';
      huelle.appendChild(ziel);
      new window.YT.Player(ziel, {
        videoId: id,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
        events: {
          onError: function (e) {
            nurAufYoutube(huelle, id, e.data === 101 || e.data === 150
              ? 'Dieses Video lässt sich nur auf YouTube abspielen.'
              : 'Das Video lässt sich hier gerade nicht abspielen (Fehler ' + e.data + ').');
          }
        }
      });
    }, function () {
      nurAufYoutube(huelle, id, 'Der YouTube-Spieler ließ sich nicht laden (keine Verbindung?).');
    });
  }

  // ------------------------------------------------------------------ Seitenblatt
  var zuletztGeoeffnetVon = null;

  function wegZeile(w) {
    var teile = [esc(w.runde.name) + ' · Gruppe ' + esc(w.gruppe)];
    if (w.fertig && w.platz != null) {
      teile.push('Platz ' + w.platz);
      teile.push(w.punkte + ' Punkte');
      var naechste = T.runden[T.runden.indexOf(w.runde) + 1];
      if (w.weiter) teile.push('<span class="weiter-marke">' + (naechste ? 'weiter ins ' + esc(naechste.name) : 'Sieger') + '</span>');
      else teile.push('ausgeschieden');
    } else {
      teile.push('Punkte ' + OFFEN);
    }
    return '<li>' + teile.join(' · ') + '</li>';
  }

  function blattTeilnehmer(name) {
    var t = teilnehmer(name);
    if (!t) return null;
    var weg = erg.wegVon(name);
    var html = '<p class="blatt-ueber">' + esc(weg.length ? weg[0].runde.name : '') + ' · Gruppe ' + esc(t.gruppe) +
      (erg.sieger === t ? ' · <b>Sieger</b>' : '') + '</p>' +
      '<h2 id="blatt-titel" tabindex="-1">' + esc(t.name) + '</h2>' +
      '<dl class="angaben"><dt>YouTube-Kanal</dt><dd>' +
      (t.kanal
        ? '<a href="' + esc(t.kanal) + '" target="_blank" rel="noopener">' + esc(t.kanalname || kanalKurz(t.kanal)) +
          '</a> <span class="klein">' + esc(kanalKurz(t.kanal)) + '</span>'
        : OFFEN) +
      '</dd>' +
      // Fehlt das Feld ganz, gehört es nicht zu dieser Fassung (öffentlich); null heißt „noch offen“.
      ('discord' in t ? '<dt>Discord</dt><dd>' + (t.discord ? esc(t.discord) : OFFEN) + '</dd>' : '') +
      '</dl>' +
      '<h3>Weg durchs Turnier</h3><ol class="weg">' + weg.map(wegZeile).join('') + '</ol>';
    weg.forEach(function (w) {
      var e = t[w.runde.id];
      html += '<h3>Einsendung ' + esc(w.runde.name) + '</h3>';
      if (!e) { html += '<p>' + OFFEN + '</p>'; return; }
      html += videoHtml(e.video, e.titel) +
        '<p class="video-titel">' + (e.titel ? esc(e.titel) : 'Titel ' + OFFEN) + '</p>' +
        '<p class="video-zeile">' + zahl(e.punkte, 'Punkte') + ' · ' +
        (e.likes != null ? e.likes + ' Likes nach einer Woche' : 'Likes nach einer Woche ' + OFFEN) +
        (e.video ? ' · <a href="' + ytLink(e.video) + '" target="_blank" rel="noopener">auf YouTube ↗</a>' : '') +
        '</p>';
    });
    return html;
  }

  function blattGruppe(gid) {
    var gr = erg.gruppen[gid];
    if (!gr) return null;
    var info = T.gruppen[gid] || {};
    var html = '<p class="blatt-ueber">' + esc(gr.runde.name) + '</p>' +
      '<h2 id="blatt-titel" tabindex="-1">Gruppe ' + esc(gid) + '</h2>' +
      '<p>' + (info.playlist
        ? '<a href="https://www.youtube.com/playlist?list=' + encodeURIComponent(info.playlist) +
          '" target="_blank" rel="noopener">Playlist der Gruppe auf YouTube ↗</a>'
        : 'Playlist ' + OFFEN) + '</p>' +
      '<h3>Ergebnis</h3>' +
      (gr.fertig ? '' : '<p class="klein">Noch nicht alle Punkte da — die Reihenfolge ist die eingetragene, nicht das Ergebnis.</p>') +
      '<table class="tabelle" data-gruppe="' + esc(gid) + '"><thead><tr><th>Platz</th><th>Name</th>' +
      '<th class="zahl">Punkte</th><th class="zahl">Likes</th></tr></thead><tbody>' +
      gr.zeilen.map(function (z) {
        var name = z.teilnehmer
          ? '<button type="button" class="name" data-name="' + esc(z.teilnehmer.name) + '">' + esc(z.teilnehmer.name) + '</button>'
          : '<span class="offen">' + esc(z.herkunft ? PLATZ_WORT[z.herkunft.platz] + ' ' + z.herkunft.gruppe + ' · ' : '') + 'noch offen</span>';
        return '<tr class="' + (z.weiter ? 'weiter' : '') + '"><td>' + (z.platz != null ? z.platz : '–') + '</td><td>' + name +
          '</td><td class="zahl">' + (z.punkte != null ? z.punkte : '–') + '</td><td class="zahl">' +
          (z.likes != null ? z.likes : '–') + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<p class="klein">Likes = Likes des Videos nach einer Woche, wie im ANALYSE-Video gezeigt. – = noch offen.</p>' +
      '<h3>ANALYSE-Video</h3>' + videoHtml(info.analyse, 'ANALYSE Gruppe ' + gid);
    return html;
  }

  function markieren(name, gid) {
    Array.prototype.forEach.call(document.querySelectorAll('.zeile'), function (z) {
      z.classList.toggle('gewaehlt', !!name && z.getAttribute('data-name') === name);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.baum .gruppe'), function (g) {
      g.classList.toggle('gewaehlt-gruppe', !!gid && g.getAttribute('data-gruppe') === gid);
    });
  }

  // Zustand steht in der Adresse (#teilnehmer=… oder #gruppe=…): übersteht Neuladen,
  // und die Zurück-Taste schließt das Blatt wieder.
  function zustandLesen() {
    var m = /^#(teilnehmer|gruppe)=(.+)$/.exec(location.hash);
    if (!m) return null;
    try { return { art: m[1], wert: decodeURIComponent(m[2]) }; } catch (e) { return null; }
  }

  function zeigen() {
    var z = zustandLesen();
    var inhalt = null;
    if (z && z.art === 'teilnehmer') inhalt = blattTeilnehmer(z.wert);
    if (z && z.art === 'gruppe') inhalt = blattGruppe(z.wert);
    var blatt = $('blatt'), grund = $('blatt-hintergrund');
    if (!inhalt) {
      var warOffen = !blatt.hidden;
      blatt.hidden = true; grund.hidden = true;
      // Inhalt leeren, sonst läuft ein gestartetes Video im versteckten Blatt hörbar weiter
      $('blatt-inhalt').innerHTML = '';
      document.body.classList.remove('blatt-offen');
      rueckenPruefen();
      neuZeichnen();
      markieren(null, null);
      if (warOffen && zuletztGeoeffnetVon && document.contains(zuletztGeoeffnetVon)) zuletztGeoeffnetVon.focus();
      return;
    }
    $('blatt-inhalt').innerHTML = inhalt;
    blatt.hidden = false; grund.hidden = false;
    $('blatt-rolle').scrollTop = 0;
    document.body.classList.add('blatt-offen');
    rueckenPruefen();
    neuZeichnen();
    markieren(z.art === 'teilnehmer' ? z.wert : null, z.art === 'gruppe' ? z.wert : null);
    var titel = $('blatt-titel');
    if (titel) titel.focus({ preventScroll: true });
  }

  function oeffnen(art, wert, von) {
    zuletztGeoeffnetVon = von || null;
    var ziel = '#' + art + '=' + encodeURIComponent(wert);
    if (location.hash === ziel) zeigen(); else location.hash = ziel;
  }

  function schliessen() {
    if (!zustandLesen()) return;
    history.replaceState(null, '', location.pathname + location.search);
    zeigen();
  }

  // ------------------------------------------------------------------ Breite des Blatts (Ziehen)
  // Am linken Rand ziehen macht das Blatt (und damit das Video) breiter. Grenzen: 360 px bis 85 % des
  // Fensters. Doppelklick = normale Breite. Die gezogene Breite bleibt im Browser gemerkt; auf schmalen
  // Fenstern (unter 1100 px) ist das Blatt immer bildschirmbreit und eine gemerkte Breite gilt dort nicht.
  var NORMAL_BREITE = 460, MIN_BREITE = 360, SCHLUESSEL = 'epc-blattbreite';
  // So viel Platz braucht der Baum mindestens, damit er neben dem Blatt noch lesbar ist (er wird
  // dabei kleiner, siehe stil.css). Bleibt weniger, legt sich das Blatt über den Baum.
  var BAUM_MINDESTENS = 640;

  function breitesFenster() { return window.innerWidth >= 1100; }
  function gestutzt(w) { return Math.round(Math.min(Math.max(w, MIN_BREITE), window.innerWidth * 0.85)); }
  function aktuelleBreite() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--blatt-breite')) || NORMAL_BREITE;
  }
  function gemerkteBreite() {
    try { var w = Number(localStorage.getItem(SCHLUESSEL)); return w > 0 ? w : null; } catch (e) { return null; }
  }
  function rueckenPruefen() {
    var offen = document.body.classList.contains('blatt-offen');
    document.body.classList.toggle('baum-rueckt',
      offen && breitesFenster() && window.innerWidth - aktuelleBreite() - 24 >= BAUM_MINDESTENS);
  }
  function breiteSetzen(w, merken) {
    var b = gestutzt(w);
    document.documentElement.style.setProperty('--blatt-breite', b + 'px');
    if (merken) { try { localStorage.setItem(SCHLUESSEL, String(b)); } catch (e) { /* ohne Merken weiter */ } }
    rueckenPruefen();
    neuZeichnen();
    return b;
  }
  function normalBreite() {
    try { localStorage.removeItem(SCHLUESSEL); } catch (e) { /* egal */ }
    breiteSetzen(NORMAL_BREITE, false);
  }
  breiteSetzen(gemerkteBreite() || NORMAL_BREITE, false);

  var griff = $('blatt-griff'), zug = null;
  griff.addEventListener('pointerdown', function (e) {
    if (!breitesFenster() || e.button !== 0) return;
    e.preventDefault();
    griff.setPointerCapture(e.pointerId);
    zug = { x: e.clientX, breite: aktuelleBreite() };
    document.body.classList.add('zieht');
  });
  griff.addEventListener('pointermove', function (e) {
    if (zug) breiteSetzen(zug.breite + (zug.x - e.clientX), false);
  });
  function zugEnde() {
    if (!zug) return;
    zug = null;
    document.body.classList.remove('zieht');
    breiteSetzen(aktuelleBreite(), true);
  }
  griff.addEventListener('pointerup', zugEnde);
  griff.addEventListener('pointercancel', zugEnde);
  griff.addEventListener('lostpointercapture', zugEnde);
  griff.addEventListener('dblclick', normalBreite);
  griff.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); breiteSetzen(aktuelleBreite() + 40, true); }
    if (e.key === 'ArrowRight') { e.preventDefault(); breiteSetzen(aktuelleBreite() - 40, true); }
    if (e.key === 'Home') { e.preventDefault(); normalBreite(); }
  });
  // Fenster kleiner/größer: von der gemerkten Breite aus neu stutzen (wird das Fenster wieder groß,
  // kommt die gezogene Breite zurück)
  window.addEventListener('resize', function () { breiteSetzen(gemerkteBreite() || NORMAL_BREITE, false); });

  // ------------------------------------------------------------------ Start
  kopf();
  baum();
  linien();
  zeigen();
  if (window.ResizeObserver) new ResizeObserver(linien).observe($('baum'));
  else window.addEventListener('resize', linien);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(linien);
  window.addEventListener('hashchange', zeigen);

  document.addEventListener('click', function (e) {
    var name = e.target.closest('.name');
    if (name) { oeffnen('teilnehmer', name.getAttribute('data-name'), name); return; }
    var gk = e.target.closest('.gruppe-knopf');
    if (gk) { oeffnen('gruppe', gk.getAttribute('data-gruppe'), gk); return; }
    var vs = e.target.closest('.video-start');
    if (vs) { videoStarten(vs); return; }
    if (e.target.closest('#blatt-zu') || e.target === $('blatt-hintergrund')) schliessen();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('blatt').hidden) schliessen();
  });
})();
