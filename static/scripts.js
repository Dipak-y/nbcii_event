function init(){

const isTouch = matchMedia('(hover: none)').matches;

/* On real touch devices there is no cursor, so :hover never fires.
   Tapping a card applies the same visual state that :hover gives on desktop;
   tapping elsewhere (or another card) clears it. */
if(isTouch){
  const touchGroups = ['.pillar-panel', '.delegate-item', '.outcome-card'];
  touchGroups.forEach(sel=>{
    const items = document.querySelectorAll(sel);
    items.forEach(item=>{
      item.addEventListener('touchstart', ()=>{
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

/* Forms */
document.querySelectorAll('[data-api-form]').forEach(form=>{

  form.onsubmit=async e=>{
    e.preventDefault();

    const type=form.dataset.apiForm;
    const required=[...form.querySelectorAll('[required]')];
    const interests=form.querySelectorAll('input[name="interests"]:checked');
    const status=form.querySelector('.form-status');
    const button=form.querySelector('button[type="submit"]');

    if(!required.every(x=>x.checkValidity()) ||
       (type==='registration'&&!interests.length)){
      status.className='form-status is-visible error';
      status.textContent='Please complete all required fields.';
      return;
    }

    const old=button.innerHTML;
    button.disabled=true;
    button.innerHTML='Sending…';

    try{
      const response=await fetch(
        type==='registration'
          ?'/api/forum/registrations/'
          :'/api/forum/contact/',
        {
          method:'POST',
          headers:{
            'X-CSRFToken':
              form.querySelector('[name=csrfmiddlewaretoken]')?.value||''
          },
          body:new FormData(form),
          credentials:'same-origin'
        }
      );

      const data=await response.json();

      if(!response.ok)
        throw new Error(data.error||'Unable to submit.');

      status.className='form-status is-visible success';
      status.textContent=
        `${data.message}. Reference: ${data.reference||''}`;

      form.reset();

    }catch(error){
      status.className='form-status is-visible error';
      status.textContent=error.message;
    }finally{
      button.disabled=false;
      button.innerHTML=old;
    }
  };

});

}

// defer guarantees DOM is ready — call immediately
init();