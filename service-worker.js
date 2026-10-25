const CACHE_NAME = 'mee-keb-shell-2026-10-25';
const SHELL_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];
const NET_TIMEOUT_MS = 3000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // ข้อมูลจริง (Apps Script) และ request ที่ไม่ใช่ GET ต้องสดเสมอ ไม่แตะแคช
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // ตัวแอป: เอาของใหม่จากเน็ตก่อนเสมอ ถ้าเน็ตช้า/ไม่มีเน็ตค่อยใช้ของในแคช
  // (กันอาการอัปโหลดไฟล์ใหม่แล้วมือถือยังเห็นของเก่า)
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(req).then((cached) => {
        const fromNet = fetch(req).then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        });
        if (!cached) return fromNet.catch(() => cached || Response.error());
        return new Promise((resolve) => {
          let settled = false;
          const done = (r) => { if (!settled && r) { settled = true; resolve(r); } };
          const timer = setTimeout(() => done(cached), NET_TIMEOUT_MS);
          fromNet.then((res) => { clearTimeout(timer); done(res); })
                 .catch(() => { clearTimeout(timer); done(cached); });
        });
      })
    )
  );
});
