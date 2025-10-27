(function () {
  'use strict';

  const directory = Object.freeze({
    'patrickdlavangart@gmail.com': {
      name: "Patrick Allistar D'Lavangart Kors",
      avatar: 'foto8.jpg'
    },
    'wilkermancito69x@gmail.com': {
      name: 'Wilkerman Kemari Yaguare Camacho',
      avatar: 'FOTO1.jpg'
    },
    'yolandacamacho2021@hotmail.com': {
      name: 'Elizabeth Yolanda Camacho Perez'
    },
    'winfreinerjose24@gmail.com': {
      name: 'Winfreiner José Guaramato López',
      avatar: 'foto2.jpg'
    },
    'yonclei_camacho97@gmail.com': {
      name: 'Yoncleiverson Andrés Camacho Lopez',
      avatar: 'foto4.jpg'
    },
    'dilinger.nataniel05@gmail.com': {
      name: 'Dilinger Nataniel Camacho Carrillo',
      avatar: 'foto5.jpg'
    },
    'wilanderson_rojas21@gmail.com': {
      name: 'Wilanderson Aníbal Rojas Chumaceiro',
      avatar: 'foto6.jpg'
    },
    'oskeiber.maicolber33@gmail.com': {
      name: 'Oskeiber Maicolber Pérez González',
      avatar: 'foto7.jpg'
    },
    'osnairo.eniliexis09@gmail.com': {
      name: 'Osnairo Eniliexis Romero Rojas',
      avatar: 'foto9.jpg'
    },
    'wilkler.anibal88@gmail.com': {
      name: 'Wilkler Aníbal Herrera Ruiz',
      avatar: 'foto10.jpg'
    },
    'yorfranwil_ysnkr23@gmail.com': {
      name: 'Yorfranwil Yusneiker Guaramato Ruiz',
      avatar: 'foto11.jpg'
    },
    'leikel_david17@gmail.com': {
      name: 'Leikelson David Camacho Herrera',
      avatar: 'foto12.jpg'
    },
    'yosneiskerherreraruiz10@gmail.com': {
      name: 'Yosneisker Rafael Herrera Ruiz',
      avatar: 'foto13.jpg'
    },
    'yorbisyeifran.mc20@gmail.com': {
      name: 'Yorbis Yeifran Medina Collado',
      avatar: 'foto14.jpg'
    },
    'yorjanderali_12@gmail.com': {
      name: 'Yorjander Alí García Sánchez',
      avatar: 'foto15.jpg'
    },
    'soyluchostar@gmail.com': {
      name: 'Luis Muñoz Quijano',
      avatar: 'luchostar.jpg'
    }
  });

  Object.defineProperty(window, 'REMEEX_EXCHANGE_USERS', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: directory
  });

  const STORAGE_KEY = 'remeexExchangeDirectory';

  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(directory));
    }
  } catch (error) {
    // Ignore storage errors (e.g., quota exceeded, disabled storage)
  }
})();
