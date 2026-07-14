/* Shared UI behavior — mobile menu + "Coming Soon" gating.
   Reads flags from js/config.js. Does not touch booking/driver submission logic. */
document.addEventListener('DOMContentLoaded', function () {

  /* Mobile app-bar */
  const toggle = document.getElementById('menuToggle');
  const panel = document.getElementById('mobilePanel');
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      toggle.classList.toggle('open');
      panel.classList.toggle('open');
    });
  }

  /* Coming Soon modal */
  const overlay = document.getElementById('csOverlay');
  const csTitle = document.getElementById('csTitle');
  const csText = document.getElementById('csText');

  window.showComingSoon = function (title, text) {
    if (!overlay) return;
    csTitle.textContent = title;
    csText.textContent = text;
    overlay.classList.add('open');
  };
  window.closeComingSoon = function () {
    if (overlay) overlay.classList.remove('open');
  };

  /* Download App button(s) */
  document.querySelectorAll('.js-download-app').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      if (!ULAGO_CONFIG.APP_LIVE) {
        e.preventDefault();
        window.showComingSoon('UlaGo App — Coming Soon', 'Our app is currently in the works and will be available on Play Store and App Store: ' + ULAGO_CONFIG.APP_LAUNCH_TEXT + '. Meanwhile, you can register as a driver right here on the website.');
      }
    });
  });

  /* Passenger booking gate — works for <a href> and buttons with data-href */
  document.querySelectorAll('.js-book-ride').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (!ULAGO_CONFIG.PASSENGER_BOOKING_LIVE) {
        e.preventDefault();
        window.showComingSoon('Passenger Booking — Coming Soon', 'Online passenger booking is ' + ULAGO_CONFIG.PASSENGER_LAUNCH_TEXT.toLowerCase() + '. Right now, you can join our driver network — registration is live today.');
      } else if (el.dataset.href) {
        window.location.href = el.dataset.href;
      }
    });
  });

  /* Auto-inject a small "Coming Soon" badge next to marked elements
     whenever passenger booking isn't live yet — removes itself automatically
     the moment PASSENGER_BOOKING_LIVE is switched to true in config.js */
  if (!ULAGO_CONFIG.PASSENGER_BOOKING_LIVE) {
    document.querySelectorAll('.js-badge-target').forEach(function (el) {
      const badge = document.createElement('span');
      badge.className = 'cs-badge';
      badge.textContent = 'Coming Soon';
      el.appendChild(badge);
    });
  }

  /* If passenger.html itself is opened directly while booking is not live,
     swap the select view for a Coming Soon panel. */
  if (document.getElementById('view-select') && !ULAGO_CONFIG.PASSENGER_BOOKING_LIVE) {
    const cs = document.getElementById('passengerComingSoon');
    if (cs) {
      document.getElementById('view-select').classList.remove('active');
      cs.classList.add('active');
    }
  }
});