/* logik.js — rechnet aus daten.js die Plätze und füllt Halbfinale, Finale und Sieger.
 *
 * Kein Aussehen, kein Seitenaufbau: nur Rechnen und Prüfen. Läuft im Browser
 * (window.TurnierLogik) und in der Prüfung tests/pruefen.mjs.
 *
 * Grundsatz: Ein Name wird nur einmal eingetragen (beim Teilnehmer, mit seinen Punkten).
 * Wer in der nächsten Runde wo steht, wird hier abgeleitet — nie von Hand gepflegt.
 * Ist etwas nicht eindeutig (Gleichstand auf einem Weiterkommen-Platz), bleibt der Platz offen
 * und es entsteht ein Hinweis; es wird nie still jemand ausgewählt.
 */
(function (wurzel) {
  'use strict';

  function wert(teilnehmer, rundeId, feld) {
    var r = teilnehmer && teilnehmer[rundeId];
    return r && r[feld] != null ? r[feld] : null;
  }

  function berechne(T) {
    var hinweise = [];
    var gruppen = {};
    var rundeVon = {};
    T.runden.forEach(function (r) { r.gruppen.forEach(function (g) { rundeVon[g] = r; }); });
    var ersteRunde = T.runden[0];

    var gesehen = {};
    T.teilnehmer.forEach(function (t) {
      if (gesehen[t.name]) hinweise.push('Der Name „' + t.name + '“ steht zweimal in den Daten.');
      gesehen[t.name] = true;
      if (ersteRunde.gruppen.indexOf(t.gruppe) < 0) {
        hinweise.push('„' + t.name + '“ steht in der Gruppe „' + t.gruppe + '“, die es in der ' +
          ersteRunde.name + ' nicht gibt.');
      }
    });

    // Wer steht in Gruppe g auf Platz p? Nur eindeutig besetzte Plätze zählen.
    function platzInhaber(g, p) {
      var gr = gruppen[g];
      if (!gr || !gr.fertig) return null;
      var treffer = gr.zeilen.filter(function (z) { return z.platz === p; });
      return treffer.length === 1 ? treffer[0].teilnehmer : null;
    }

    T.runden.forEach(function (runde, rundenNr) {
      runde.gruppen.forEach(function (gid) {
        var zeilen;
        if (rundenNr === 0) {
          zeilen = T.teilnehmer
            .filter(function (t) { return t.gruppe === gid; })
            .map(function (t) { return { teilnehmer: t, herkunft: null }; });
          if (zeilen.length > runde.plaetze) {
            hinweise.push('In Gruppe ' + gid + ' stehen ' + zeilen.length + ' Teilnehmer, Platz ist für ' +
              runde.plaetze + '.');
          }
        } else {
          zeilen = (T.besetzung[gid] || []).map(function (b) {
            return { teilnehmer: platzInhaber(b[0], b[1]), herkunft: { gruppe: b[0], platz: b[1] } };
          });
        }
        while (zeilen.length < runde.plaetze) zeilen.push({ teilnehmer: null, herkunft: null });

        zeilen.forEach(function (z) {
          z.punkte = wert(z.teilnehmer, runde.id, 'punkte');
          z.likes = wert(z.teilnehmer, runde.id, 'likes');
          z.platz = null;
          z.weiter = false;
        });

        // Fertig ist eine Gruppe erst, wenn jeder Platz besetzt ist und jeder Punkte hat.
        var fertig = zeilen.length === runde.plaetze && zeilen.every(function (z) {
          return z.teilnehmer && z.punkte != null;
        });
        var gleichstand = false;
        if (fertig) {
          // Nach Punkten sortieren; bei gleichen Punkten bleibt die eingetragene Reihenfolge.
          zeilen = zeilen.map(function (z, i) { z._i = i; return z; })
            .sort(function (a, b) { return b.punkte - a.punkte || a._i - b._i; });
          zeilen.forEach(function (z) {
            z.platz = 1 + zeilen.filter(function (x) { return x.punkte > z.punkte; }).length;
            delete z._i;
          });
          for (var p = 1; p <= runde.weiter; p++) {
            var gleich = zeilen.filter(function (z) { return z.platz === p; });
            if (gleich.length > 1) {
              gleichstand = true;
              hinweise.push('Gleichstand in Gruppe ' + gid + ' um Platz ' + p + ': ' +
                gleich.map(function (z) { return z.teilnehmer.name; }).join(' und ') + ' haben je ' +
                gleich[0].punkte + ' Punkte. Wer weiterkommt, ist offen, bis die Regel dafür eingetragen ist.');
            }
          }
          zeilen.forEach(function (z) {
            var eindeutig = zeilen.filter(function (x) { return x.platz === z.platz; }).length === 1;
            z.weiter = z.platz <= runde.weiter && eindeutig;
          });
        }
        gruppen[gid] = { id: gid, runde: runde, zeilen: zeilen, fertig: fertig, gleichstand: gleichstand };
      });
    });

    // Angaben für eine Runde, in der jemand gar nicht steht, sind ein Widerspruch.
    T.teilnehmer.forEach(function (t) {
      T.runden.slice(1).forEach(function (runde) {
        if (!t[runde.id]) return;
        var drin = runde.gruppen.some(function (g) {
          return gruppen[g].zeilen.some(function (z) { return z.teilnehmer === t; });
        });
        if (!drin) {
          hinweise.push('Bei „' + t.name + '“ stehen Angaben für das ' + runde.name +
            ', laut Punkten ist „' + t.name + '“ dort aber nicht dabei.');
        }
      });
    });

    var sieger = platzInhaber(T.sieger[0], T.sieger[1]);

    function wegVon(name) {
      var weg = [];
      T.runden.forEach(function (runde) {
        runde.gruppen.forEach(function (g) {
          gruppen[g].zeilen.forEach(function (z) {
            if (z.teilnehmer && z.teilnehmer.name === name) {
              weg.push({ runde: runde, gruppe: g, platz: z.platz, punkte: z.punkte, likes: z.likes,
                weiter: z.weiter, fertig: gruppen[g].fertig, herkunft: z.herkunft });
            }
          });
        });
      });
      return weg;
    }

    return { gruppen: gruppen, sieger: sieger, hinweise: hinweise, wegVon: wegVon };
  }

  wurzel.TurnierLogik = { berechne: berechne };
})(typeof window !== 'undefined' ? window : globalThis);
