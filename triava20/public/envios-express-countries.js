export const COUNTRY_STORAGE_KEY = 'enviosExpress.selectedCountry';
export const COUNTRY_SELECTOR_URL = 'envios-express-paises.html';

export const MIN_TRANSFER_AMOUNT_USD = 50;

function createMinTransferHint(currencyCode, currencyName) {
  const code = typeof currencyCode === 'string' && currencyCode.trim() ? currencyCode.trim().toUpperCase() : 'USD';
  const name = typeof currencyName === 'string' && currencyName.trim() ? currencyName.trim() : code;
  if (code === 'USD') {
    return `Monto mínimo permitido: ${MIN_TRANSFER_AMOUNT_USD} USD.`;
  }
  return `Monto mínimo permitido: ${MIN_TRANSFER_AMOUNT_USD} USD (equivalente en ${name}).`;
}

export const COUNTRY_OPTIONS = [
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', currency: 'Peso argentino', currencyCode: 'ARS' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', currency: 'Boliviano', currencyCode: 'BOB' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', currency: 'Real brasileño', currencyCode: 'BRL' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', currency: 'Peso chileno', currencyCode: 'CLP' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', currency: 'Peso colombiano', currencyCode: 'COP' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', currency: 'Colón costarricense', currencyCode: 'CRC' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺', currency: 'Peso cubano (CUP)', currencyCode: 'CUP' },
  { code: 'DO', name: 'República Dominicana', flag: '🇩🇴', currency: 'Peso dominicano', currencyCode: 'DOP' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', currency: 'Dólar estadounidense', currencyCode: 'USD' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻', currency: 'Dólar estadounidense', currencyCode: 'USD' },
  { code: 'ES', name: 'España', flag: '🇪🇸', currency: 'Euro', currencyCode: 'EUR' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', currency: 'Dólar estadounidense', currencyCode: 'USD' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', currency: 'Quetzal guatemalteco', currencyCode: 'GTQ' },
  { code: 'HT', name: 'Haití', flag: '🇭🇹', currency: 'Gourde haitiano', currencyCode: 'HTG' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳', currency: 'Lempira hondureño', currencyCode: 'HNL' },
  { code: 'MX', name: 'México', flag: '🇲🇽', currency: 'Peso mexicano', currencyCode: 'MXN' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', currency: 'Córdoba nicaragüense', currencyCode: 'NIO' },
  { code: 'PA', name: 'Panamá', flag: '🇵🇦', currency: 'Balboa / USD', currencyCode: 'USD' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', currency: 'Guaraní paraguayo', currencyCode: 'PYG' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', currency: 'Sol peruano', currencyCode: 'PEN' },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷', currency: 'Dólar estadounidense', currencyCode: 'USD' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', currency: 'Peso uruguayo', currencyCode: 'UYU' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', currency: 'Bolívar digital', currencyCode: 'VES' }
];

const DEFAULT_FORM_CONFIG = {
  stepDescription:
    'Completa los datos obligatorios del receptor del dinero. Utiliza información real para evitar rechazos.',
  recipientId: {
    label: 'Documento de identidad',
    placeholder: 'Ej. Documento 12345678',
    hint: ''
  },
  recipientPhone: {
    placeholder: 'Ej. +00 000 000 0000'
  },
  recipientBank: {
    label: 'Banco de recepción',
    placeholder: 'Ej. Banco Internacional'
  },
  recipientAccountNumber: {
    label: 'Número de cuenta o IBAN',
    placeholder: 'Ej. ES12 3456 7890 1234',
    hint: ''
  },
  transferAmount: {
    label: 'Monto a enviar',
    placeholder: 'Ej. 500',
    hint: createMinTransferHint('USD', 'dólares estadounidenses')
  },
  accountTypeOptions: [
    { value: 'corriente', label: 'Cuenta corriente' },
    { value: 'ahorro', label: 'Cuenta de ahorros' },
    { value: 'tarjeta', label: 'Tarjeta VISA' },
    { value: 'otro', label: 'Otro' }
  ]
};

export const COUNTRY_FORM_CONFIG = {
  AR: {
    stepDescription:
      'Ingresa los datos del beneficiario en Argentina tal como aparecen en su DNI o en la cuenta bancaria.',
    recipientId: {
      label: 'Documento Nacional de Identidad (DNI)',
      placeholder: 'Ej. 12345678',
      hint: 'Utiliza el número completo sin puntos. Para extranjeros puedes usar el NIE.'
    },
    recipientPhone: {
      placeholder: 'Ej. +54 9 11 5555 5555'
    },
    recipientBank: {
      label: 'Banco o billetera receptora',
      placeholder: 'Ej. Banco Nación o Mercado Pago'
    },
    recipientAccountNumber: {
      label: 'CBU o CVU',
      placeholder: 'Ej. 2850590940090418125201',
      hint: 'El CBU/CVU posee 22 dígitos. Verifica que corresponda al banco del beneficiario.'
    },
    transferAmount: {
      label: 'Monto a transferir (ARS)',
      placeholder: 'Ej. 150000'
    },
    accountTypeOptions: [
      { value: 'ahorro', label: 'Caja de ahorro' },
      { value: 'corriente', label: 'Cuenta corriente' },
      { value: 'tarjeta', label: 'Tarjeta VISA' },
      { value: 'otro', label: 'CVU / billetera virtual' }
    ]
  },
  BO: {
    stepDescription: 'Completa la información del titular en Bolivia tal como aparece en su cédula o pasaporte.',
    recipientId: {
      label: 'Cédula de Identidad (CI)',
      placeholder: 'Ej. 12345678',
      hint: 'Puedes incluir el complemento si aplica (por ejemplo 12345678-1J).'
    },
    recipientPhone: {
      placeholder: 'Ej. +591 7000 0000'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. Banco Nacional de Bolivia'
    },
    recipientAccountNumber: {
      label: 'Número de cuenta bancaria',
      placeholder: 'Ej. 1000123456789',
      hint: 'Verifica el número completo según el formato del banco (generalmente 13 dígitos).'
    },
    transferAmount: {
      label: 'Monto a transferir (BOB)',
      placeholder: 'Ej. 5500'
    }
  },
  BR: {
    stepDescription:
      'Completa los datos del beneficiario en Brasil. Asegúrate de indicar correctamente CPF/CNPJ y agência.',
    recipientId: {
      label: 'CPF/CNPJ del beneficiario',
      placeholder: 'Ej. 123.456.789-00',
      hint: 'Incluye formato numérico de 11 dígitos para CPF o 14 para CNPJ (puedes escribirlo sin separadores).'
    },
    recipientPhone: {
      placeholder: 'Ej. +55 11 91234 5678'
    },
    recipientBank: {
      label: 'Banco o institución PIX',
      placeholder: 'Ej. Nubank o Banco do Brasil'
    },
    recipientAccountNumber: {
      label: 'Número de conta / agencia',
      placeholder: 'Ej. 0001 / 123456-7',
      hint: 'Indica agência y conta. Si usas clave PIX colócala en la referencia.'
    },
    transferAmount: {
      label: 'Monto a transferir (BRL)',
      placeholder: 'Ej. 2500'
    },
    accountTypeOptions: [
      { value: 'corriente', label: 'Conta corrente' },
      { value: 'ahorro', label: 'Conta poupança' },
      { value: 'tarjeta', label: 'Tarjeta VISA' },
      { value: 'otro', label: 'Clave PIX / Otro' }
    ]
  },
  CL: {
    stepDescription:
      'Ingresa la información del beneficiario en Chile. Recuerda validar el RUN con su dígito verificador.',
    recipientId: {
      label: 'RUN / RUT',
      placeholder: 'Ej. 12.345.678-5',
      hint: 'Incluye dígito verificador. Puedes escribirlo con o sin puntos.'
    },
    recipientPhone: {
      placeholder: 'Ej. +56 9 6123 4567'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. BancoEstado'
    },
    recipientAccountNumber: {
      label: 'Número de cuenta',
      placeholder: 'Ej. 123456789012',
      hint: 'Verifica si se trata de cuenta corriente, vista o RUT.'
    },
    transferAmount: {
      label: 'Monto a transferir (CLP)',
      placeholder: 'Ej. 850000'
    }
  },
  CO: {
    stepDescription:
      'Completa los datos del titular en Colombia, incluyendo la cédula y la cuenta bancaria.',
    recipientId: {
      label: 'Cédula / Documento del beneficiario',
      placeholder: 'Ej. 1234567890',
      hint: 'Ingresa cédula de ciudadanía, extranjería o NIT (sin guiones).'
    },
    recipientPhone: {
      placeholder: 'Ej. +57 300 1234567'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. Bancolombia'
    },
    recipientAccountNumber: {
      label: 'Número de cuenta',
      placeholder: 'Ej. 12345678901',
      hint: 'El número de cuenta suele tener entre 10 y 12 dígitos según el banco.'
    },
    transferAmount: {
      label: 'Monto a transferir (COP)',
      placeholder: 'Ej. 2500000'
    }
  },
  CR: {
    stepDescription:
      'Proporciona los datos del beneficiario en Costa Rica. El IBAN es obligatorio para transferencias locales.',
    recipientId: {
      label: 'Número de identificación (cédula/DIMEX)',
      placeholder: 'Ej. 1-2345-6789',
      hint: 'Puedes usar cédula nacional, DIMEX o pasaporte vigente.'
    },
    recipientPhone: {
      placeholder: 'Ej. +506 8888 8888'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. BAC Credomatic'
    },
    recipientAccountNumber: {
      label: 'IBAN (22 caracteres)',
      placeholder: 'Ej. CR05015202001026284066',
      hint: 'El IBAN costarricense inicia con CR y contiene 22 caracteres alfanuméricos.'
    },
    transferAmount: {
      label: 'Monto a transferir (CRC)',
      placeholder: 'Ej. 450000'
    }
  },
  CU: {
    stepDescription:
      'Indica los datos del beneficiario en Cuba. Confirma el número de tarjeta o cuenta de MLC/CUP.',
    recipientId: {
      label: 'Carné de identidad',
      placeholder: 'Ej. 90010112345',
      hint: 'Utiliza los 11 dígitos del carné de identidad.'
    },
    recipientPhone: {
      placeholder: 'Ej. +53 5 1234567'
    },
    recipientBank: {
      label: 'Banco o tarjeta destino',
      placeholder: 'Ej. Banco Metropolitano'
    },
    recipientAccountNumber: {
      label: 'Número de tarjeta/cuenta',
      placeholder: 'Ej. 9200123412341234',
      hint: 'Verifica si corresponde a tarjeta MLC, AIS o cuenta bancaria en CUP.'
    },
    transferAmount: {
      label: 'Monto a transferir (CUP/MLC)',
      placeholder: 'Ej. 2500'
    },
    accountTypeOptions: [
      { value: 'corriente', label: 'Cuenta bancaria' },
      { value: 'ahorro', label: 'Libretta de ahorro' },
      { value: 'tarjeta', label: 'Tarjeta magnética' },
      { value: 'otro', label: 'Otro medio de cobro' }
    ]
  },
  DO: {
    stepDescription:
      'Completa los datos de la persona en República Dominicana, incluyendo cédula y cuenta bancaria.',
    recipientId: {
      label: 'Cédula / Pasaporte',
      placeholder: 'Ej. 001-1234567-8',
      hint: 'La cédula dominicana tiene formato 000-0000000-0.'
    },
    recipientPhone: {
      placeholder: 'Ej. +1 809 555 5555'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. Banco Popular Dominicano'
    },
    recipientAccountNumber: {
      label: 'Número de cuenta',
      placeholder: 'Ej. 12345678901',
      hint: 'Confirma si es cuenta de ahorro o corriente para evitar rechazos.'
    },
    transferAmount: {
      label: 'Monto a transferir (DOP)',
      placeholder: 'Ej. 75000'
    }
  },
  EC: {
    stepDescription:
      'Proporciona los datos del beneficiario en Ecuador. El documento puede ser cédula, RUC o pasaporte.',
    recipientId: {
      label: 'Cédula/RUC/Pasaporte',
      placeholder: 'Ej. 0102030405',
      hint: 'Utiliza 10 dígitos para cédula o 13 para RUC. Los pasaportes pueden combinar letras y números.'
    },
    recipientPhone: {
      placeholder: 'Ej. +593 99 123 4567'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. Banco Pichincha'
    },
    recipientAccountNumber: {
      label: 'Número de cuenta',
      placeholder: 'Ej. 1234567890001',
      hint: 'Indica si es cuenta corriente o de ahorros en la referencia si aplica.'
    },
    transferAmount: {
      label: 'Monto a transferir (USD)',
      placeholder: 'Ej. 850'
    }
  },
  SV: {
    stepDescription:
      'Completa los datos del beneficiario en El Salvador. Recuerda incluir el DUI o pasaporte vigente.',
    recipientId: {
      label: 'DUI / Pasaporte',
      placeholder: 'Ej. 01234567-8',
      hint: 'El DUI posee 9 dígitos incluyendo guion. Puedes ingresar también pasaporte.'
    },
    recipientPhone: {
      placeholder: 'Ej. +503 7012 3456'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. Banco Agrícola'
    },
    recipientAccountNumber: {
      label: 'Número de cuenta',
      placeholder: 'Ej. 001234567890',
      hint: 'Proporciona los 12 dígitos de la cuenta bancaria.'
    },
    transferAmount: {
      label: 'Monto a transferir (USD)',
      placeholder: 'Ej. 650'
    }
  },
  ES: {
    stepDescription:
      'Introduce la información del beneficiario en España con su documento de identidad vigente.',
    recipientId: {
      label: 'DNI / NIE / Pasaporte',
      placeholder: 'Ej. 12345678Z',
      hint: 'Puedes usar DNI, NIE o pasaporte. Respeta letras y números correspondientes.'
    },
    recipientPhone: {
      placeholder: 'Ej. +34 612 34 56 78'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. CaixaBank'
    },
    recipientAccountNumber: {
      label: 'IBAN (24 caracteres)',
      placeholder: 'Ej. ES9121000418450200051332',
      hint: 'El IBAN español comienza con ES y tiene 24 caracteres alfanuméricos.'
    },
    transferAmount: {
      label: 'Monto a transferir (EUR)',
      placeholder: 'Ej. 1200'
    }
  },
  US: {
    stepDescription:
      'Completa los datos del destinatario en Estados Unidos. Incluye datos bancarios o de tarjeta válidos.',
    recipientId: {
      label: 'Identificación (SSN/ITIN/ID)',
      placeholder: 'Ej. 123-45-6789',
      hint: 'Puedes usar SSN, ITIN o número de identificación del estado.'
    },
    recipientPhone: {
      placeholder: 'Ej. +1 (305) 555-1234'
    },
    recipientBank: {
      label: 'Banco o institución financiera',
      placeholder: 'Ej. Bank of America'
    },
    recipientAccountNumber: {
      label: 'Número de cuenta / Routing',
      placeholder: 'Ej. 026009593 / 123456789',
      hint: 'Incluye número de ruta (ABA) en la referencia si aplica.'
    },
    transferAmount: {
      label: 'Monto a transferir (USD)',
      placeholder: 'Ej. 1200'
    }
  },
  GT: {
    stepDescription:
      'Ingresa los datos del beneficiario en Guatemala. Usa la cédula DPI vigente.',
    recipientId: {
      label: 'DPI / Pasaporte',
      placeholder: 'Ej. 1234 56789 0101',
      hint: 'El DPI tiene 13 dígitos separados en grupos de 4-5-4.'
    },
    recipientPhone: {
      placeholder: 'Ej. +502 5123 4567'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. Banco Industrial'
    },
    recipientAccountNumber: {
      label: 'Número de cuenta',
      placeholder: 'Ej. 00123456789',
      hint: 'Confirma si la cuenta es monetaria o de ahorro.'
    },
    transferAmount: {
      label: 'Monto a transferir (GTQ)',
      placeholder: 'Ej. 7500'
    }
  },
  HT: {
    stepDescription:
      'Completa los datos del beneficiario en Haití. Puedes usar número CIN o pasaporte vigente.',
    recipientId: {
      label: 'CIN / Pasaporte',
      placeholder: 'Ej. 03-12-99-12345-12-12',
      hint: 'El CIN haitiano combina números y guiones. Respeta el formato si lo conoces.'
    },
    recipientPhone: {
      placeholder: 'Ej. +509 34 12 3456'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. Unibank'
    },
    recipientAccountNumber: {
      label: 'Número de cuenta',
      placeholder: 'Ej. 123456789',
      hint: 'Indica si la cuenta está en HTG o USD en el mensaje de referencia.'
    },
    transferAmount: {
      label: 'Monto a transferir (HTG)',
      placeholder: 'Ej. 95000'
    }
  },
  HN: {
    stepDescription:
      'Ingresa los datos del titular en Honduras. El documento principal es la tarjeta de identidad.',
    recipientId: {
      label: 'Identidad / Pasaporte',
      placeholder: 'Ej. 0801-1990-12345',
      hint: 'Puedes ingresar identidad nacional (13 dígitos) o pasaporte.'
    },
    recipientPhone: {
      placeholder: 'Ej. +504 9876 5432'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. BAC Credomatic'
    },
    recipientAccountNumber: {
      label: 'Número de cuenta',
      placeholder: 'Ej. 0010203040506',
      hint: 'Verifica con el banco si requiere código adicional (ABA/SWIFT).' 
    },
    transferAmount: {
      label: 'Monto a transferir (HNL)',
      placeholder: 'Ej. 18000'
    }
  },
  MX: {
    stepDescription:
      'Completa los datos del beneficiario en México. Puedes transferir a CLABE, tarjeta o cuenta SPEI.',
    recipientId: {
      label: 'CURP / INE / Pasaporte',
      placeholder: 'Ej. GODE561231HDFRRN04',
      hint: 'Puedes ingresar CURP, INE o pasaporte vigente.'
    },
    recipientPhone: {
      placeholder: 'Ej. +52 55 1234 5678'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. BBVA México'
    },
    recipientAccountNumber: {
      label: 'CLABE (18 dígitos) o tarjeta',
      placeholder: 'Ej. 002910700123456789',
      hint: 'Para CLABE usa 18 dígitos; para tarjeta, indica el tipo en la referencia.'
    },
    transferAmount: {
      label: 'Monto a transferir (MXN)',
      placeholder: 'Ej. 15000'
    },
    accountTypeOptions: [
      { value: 'ahorro', label: 'Cuenta de ahorro' },
      { value: 'corriente', label: 'Cuenta corriente' },
      { value: 'tarjeta', label: 'Tarjeta de débito/crédito' },
      { value: 'otro', label: 'CLABE interbancaria' }
    ]
  },
  NI: {
    stepDescription:
      'Proporciona los datos del beneficiario en Nicaragua. Usa el número de cédula o pasaporte.',
    recipientId: {
      label: 'Cédula / Pasaporte',
      placeholder: 'Ej. 001-010101-0001X',
      hint: 'La cédula nicaragüense posee 14 caracteres incluyendo letra final.'
    },
    recipientPhone: {
      placeholder: 'Ej. +505 8888 8888'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. Banpro'
    },
    recipientAccountNumber: {
      label: 'Número de cuenta',
      placeholder: 'Ej. 1234567890123',
      hint: 'Especifica si es cuenta en córdobas o dólares en la referencia.'
    },
    transferAmount: {
      label: 'Monto a transferir (NIO)',
      placeholder: 'Ej. 32000'
    }
  },
  PA: {
    stepDescription:
      'Completa los datos del beneficiario en Panamá. Indica cuenta bancaria o número de tarjeta Clave.',
    recipientId: {
      label: 'Cédula / Pasaporte',
      placeholder: 'Ej. 8-123-456',
      hint: 'Usa la cédula panameña (formato 0-000-000) o un pasaporte válido.'
    },
    recipientPhone: {
      placeholder: 'Ej. +507 6000 0000'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. Banco General'
    },
    recipientAccountNumber: {
      label: 'Cuenta bancaria / Tarjeta Clave',
      placeholder: 'Ej. 0112345678901234',
      hint: 'Las cuentas Clave tienen 16 dígitos; las bancarias varían según el banco.'
    },
    transferAmount: {
      label: 'Monto a transferir (USD)',
      placeholder: 'Ej. 900'
    }
  },
  PY: {
    stepDescription:
      'Ingresa los datos del beneficiario en Paraguay. Usa la cédula y el número de cuenta correcto.',
    recipientId: {
      label: 'Cédula / Pasaporte',
      placeholder: 'Ej. 1234567',
      hint: 'La cédula paraguaya suele tener de 6 a 8 dígitos.'
    },
    recipientPhone: {
      placeholder: 'Ej. +595 981 123456'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. Banco Itaú'
    },
    recipientAccountNumber: {
      label: 'Número de cuenta',
      placeholder: 'Ej. 123456789012',
      hint: 'Indica si la cuenta es en guaraníes o dólares.'
    },
    transferAmount: {
      label: 'Monto a transferir (PYG)',
      placeholder: 'Ej. 3500000'
    }
  },
  PE: {
    stepDescription:
      'Completa los datos del beneficiario en Perú. Utiliza DNI o CE y el número de cuenta correcto.',
    recipientId: {
      label: 'DNI / Carné de extranjería',
      placeholder: 'Ej. 12345678',
      hint: 'El DNI tiene 8 dígitos. El CE puede combinar letras y números.'
    },
    recipientPhone: {
      placeholder: 'Ej. +51 912 345 678'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. BCP o Interbank'
    },
    recipientAccountNumber: {
      label: 'Cuenta bancaria o CCI',
      placeholder: 'Ej. 00212345678901234567',
      hint: 'El CCI peruano cuenta con 20 dígitos. Verifica si es cuenta en soles o dólares.'
    },
    transferAmount: {
      label: 'Monto a transferir (PEN)',
      placeholder: 'Ej. 3500'
    }
  },
  PR: {
    stepDescription:
      'Proporciona los datos del beneficiario en Puerto Rico. Las transferencias se manejan en USD.',
    recipientId: {
      label: 'Número de identificación (SSN/ID)',
      placeholder: 'Ej. 123-45-6789',
      hint: 'Puedes usar SSN, ITIN o número de identificación local.'
    },
    recipientPhone: {
      placeholder: 'Ej. +1 787 555 1234'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. Banco Popular de Puerto Rico'
    },
    recipientAccountNumber: {
      label: 'Número de cuenta / Routing',
      placeholder: 'Ej. 021502011 / 123456789',
      hint: 'Incluye el número de ruta ABA cuando sea necesario.'
    },
    transferAmount: {
      label: 'Monto a transferir (USD)',
      placeholder: 'Ej. 980'
    }
  },
  UY: {
    stepDescription:
      'Completa los datos del beneficiario en Uruguay con su cédula y cuenta bancaria.',
    recipientId: {
      label: 'Cédula de identidad',
      placeholder: 'Ej. 4.123.456-7',
      hint: 'Incluye el dígito verificador. Puedes ingresar el número sin puntos.'
    },
    recipientPhone: {
      placeholder: 'Ej. +598 94 123 456'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. Banco República (BROU)'
    },
    recipientAccountNumber: {
      label: 'Número de cuenta',
      placeholder: 'Ej. 001234567890',
      hint: 'Indica la moneda de la cuenta en la referencia si aplica.'
    },
    transferAmount: {
      label: 'Monto a transferir (UYU)',
      placeholder: 'Ej. 45000'
    }
  },
  VE: {
    stepDescription:
      'Completa los datos del beneficiario en Venezuela. Asegúrate de que la cédula y cuenta sean correctas.',
    recipientId: {
      label: 'Cédula de identidad',
      placeholder: 'Ej. V-12345678',
      hint: 'Utiliza el prefijo V/E/P según corresponda y 7-9 dígitos.'
    },
    recipientPhone: {
      placeholder: 'Ej. +58 412 1234567'
    },
    recipientBank: {
      label: 'Banco destino',
      placeholder: 'Ej. Banco de Venezuela'
    },
    recipientAccountNumber: {
      label: 'Número de cuenta bancaria',
      placeholder: 'Ej. 01020345670012345678',
      hint: 'Las cuentas venezolanas tienen 20 dígitos. Verifica el banco y tipo de cuenta.'
    },
    transferAmount: {
      label: 'Monto a transferir (VES)',
      placeholder: 'Ej. 4500'
    },
    accountTypeOptions: [
      { value: 'ahorro', label: 'Cuenta de ahorros' },
      { value: 'corriente', label: 'Cuenta corriente' },
      { value: 'tarjeta', label: 'Tarjeta de débito VISA' },
      { value: 'otro', label: 'Pago móvil / Otro' }
    ]
  }
};

Object.entries(COUNTRY_FORM_CONFIG).forEach(([code, config]) => {
  const country = findCountryByCode(code);
  const currencyCode = country?.currencyCode || 'USD';
  const currencyName = country?.currency || currencyCode;
  const hint = createMinTransferHint(currencyCode, currencyName);

  if (!config.transferAmount) {
    config.transferAmount = { hint };
    return;
  }

  if (config.transferAmount.hint) {
    const existing = config.transferAmount.hint.trim();
    if (!existing.includes(`${MIN_TRANSFER_AMOUNT_USD}`)) {
      config.transferAmount.hint = `${existing} ${hint}`.trim();
    }
  } else {
    config.transferAmount.hint = hint;
  }
});

export function getFormConfigForCountry(code) {
  const upper = normaliseCountryCode(code);
  if (!upper) {
    return DEFAULT_FORM_CONFIG;
  }
  const overrides = COUNTRY_FORM_CONFIG[upper];
  if (!overrides) {
    return DEFAULT_FORM_CONFIG;
  }
  return {
    stepDescription: overrides.stepDescription || DEFAULT_FORM_CONFIG.stepDescription,
    recipientId: { ...DEFAULT_FORM_CONFIG.recipientId, ...overrides.recipientId },
    recipientPhone: { ...DEFAULT_FORM_CONFIG.recipientPhone, ...overrides.recipientPhone },
    recipientBank: { ...DEFAULT_FORM_CONFIG.recipientBank, ...overrides.recipientBank },
    recipientAccountNumber: {
      ...DEFAULT_FORM_CONFIG.recipientAccountNumber,
      ...overrides.recipientAccountNumber
    },
    transferAmount: { ...DEFAULT_FORM_CONFIG.transferAmount, ...overrides.transferAmount },
    accountTypeOptions: overrides.accountTypeOptions || DEFAULT_FORM_CONFIG.accountTypeOptions
  };
}

export function normaliseCountryCode(value) {
  return typeof value === 'string' && value.trim() ? value.trim().toUpperCase() : '';
}

export function findCountryByCode(code) {
  const upper = normaliseCountryCode(code);
  if (!upper) return null;
  return COUNTRY_OPTIONS.find((country) => country.code === upper) || null;
}

function getStorageCandidates() {
  if (typeof window === 'undefined') {
    return [];
  }
  const stores = [];
  try {
    if (window.sessionStorage) stores.push(window.sessionStorage);
  } catch (error) {
    // ignore storage errors
  }
  try {
    if (window.localStorage) stores.push(window.localStorage);
  } catch (error) {
    // ignore storage errors
  }
  return stores;
}

export function persistCountryCode(code) {
  const normalised = normaliseCountryCode(code);
  getStorageCandidates().forEach((store) => {
    try {
      if (normalised) {
        store.setItem(COUNTRY_STORAGE_KEY, normalised);
      } else {
        store.removeItem(COUNTRY_STORAGE_KEY);
      }
    } catch (error) {
      // ignore storage persistence issues
    }
  });
}

export function getPersistedCountryCode() {
  for (const store of getStorageCandidates()) {
    try {
      const value = store.getItem(COUNTRY_STORAGE_KEY);
      if (value) {
        return value;
      }
    } catch (error) {
      // ignore storage retrieval issues
    }
  }
  return '';
}

export function clearPersistedCountryCode() {
  getStorageCandidates().forEach((store) => {
    try {
      store.removeItem(COUNTRY_STORAGE_KEY);
    } catch (error) {
      // ignore
    }
  });
}

export function ensureValidCountryCode(code) {
  const upper = normaliseCountryCode(code);
  if (!upper) return '';
  return findCountryByCode(upper)?.code || '';
}

export function getAllCountryCodes() {
  return COUNTRY_OPTIONS.map((country) => country.code);
}
