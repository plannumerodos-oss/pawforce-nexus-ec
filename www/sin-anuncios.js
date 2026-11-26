/* PawForce Nexus EC - Quita todo el sistema de anuncios.
   Uso: en index.html, después de roms.js / ai.js:  <script src="sin-anuncios.js"></script> */
(() => {
  // Desactiva las funciones de anuncios (así nada falla si otro código las llama)
  const noop = () => {};
  ['watchRewardedAd', 'addSponsorAd', 'renderAdminAds', 'updateAdLimitInfo', 'showAd', 'claimAdReward', 'visitAdvertiser', 'closeAd']
    .forEach(n => { window[n] = noop; });

  const rm = el => el && el.remove();
  const byId = id => document.getElementById(id);

  // Ventana del anuncio
  rm(byId('ad-modal'));
  // Tarjeta "Ver Anuncio (+50 PawCoins)" en Planes & Recargas
  const btn = document.querySelector('#tab-plans button[onclick="watchRewardedAd()"]');
  rm(btn && btn.closest('.card'));
  // Tarjeta "Anuncios de Empresas" del Panel Admin
  const adm = byId('ad-admin-list');
  rm(adm && adm.closest('.card'));
})();
