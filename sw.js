// Service Worker for 化学物性查询 PWA
// 版本号
const CACHE_NAME = 'chem-query-v1';
const urlsToCache = [
  './chemical_properties_query_pwa.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安装事件：缓存资源
self.addEventListener('install', function(event) {
  console.log('[SW] 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] 缓存资源');
      return cache.addAll(urlsToCache);
    }).then(function() {
      console.log('[SW] 安装完成');
      return self.skipWaiting();
    })
  );
});

// 激活事件：清理旧缓存
self.addEventListener('activate', function(event) {
  console.log('[SW] 激活中...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('[SW] 激活完成');
      return self.clients.claim();
    })
  );
});

// 拦截请求：优先使用缓存
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      // 缓存命中
      if (response) {
        console.log('[SW] 缓存命中:', event.request.url);
        return response;
      }
      
      // 缓存未命中，从网络获取
      console.log('[SW] 网络请求:', event.request.url);
      return fetch(event.request).then(function(response) {
        // 检查响应是否有效
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // 克隆响应（流只能读一次）
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then(function(cache) {
          console.log('[SW] 缓存新资源:', event.request.url);
          cache.put(event.request, responseToCache);
        });
        
        return response;
      });
    }).catch(function() {
      console.log('[SW] 请求失败:', event.request.url);
      // 可以返回一个离线页面
    })
  );
});

console.log('[SW] Service Worker 已加载');
