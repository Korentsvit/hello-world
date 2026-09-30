document.addEventListener('DOMContentLoaded', function () {
  if (!window.NWPTSandbox) return;
  NWPTSandbox.hydrateFromQuery();
  NWPTSandbox.mountJourneyChip('#journey-chip');

  var amountEl = document.getElementById('sub-amount');
  var statusEl = document.getElementById('sub-status');
  var saveBtn = document.getElementById('sub-save');
  var msg = document.getElementById('sub-msg');
  var next = document.getElementById('sub-next');
  function paint() {
    var s = NWPTSandbox.read();
    if (s.amount != null) amountEl.value = s.amount;
    statusEl.value = s.subscriptionStatus || '';
    var u = NWPTSandbox.units(s);
    if (s.subscriptionStatus === 'accepted') {
      next.innerHTML = '<strong>Next:</strong> Ownership will show <strong>' + u + '</strong> demo units (matching this accepted amount).';
    } else if (s.subscriptionStatus === 'rejected') {
      next.innerHTML = '<strong>Next:</strong> Ownership will show <strong>0</strong> units (rejected).';
    } else if (s.subscriptionStatus === 'pending') {
      next.innerHTML = '<strong>Next:</strong> Ownership will show <strong>0</strong> units while Pending.';
    } else {
      next.innerHTML = '<strong>Next:</strong> Enter an amount and pick Pending / Accepted / Rejected, then save.';
    }
    NWPTSandbox.mountJourneyChip('#journey-chip');
  }
  saveBtn.addEventListener('click', function () {
    var n = parseFloat(amountEl.value);
    if (isNaN(n) || n < 0) n = 0;
    var st = statusEl.value || null;
    NWPTSandbox.update({ amount: n, subscriptionStatus: st });
    msg.hidden = false;
    paint();
  });
  amountEl.addEventListener('change', function () {
    var n = parseFloat(amountEl.value);
    if (!isNaN(n) && n >= 0) NWPTSandbox.update({ amount: n });
    paint();
  });
  statusEl.addEventListener('change', function () {
    NWPTSandbox.update({ subscriptionStatus: statusEl.value || null });
    paint();
  });
  paint();
});
