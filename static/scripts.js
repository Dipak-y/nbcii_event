document.addEventListener('DOMContentLoaded', function () {
  var lenis = null;
  if (typeof Lenis !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    lenis = new Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    var raf = function (time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  var menuToggle = document.querySelector('[data-menu-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', function () {
      var open = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!open));
      menuToggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      menuToggle.classList.toggle('is-open', !open);
      mobileNav.classList.toggle('is-open', !open);
    });
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open menu');
        menuToggle.classList.remove('is-open');
        mobileNav.classList.remove('is-open');
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: 0 });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (element) {
    revealObserver.observe(element);
  });

  var sections = ['home', 'about', 'pillars', 'delegates', 'programme', 'gallery', 'outcomes', 'registration', 'contact'];
  var navLinks = document.querySelectorAll('.nav-link');
  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      navLinks.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
      });
    });
  }, { rootMargin: '-28% 0px -62% 0px', threshold: 0 });
  sections.forEach(function (id) {
    var section = document.getElementById(id);
    if (section) sectionObserver.observe(section);
  });

  var galleryToggle = document.querySelector('[data-gallery-toggle]');
  if (galleryToggle) {
    galleryToggle.addEventListener('click', function () {
      var expanded = galleryToggle.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.gallery-extra').forEach(function (item) {
        item.classList.toggle('is-visible', !expanded);
      });
      galleryToggle.setAttribute('aria-expanded', String(!expanded));
      galleryToggle.innerHTML = expanded ? 'View more <span aria-hidden="true">↓</span>' : 'View less <span aria-hidden="true">↑</span>';
    });
  }

  function showStatus(form, type, message) {
    var status = form.querySelector('.form-status');
    status.className = 'form-status is-visible ' + type;
    status.textContent = message;
  }

  function formPayload(form, kind) {
    var data = new FormData(form);
    var payload = {};
    data.forEach(function (value, key) {
      if (key === 'interests') {
        if (!payload.interests) payload.interests = [];
        payload.interests.push(value);
      } else {
        payload[key] = value;
      }
    });
    if (kind === 'enquiry' && !payload.phone) payload.phone = '';
    return payload;
  }

  document.querySelectorAll('[data-api-form]').forEach(function (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var kind = form.getAttribute('data-api-form');
      var required = Array.from(form.querySelectorAll('[required]'));
      var interests = form.querySelectorAll('input[name="interests"]:checked');
      var valid = required.every(function (field) { return field.checkValidity(); }) && (kind !== 'registration' || interests.length > 0);
      if (!valid) {
        showStatus(form, 'error', kind === 'registration' ? 'Please complete the required fields and select at least one area of interest.' : 'Please complete the required fields. Your message should be at least 10 characters.');
        return;
      }

      var button = form.querySelector('button[type="submit"]');
      var originalLabel = button.innerHTML;
      button.disabled = true;
      button.innerHTML = 'Sending…';
      try {
        var response = await fetch('/api/forum/' + (kind === 'registration' ? 'registrations' : 'enquiries'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formPayload(form, kind))
        });
        var result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to submit right now.');
        showStatus(form, 'success', result.message + ' Reference: ' + result.reference + '.');
        form.reset();
      } catch (error) {
        showStatus(form, 'error', error.message || 'We could not submit your form right now. Please try again.');
      } finally {
        button.disabled = false;
        button.innerHTML = originalLabel;
      }
    });
  });
});