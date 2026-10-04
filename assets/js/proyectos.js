(function () {
  "use strict";

  var dataEl = document.getElementById("proy-data");
  var dialog = document.getElementById("proy-lightbox");
  if (!dataEl || !dialog || typeof dialog.showModal !== "function") return;

  var projects = JSON.parse(dataEl.textContent);
  var stage = dialog.querySelector(".proy-lb-stage");
  var img = stage.querySelector("img");
  var title = document.getElementById("proy-lb-title");
  var count = dialog.querySelector(".proy-lb-count");
  var current = null;
  var index = 0;
  var opener = null;
  var startX = 0;

  function photoAt(i) {
    var photos = current.photos;
    return photos[(i + photos.length) % photos.length];
  }

  function show(i) {
    var photos = current.photos;
    index = (i + photos.length) % photos.length;
    var photo = photos[index];
    img.alt = photo.alt;
    img.width = photo.w;
    img.height = photo.h;
    if (img.getAttribute("src") !== photo.src) img.src = photo.src;
    title.textContent = current.place + ", " + current.region;
    count.textContent = (index + 1) + " / " + photos.length;
    [photoAt(index + 1), photoAt(index - 1)].forEach(function (photo) {
      var pre = new Image();
      pre.src = photo.src;
    });
  }

  function openProject(id, button) {
    current = projects[id];
    if (!current || !current.photos.length) return;
    opener = button || null;
    show(0);
    dialog.showModal();
    dialog.querySelector(".proy-lb-close").focus();
  }

  document.querySelectorAll("[data-proy]").forEach(function (button) {
    button.addEventListener("click", function () {
      openProject(button.getAttribute("data-proy"), button);
    });
  });

  dialog.querySelector(".proy-lb-close").addEventListener("click", function () {
    dialog.close();
  });
  dialog.querySelector(".proy-lb-prev").addEventListener("click", function () {
    show(index - 1);
  });
  dialog.querySelector(".proy-lb-next").addEventListener("click", function () {
    show(index + 1);
  });

  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", function () {
    img.removeAttribute("src");
    if (opener) opener.focus();
  });

  dialog.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      show(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(index - 1);
    }
  });

  stage.addEventListener("touchstart", function (event) {
    startX = event.changedTouches[0].clientX;
  }, { passive: true });

  stage.addEventListener("touchend", function (event) {
    var dx = event.changedTouches[0].clientX - startX;
    if (Math.abs(dx) < 40) return;
    show(dx < 0 ? index + 1 : index - 1);
  }, { passive: true });
})();
