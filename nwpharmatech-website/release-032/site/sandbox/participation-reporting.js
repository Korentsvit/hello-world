document.addEventListener('DOMContentLoaded', function () {
  if (!window.NWPTSandbox) return;
  NWPTSandbox.hydrateFromQuery();
  NWPTSandbox.mountJourneyChip('#journey-chip');

  var box = document.getElementById('report-box');
  var list = document.getElementById('report-list');
  var s = NWPTSandbox.read();
  var u = NWPTSandbox.units(s);
  var elig = NWPTSandbox.eligibilityLabel(s.eligibility);
  var st = NWPTSandbox.subscriptionLabel(s.subscriptionStatus);
  box.innerHTML = 'DEMO Q-report — fixture for <strong>' + s.investorName + '</strong> (' + s.investorId + ')<br>' +
    'Eligibility: <strong>' + elig + '</strong> · Docs: <strong>' + (s.docsAcked ? 'acknowledged' : 'not acknowledged') + '</strong><br>' +
    'Subscription: <strong>' + st + '</strong>' + (s.amount != null ? ' · Commitment recorded: ' + s.amount + ' demo units' : '') + '<br>' +
    'Register units (fake): <strong>' + u.toLocaleString('en-GB') + '</strong> · Chain mirror: not connected';
  list.innerHTML = '<li>DEMO ops note — “enrolment gate not a payday” reminder</li>' +
    '<li>DEMO journey echo — units and status above are carried from earlier sandbox steps (sessionStorage)</li>' +
    '<li>Next fixture notice: none scheduled · Unsubscribe from demo: close the tab</li>';
  NWPTSandbox.mountJourneyChip('#journey-chip');
});
