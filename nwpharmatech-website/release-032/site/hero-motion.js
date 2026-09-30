/*! NWPharmaTech — NWPT-034 homepage hero motion.
 * The neural still is always in the page; the video is an optional layer on top of it.
 * - No motion (the still stays) with prefers-reduced-motion, Save-Data or prefers-reduced-data.
 * - Nothing is fetched until the page has loaded, so the headline and navigation are never delayed.
 * - Phones (max-width 859px) get a square 540px encode; wider screens the 21:9 1280px encode.
 * - A visible Pause/Play button; the choice is remembered on this device. Playback also pauses
 *   while the hero is off screen or the tab is hidden.
 */
(function () {
  var root = document.querySelector("[data-hero-motion]");
  if (!root) return;
  var video = root.querySelector("video");
  var btn = root.querySelector(".hero-motion__toggle");
  var label = root.querySelector(".hero-motion__label");
  if (!video || !btn) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reducedData = window.matchMedia("(prefers-reduced-data: reduce)");
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (reduce.matches || reducedData.matches || (conn && conn.saveData)) return;

  var KEY = "nwpt-hero-motion";
  function stored() { try { return window.localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { window.localStorage.setItem(KEY, v); } catch (e) { /* storage unavailable */ } }

  var userPaused = stored() === "paused";
  var visible = true;

  function setButton(playing) {
    btn.setAttribute("aria-pressed", playing ? "false" : "true");
    btn.classList.toggle("is-paused", !playing);
    label.textContent = playing ? "Pause animation" : "Play animation";
  }

  function tryPlay() {
    if (userPaused || !visible || document.hidden) return;
    var p = video.play();
    if (p && p.catch) p.catch(function () { setButton(false); });
  }

  function start() {
    var phone = window.matchMedia("(max-width: 859px)").matches;
    var kind = phone ? "phone" : "desktop";
    [["webm", "video/webm"], ["mp4", "video/mp4"]].forEach(function (t) {
      var s = document.createElement("source");
      s.src = video.getAttribute("data-" + kind + "-" + t[0]);
      s.type = t[1];
      video.appendChild(s);
    });
    video.addEventListener("playing", function () { root.classList.add("is-playing"); setButton(true); });
    video.addEventListener("pause", function () { setButton(false); });
    video.addEventListener("error", function () { root.classList.remove("is-playing"); btn.hidden = true; }, true);
    btn.hidden = false;
    setButton(!userPaused);
    video.load();
    tryPlay();

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) tryPlay(); else video.pause();
      }, { threshold: 0.15 }).observe(root.closest("section") || root);
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
