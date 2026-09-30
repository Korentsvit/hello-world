/*! NWPharmaTech — NWPT-051: the formulation and research-question sections moved from /science to /science/formulation.
    Old deep links (/science#investigating, #formulation, #q2-h, #dg-title, #dg-desc, #ar, #conceptual-platform,
    #chrp-title) continue to the same section on the new page. Without JavaScript, #investigating and #formulation land on
    the "Our programme" introduction, which links to the new page. */
(function () {
  "use strict";
  var moved = ["investigating", "formulation", "q2-h", "conceptual-platform", "chrp-title"];
  // ids inside the capsule-to-measurement SVG cannot be scrolled to; they go to the diagram's figure
  var diagram = ["dg-title", "dg-desc", "ar"];
  function forward() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (moved.indexOf(id) !== -1) location.replace("science/formulation#" + id);
    else if (diagram.indexOf(id) !== -1) location.replace("science/formulation#capsule-diagram");
  }
  forward();
  window.addEventListener("hashchange", forward);
})();
