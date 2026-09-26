document.addEventListener('DOMContentLoaded', function () {
  if (!window.NWPTSandbox) return;
  NWPTSandbox.hydrateFromQuery();
  NWPTSandbox.mountJourneyChip('#journey-chip');

  var viewBtn = document.getElementById('view-docs');
  var access = document.getElementById('docs-access');
  var accept = document.getElementById('docs-accept');
  var ackBtn = document.getElementById('docs-ack');
  var ackMsg = document.getElementById('docs-ack-msg');
  var next = document.getElementById('docs-next');
  function paint() {
    var s = NWPTSandbox.read();
    accept.checked = !!s.docsAccepted;
    if (s.docsViewed) {
      access.innerHTML = 'Access grant: <strong>read-only fixture</strong> · Expires: never (because nothing is real)';
    } else {
      access.innerHTML = 'Access grant: <strong>not yet simulated</strong> · Expires: never (because nothing is real)';
    }
    if (s.docsAcked) {
      ackBtn.disabled = true;
      ackBtn.textContent = 'Acknowledged';
      ackBtn.classList.add('sandbox-btn-done');
      ackMsg.hidden = false;
      next.innerHTML = '<strong>Next:</strong> Continue to subscription — enter a dummy amount and set Pending / Accepted / Rejected.';
    } else {
      ackBtn.disabled = false;
      ackBtn.textContent = 'Acknowledge (simulated)';
      ackBtn.classList.remove('sandbox-btn-done');
      ackMsg.hidden = true;
      next.innerHTML = '<strong>Next:</strong> Simulate access, tick acceptance, then press Acknowledge (button will show a done state).';
    }
    NWPTSandbox.mountJourneyChip('#journey-chip');
  }
  viewBtn.addEventListener('click', function () {
    NWPTSandbox.update({ docsViewed: true });
    paint();
  });
  accept.addEventListener('change', function () {
    NWPTSandbox.update({ docsAccepted: accept.checked, docsAcked: accept.checked ? NWPTSandbox.read().docsAcked : false });
    paint();
  });
  ackBtn.addEventListener('click', function () {
    var s = NWPTSandbox.read();
    if (!s.docsViewed) {
      NWPTSandbox.update({ docsViewed: true });
    }
    if (!accept.checked) {
      accept.checked = true;
    }
    NWPTSandbox.update({ docsAccepted: true, docsAcked: true });
    paint();
  });
  paint();
});
