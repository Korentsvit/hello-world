document.addEventListener('DOMContentLoaded', function () {
  if (!window.NWPTSandbox) return;
  NWPTSandbox.hydrateFromQuery();
  NWPTSandbox.mountJourneyChip('#journey-chip');

  var line = document.getElementById('own-line');
  var next = document.getElementById('own-next');
  var s = NWPTSandbox.read();
  var u = NWPTSandbox.units(s);
  var st = NWPTSandbox.subscriptionLabel(s.subscriptionStatus);
  var note = '';
  if (s.subscriptionStatus === 'accepted') note = 'test credit (accepted mock)';
  else if (s.subscriptionStatus === 'pending') note = 'awaiting decision (pending mock)';
  else if (s.subscriptionStatus === 'rejected') note = 'no credit (rejected mock)';
  else note = 'no subscription state yet';
  line.innerHTML = 'Register line (fake): DEMO-INV-0042 · <strong>' + u.toLocaleString('en-GB') + ' demo units</strong> · Status: “' + note + '” · Chain mirror: <em>not connected</em>';
  next.innerHTML = '<strong>Next:</strong> Reporting will cite ' + u.toLocaleString('en-GB') + ' units and subscription status <em>' + st + '</em>.';
  NWPTSandbox.mountJourneyChip('#journey-chip');
});
