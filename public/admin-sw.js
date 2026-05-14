const CACHE_NAME = 'admin-cache-v9';
const CACHE_PREFIX = 'admin-cache-';

const ADMIN_URLS = [
  '/login',
  '/login.html',
  '/login.css',
  '/login.js',
  '/china-divisions.js',
  '/linkhistory',
  '/linkhistory.html',
  '/linkhistory.js',
  '/superloginv',
  '/admin-update.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      ),
      clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 只缓存当前域名的 GET 请求
  if (event.request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // 只处理我们指定的后台相关的静态资源和页面
  const pathname = url.pathname;
  if (!ADMIN_URLS.includes(pathname) && pathname !== '/admin-sw.js') {
    return;
  }

  // 针对 /admin-sw.js 本身，始终走网络，不走本地缓存
  if (pathname === '/admin-sw.js') {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 在后台发起网络请求获取最新数据
      const fetchPromise = fetch(event.request).then(async (networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const cache = await caches.open(CACHE_NAME);

        if (cachedResponse) {
          // 比较新旧内容
          const hasHeaderChanged = (name) => {
            const cachedValue = cachedResponse.headers.get(name);
            const newValue = networkResponse.headers.get(name);
            return cachedValue && newValue && cachedValue !== newValue;
          };
          const hasUpdate =
            hasHeaderChanged('ETag') ||
            hasHeaderChanged('Last-Modified') ||
            hasHeaderChanged('Content-Length');

          if (hasUpdate) {
            // 通知前端页面有更新
            const clientsList = await self.clients.matchAll();
            for (const client of clientsList) {
              client.postMessage({ type: 'UPDATE_AVAILABLE' });
            }
          }
        }
        
        // 更新缓存
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      }).catch((err) => {
        console.error('Service Worker Fetch Error:', err);
        return cachedResponse || new Response('Service Unavailable', { status: 503 });
      });

      // 如果本地有缓存，立即返回渲染（秒开）；否则等待网络请求
      return cachedResponse || fetchPromise;
    })
  );
});
