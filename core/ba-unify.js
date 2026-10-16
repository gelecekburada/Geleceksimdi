/* Keeps each BA screen's own language select in step with the global TR/EN switch,
   so the screen text follows the menu language instead of staying English. */
(function () {
  function want() {
    try { return localStorage.getItem("baforge-language") === "tr" ? "tr" : "en"; } catch (e) { return "en"; }
  }
  function sync() {
    var el = document.getElementById("language");
    var l = want();
    if (!el || el.tagName !== "SELECT" || el.value === l) return;
    if (!Array.prototype.some.call(el.options, function (o) { return o.value === l; })) return;
    el.value = l;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  window.addEventListener("baforge:language-changed", function () { setTimeout(sync, 0); });
  window.addEventListener("load", function () { setTimeout(sync, 150); });
  document.addEventListener("DOMContentLoaded", function () { setTimeout(sync, 0); });
})();
