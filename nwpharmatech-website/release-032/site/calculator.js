(function () {
  var scenarios = {
    A: {
      title: "Zero receipts",
      body: "The defined CHR-P field never generates qualifying receipts that contracts recognise. Illustrative holder outcome: <strong>zero</strong> distributions. Capital already spent under use-of-proceeds is at risk, not a deposit account.",
      means: "Many programmes never reach a receipts step. Participation can pay nothing.",
      not: "It does not imply a coupon, refund, or that website copy creates economic rights.",
      dist: "zero", claim: "zero", cert: "zero",
      delayDefault: 0
    },
    B: {
      title: "Clinical stop",
      body: "The trial stops for safety, futility, or regulatory reasons. Illustrative outcome: typically <strong>zero</strong> ongoing participation; ethics and close-out may use holdback first under proposed documents.",
      means: "Failure is a real educational case — not a yield product.",
      not: "It does not mean an automatic residual return equal to contribution.",
      dist: "zero", claim: "zero", cert: "zero",
      delayDefault: 0
    },
    C: {
      title: "Long delay",
      body: "Start-up or enrolment slips. There is no automatic “coupon” for waiting. Distributions stay <strong>zero</strong> until (and unless) qualifying receipts arise under future contracts.",
      means: "Material delay does not create interest-like payments. Information rights and programme re-planning may apply under proposed documents.",
      not: "It does not mean a yield product, a deposit account, or that operational progress is an investor payday.",
      dist: "zero", claim: "zero", cert: "low",
      delayDefault: 2
    },
    D: {
      title: "Ops complete, commercial uncertain",
      body: "Operational milestones complete; commercialisation remains uncertain. Still <strong>zero</strong> from ops alone — milestones unlock spend, not an investor payday.",
      means: "Scientific or operational progress is not, by itself, a distribution trigger.",
      not: "It does not mean “prevention proven” or that clinical success is established.",
      dist: "zero", claim: "zero", cert: "low",
      delayDefault: 0
    },
    E: {
      title: "Qualifying receipts (hypothetical)",
      body: "Years later, the defined field generates receipts that contracts recognise. Any holder share would follow <strong>future</strong> contracts only. Residual economics remain with NWPharmaTech under those contracts. Terms are <strong>not</strong> published as final here.",
      means: "This is a hypothetical teaching case. Exact metric and share remain open / proposed.",
      not: "It is not a forecast, valuation, or agreed percentage on this website.",
      dist: "contract", claim: "relative", cert: "partial",
      delayDefault: 0
    },
    F: {
      title: "More capital later",
      body: "Additional financing enters the programme. Relative claims may change under pre-agreed rules (for example pari passu units, seniority, or consent-gated changes). Silent dilution without rules is not part of the proposed design.",
      means: "Later money can change relative claims — documents must say how before close.",
      not: "It does not invent a dilution percentage or price on this page.",
      dist: "zero", claim: "relative", cert: "partial",
      delayDefault: 0
    },
    G: {
      title: "Buyout / sale",
      body: "A sponsor call or programme transaction occurs. Exit follows the contract waterfall — not a community vote. Medical control follows successor sponsor rules NWPharmaTech sets.",
      means: "Illustrative exit path is contractual, not retail-token governance.",
      not: "It does not publish a buyout formula or guaranteed recovery.",
      dist: "partial", claim: "relative", cert: "partial",
      delayDefault: 0
    },
    H: {
      title: "Dissolution",
      body: "The vehicle winds down. Priority of return follows offering documents; digital units (if any) sync or cancel to match the final register. Outcomes are often partial or <strong>zero</strong> versus contribution.",
      means: "The legal register is the source of truth at close-out.",
      not: "It does not promise recovery of capital already spent under use-of-proceeds.",
      dist: "zero", claim: "partial", cert: "low",
      delayDefault: 0
    }
  };

  var delayLabels = [
    "No extra delay modelled (educational)",
    "Modest delay (educational) — still not a coupon",
    "Long delay (educational) — delay is not a coupon"
  ];

  var scenarioEl = document.getElementById("scenario");
  var delayEl = document.getElementById("delay");
  var delayField = document.getElementById("delay-field");
  var delayLabel = document.getElementById("delay-label");
  var addlEl = document.getElementById("addl-fin");
  var receiptsEl = document.getElementById("receipts");
  var outKey = document.getElementById("out-key");
  var outTitle = document.getElementById("out-title");
  var outBody = document.getElementById("out-body");
  var outMeans = document.getElementById("out-means");
  var outNot = document.getElementById("out-not");
  var barDist = document.getElementById("bar-dist");
  var barClaim = document.getElementById("bar-claim");
  var barCert = document.getElementById("bar-cert");
  if (!scenarioEl) return;
  var lastScenario = scenarioEl.value;
  var syncing = false;

  function setBar(el, kind) {
    el.className = "calc-bar__fill";
    if (kind === "zero") { el.classList.add("is-zero"); el.style.width = "0%"; }
    else if (kind === "low") { el.classList.add("is-zero"); el.style.width = "18%"; }
    else if (kind === "partial") { el.classList.add("is-partial"); el.style.width = "42%"; }
    else if (kind === "relative") { el.classList.add("is-relative"); el.style.width = "55%"; }
    else if (kind === "contract") { el.classList.add("is-contract"); el.style.width = "48%"; }
    else { el.style.width = "10%"; }
  }

  function render() {
    var key = scenarioEl.value;
    var s = scenarios[key];
    if (!s) {
      key = "C";
      scenarioEl.value = "C";
      s = scenarios.C;
    }

    /* When the user changes scenario, sync ancillary controls so a prior
       "Long delay" slider/label cannot linger under a different card. */
    if (key !== lastScenario) {
      syncing = true;
      delayEl.value = String(s.delayDefault);
      if (key !== "F") addlEl.checked = false;
      if (key !== "E") receiptsEl.checked = false;
      if (key === "F") addlEl.checked = true;
      if (key === "E") receiptsEl.checked = true;
      lastScenario = key;
      syncing = false;
    }

    var delay = parseInt(delayEl.value, 10);
    if (isNaN(delay) || delay < 0 || delay > 2) delay = s.delayDefault;
    delayLabel.textContent = delayLabels[delay];
    delayField.hidden = (key !== "C");
    delayEl.disabled = (key !== "C");

    /* Title and key ALWAYS mirror the select — single source of truth. */
    var title = s.title;
    var body = s.body;
    var means = s.means;
    var not = s.not;
    var dist = s.dist, claim = s.claim, cert = s.cert;

    if (key === "C") {
      if (delay === 0) {
        body = "Even without modelling a long slip, waiting does not create automatic payments. Distributions remain <strong>zero</strong> until qualifying receipts (if any) under future contracts.";
      } else if (delay === 1) {
        body = "A modest slip in start-up or enrolment still creates no automatic “coupon”. Distributions stay <strong>zero</strong> until (and unless) qualifying receipts arise under future contracts.";
      }
      dist = "zero";
    }

    if (addlEl.checked) {
      if (key === "F") {
        means = s.means;
      } else {
        means += " Additional financing note is on: relative claim may change under pre-agreed rules (illustrative narrative only).";
        claim = "relative";
      }
    }
    if (receiptsEl.checked) {
      if (key === "E") {
        means = "Hypothetical receipts remain educational. Agreed cash terms on this site: none.";
      } else if (key === "A" || key === "C" || key === "D") {
        body += " A hypothetical-receipts note is also on — still only per <strong>future</strong> contracts; no percentage is published here.";
        /* Keep the selected scenario title; do not rename to another card. */
        means += " Receipts note is illustrative only.";
      }
    }

    outKey.textContent = "Scenario " + key;
    outTitle.textContent = title;
    outBody.innerHTML = body;
    outMeans.textContent = means;
    outNot.textContent = not;
    setBar(barDist, dist);
    setBar(barClaim, claim);
    setBar(barCert, cert === "low" ? "low" : cert);
  }

  scenarioEl.addEventListener("change", render);
  delayEl.addEventListener("input", function () { if (!syncing) render(); });
  delayEl.addEventListener("change", function () { if (!syncing) render(); });
  addlEl.addEventListener("change", function () { if (!syncing) render(); });
  receiptsEl.addEventListener("change", function () { if (!syncing) render(); });
  render();
})();
