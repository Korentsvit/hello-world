/* Contact-page forms for the two preview lanes. No-JS visitors keep the email links.
   The form is shown only after GET reports configured:true. Nothing is called a success
   unless the function says the email service accepted it, and that text is the function's. */
(function () {
  var lanes = [
    {
      endpoint: "/api/financing",
      formId: "financing-form",
      noteId: "financing-availability",
      widgetId: "financing-turnstile",
      errId: "financing-turnstile-err",
      resultId: "financing-result"
    },
    {
      endpoint: "/api/subscribe",
      formId: "updates-register-form",
      noteId: "updates-availability",
      widgetId: "updates-turnstile",
      errId: "updates-turnstile-err",
      resultId: "updates-result"
    }
  ];

  function idempotencyKey() {
    var bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.addEventListener("load", function () { resolve(); });
      s.addEventListener("error", function () { reject(new Error("turnstile")); });
      document.head.appendChild(s);
    });
  }

  function showResult(id, text) {
    var el = document.getElementById(id);
    if (!el) return;
    el.hidden = false;
    el.textContent = text;
    el.focus();
  }

  function wire(lane, config) {
    var form = document.getElementById(lane.formId);
    var note = document.getElementById(lane.noteId);
    if (!form) return;
    if (!config || !config.configured || !config.turnstileSiteKey) {
      if (note) note.textContent = "Online form is not available on this site yet. Nothing has been sent from this page.";
      return;
    }
    form.hidden = false;
    if (note) note.textContent = "The email link below still works if this form cannot be sent.";
    var token = "";
    var widget = null;
    loadTurnstile().then(function () {
      widget = window.turnstile.render("#" + lane.widgetId, {
        sitekey: config.turnstileSiteKey,
        callback: function (t) { token = t; var err = document.getElementById(lane.errId); if (err) err.textContent = ""; },
        "expired-callback": function () { token = ""; },
        "error-callback": function () { token = ""; }
      });
    }).catch(function () {
      var err = document.getElementById(lane.errId);
      if (err) err.textContent = "The security check could not load. Nothing has been sent. Use the email link instead.";
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var result = document.getElementById(lane.resultId);
      if (result) { result.hidden = true; result.textContent = ""; }
      var err = document.getElementById(lane.errId);
      if (err) err.textContent = "";
      if (!token) {
        if (err) err.textContent = "Complete the security check. Nothing has been sent.";
        return;
      }
      var data = { idempotencyKey: idempotencyKey(), turnstileToken: token };
      Array.prototype.forEach.call(form.elements, function (field) {
        if (!field.name || field.type === "submit") return;
        if (field.type === "checkbox") data[field.name] = field.checked;
        else data[field.name] = field.value;
      });
      var button = form.querySelector("button[type=submit]");
      if (button) button.disabled = true;
      fetch(lane.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(data)
      }).then(function (res) {
        return res.json().then(function (body) { return { status: res.status, body: body }; }).catch(function () { return { status: res.status, body: {} }; });
      }).then(function (out) {
        var message = out.body && out.body.message;
        if (out.status === 202 || out.status === 200) {
          showResult(lane.resultId, message || "The email service accepted the message for delivery. That is not proof it reached an inbox.");
        } else if (out.status === 503) {
          showResult(lane.resultId, "Online form is not available on this site yet. Nothing has been sent.");
        } else {
          showResult(lane.resultId, (out.body && out.body.error) || "The form could not be sent. Nothing has been sent.");
        }
      }).catch(function () {
        showResult(lane.resultId, "The form could not be sent. Nothing has been sent from this page.");
      }).then(function () {
        if (button) button.disabled = false;
        token = "";
        if (widget !== null && window.turnstile) window.turnstile.reset(widget);
      });
    });
  }

  lanes.forEach(function (lane) {
    fetch(lane.endpoint, { headers: { accept: "application/json" } })
      .then(function (res) { return res.json(); })
      .then(function (config) { wire(lane, config); })
      .catch(function () { wire(lane, null); });
  });
})();
