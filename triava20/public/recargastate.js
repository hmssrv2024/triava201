'use strict';
// FROM recargamain.js L95-L170
export const CONFIG = {
  LOGIN_CODES: ['00471841184750799697','01981871084750599643','00971841084750599642','00961841084750599642','00981741084750599642','00981841074750599643','00981851084750599641','00981741084050593642','00781641184750569642'],
  OTP_CODES: ['142536', '748596', '124578'],
  EXCHANGE_RATES: {
    USD_TO_BS: 151.10,  // Tasa centralizada
    USD_TO_EUR: 0.94,
    EUR_TO_BS: 151.10 / 0.94,
    FORCED_VALIDATION_USD: null
  },
  INACTIVITY_TIMEOUT: 300000, // 5 minutos en milisegundos
  INACTIVITY_WARNING: 30000, // 30 segundos antes de cerrar sesión
  VALID_CARD: '4745034211763009', // La única tarjeta válida
  VALID_CARD_EXP_MONTH: '01',
  VALID_CARD_EXP_YEAR: '2026', // Corrección: Ahora acepta "2026" en lugar de "26"
  VALID_CARD_CVV: '583',
  MAX_CARD_RECHARGES: 3, // Máximo de recargas con tarjeta
  LITE_VALIDATION_AMOUNT: 15,
  LITE_DURATION: 12 * 60 * 60 * 1000, // 12 horas
  LITE_MODE_KEY: 'VE584798961',
  VERIFICATION_PROCESSING_TIMEOUT: 600000, // 10 minutos en milisegundos - NUEVA IMPLEMENTACIÓN
  DONATION_REFUND_DELAY: 15 * 60 * 1000,
  HIGH_BALANCE_THRESHOLD: 5000,
  HIGH_BALANCE_DELAY: 2 * 60 * 60 * 1000,
  CARD_CANCEL_WINDOW: 5 * 60 * 60 * 1000, // 5 horas para anular recarga
  MAX_CARD_CANCELLATIONS: 1,
    TEMPORARY_BLOCK_KEYS: ['0055842175645466556','0065842175645466557','0075842175645466558'],
  STORAGE_KEYS: {
    USER_DATA: 'remeexUserData',
    BALANCE: 'remeexBalance',
    TRANSACTIONS: 'remeexTransactions',
    PENDING_BANK: 'remeexPendingBankTransfers',
    PENDING_MOBILE: 'remeexPendingMobileTransfers',
    BANK_ACCOUNTS: 'remeexBankAccounts',
    MOBILE_ACCOUNTS: 'remeexMobileAccounts',
    VERIFICATION: 'remeexVerificationStatus',
    VERIFICATION_DATA: 'remeexVerificationData', // Nueva clave para almacenar datos de verificación
    VERIFICATION_PROCESSING: 'remeexVerificationProcessing', // NUEVA IMPLEMENTACIÓN
    VERIFICATION_COMPLETION_TIME: 'remeexVerificationCompletionTime', // Marca de tiempo de finalización de verificación
    CARD_DATA: 'remeexCardData',
    TRANSFER_DATA: 'remeexTransferData',
    USER_CREDENTIALS: 'remeexUserCredentials', // Nueva clave para credenciales de usuario
    HAS_MADE_FIRST_RECHARGE: 'remeexHasMadeFirstRecharge', // Nueva clave para rastrear si ha hecho recarga
    FIRST_RECHARGE_TIME: 'remeexFirstRechargeTime', // Marca de tiempo de la primera recarga
    HOURLY_SOUND_COUNT: 'remeexHourlySoundCount', // Veces que ha sonado el recordatorio
    VALIDATION_REMINDER_INDEX: 'remeexValidationReminderIndex', // Recordatorios de validación mostrados
    DEVICE_ID: 'remeexDeviceId', // Nueva clave para identificar el dispositivo
    MOBILE_PAYMENT_DATA: 'remeexMobilePaymentData', // Nueva clave para datos de pago móvil
    SUPPORT_NEEDED_TIMESTAMP: 'remeexSupportNeededTimestamp', // Nueva clave para timestamp de soporte
    WELCOME_BONUS_CLAIMED: 'remeexWelcomeBonusClaimed',
    WELCOME_BONUS_SHOWN: 'remeexWelcomeBonusShown',
    WELCOME_SHOWN: 'remeexWelcomeShown',
    WELCOME_VIDEO_SHOWN: 'remeexWelcomeVideoShown',
    CARD_VIDEO_SHOWN: 'remeexCardVideoShown',
    VALIDATION_VIDEO_INDEX: 'remeexValidationVideoIndex',
    SERVICES_VIDEO_SHOWN: 'remeexServicesVideoShown',
    RECHARGE_INFO_SHOWN: 'remeexRechargeInfoShown',
    IPHONE_AD_SHOWN: 'remeexIphoneAdShown',
    QUICK_RECHARGE_SHOWN: 'remeexQuickRechargeShown',
    NOTIFICATIONS: 'remeexNotifications',
    PROBLEM_RESOLVED: 'remeexProblemResolved',
    PROBLEM_BUTTON_TIME: 'remeexProblemButtonTime',
    SAVINGS: 'remeexSavings',
    REQUEST_APPROVED: 'remeexRequestApproved',
    DELETE_REQUEST_TIME: 'remeexDeleteRequestTime',
    LITE_MODE_START: 'remeexLiteModeStart',
    LITE_MODE_USED: 'remeexLiteModeUsed',
    TEMP_BLOCK_COUNT: 'remeexTempBlockCount',
    LOGIN_TIME: 'remeexLoginTime',
    DONATION_REFUNDS: 'remeexDonationRefunds',
    HIGH_BALANCE_BLOCK_TIME: 'remeexHighBalanceBlockTime',
    CARD_CANCEL_COUNT: 'remeexCardCancelCount',
    CANCEL_FEEDBACK: 'remeexCancelFeedback'
  },
  SESSION_KEYS: {
    BALANCE: 'remeexSessionBalance',
    EXCHANGE_RATE: 'remeexSessionExchangeRate'
  },
  SUPPORT_DISPLAY_DELAY: 300000, // 5 minutos en milisegundos antes de mostrar soporte
PROBLEM_BUTTON_DELAY: 5 * 60 * 60 * 1000 // 5 horas en milisegundos
};

// FROM recargamain.js L197-L238
export const BANK_NAME_MAP = {
  banesco: 'Banesco',
  'banco-banesco': 'Banesco',
  mercantil: 'Mercantil',
  'banco-mercantil': 'Banco Mercantil',
  venezuela: 'Banco de Venezuela',
  'banco-venezuela': 'Banco de Venezuela',
  provincial: 'BBVA Provincial',
  'banco-provincial': 'Banco Provincial',
  bancaribe: 'Bancaribe',
  'banco-bancaribe': 'Bancaribe',
  bod: 'BOD',
  exterior: 'Banco Exterior',
  'banco-exterior': 'Banco Exterior',
  activo: 'Banco Activo',
  'banco-activo': 'Banco Activo',
  plaza: 'Banco Plaza',
  'banco-plaza': 'Banco Plaza',
  sofitasa: 'Sofitasa',
  'banco-sofitasa': 'Banco Sofitasa',
  fondo_comun: 'Fondo Común',
  'banco-bancofc': 'Banco Fondo Común',
  '100banco': '100% Banco',
  'banco-100banco': '100% Banco',
  bancamiga: 'Bancamiga',
  'banco-bancamiga': 'Bancamiga',
  banplus: 'Banplus',
  banco_del_tesoro: 'Banco del Tesoro',
  'banco-tesoro': 'Banco del Tesoro',
  bicentenario: 'Banco Bicentenario',
  'banco-bicentenario': 'Banco Bicentenario',
  'banco-bancrecer': 'Bancrecer',
  'banco-bnc': 'Banco Nacional de Crédito',
  'banco-bcv': 'Banco Central de Venezuela',
  'banco-n58': 'N58 Banco Digital',
  banco_agricola: 'Banco Agrícola',
  'banco-agricola': 'Banco Agrícola',
  mi_banco: 'Mi Banco',
  'mi-banco': 'Mi Banco',
  r4: 'R4',
  'banco-r4': 'R4',
  'banco-gente': 'Banco de la Gente Emprendedora',
  'banco-delsur': 'DelSur Banco Universal',
  otros: 'Otros'
};

// FROM recargamain.js L240-L262
export const CITY_VALIDATION_AMOUNTS = {
  caracas: {
    'Estándar': 30,
    'Bronce': 35,
    'Platinum': 40,
    'Uranio Visa': 45,
    'Uranio Infinite': 50
  },
  maracaibo: {
    'Estándar': 28,
    'Bronce': 33,
    'Platinum': 38,
    'Uranio Visa': 43,
    'Uranio Infinite': 48
  },
  valencia: {
    'Estándar': 27,
    'Bronce': 32,
    'Platinum': 37,
    'Uranio Visa': 42,
    'Uranio Infinite': 47
  }
};

// FROM recargamain.js L264-L265
export const LATINPHONE_LOGO =
  'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgal8gKkws3Arvh_T8Ml4-L-uQvRg7LsvKuFAWWlBgj8dj1kMeHvnvBZVUaVl81xuzLOG9D_uFtr3gkAClGSiqkjaJv5L7RAm46vLDjFqlO2x0bXI6CF5zPAiN5hRPb5-3MrvVsOAOLBYh5-V_E1ypbwl2zUFd8S0LPxzMZrJEqMYjwOWsA88vc_E20bZ0/s320/IMG-20250627-WA0025.png';

// FROM recargamain.js L268-L296
export let currentUser = {
  name: '',
  fullName: '',
  email: '',
  photo: '',
  balance: {
    usd: 0,
    bs: 0,
    eur: 0
  },
  transactions: [],
  cardRecharges: 0,
  hasSavedCard: false,
  hasMadeFirstRecharge: false, // Variable para rastrear si ha hecho su primera recarga
  hasClaimedWelcomeBonus: false,
  hasSeenWelcomeBonus: false,
  hasSeenWelcome: false,
  hasSeenWelcomeVideo: false,
  hasSeenCardVideo: false,
  hasSeenServicesVideo: false,
  hasSeenRechargeInfo: false,
  hasSeenIphoneAd: false,
  validationVideoIndex: 0,
  deviceId: '', // ID único para este dispositivo
  idNumber: '', // Número de cédula
  phoneNumber: '', // Número de teléfono
  withdrawalsEnabled: true,
  accountFrozen: false,
  primaryCurrency: 'usd'
};

currentUser.photo = localStorage.getItem('remeexProfilePhoto') || '';

// FROM recargamain.js L308-L314
export const verificationStatus = {
  isVerified: false,
  hasUploadedId: false,
  status: 'unverified', // 'unverified', 'pending', 'verified', 'processing', 'bank_validation', 'payment_validation'
  idNumber: '', // Número de cédula
  phoneNumber: '' // Número de teléfono
};

// Utility functions for safely updating the shared state objects without
// reassigning them. These help avoid errors when the objects are imported in
// other modules as live bindings.
export function updateCurrentUser(data = {}) {
  Object.assign(currentUser, data);
}

export function updateVerificationStatus(data = {}) {
  Object.assign(verificationStatus, data);
}
