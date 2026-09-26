/**
 * NWPT sandbox participation journey — sessionStorage state machine.
 * Fake data only. No payments, wallets, or minting.
 */
(function (global) {
  var KEY = 'nwptSandboxJourney.v1';
  var DEFAULTS = {
    eligibility: null,       // 'pass' | 'fail' | 'review'
    docsViewed: false,
    docsAccepted: false,
    docsAcked: false,
    amount: null,            // number (demo units commitment)
    subscriptionStatus: null, // 'pending' | 'accepted' | 'rejected'
    investorId: 'DEMO-INV-0042',
    investorName: 'Alexandra Demo'
  };

  function read() {
    try {
      var raw = sessionStorage.getItem(KEY);
      if (!raw) return Object.assign({}, DEFAULTS);
      var parsed = JSON.parse(raw);
      return Object.assign({}, DEFAULTS, parsed);
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function write(state) {
    sessionStorage.setItem(KEY, JSON.stringify(state));
    return state;
  }

  function update(patch) {
    var s = Object.assign(read(), patch);
    return write(s);
  }

  function reset() {
    sessionStorage.removeItem(KEY);
    return Object.assign({}, DEFAULTS);
  }

  /** Units on the register: only when subscription accepted; else 0. */
  function units(state) {
    state = state || read();
    if (state.subscriptionStatus === 'accepted' && typeof state.amount === 'number' && state.amount > 0) {
      return Math.floor(state.amount);
    }
    return 0;
  }

  function eligibilityLabel(v) {
    if (v === 'pass') return 'Pass';
    if (v === 'fail') return 'Fail';
    if (v === 'review') return 'Review';
    return 'Not set';
  }

  function subscriptionLabel(v) {
    if (v === 'pending') return 'Pending';
    if (v === 'accepted') return 'Accepted';
    if (v === 'rejected') return 'Rejected';
    return 'Not set';
  }

  function journeySummaryHtml(state) {
    state = state || read();
    var u = units(state);
    return (
      '<strong>Journey state (fake):</strong> ' +
      'Eligibility ' + eligibilityLabel(state.eligibility) +
      ' · Docs ' + (state.docsAcked ? 'acknowledged' : (state.docsAccepted ? 'accepted, not acked' : 'not acknowledged')) +
      ' · Subscription ' + subscriptionLabel(state.subscriptionStatus) +
      (state.amount != null ? ' · Amount ' + state.amount + ' demo units' : '') +
      ' · Ownership units <strong>' + u + '</strong>'
    );
  }

  /** Apply ?eligibility= & ?amount= & ?status= query params once, then strip. */
  function hydrateFromQuery() {
    try {
      var params = new URLSearchParams(global.location.search);
      if (![...params.keys()].length) return read();
      var patch = {};
      if (params.has('eligibility')) {
        var e = params.get('eligibility').toLowerCase();
        if (e === 'pass' || e === 'fail' || e === 'review') patch.eligibility = e;
      }
      if (params.has('amount')) {
        var n = parseFloat(params.get('amount'));
        if (!isNaN(n) && n >= 0) patch.amount = n;
      }
      if (params.has('status')) {
        var st = params.get('status').toLowerCase();
        if (st === 'pending' || st === 'accepted' || st === 'rejected') patch.subscriptionStatus = st;
      }
      if (params.has('reset') && params.get('reset') === '1') {
        reset();
        if (Object.keys(patch).length) update(patch);
      } else if (Object.keys(patch).length) {
        update(patch);
      }
      // Clean query from URL without reload
      if (global.history && global.history.replaceState) {
        global.history.replaceState({}, '', global.location.pathname + global.location.hash);
      }
      return read();
    } catch (err) {
      return read();
    }
  }

  function mountJourneyChip(selector) {
    var el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return;
    el.innerHTML = journeySummaryHtml(read());
  }

  global.NWPTSandbox = {
    KEY: KEY,
    read: read,
    write: write,
    update: update,
    reset: reset,
    units: units,
    eligibilityLabel: eligibilityLabel,
    subscriptionLabel: subscriptionLabel,
    journeySummaryHtml: journeySummaryHtml,
    hydrateFromQuery: hydrateFromQuery,
    mountJourneyChip: mountJourneyChip
  };
})(window);
