if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}

let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  const banner = document.getElementById('pwa-install');
  if (banner) banner.hidden = false;
});

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-pwa-install]');
  if (!button || !deferredInstallPrompt) return;

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;

  const banner = document.getElementById('pwa-install');
  if (banner) banner.hidden = true;
});
