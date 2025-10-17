document.addEventListener('DOMContentLoaded', function(){
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if(menuToggle){
    menuToggle.addEventListener('click', ()=>{
      menuToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
    });
  }

  // active link highlight
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(a => {
    if(a.href === window.location.href) a.classList.add('active');
  });

  // populate gallery dynamically with animated insights
  const gallery = document.getElementById('gallery');
  const items = [
    {title:'Aurora Night', insight:'A shimmering sky — reminds us of small moments that spark wonder.', src:'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=60'},
    {title:'Desert Calm', insight:'Warm light and quiet dunes. A moment to breathe.', src:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=60'},
    {title:'Mountain Mirror', insight:'Reflections that challenge our perception of scale.', src:'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=60'},
    {title:'Urban Glow', insight:'City nights bring stories in lights and shadows.', src:'https://images.unsplash.com/photo-1497493292307-31c376b6e479?auto=format&fit=crop&w=800&q=60'}
  ];

  items.forEach((it, idx)=>{
    const el = document.createElement('article');
    el.className = 'gallery-item';
    el.innerHTML = `
      <img src="${it.src}" alt="${it.title}" />
      <div class="meta">
        <h4>${it.title}</h4>
        <p>${it.insight}</p>
      </div>
    `;
    el.style.opacity = 0;
    el.style.transform = 'translateY(18px)';
    gallery.appendChild(el);
    setTimeout(()=>{
      el.style.transition = 'all 600ms cubic-bezier(.2,.8,.2,1)';
      el.style.opacity = 1;
      el.style.transform = 'translateY(0)';
    }, 120 * idx);
  });

  // word animation
  const words = document.querySelectorAll('.word-animate');
  words.forEach((w, i)=>{
    let texts = ['listen','watch','share','create'];
    let k = 0;
    setInterval(()=>{
      w.style.transition = 'opacity .4s ease, transform .4s ease';
      w.style.opacity = 0;
      w.style.transform = 'translateY(-6px)';
      setTimeout(()=>{
        w.textContent = texts[(k++) % texts.length];
        w.style.opacity = 1;
        w.style.transform = 'translateY(0)';
      }, 420);
    }, 2500 + (i*300));
  });

  // submit.js — drag/drop, floating labels, XHR upload with progress, success animation
document.addEventListener('DOMContentLoaded', () => {
  const dropbox = document.getElementById('dropbox');
  const mediaInput = document.getElementById('mediaInput');
  const form = document.getElementById('uploadForm');
  const progressWrap = document.getElementById('progressWrap') || document.querySelector('.progress-wrap');
  const progressBar = document.getElementById('progressBar');
  const progressLabel = document.getElementById('progressLabel');
  const msg = document.getElementById('msg');
  const submitBtn = document.getElementById('submitBtn');
  const fields = document.querySelectorAll('.field');

  const successOverlay = document.getElementById('successOverlay');
  const confettiWrap = document.getElementById('confetti');

  // Floating label: set .has-value if input has content
  fields.forEach(f => {
    const input = f.querySelector('input, select');
    function update() {
      if (input.value && input.value.trim() !== '') f.classList.add('has-value');
      else f.classList.remove('has-value');
    }
    input.addEventListener('input', update);
    input.addEventListener('focus', () => f.classList.add('has-value'));
    input.addEventListener('blur', update);
    update();
  });

  // click to open file
  dropbox.addEventListener('click', () => mediaInput.click());

  // keyboard accessible
  dropbox.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') mediaInput.click(); });

  // drag events
  ['dragenter','dragover'].forEach(ev => {
    dropbox.addEventListener(ev, e => {
      e.preventDefault(); e.stopPropagation();
      dropbox.classList.add('dragover');
    });
  });
  ['dragleave','drop'].forEach(ev => {
    dropbox.addEventListener(ev, e => {
      e.preventDefault(); e.stopPropagation();
      if (ev === 'drop' && e.dataTransfer.files && e.dataTransfer.files.length) {
        mediaInput.files = e.dataTransfer.files;
        updateDropText();
      }
      dropbox.classList.remove('dragover');
    });
  });

  mediaInput.addEventListener('change', updateDropText);
  function updateDropText(){
    if (mediaInput.files && mediaInput.files[0]) {
      dropbox.querySelector('.upload-instructions .text strong').textContent = mediaInput.files[0].name;
    } else {
      dropbox.querySelector('.upload-instructions .text strong').textContent = 'Drag & drop';
    }
  }

  // upload handler with XHR to /api/upload
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    msg.textContent = '';
    const file = mediaInput.files[0];
    if (!file) {
      msg.textContent = 'Please choose a file to upload.';
      return;
    }

    // client-side MIME check
    if (!file.type.startsWith('image/') && !file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      msg.textContent = 'Invalid file type. Please upload an image, audio, or video file.';
      return;
    }

    const fd = new FormData();
    fd.append('media', file);
    fd.append('title', document.getElementById('u-title').value || '');
    fd.append('author', document.getElementById('u-name').value || '');
    fd.append('category', document.getElementById('u-cat').value || 'pictures');

    progressWrap && (progressWrap.style.display = 'block');
    progressBar && (progressBar.style.width = '2%');
    progressLabel && (progressLabel.textContent = '0%');
    submitBtn.disabled = true;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        const pct = Math.round((ev.loaded / ev.total) * 100);
        if (progressBar) progressBar.style.width = pct + '%';
        if (progressLabel) progressLabel.textContent = pct + '%';
      }
    };

    xhr.onload = () => {
      submitBtn.disabled = false;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          if (json.ok) {
            if (progressBar) progressBar.style.width = '100%';
            if (progressLabel) progressLabel.textContent = '100%';
            showSuccess(json.file);
            setTimeout(resetForm, 1400);
          } else {
            throw new Error(json.error || 'Upload failed');
          }
        } catch (err) {
          msg.style.color = 'tomato';
          msg.textContent = err.message || 'Unexpected response';
        }
      } else {
        msg.style.color = 'tomato';
        msg.textContent = 'Upload failed. Server returned status ' + xhr.status;
      }
    };

    xhr.onerror = () => {
      submitBtn.disabled = false;
      msg.style.color = 'tomato';
      msg.textContent = 'Network error during upload.';
    };

    xhr.send(fd);
  });

  function resetForm(){
    form.reset();
    updateDropText();
    fields.forEach(f => f.classList.remove('has-value'));
    progressWrap && (progressWrap.style.display = 'none');
    progressBar && (progressBar.style.width = '0%');
    if (successOverlay) successOverlay.classList.remove('show');
    clearConfetti();
  }

  // success + confetti
  function showSuccess(fileMeta){
    const overlay = successOverlay;
    if (!overlay) return;
    overlay.classList.add('show');
    // create confetti pieces
    createConfetti(22);
    // set message (optional)
    const msgBox = document.getElementById('msg');
    msgBox.style.color = 'var(--accent2)';
    msgBox.textContent = `Uploaded: ${fileMeta.originalName || fileMeta.filename}`;
  }

  function createConfetti(n){
    if (!confettiWrap) return;
    confettiWrap.innerHTML = '';
    const colors = ['#7c5cff','#00d1ff','#ffd166','#ff6b6b','#8ce99a'];
    for (let i=0;i<n;i++){
      const s = document.createElement('span');
      const left = Math.random()*100;
      s.style.left = left + '%';
      s.style.background = colors[i % colors.length];
      s.style.width = (6 + Math.random()*10) + 'px';
      s.style.height = (8 + Math.random()*12) + 'px';
      s.style.transform = `translateY(-10vh) rotate(${Math.random()*360}deg)`;
      s.style.animationDelay = (Math.random()*300) + 'ms';
      s.style.opacity = 0;
      confettiWrap.appendChild(s);
    }
    // remove after animation
    setTimeout(()=> clearConfetti(), 2000);
  }

  function clearConfetti(){
    if (confettiWrap) confettiWrap.innerHTML = '';
  }
});


});
