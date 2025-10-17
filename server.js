const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PUBLIC = path.join(__dirname, 'public');
const UPLOADS = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

app.use(express.static(PUBLIC));
app.use('/uploads', express.static(UPLOADS));

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-\_]/g, '_');
    cb(null, safe);
  }
});

// Accept only images, audio, video
function fileFilter (req, file, cb) {
  const allowed = /^(image|audio|video)\//;
  if (allowed.test(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type. Only images, audio and video are allowed.'), false);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB limit

app.post('/api/upload', upload.single('media'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok:false, error: 'No file uploaded' });
    const { title = '', author = '', category = 'pictures' } = req.body;
    const meta = {
      id: req.file.filename,
      originalName: req.file.originalname,
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      title, author, category,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    };
    // write metadata file
    fs.writeFileSync(path.join(UPLOADS, req.file.filename + '.json'), JSON.stringify(meta, null, 2));
    return res.json({ ok:true, media: meta });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok:false, error: 'Upload failed' });
  }
});

// list media
app.get('/api/media', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOADS);
    const metas = files.filter(f=>f.endsWith('.json')).map(f=>{
      try { return JSON.parse(fs.readFileSync(path.join(UPLOADS,f),'utf8')); }
      catch(e){ return null; }
    }).filter(Boolean).sort((a,b)=> new Date(b.uploadedAt)-new Date(a.uploadedAt));
    res.json({ ok:true, media: metas });
  } catch(err){
    console.error(err); res.status(500).json({ ok:false, error:'Could not list media' });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Media Portal running on http://localhost:${PORT}`));
