// submit.js
document.addEventListener('DOMContentLoaded', ()=> {
  const form = document.getElementById('uploadForm');
  const dropbox = document.getElementById('dropbox');
  const mediaInput = document.getElementById('mediaInput');
  const progressWrap = document.getElementById('progressWrap');
  const progressBar = document.getElementById('progressBar');
  const submitBtn = document.getElementById('submitBtn');
  const msg = document.getElementById('msg');
  const fields = document.querySelectorAll('.field');

  // label animation: focus/blur
  fields.forEach(f=>{
    const input = f.querySelector('input, select, textarea');
    const label = f.querySelector('label');
    input.addEventListener('focus', ()=> f.classList.add('focused'));
    input.addEventListener('blur', ()=> {
      if (!input.value) f.classList.remove('focused');
    });
    // pre-fill focused if value present
    if (input.value) f.classList.add('focused');
  });

  // open file dialog when clicking dropbox
  dropbox.addEventListener('click', ()=> mediaInput.click());

  // drag events
  ['dragenter','dragover'].forEach(ev=>{
    dropbox.addEventListener(ev, (e)=> {
      e.preventDefault(); e.stopPropagation();
      dropbox.classList.add('dragover');
    });
  });
  ['dragleave','drop'].forEach(ev=>{
    dropbox.addEventListener(ev, (e)=> {
      e.preventDefault(); e.stopPropagation();
      if (ev === 'drop') {
        const files = e.dataTransfer.files;
        if (files && files.length) mediaInput.files = files;
      }
      dropbox.classList.remove('dragover');
    });
  });

  // show file name
  mediaInput.addEventListener('change', ()=> {
    if (mediaInput.files && mediaInput.files[0]) {
      document.getElementById('dropText').textContent = mediaInput.files[0].name;
    }
  });

  // submit handler with XHR for progress
  form.addEventListener('submit', (e)=> {
    e.preventDefault();
    msg.textContent = '';
    const file = mediaInput.files[0];
    if (!file) {
      msg.textContent = 'Please choose a file to upload.';
      return;
    }
    // client-side mime validation (defense in depth)
    if (!file.type.startsWith('image/') && !file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      msg.textContent = 'Only images, audio and video files are allowed.';
      return;
    }

    const fd = new FormData();
    fd.append('media', file);
    fd.append('title', document.getElementById('u-title').value || '');
    fd.append('author', document.getElementById('u-name').value || '');
    fd.append('category', document.getElementById('u-cat').value || 'pictures');

    // UI: show progress
    progressWrap.style.display = 'block';
    progressBar.style.width = '2%';
    submitBtn.disabled = true;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);

    xhr.upload.onprogress = function(e) {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        progressBar.style.width = pct + '%';
      }
    };

    xhr.onload = function() {
      submitBtn.disabled = false;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          if (json.ok) {
            progressBar.style.width = '100%';
            msg.style.color = 'var(--accent2)';
            msg.textContent = 'Upload successful!';
            // success animation: pulse container
            const wrap = document.getElementById('submitWrap');
            wrap.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1)' }], { duration: 700 });
            // reset after short delay
            setTimeout(()=> {
              progressWrap.style.display = 'none';
              progressBar.style.width = '0%';
              form.reset();
              document.getElementById('dropText').textContent = 'Drag & drop your file here, or click to choose';
              fields.forEach(f => f.classList.remove('focused'));
            }, 1200);
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

    xhr.onerror = function() {
      submitBtn.disabled = false;
      msg.style.color = 'tomato';
      msg.textContent = 'Network error during upload.';
    };

    xhr.send(fd);
  });
});

// === FILE BUTTON ANIMATION AND LABEL ===
const mediaInput = document.getElementById('mediaInput');
const uploadArea = document.getElementById('dropbox');

// Create a span to show file name
const fileNameDisplay = document.createElement('div');
fileNameDisplay.classList.add('file-name');
uploadArea.appendChild(fileNameDisplay);

// Click to open file selector
uploadArea.querySelector('.browse').addEventListener('click', () => {
  mediaInput.click();
});

// Show selected file name
mediaInput.addEventListener('change', () => {
  if (mediaInput.files.length > 0) {
    fileNameDisplay.textContent = `📁 ${mediaInput.files[0].name}`;
  } else {
    fileNameDisplay.textContent = '';
  }
});

// Drag and drop feedback
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  mediaInput.files = e.dataTransfer.files;
  if (mediaInput.files.length > 0) {
    fileNameDisplay.textContent = `📁 ${mediaInput.files[0].name}`;
  }
});

