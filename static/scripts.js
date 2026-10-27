function init(){

const isTouch = matchMedia('(hover: none)').matches;

/* On real touch devices there is no cursor, so :hover never fires.
   Tapping a card applies the same visual state that :hover gives on desktop;
   tapping elsewhere (or another card) clears it. */
if(isTouch){
  const touchGroups = ['.pillar-panel', '.programme-row', '.delegate-item', '.outcome-card'];
  touchGroups.forEach(sel=>{
    const items = document.querySelectorAll(sel);
    items.forEach(item=>{
      item.addEventListener(sel === '.programme-row' ? 'click' : 'touchstart', () => {
        items.forEach(i=>{ if(i!==item) i.classList.remove('is-touched'); });
        item.classList.toggle('is-touched');
      }, {passive:true});
    });
  });
  document.addEventListener('touchstart', e=>{
    touchGroups.forEach(sel=>{
      document.querySelectorAll(sel).forEach(item=>{
        if(!item.contains(e.target)) item.classList.remove('is-touched');
      });
    });
  }, {passive:true});
}

/* Hero: keep the exact desktop layout at every screen size — instead of
   reflowing into a stacked/row-wise mobile view, shrink the whole block
   as one unit so it always looks like a scaled-down desktop hero. */
(function scaleHero(){
  const copy = document.querySelector('.hero-copy');
  const inner = document.querySelector('.hero-inner');
  if(!copy||!inner) return;
  const DESIGN_WIDTH = 1180; // matches .hero-copy's fixed width in CSS

  function apply(){
    const available = inner.clientWidth;
    let scale = available / DESIGN_WIDTH;
    scale = Math.min(scale, 1);   // never enlarge past true desktop size
    scale = Math.max(scale, 0.34); // stay legible on very small phones
    copy.style.transform = `scale(${scale})`;
  }

  apply();
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', apply);
})();

let lenis;
if(!isTouch && typeof Lenis!=='undefined'&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
  lenis=new Lenis({duration:1.1,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true});
  const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)};
  requestAnimationFrame(raf);

  /* Fix: Lenis measures page height once on init. Images that finish
     loading afterwards (many are lazy-loaded) and web fonts that swap
     in later both grow the page, but Lenis never finds out — so its
     cached scroll limit stops short and the footer becomes unreachable.
     Recalculate whenever the page's real height changes. */
  window.addEventListener('load', () => lenis.resize());
  document.fonts && document.fonts.ready.then(() => lenis.resize());
  document.querySelectorAll('img').forEach(img => {
    if (!img.complete) img.addEventListener('load', () => lenis.resize());
  });
  new ResizeObserver(() => lenis.resize()).observe(document.body);
}

/* Mobile menu */
const menu=document.querySelector('[data-menu-toggle]');
const mobile=document.querySelector('[data-mobile-nav]');

if(menu&&mobile){
  menu.onclick=()=>{
    const open=menu.getAttribute('aria-expanded')==='true';
    menu.setAttribute('aria-expanded',!open);
    menu.setAttribute('aria-label',open?'Open menu':'Close menu');
    menu.classList.toggle('is-open',!open);
    mobile.classList.toggle('is-open',!open);
  };
}

function closeMobileMenu(){
  if(!menu||!mobile)return;
  menu.setAttribute('aria-expanded','false');
  menu.setAttribute('aria-label','Open menu');
  menu.classList.remove('is-open');
  mobile.classList.remove('is-open');
}

/* Smooth links (also closes the mobile menu when a link is used) */
document.querySelectorAll('a[href^="#"]').forEach(a=>a.onclick=e=>{
  const href=a.getAttribute('href');
  const target=document.querySelector(href);
  closeMobileMenu();
  if(!target)return;
  e.preventDefault();
  lenis?lenis.scrollTo(target,{offset:-96}):target.scrollIntoView({behavior:'smooth'});
});

/* Reveal animation */
const reveal=new IntersectionObserver(es=>{
  es.forEach(e=>{
    if(e.isIntersecting)e.target.classList.add('is-visible');
  });
},{threshold:.12});

document.querySelectorAll('.reveal').forEach(e=>reveal.observe(e));

/* Active navigation */
const links=document.querySelectorAll('.nav-link');

new IntersectionObserver(es=>{
  es.forEach(e=>{
    if(e.isIntersecting)
      links.forEach(l=>l.classList.toggle(
        'active',
        l.getAttribute('href')==='#'+e.target.id
      ));
  });
},{rootMargin:'-28% 0px -62% 0px'}).observe(document.querySelector('#home'));

document.querySelectorAll('section[id]').forEach(s=>{
  new IntersectionObserver(es=>{
    es.forEach(e=>{
      if(e.isIntersecting)
        links.forEach(l=>l.classList.toggle(
          'active',
          l.getAttribute('href')==='#'+e.target.id
        ));
    });
  },{rootMargin:'-28% 0px -62% 0px'}).observe(s);
});

/* Gallery */
const galleryBtn=document.querySelector('[data-gallery-toggle]');

if(galleryBtn){
  galleryBtn.onclick=()=>{
    const open=galleryBtn.getAttribute('aria-expanded')==='true';

    document.querySelectorAll('.gallery-extra')
      .forEach(e=>e.classList.toggle('is-visible',!open));

    galleryBtn.setAttribute('aria-expanded',!open);
    galleryBtn.innerHTML=open
      ?'View more <span>↓</span>'
      :'View less <span>↑</span>';
  };
}

/* Contact form -> EmailJS */
const form=document.querySelector('.contact-form');
if(form){
  const status=form.querySelector('.form-status');
  const button=form.querySelector('button[type="submit"]');

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(form.website.value) return; /* bot */

    const label=button.innerHTML;
    button.disabled=true;
    button.innerHTML='Sending…';

    try{
      await emailjs.sendForm(
        'service_cfez7m6',
        'template_avt9akk',
        form,
        {publicKey:'eV2MlxTKkUNwjdc3l'}
      );
      status.className='form-status is-visible success';
      status.textContent='Thank you! Your message has been sent.';
      form.reset();
    }catch(err){
      status.className='form-status is-visible error';
      status.textContent='Could not send. Please try again.';
    }finally{
      button.disabled=false;
      button.innerHTML=label;
    }
  });
}

}

// defer guarantees DOM is ready — call immediately
init();

/* ---- Delegates: interactive index (hover / focus / click a group -> spotlight panel; accordion on phones) ---- */
(function () {
  var root = document.getElementById('delegates');
  if (!root) return;
  var items = Array.prototype.slice.call(root.querySelectorAll('.dg-item'));
  var panel = root.querySelector('.dg-panel');
  var body = root.querySelector('.dg-panel-body');
  var elIcon = root.querySelector('.dg-icon i');
  var elCount = root.querySelector('.dg-count');
  var elTitle = root.querySelector('.dg-title');
  var elText = root.querySelector('.dg-text');
  var mobile = window.matchMedia('(max-width: 820px)');
  var current = 0, timer;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function paint(i) {
    var it = items[i];
    elIcon.className = 'fas ' + it.getAttribute('data-icon');
    elCount.textContent = 'Group ' + pad(i + 1) + ' / ' + pad(items.length);
    elTitle.textContent = it.querySelector('.dg-name').textContent;
    elText.textContent = it.querySelector('.dg-desc').textContent;
    panel.setAttribute('data-num', pad(i + 1));
  }

  function activate(i) {
    items.forEach(function (it, idx) {
      var on = idx === i;
      it.classList.toggle('is-active', on);
      it.querySelector('.dg-tab').setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    if (i === current) return;
    current = i;
    clearTimeout(timer);
    body.classList.add('is-out');
    timer = setTimeout(function () { paint(i); body.classList.remove('is-out'); }, 160);
  }

  items.forEach(function (it, i) {
    var tab = it.querySelector('.dg-tab');
    it.addEventListener('mouseenter', function () { if (!mobile.matches) activate(i); });
    tab.addEventListener('focus', function () { if (!mobile.matches) activate(i); });
    tab.addEventListener('click', function () {
      if (mobile.matches && it.classList.contains('is-active')) {
        it.classList.remove('is-active');
        tab.setAttribute('aria-expanded', 'false');
      } else {
        activate(i);
      }
    });
  });
})();


/* ---- Gallery lightbox ---- */
(function () {
  var box = document.getElementById('lightbox');
  if (!box) return;
  var img = box.querySelector('.lb-img');
  var text = box.querySelector('.lb-text');
  var count = box.querySelector('.lb-count');
  var idx = 0, startX = 0;

  function items() {
    /* all gallery images, including the ones hidden behind "View more" */
    return Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));
  }
  function show(i) {
    var list = items();
    if (!list.length) return;
    idx = (i + list.length) % list.length;
    var src = list[idx].querySelector('img');
    var cap = list[idx].querySelector('.gallery-caption-text');
    img.classList.add('is-loading');
    img.onload = function () { img.classList.remove('is-loading'); };
    img.src = src.currentSrc || src.src;
    img.alt = src.alt;
    text.textContent = cap ? cap.textContent : '';
    count.textContent = (idx + 1) + ' / ' + list.length;
    /* preload neighbours */
    [idx - 1, idx + 1].forEach(function (n) {
      var el = list[(n + list.length) % list.length].querySelector('img');
      if (el) new Image().src = el.src;
    });
  }
  function open(i) {
    show(i);
    box.classList.add('is-open');
    requestAnimationFrame(function () { box.classList.add('is-show'); });
    document.documentElement.style.overflow = 'hidden';
    box.querySelector('.lb-close').focus();
  }
  function close() {
    box.classList.remove('is-show');
    setTimeout(function () { box.classList.remove('is-open'); img.removeAttribute('src'); }, 250);
    document.documentElement.style.overflow = '';
  }

  document.addEventListener('click', function (e) {
    var fig = e.target.closest('.gallery-item');
    if (fig) { open(items().indexOf(fig)); }
  });
  box.querySelector('.lb-close').addEventListener('click', close);
  box.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
  box.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
  box.addEventListener('click', function (e) {
    if (e.target === box || e.target.classList.contains('lb-stage')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });
  box.addEventListener('touchstart', function (e) { startX = e.changedTouches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();