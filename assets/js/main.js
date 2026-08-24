(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------
     Footer year
     ----------------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* -----------------------------------------------------------
     Nav: translucent until scrolled, then elevated + blurred
     ----------------------------------------------------------- */
  var nav = document.querySelector("[data-nav]");
  if (nav) {
    var setScrolled = function () {
      nav.setAttribute("data-scrolled", window.scrollY > 8 ? "true" : "false");
    };
    setScrolled();
    var navTicking = false;
    window.addEventListener("scroll", function () {
      if (!navTicking) {
        window.requestAnimationFrame(function () {
          setScrolled();
          navTicking = false;
        });
        navTicking = true;
      }
    }, { passive: true });
  }

  /* -----------------------------------------------------------
     Mobile nav toggle
     ----------------------------------------------------------- */
  var toggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-nav-mobile]");

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Menü öffnen" : "Menü schließen");
      mobileNav.setAttribute("data-open", String(!isOpen));
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Menü öffnen");
        mobileNav.setAttribute("data-open", "false");
      });
    });
  }

  /* -----------------------------------------------------------
     Contact form: front-end only placeholder handling
     ----------------------------------------------------------- */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var button = form.querySelector("button[type='submit']");
      if (!button) return;
      var original = button.textContent;
      button.textContent = "Danke, wir melden uns.";
      button.disabled = true;
      setTimeout(function () {
        button.textContent = original;
        button.disabled = false;
        form.reset();
      }, 3200);
    });
  }

  /* -----------------------------------------------------------
     Reveal on scroll: IntersectionObserver only (no scroll
     listeners). Degrades to instantly visible under
     prefers-reduced-motion or if IO is unavailable.
     ----------------------------------------------------------- */
  var revealEls = document.querySelectorAll("[data-reveal]");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });

    /* Safety net: never let content stay invisible. */
    setTimeout(function () {
      revealEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
    }, 4000);
  }

  /* ===============================================================
     3D WORLD GLOBE: dependency-free, draggable, with real continent
     silhouettes and labelled hub cities. Runs entirely on a 2D
     canvas with a hand-rolled perspective projection, no Three.js,
     no CDN, nothing that can fail to load or go stale.

     - Landmass is a dot-matrix world map: points are sampled evenly
       across the sphere (Fibonacci distribution) and kept only where
       they fall inside a hand-authored continent polygon (simple
       ray-casting point-in-polygon test against lat/lng outlines).
     - A curated set of hub cities (CoreSetup Studio is Berlin-based)
       get brighter markers and labels, connected by pulsing
       great-circle flight paths, in the spirit of the flight-route
       globes on logistics sites like unitedcarriers.com.
     - The globe is draggable (pointer events, with momentum/inertia
       on release) and auto-rotates gently when idle.
     =============================================================== */
  var canvas = document.getElementById("globeCanvas");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0, height = 0, radius = 0;
    var DEG = Math.PI / 180;
    var GOLD = [201, 169, 97];

    /* ---- Rough continent outlines, [lng, lat] degree pairs.
       Hand-authored approximations, not survey data: at the point
       size a hero canvas renders, silhouette-level accuracy reads
       as "a world map," which is the goal, not GIS precision. ---- */
    var CONTINENTS = [
      [[-165,68],[-165,60],[-140,60],[-130,55],[-125,48],[-124,40],[-117,32],[-105,20],[-97,16],[-90,14],[-83,9],[-80,8],[-77,18],[-80,25],[-81,31],[-75,35],[-70,41],[-67,45],[-60,50],[-65,60],[-75,62],[-85,68],[-95,70],[-110,72],[-125,70],[-140,70],[-155,71]],
      [[-79,9],[-77,1],[-80,-5],[-81,-15],[-71,-18],[-70,-25],[-71,-33],[-73,-42],[-75,-52],[-68,-55],[-65,-52],[-62,-45],[-58,-38],[-56,-34],[-48,-25],[-40,-15],[-35,-8],[-38,-4],[-45,-1],[-50,0],[-60,5],[-67,8],[-72,9]],
      [[-9,43],[-9,36],[3,36],[10,36],[15,37],[19,40],[23,37],[28,36],[27,40],[29,41],[35,45],[40,46],[40,52],[35,55],[30,60],[25,65],[20,69],[10,71],[5,62],[5,58],[-2,58],[-5,50],[-9,49]],
      [[-17,15],[-17,21],[-10,30],[0,33],[10,33],[20,32],[25,32],[32,31],[35,28],[35,20],[42,12],[51,12],[51,2],[42,-2],[40,-15],[35,-25],[33,-30],[27,-34],[20,-34],[16,-29],[12,-18],[12,-6],[8,0],[3,6],[-5,5],[-11,7]],
      [[27,40],[35,45],[40,52],[35,55],[30,60],[25,65],[35,70],[50,72],[70,72],[90,73],[110,73],[130,72],[145,60],[160,60],[170,65],[180,68],[180,60],[160,55],[150,45],[140,40],[130,35],[122,30],[110,20],[100,10],[95,5],[100,0],[105,-6],[115,-8],[120,5],[125,10],[122,18],[120,23],[110,20],[105,20],[100,25],[95,25],[90,22],[85,20],[80,15],[77,8],[72,10],[68,25],[63,25],[60,25],[55,25],[50,25],[45,25],[40,25],[35,30]],
      [[113,-22],[114,-30],[118,-35],[130,-32],[137,-35],[140,-38],[147,-38],[150,-35],[153,-28],[153,-20],[145,-15],[135,-12],[130,-12],[125,-15],[120,-18]]
    ];

    /* ---- Hub cities. Berlin is home; the rest are the studio's
       reference network for a globally-remote client base. ---- */
    var HUBS = [
      { lng: 13.405, lat: 52.52, label: "Berlin", home: true },
      { lng: -0.1278, lat: 51.5074, label: "London" },
      { lng: -74.006, lat: 40.7128, label: "New York" },
      { lng: 55.2708, lat: 25.2048, label: "Dubai" },
      { lng: 103.8198, lat: 1.3521, label: "Singapur" },
      { lng: 139.6917, lat: 35.6895, label: "Tokio" },
      { lng: -46.6333, lat: -23.5505, label: "São Paulo" },
      { lng: 151.2093, lat: -33.8688, label: "Sydney" }
    ];

    function lngLatToXYZ(lng, lat) {
      var phi = lat * DEG, theta = lng * DEG;
      return {
        x: Math.cos(phi) * Math.sin(theta),
        /* Canvas Y grows downward, so northern latitudes (positive
           phi) must map to a NEGATIVE y here, or the whole globe
           renders upside down (south pole on top). This sign flip is
           the fix for that. */
        y: -Math.sin(phi),
        z: Math.cos(phi) * Math.cos(theta)
      };
    }

    function pointInPolygon(lng, lat, poly) {
      var inside = false;
      for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        var xi = poly[i][0], yi = poly[i][1];
        var xj = poly[j][0], yj = poly[j][1];
        var intersect = ((yi > lat) !== (yj > lat)) &&
          (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }

    function fibonacciSphereLngLat(n) {
      var pts = [];
      var phi = Math.PI * (3 - Math.sqrt(5));
      for (var i = 0; i < n; i++) {
        var y = 1 - (i / (n - 1)) * 2;
        var r = Math.sqrt(Math.max(0, 1 - y * y));
        var theta = phi * i;
        var lat = Math.asin(y) / DEG;
        var lng = Math.atan2(Math.sin(theta) * r, Math.cos(theta) * r) / DEG;
        pts.push([lng, lat]);
      }
      return pts;
    }

    var landDots = [];
    var hubPoints = [];
    var arcs = [];
    var graticuleLines = [];

    function buildLand() {
      landDots = [];
      var candidates = fibonacciSphereLngLat(2600);
      candidates.forEach(function (c) {
        for (var k = 0; k < CONTINENTS.length; k++) {
          if (pointInPolygon(c[0], c[1], CONTINENTS[k])) {
            var xyz = lngLatToXYZ(c[0], c[1]);
            xyz.lng = c[0]; xyz.lat = c[1];
            landDots.push(xyz);
            break;
          }
        }
      });
    }

    /* ---- Faint lat/lng wireframe: gives the point-cloud continents
       an actual sphere to sit on, the way reference "flight route"
       globes (unitedcarriers.com and similar) always ground their
       dots in a visible graticule instead of a floating cloud. ---- */
    function buildGraticule() {
      graticuleLines = [];
      for (var lng = -150; lng <= 180; lng += 30) {
        var meridian = [];
        for (var lat = -80; lat <= 80; lat += 4) {
          meridian.push(lngLatToXYZ(lng, lat));
        }
        graticuleLines.push(meridian);
      }
      for (var lat2 = -60; lat2 <= 60; lat2 += 30) {
        var parallel = [];
        for (var lng2 = -180; lng2 <= 180; lng2 += 4) {
          parallel.push(lngLatToXYZ(lng2, lat2));
        }
        graticuleLines.push(parallel);
      }
    }

    function buildHubs() {
      hubPoints = HUBS.map(function (h) {
        var xyz = lngLatToXYZ(h.lng, h.lat);
        xyz.label = h.label;
        xyz.home = !!h.home;
        return xyz;
      });
    }

    function buildArcs() {
      var home = hubPoints[0];
      arcs = [];
      for (var i = 1; i < hubPoints.length; i++) {
        arcs.push({
          a: home,
          b: hubPoints[i],
          t: Math.random(),
          speed: 0.1 + Math.random() * 0.05,
          delay: Math.random() * 4
        });
      }
    }

    function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }

    function slerp(p0, p1, t) {
      var d = Math.max(-1, Math.min(1, dot(p0, p1)));
      var omega = Math.acos(d);
      if (omega < 1e-6) return p0;
      var sinOmega = Math.sin(omega);
      var w0 = Math.sin((1 - t) * omega) / sinOmega;
      var w1 = Math.sin(t * omega) / sinOmega;
      return {
        x: p0.x * w0 + p1.x * w1,
        y: p0.y * w0 + p1.y * w1,
        z: p0.z * w0 + p1.z * w1
      };
    }

    /* Great-circle interpolation plus an outward "altitude" bulge, so
       flight paths arc above the sphere surface instead of hugging
       it - the signature look of reference flight-route globes. */
    var ARC_BULGE = 0.22;
    function bulgePoint(p0, p1, t) {
      var p = slerp(p0, p1, t);
      var lift = 1 + ARC_BULGE * Math.sin(Math.max(0, Math.min(1, t)) * Math.PI);
      return { x: p.x * lift, y: p.y * lift, z: p.z * lift };
    }

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * DPR;
      canvas.height = height * DPR;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      radius = Math.min(width, height) * 0.42;
    }

    function project(p, rotY, tiltX) {
      var cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      var x1 = p.x * cosY + p.z * sinY;
      var z1 = -p.x * sinY + p.z * cosY;
      var y1 = p.y;

      var cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
      var y2 = y1 * cosX - z1 * sinX;
      var z2 = y1 * sinX + z1 * cosX;

      var perspective = 2.6;
      var scale = perspective / (perspective + z2);
      return {
        x: width / 2 + x1 * radius * scale,
        y: height / 2 + y2 * radius * scale,
        z: z2,
        scale: scale
      };
    }

    function rgba(alpha) {
      var a = Math.max(0, Math.min(1, alpha));
      return "rgba(" + GOLD[0] + "," + GOLD[1] + "," + GOLD[2] + "," + a + ")";
    }

    /* ---- Rotation state: ambient auto-spin, or user drag with
       momentum. Reduced motion keeps dragging (direct user action)
       but drops ambient spin and momentum coasting. ---- */
    var rotation = 0.4;
    var tilt = -0.32;
    var velocity = reduceMotion ? 0 : 0.16;
    var lastTime = null;
    var running = true;
    var dragging = false;
    var lastPointer = null;
    var idleSince = 0;
    var AMBIENT_SPEED = reduceMotion ? 0 : 0.16;

    function frame(now) {
      if (!running) return;
      if (lastTime === null) lastTime = now;
      var dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!dragging) {
        if (Math.abs(velocity) > 0.001) {
          rotation += velocity * dt;
          velocity *= reduceMotion ? 0 : Math.pow(0.06, dt);
        } else if (!reduceMotion) {
          idleSince += dt;
          if (idleSince > 0.6) {
            velocity += (AMBIENT_SPEED - velocity) * Math.min(1, dt * 1.5);
            rotation += velocity * dt;
          }
        }
      }

      if (!reduceMotion) {
        arcs.forEach(function (arc) {
          if (arc.delay > 0) { arc.delay -= dt; return; }
          arc.t += dt * arc.speed;
          if (arc.t > 1.2) {
            arc.t = 0;
            arc.delay = 1 + Math.random() * 2.5;
          }
        });
      }

      ctx.clearRect(0, 0, width, height);

      var cx = width / 2, cy = height / 2;

      /* ---- Atmosphere: soft outer glow behind the whole sphere,
         the halo every reference "premium" globe has and a flat
         dot-cloud never does. ---- */
      var atmosphere = ctx.createRadialGradient(cx, cy, radius * 0.82, cx, cy, radius * 1.38);
      atmosphere.addColorStop(0, "rgba(" + GOLD[0] + "," + GOLD[1] + "," + GOLD[2] + ",0.16)");
      atmosphere.addColorStop(1, "rgba(" + GOLD[0] + "," + GOLD[1] + "," + GOLD[2] + ",0)");
      ctx.fillStyle = atmosphere;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.38, 0, Math.PI * 2);
      ctx.fill();

      /* ---- Sphere volume: a faint inner gradient so the dots read
         as sitting on a solid body, not floating in space. ---- */
      var sphereFill = ctx.createRadialGradient(
        cx - radius * 0.32, cy - radius * 0.32, radius * 0.05,
        cx, cy, radius
      );
      sphereFill.addColorStop(0, "rgba(" + GOLD[0] + "," + GOLD[1] + "," + GOLD[2] + ",0.07)");
      sphereFill.addColorStop(0.7, "rgba(" + GOLD[0] + "," + GOLD[1] + "," + GOLD[2] + ",0.02)");
      sphereFill.addColorStop(1, "rgba(" + GOLD[0] + "," + GOLD[1] + "," + GOLD[2] + ",0)");
      ctx.fillStyle = sphereFill;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      /* ---- Graticule: faint lat/lng wireframe grounding the globe
         as an actual sphere. ---- */
      graticuleLines.forEach(function (line) {
        ctx.beginPath();
        var began = false;
        for (var i = 0; i < line.length; i++) {
          var gp = project(line[i], rotation, tilt);
          var visible = gp.z > -0.15;
          if (!visible) { began = false; continue; }
          if (!began) { ctx.moveTo(gp.x, gp.y); began = true; }
          else { ctx.lineTo(gp.x, gp.y); }
        }
        ctx.strokeStyle = "rgba(" + GOLD[0] + "," + GOLD[1] + "," + GOLD[2] + ",0.09)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      var projLand = landDots.map(function (p) { return project(p, rotation, tilt); });
      projLand.forEach(function (p) {
        if (p.z < -0.28) return;
        var alpha = 0.1 + Math.max(0, (p.z + 1) / 2) * 0.5;
        var size = 0.9 + Math.max(0, (p.z + 1) / 2) * 1.3;
        ctx.beginPath();
        ctx.fillStyle = rgba(alpha);
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      /* ---- Flight-path arcs: full elevated great-circle path drawn
         at low, depth-cued alpha (so the route network reads even
         before the pulse arrives), plus a glowing comet-head pulse
         travelling along it. This is the unitedcarriers.com-style
         moment: visible routes, not just single blinking dots. ---- */
      var ARC_STEPS = 40;
      arcs.forEach(function (arc) {
        ctx.beginPath();
        var began = false;
        for (var s = 0; s <= ARC_STEPS; s++) {
          var st = s / ARC_STEPS;
          var sp = project(bulgePoint(arc.a, arc.b, st), rotation, tilt);
          var segVisible = sp.z > -0.32;
          if (!segVisible) { began = false; continue; }
          if (!began) { ctx.moveTo(sp.x, sp.y); began = true; }
          else { ctx.lineTo(sp.x, sp.y); }
        }
        ctx.strokeStyle = rgba(0.22);
        ctx.lineWidth = 1.1;
        ctx.stroke();

        if (arc.delay > 0) return;
        var t = Math.max(0, Math.min(1, arc.t));

        /* short comet tail behind the pulse head */
        for (var tail = 6; tail >= 1; tail--) {
          var tt = t - tail * 0.014;
          if (tt < 0) continue;
          var tp = project(bulgePoint(arc.a, arc.b, tt), rotation, tilt);
          if (tp.z < -0.1) continue;
          ctx.beginPath();
          ctx.fillStyle = rgba((1 - tail / 6) * 0.35);
          ctx.arc(tp.x, tp.y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }

        var p = project(bulgePoint(arc.a, arc.b, t), rotation, tilt);
        if (p.z < -0.1) return;
        var fade = Math.sin(Math.min(1, t) * Math.PI);
        ctx.save();
        ctx.shadowColor = "rgba(" + GOLD[0] + "," + GOLD[1] + "," + GOLD[2] + ",0.9)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.fillStyle = rgba(0.85 * fade + 0.15);
        ctx.arc(p.x, p.y, 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      /* hub markers + labels, front-facing only */
      var fontSize = Math.max(10, Math.min(12, width * 0.024));
      ctx.font = "500 " + fontSize + 'px "JetBrains Mono", ui-monospace, monospace';
      ctx.textBaseline = "middle";
      hubPoints.forEach(function (h) {
        var p = project(h, rotation, tilt);
        if (p.z < 0.12) return;
        var reveal = Math.min(1, (p.z - 0.12) / 0.35);
        var markerSize = h.home ? 4 : 3;
        ctx.beginPath();
        ctx.fillStyle = rgba(0.95 * reveal);
        ctx.arc(p.x, p.y, markerSize, 0, Math.PI * 2);
        ctx.fill();
        if (h.home) {
          ctx.beginPath();
          ctx.strokeStyle = rgba(0.5 * reveal);
          ctx.lineWidth = 1;
          ctx.arc(p.x, p.y, markerSize + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(245, 243, 238, " + (0.85 * reveal) + ")";
        ctx.textAlign = p.x > width / 2 ? "left" : "right";
        var labelX = p.x + (p.x > width / 2 ? 9 : -9);
        ctx.fillText(h.label, labelX, p.y);
      });

      if (!reduceMotion || dragging) {
        window.requestAnimationFrame(frame);
      }
    }

    function requestFrame() {
      if (!reduceMotion) { window.requestAnimationFrame(frame); return; }
      lastTime = null;
      frame(performance.now());
    }

    /* ---- Pointer drag: grab the globe and spin it ---- */
    canvas.style.touchAction = "none";
    canvas.style.cursor = "grab";

    canvas.addEventListener("pointerdown", function (e) {
      dragging = true;
      velocity = 0;
      lastPointer = { x: e.clientX, y: e.clientY, t: performance.now() };
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
      if (reduceMotion) window.requestAnimationFrame(frame);
    });

    canvas.addEventListener("pointermove", function (e) {
      if (!dragging || !lastPointer) return;
      var now = performance.now();
      var dx = e.clientX - lastPointer.x;
      var dy = e.clientY - lastPointer.y;
      var dtms = Math.max(1, now - lastPointer.t);
      rotation += dx * 0.0055;
      tilt = Math.max(-1.2, Math.min(0.5, tilt + dy * 0.0035));
      velocity = (dx * 0.0055) / (dtms / 1000);
      lastPointer = { x: e.clientX, y: e.clientY, t: now };
      if (reduceMotion) window.requestAnimationFrame(frame);
    });

    function releaseDrag(e) {
      if (!dragging) return;
      dragging = false;
      idleSince = 0;
      canvas.style.cursor = "grab";
      if (reduceMotion) {
        velocity = 0;
      } else {
        velocity = Math.max(-2.4, Math.min(2.4, velocity));
      }
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    canvas.addEventListener("pointerup", releaseDrag);
    canvas.addEventListener("pointercancel", releaseDrag);
    canvas.addEventListener("pointerleave", function (e) {
      if (dragging) releaseDrag(e);
    });

    function init() {
      buildLand();
      buildGraticule();
      buildHubs();
      buildArcs();
      resize();
      requestFrame();
    }

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resize();
        if (reduceMotion) frame(performance.now());
      }, 120);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        running = false;
      } else if (!running) {
        running = true;
        lastTime = null;
        requestFrame();
      }
    });

    init();
  }
})();
