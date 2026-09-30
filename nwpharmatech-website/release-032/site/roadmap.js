(function () {
  var STATUS_LABEL = {
    completed: 'Completed',
    in_progress: 'In progress',
    planned: 'Planned',
    not_confirmed: 'Not confirmed publicly'
  };
  var TRACK_HEADING = {
    communications: 'A. Communication / website milestones',
    clinical: 'B. Clinical development milestones (Phase 2B)'
  };
  var TRACK_ORDER = ['communications', 'clinical'];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function itemHtml(m) {
    var st = m.status || 'planned';
    var label = STATUS_LABEL[st] || st.replace(/_/g, ' ');
    return '<li data-id="' + esc(m.id || '') + '" data-track="' + esc(m.track || '') + '">' +
      '<span class="status ' + esc(st) + '">' + esc(label) + '</span>' +
      '<h3>' + esc(m.name || '') + '</h3>' +
      '<p class="purpose">' + esc(m.purpose || '') + '</p>' +
      '<p class="evidence"><strong>Evidence:</strong> ' + esc(m.evidence || '') + '</p>' +
      '</li>';
  }

  function render(data) {
    var root = document.getElementById('roadmap');
    if (!root || !data || !Array.isArray(data.milestones)) return;
    var milestones = data.milestones;
    var hasTrack = milestones.some(function (m) { return m && m.track; });
    var html = '';
    if (hasTrack) {
      TRACK_ORDER.forEach(function (track) {
        var items = milestones.filter(function (m) { return m && m.track === track; });
        if (!items.length) return;
        html += '<h2 class="road-track">' + esc(TRACK_HEADING[track] || track) + '</h2>';
        html += '<ul class="road-list">';
        items.forEach(function (m) { html += itemHtml(m); });
        html += '</ul>';
      });
      // Any milestones without a recognised track
      var other = milestones.filter(function (m) {
        return m && TRACK_ORDER.indexOf(m.track) === -1;
      });
      if (other.length) {
        html += '<h2 class="road-track">Other milestones</h2><ul class="road-list">';
        other.forEach(function (m) { html += itemHtml(m); });
        html += '</ul>';
      }
    } else {
      html = '<ul class="road-list">';
      milestones.forEach(function (m) { html += itemHtml(m); });
      html += '</ul>';
    }
    root.innerHTML = html;
  }
  fetch('assets/roadmap.json', { credentials: 'same-origin' })
    .then(function (r) { if (!r.ok) throw new Error('roadmap fetch ' + r.status); return r.json(); })
    .then(render)
    .catch(function () { /* static HTML fallback already in the page */ });
})();
