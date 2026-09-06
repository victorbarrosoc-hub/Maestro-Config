/* Maestro — o entregador dos avisos deste aparelho.

   DE PROPÓSITO SEM `fetch`: um service worker que intercepta navegação
   passa a decidir qual HTML o aparelho vê, e esta casa já pagou caro por
   um aparelho preso numa versão antiga (v158). Sem `fetch`, o navegador
   continua buscando o index.html como sempre buscou, e a checagem de
   versão continua sendo a única dona desse assunto.

   O que ele faz é só isto: mostrar o aviso e levar a pessoa ao lugar
   certo quando ela toca nele. O `push` fica pronto para quando existir
   servidor — hoje quem manda mostrar é a própria página. */

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const destino = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil((async () => {
    const abas = await self.clients.matchAll({ type:'window', includeUncontrolled:true });
    for(const aba of abas){
      if(aba.url.includes(self.location.origin)){
        await aba.focus();
        try{ aba.postMessage({ maestro:'abrir', url: destino }); }catch(err){}
        return;
      }
    }
    await self.clients.openWindow(destino);
  })());
});

/* para quando houver servidor mandando (VAPID). Hoje não chega nada aqui. */
self.addEventListener('push', e => {
  let d = {};
  try{ d = e.data ? e.data.json() : {}; }catch(err){ d = {}; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Maestro', {
    body: d.corpo || '', tag: d.tag || 'maestro', data: { url: d.url || '/' },
    icon: '/icones/maestro-gesto-192.png', badge: '/icones/maestro-gesto-192.png'
  }));
});
