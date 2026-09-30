/*! NWPharmaTech — Funding page hero motion (/funding-use).
 * The matching poster (21:9 desktop, 4:3 phone, chosen by <picture>) is always in the page; the video is an optional
 * layer on top of it, so without JavaScript, with prefers-reduced-motion, prefers-reduced-data or Save-Data the poster
 * stays and no video is requested.
 * - Nothing is fetched until the page has loaded; only the composition for the current width is requested
 *   (max-width 767px: 4:3; wider: 21:9). Crossing that width swaps the source, keeping the play/pause state.
 * - Muted, inline, looping; the seamless cycle is inside the file (no crossfade or restart logic here).
 * - A visible Pause/Play button; the choice is remembered on this device. Playback also pauses while the hero is
 *   off screen or the tab is hidden.
 */
(function () {
  var root = document.querySelector("[data-funding-hero]");
  if (!root) return;
  var video = root.querySelector(".funding-hero__video");
  var btn = root.querySelector(".funding-hero__toggle");
  var label = btn && btn.querySelector(".hero-motion__label");
  if (!video || !btn || !label) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reducedData = window.matchMedia("(prefers-reduced-data: reduce)");
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (reduce.matches || reducedData.matches || (conn && conn.saveData)) return;

  var KEY = "nwpt-funding-hero";
  function stored() { try { return window.localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { window.localStorage.setItem(KEY, v); } catch (e) { /* storage unavailable */ } }

  var phoneQuery = window.matchMedia("(max-width: 767px)");
  var userPaused = stored() === "paused";
  var visible = true;
  var kind = null;

  function setButton(playing) {
    btn.setAttribute("aria-pressed", playing ? "false" : "true");
    btn.classList.toggle("is-paused", !playing);
    label.textContent = playing ? "Pause animation" : "Play animation";
  }
  function tryPlay() {
    if (userPaused || !visible || document.hidden || !kind) return;
    var p = video.play();
    if (p && p.catch) p.catch(function () { setButton(false); });
  }
  function useSources(next) {
    if (next === kind) return;
    kind = next;
    root.classList.remove("is-playing");
    while (video.firstChild) video.removeChild(video.firstChild);
    [["webm", "video/webm"], ["mp4", "video/mp4"]].forEach(function (t) {
      var s = document.createElement("source");
      s.src = video.getAttribute("data-" + kind + "-" + t[0]);
      s.type = t[1];
      video.appendChild(s);
    });
    video.load();
    tryPlay();
  }

  function start() {
    video.addEventListener("playing", function () { root.classList.add("is-playing"); setButton(true); });
    video.addEventListener("pause", function () { setButton(false); });
    video.addEventListener("error", function () { root.classList.remove("is-playing"); btn.hidden = true; }, true);
    btn.hidden = false;
    setButton(!userPaused);
    useSources(phoneQuery.matches ? "phone" : "desktop");

    var onWidth = function () { useSources(phoneQuery.matches ? "phone" : "desktop"); };
    if (phoneQuery.addEventListener) phoneQuery.addEventListener("change", onWidth); else if (phoneQuery.addListener) phoneQuery.addListener(onWidth);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) tryPlay(); else video.pause();
      }, { threshold: 0.15 }).observe(root);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) video.pause(); else tryPlay();
    });
    var stopForMotionPref = function () {
      if (!reduce.matches) return;
      video.pause(); root.classList.remove("is-playing"); btn.hidden = true;
    };
    if (reduce.addEventListener) reduce.addEventListener("change", stopForMotionPref);
    else if (reduce.addListener) reduce.addListener(stopForMotionPref);
  }

  btn.addEventListener("click", function () {
    if (video.paused) {
      userPaused = false; store("playing");
      visible = true; tryPlay();
    } else {
      userPaused = true; store("paused");
      video.pause();
    }
  });

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
})();
