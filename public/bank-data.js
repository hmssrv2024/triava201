const DEFAULT_BANK_LOGO = 'https://e7.pngegg.com/pngimages/127/511/png-clipart-bank-computer-icons-bank-building-bank.png';

const BANK_DATA = {
  NACIONAL: [
    { id: 'banco-venezuela', name: 'Banco de Venezuela', logo: 'https://www.bancodevenezuela.com/wp-content/uploads/2023/03/logonuevo.png' },
    { id: 'banco-venezolano', name: 'Banco Venezolano de Crédito', logo: 'https://www.venezolano.com/images/galeria/108_1.png' },
    { id: 'banco-mercantil', name: 'Banco Mercantil', logo: 'https://files.socialgest.net/mybio/5f529398b36f8_1599247256.png' },
    { id: 'banco-provincial', name: 'Banco Provincial', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/BBVAprovinciallogo.svg' },
    { id: 'banco-bancaribe', name: 'Banco del Caribe (Bancaribe)', logo: 'https://d3olc33sy92l9e.cloudfront.net/wp-content/themes/bancaribe/images/Bancaribe-LogotipoTurquesa.png' },
    { id: 'banco-exterior', name: 'Banco Exterior', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Banco-Exterior-VE-logo.png/183px-Banco-Exterior-VE-logo.png' },
    { id: 'banco-caroni', name: 'Banco Caroní', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/db/Banco-Caron%C3%AD-logo.png' },
    { id: 'banco-banesco', name: 'Banesco', logo: 'https://banesco-prod-2020.s3.amazonaws.com/wp-content/themes/banescocontigo/assets/images/header/logo.svg.gzip' },
    { id: 'banco-sofitasa', name: 'Banco Sofitasa', logo: 'https://www.sofitasa.com/assets/img/nuevo_logo.png' },
    { id: 'banco-plaza', name: 'Banco Plaza', logo: 'https://images.crunchbase.com/image/upload/c_pad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_1/xaohzgslrcyk6if8bw0p' },
    { id: 'banco-bancofc', name: 'Banco Fondo Común', logo: 'https://www.bfc.com.ve/wp-content/uploads/2021/01/logofos.png' },
    { id: 'banco-100banco', name: '100% Banco', logo: 'https://www.100x100banco.com/img/logo.png' },
    { id: 'banco-tesoro', name: 'Banco del Tesoro', logo: 'https://comerciomovil.bt.com.ve/_next/static/media/logo-slogan.907bb4c8.png' },
    { id: 'banco-bancrecer', name: 'Bancrecer', logo: 'https://images.seeklogo.com/logo-png/36/1/bancrecer-logo-png_seeklogo-364928.png' },
    { id: 'banco-activo', name: 'Banco Activo', logo: 'https://www.bancoactivo.com/logo.svg' },
    { id: 'banco-bancamiga', name: 'Bancamiga', logo: 'https://vectorseek.com/wp-content/uploads/2023/09/Bancamiga-Logo-Vector.svg-.png' },
    { id: 'banco-bicentenario', name: 'Banco Bicentenario', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/BancoDigitaldelosTrabajadores.png/320px-BancoDigitaldelosTrabajadores.png' },
    { id: 'banco-bnc', name: 'Banco Nacional de Crédito', logo: 'https://www.bncenlinea.com/images/default-source/misc/BNCLogo_rebrand.png' },
    { id: 'banco-n58', name: 'N58 Banco Digital', logo: 'https://onboarding.n58bancodigital.com/assets/img/logo-dark.svg' },
    { id: 'banco-bcv', name: 'Banco Central de Venezuela', logo: 'https://www.bcv.org.ve/sites/default/files/default_images/logo_bcv-04_2.png' },
    { id: 'banco-gente', name: 'Banco de la Gente Emprendedora', logo: DEFAULT_BANK_LOGO },
    { id: 'banco-delsur', name: 'DelSur Banco Universal', logo: DEFAULT_BANK_LOGO },
    { id: 'banco-agricola', name: 'Banco Agrícola de Venezuela', logo: DEFAULT_BANK_LOGO },
    { id: 'mi-banco', name: 'Mi Banco', logo: DEFAULT_BANK_LOGO },
    { id: 'banco-r4', name: 'R4', logo: 'https://www.r4conecta.io/_nuxt/img/mibanco_logo.67b5af9.png' }
  ],
  INTERNACIONAL: [
    { id: 'bank-america', name: 'Bank of America', logo: 'https://1000logos.net/wp-content/uploads/2016/10/Bank-of-America-Logo.png' },
    { id: 'chase-bank', name: 'Chase Bank', logo: 'https://download.logo.wine/logo/Chase_Bank/Chase_Bank-Logo.wine.png' },
    { id: 'bancolombia', name: 'Bancolombia', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Logo_Bancolombia.svg/2000px-Logo_Bancolombia.svg.png' },
    { id: 'western-union', name: 'Western Union', logo: 'https://1000logos.net/wp-content/uploads/2020/07/Western-Union-Logo-500x281.png' }
  ],
  FINTECH: [
    { id: 'zinli', name: 'Zinli', logo: 'https://s3-eu-west-1.amazonaws.com/tpd/logos/61bb38efff4dedb88e94fbe6/0x0.png' },
    { id: 'paypal', name: 'PayPal', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Paypal_2014_logo.png' },
    { id: 'binance', name: 'Binance', logo: 'https://www.logo.wine/a/logo/Binance/Binance-Logo.wine.svg' },
    { id: 'airtm', name: 'AirTM', logo: 'https://brandlogovector.com/wp-content/uploads/2023/08/Airtm-Logo-PNG.png' },
    { id: 'xoom', name: 'Xoom', logo: 'https://www.paypalobjects.com/xoom/static/img/logo/xpp-logo-es.svg' },
    { id: 'zoom', name: 'Zoom', logo: 'https://zoom.red/wp-content/uploads/2021/01/Logo-Zoom-Registrado.png' },
    { id: 'zelle', name: 'Zelle', logo: 'https://download.logo.wine/logo/Zelle_(payment_service)/Zelle_(payment_service)-Logo.wine.png' },
    { id: 'venmo', name: 'Venmo', logo: 'https://logos-world.net/wp-content/uploads/2021/12/Venmo-Logo.png' },
    { id: 'nequi', name: 'Nequi', logo: 'https://images.seeklogo.com/logo-png/40/1/nequi-logo-png_seeklogo-404357.png' },
    { id: 'wise', name: 'Wise', logo: 'https://icon2.cleanpng.com/lnd/20250116/qj/27d09a29b3056c595b6e2d995a15b5.webp' },
    { id: 'revolut', name: 'Revolut', logo: 'https://e7.pngegg.com/pngimages/739/64/png-clipart-revolut-black-new-logo-tech-companies.png' },
    { id: 'eldorado', name: 'El Dorado', logo: 'https://eldorado.io/static/f4ed8a521b10baed657858830cac133c/58556/logo.webp' },
    { id: 'ubii', name: 'Ubii Pagos', logo: 'https://www.ubiipagos.com/img/new-home/ubiipagos_logo_home_dark.svg' },
    { id: 'pago-movil', name: 'Pago Móvil', logo: 'https://i0.wp.com/logoroga.com/wp-content/uploads/2018/02/pago-movil.png?fit=800%2C800&ssl=1' },
    { id: 'wally-tech', name: 'Wally Tech', logo: 'https://www.wally.tech/sites/default/files/inline-images/menuforeground01_0.png' }
  ]
};

// Mapa de códigos de cuenta por banco
const BANK_CODES = {
  'banco-venezuela': '0102',
  'banco-venezolano': '0104',
  'banco-mercantil': '0105',
  'banco-provincial': '0108',
  'banco-bancaribe': '0114',
  'banco-exterior': '0115',
  'banco-caroni': '0128',
  'banco-banesco': '0134',
  'banco-sofitasa': '0137',
  'banco-plaza': '0138',
  'banco-bancofc': '0151',
  'banco-100banco': '0156',
  'banco-tesoro': '0163',
  'banco-bancrecer': '0168',
  'banco-r4': '0169',
  'banco-activo': '0171',
  'banco-bancamiga': '0172',
  'banco-bicentenario': '0175',
  'banco-bnc': '0191',
  'banco-n58': '0178'
};

// Helper to get logo by bank id
function getBankLogo(bankId) {
  if (!bankId || !window.BANK_DATA) return '';

  // Search in all bank categories
  const allBanks = [
    ...(BANK_DATA.NACIONAL || []),
    ...(BANK_DATA.INTERNACIONAL || []),
    ...(BANK_DATA.FINTECH || [])
  ];

  const bank = allBanks.find(b => b.id === bankId);
  return bank ? bank.logo : '';
}

window.BANK_DATA = BANK_DATA;
window.getBankLogo = getBankLogo;
window.BANK_CODES = BANK_CODES;
