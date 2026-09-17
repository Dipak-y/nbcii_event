document.addEventListener('DOMContentLoaded',()=>{

let lenis;
if(typeof Lenis!=='undefined'&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
  lenis=new Lenis({duration:1.1,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true});
  const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)};
  requestAnimationFrame(raf);
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

  mobile.querySelectorAll('a').forEach(a=>a.onclick=()=>{
    menu.setAttribute('aria-expanded','false');
    menu.setAttribute('aria-label','Open menu');
    menu.classList.remove('is-open');
    mobile.classList.remove('is-open');
  });
}

/* Smooth links */
document.querySelectorAll('a[href^="#"]').forEach(a=>a.onclick=e=>{
  const target=document.querySelector(a.getAttribute('href'));
  if(!target)return;
  e.preventDefault();
  lenis?lenis.scrollTo(target):target.scrollIntoView({behavior:'smooth'});
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

});