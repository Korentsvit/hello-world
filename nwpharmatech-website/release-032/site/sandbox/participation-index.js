document.addEventListener('DOMContentLoaded', function () {
  if (!window.NWPTSandbox) return;
  NWPTSandbox.hydrateFromQuery();
  NWPTSandbox.mountJourneyChip('#journey-chip');

  var btn = document.getElementById('reset-journey');
  if (btn) btn.addEventListener('click', function () {
    NWPTSandbox.reset();
    NWPTSandbox.mountJourneyChip('#journey-chip');
  });
});
