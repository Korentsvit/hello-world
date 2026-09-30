/*! NWPharmaTech — NWPT-052: labelled endocannabinoid-system animation on /science/cannabinoids.
 * The poster (same 16:9 composition) is always in the page and reserves the space; the video is an optional layer on top
 * of it. Without JavaScript, with prefers-reduced-motion, prefers-reduced-data or Save-Data the poster stays and no
 * video is requested.
 * - Nothing is fetched until the page has loaded. Silent (muted, no audio track), inline, looping.
 * - A visible Pause/Play button (aria-pressed); the choice is remembered on this device. Playback also pauses while
 *   the animation is off screen or the tab is hidden.
 */
(function () {
  var root = document.querySelector("[data-ecs-video]");
  if (!root) return;
  var video = root.querySelector(".ecs-video__video");
  var btn = root.querySelector(".ecs-video__toggle");
  var label = btn && btn.querySelector(".hero-motion__label");
  if (!video || !btn || !label) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reducedData = window.matchMedia("(prefers-reduced-data: reduce)");
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (reduce.matches || reducedData.matches || (conn && conn.saveData)) return;

  var KEY = "nwpt-ecs-video";
  function stored() { try { return window.localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { window.localStorage.setItem(KEY, v); } catch (e) { /* storage unavailable */ } }
  var userPaused = stored() === "paused";
  var visible = false;

  function render() {
    var paused = userPaused || video.paused;
    btn.setAttribute("aria-pressed", userPaused ? "true" : "false");
    btn.classList.toggle("is-paused", userPaused);
    label.textContent = userPaused ? "Play animation" : "Pause animation";
    root.classList.toggle("is-playing", !paused);
  }
  function sync() {
    if (userPaused || !visible || document.hidden) { video.pause(); render(); return; }
    var p = video.play();
    if (p && p.catch) p.catch(function () { render(); });
    render();
  }

  function start() {
    if (reduce.matches) return;
    video.muted = true;
    [["webm", "video/webm"], ["mp4", "video/mp4"]].forEach(function (s) {
      var src = video.getAttribute("data-" + s[0]);
      if (!src) return;
      var el = document.createElement("source");
      el.src = src; el.type = s[1];
      video.appendChild(el);
    });
    video.load();
    btn.hidden = false;
    btn.addEventListener("click", function () {
      userPaused = !userPaused;
      store(userPaused ? "paused" : "playing");
      sync();
    });
    video.addEventListener("playing", render);
    video.addEventListener("pause", render);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }, { threshold: 0.25 }).observe(root.querySelector(".ecs-video__media") || root);
    } else { visible = true; }
    document.addEventListener("visibilitychange", sync);
    reduce.addEventListener && reduce.addEventListener("change", function () { if (reduce.matches) { userPaused = true; sync(); } });
    render(); sync();
  }
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
})();
