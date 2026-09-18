document.addEventListener('DOMContentLoaded',()=>{

const isTouch = matchMedia('(hover: none)').matches;

let lenis;
if(!isTouch && typeof Lenis!=='undefined'&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
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
  const target=document.querySelector(a.getAttribute('href'));
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

/* Teletype effect on the hero title — loops forever */
(()=>{
  const heroTitle=document.querySelector('.hero-title');
  if(!heroTitle)return;
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;

  /* On touch devices, show text statically — no typing loop needed */
  if(isTouch){
    /* Just make the text visible immediately, no animation */
    const walker2=document.createTreeWalker(heroTitle,NodeFilter.SHOW_TEXT,{
      acceptNode:n=>n.textContent.trim().length?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT
    });
    /* Text nodes already have content; nothing to do */
    return;
  }

  /* Collect every text node, its parent line element, and full text, then blank them */
  const walker=document.createTreeWalker(heroTitle,NodeFilter.SHOW_TEXT,{
    acceptNode:n=>n.textContent.trim().length?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT
  });
  const chars=[];   /* [{node, ch, lineEl}] */
  const nodes=[];   /* unique text nodes in order */
  let n;
  while(n=walker.nextNode()){
    const full=n.textContent;
    n.textContent='';
    const lineEl=n.parentElement.closest('.line')||n.parentElement;
    nodes.push({node:n,full});
    for(const ch of full)chars.push({node:n,ch,lineEl});
  }
  if(!chars.length)return;

  const cursor=document.createElement('span');
  cursor.className='type-cursor';
  cursor.setAttribute('aria-hidden','true');

  const TYPE_SPEED        = 52;
  const ERASE_SPEED       = 28;
  const PAUSE_AFTER_TYPE  = 2200;
  const PAUSE_AFTER_ERASE = 500;

  /* Rebuild every node's text from the chars array up to `count` chars typed */
  function renderAt(count){
    nodes.forEach(({node})=>{ node.textContent=''; });
    for(let i=0;i<count;i++) chars[i].node.textContent+=chars[i].ch;
    if(count>0){
      chars[count-1].lineEl.appendChild(cursor);
    } else {
      chars[0].lineEl.prepend(cursor);
    }
  }

  let timer=null;
  function loop(){
    let i=0;
    function typeStep(){
      renderAt(i);
      if(i>=chars.length){
        timer=setTimeout(eraseStart,PAUSE_AFTER_TYPE);
        return;
      }
      i++;
      timer=setTimeout(typeStep,TYPE_SPEED);
    }
    function eraseStart(){
      timer=setTimeout(eraseStep,ERASE_SPEED);
    }
    function eraseStep(){
      i--;
      renderAt(i);
      if(i<=0){
        timer=setTimeout(loop,PAUSE_AFTER_ERASE);
        return;
      }
      timer=setTimeout(eraseStep,ERASE_SPEED);
    }
    typeStep();
  }

  let running=false;
  new IntersectionObserver(es=>{
    es.forEach(e=>{
      if(e.isIntersecting&&!running){
        running=true;
        loop();
      }
    });
  },{threshold:.1}).observe(heroTitle);
})();

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