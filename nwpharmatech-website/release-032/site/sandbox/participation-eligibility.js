document.addEventListener('DOMContentLoaded', function () {
  if (!window.NWPTSandbox) return;
  NWPTSandbox.hydrateFromQuery();
  NWPTSandbox.mountJourneyChip('#journey-chip');

  var form = document.getElementById('elig-form');
  var result = document.getElementById('elig-result');
  var next = document.getElementById('elig-next');
  function paint() {
    var s = NWPTSandbox.read();
    var radios = form.querySelectorAll('input[name="eligibility"]');
    radios.forEach(function (r) { r.checked = (r.value === s.eligibility); });
    var label = NWPTSandbox.eligibilityLabel(s.eligibility);
    result.innerHTML = 'Result: <strong>' + label.toUpperCase() + ' (mock)</strong> — Alexandra Demo / DEMO-INV-0042';
    if (s.eligibility === 'fail') {
      next.innerHTML = '<strong>Next:</strong> Fail ends a live path. In this demo you may still open documents to inspect UX, or reset on Overview.';
    } else if (s.eligibility === 'review') {
      next.innerHTML = '<strong>Next:</strong> Review would wait on a vendor. Demo: continue to documents when ready.';
    } else if (s.eligibility === 'pass') {
      next.innerHTML = '<strong>Next:</strong> Continue to the documents room (sample access + acknowledgement).';
    } else {
      next.innerHTML = '<strong>Next:</strong> Select Pass, Fail, or Review to persist a mock outcome.';
    }
    NWPTSandbox.mountJourneyChip('#journey-chip');
  }
  form.addEventListener('change', function (e) {
    if (e.target.name === 'eligibility') {
      NWPTSandbox.update({ eligibility: e.target.value });
      paint();
    }
  });
  paint();
});
