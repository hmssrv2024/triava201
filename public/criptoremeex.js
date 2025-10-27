// Global Variables
let selectedSeller = null;
let currentStep = 1;
let orderData = {
    amount: 100,
    rate: 0,
    total: 0,
    seller: null,
    orderId: null,
    timestamp: null
};
let countdownInterval = null;
let chatMessages = [];
let dynamicVariables = null;
let activeOrder = null;
function formatBs(value) {
    return Number(value || 0).toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
const cancelReasons = {
    buyer: [
        "I do not want to trade anymore",
        "Ocurrió un error técnico o de red con la plataforma de pago",
        "No pagué, pero hice clic en 'Transferido'",
        "Other reasons"
    ],
    seller: [
        "Seller is asking for extra fee",
        "Problem with seller's payment method result in unsuccessful payments",
        "El vendedor no puede liberar la orden por problemas de red. El vendedor reintegró la cantidad.",
        "No hay respuesta del vendedor"
    ]
};

const sellerTerms = [
    "Libero rápido, mira mis estadísticas.",
    "Soy titular de todas mis cuentas.",
    "No comercio con terceros.",
    "Si todo sale bien, agradezco tu feedback positivo."
];

// AÑADIR AL CÓDIGO - Variables dinámicas para personalización
class DynamicVariables {
    constructor(seller, order) {
        this.variables = {
            // Información del vendedor
            '{sellerName}': seller?.name || '',
            '{sellerBank}': seller?.bank || '',
            '{sellerPhone}': seller?.phone || '',
            '{sellerId}': seller?.cedula || '',
            '{sellerRating}': seller?.rating || '',
            '{sellerOrders}': seller?.orders || '',
            '{sellerCompletion}': seller?.completion || '',
            '{avgTime}': seller?.avgTime || '',

            // Información de la orden
            '{amount}': order?.amount || '',
            '{rate}': order?.rate || '',
            '{total}': order?.total || '',
            '{orderId}': order?.orderId || '',
            '{timeRemaining}': this.getTimeRemaining(),

            // Información contextual
            '{currentTime}': new Date().toLocaleTimeString('es-ES'),
            '{currentDate}': new Date().toLocaleDateString('es-ES'),
            '{dayPeriod}': this.getDayPeriod(),
            '{bankStatus}': this.getBankStatus(seller?.bank),

            // Estadísticas
            '{totalVolume}': ((seller?.available || 0) + Math.random() * 5000).toFixed(0),
            '{todayOrders}': Math.floor(Math.random() * 20) + 5,
            '{responseTime}': Math.floor(Math.random() * 3) + 1,

            // Estados dinámicos
            '{waitTime}': this.getEstimatedWaitTime(),
            '{queuePosition}': Math.floor(Math.random() * 3) + 1,
            '{bankDelay}': this.getBankDelay(seller?.bank)
        };
    }

    replaceVariables(text) {
        let result = text;
        for (const [key, value] of Object.entries(this.variables)) {
            result = result.replace(new RegExp(key, 'g'), value);
        }
        return result;
    }

    getTimeRemaining() {
        // Calcular tiempo restante de la orden
        return "14:30"; // Ejemplo
    }

    getDayPeriod() {
        const hour = new Date().getHours();
        if (hour < 12) return "mañana";
        if (hour < 18) return "tarde";
        return "noche";
    }

    getBankStatus(bank) {
        const statuses = {
            "Banesco": "✅ Operativo",
            "Mercantil": "✅ Operativo",
            "Banco de Venezuela": "⚠️ Lento",
            "BBVA Provincial": "✅ Operativo"
        };
        return statuses[bank] || "✅ Operativo";
    }

    getEstimatedWaitTime() {
        return `${Math.floor(Math.random() * 5) + 3} minutos`;
    }

    getBankDelay(bank) {
        const delays = {
            "Banesco": "instantáneo",
            "Mercantil": "1-2 minutos",
            "Banco de Venezuela": "3-5 minutos",
            "BBVA Provincial": "instantáneo"
        };
        return delays[bank] || "2-3 minutos";
    }
}

// AÑADIR AL CÓDIGO - Sistema que "aprende" del contexto
class ConversationLearning {
    constructor() {
        this.userProfile = {
            isNewUser: true,
            previousIssues: [],
            preferredBank: null,
            averageAmount: 0,
            responseSpeed: 'normal',
            language: 'formal',
            patience: 'normal'
        };
    }

    analyzeUserBehavior(messages) {
        // Analizar velocidad de respuesta
        if (messages.length > 3) {
            const avgTime = this.calculateAverageResponseTime(messages);
            if (avgTime < 10000) this.userProfile.responseSpeed = 'fast';
            else if (avgTime > 30000) this.userProfile.responseSpeed = 'slow';
        }

        // Detectar nivel de formalidad
        const formalWords = messages.filter(m => 
            m.match(/usted|disculpe|por favor|gracias|señor/i)
        ).length;
        
        if (formalWords > messages.length * 0.3) {
            this.userProfile.language = 'very_formal';
        } else if (formalWords < messages.length * 0.1) {
            this.userProfile.language = 'casual';
        }

        // Detectar paciencia
        const impatientWords = messages.filter(m => 
            m.match(/rápido|ya|ahora|apura|tarde/i)
        ).length;
        
        if (impatientWords > messages.length * 0.3) {
            this.userProfile.patience = 'low';
        }
    }

    adaptResponse(baseResponse) {
        let adapted = baseResponse;

        // Adaptar según formalidad
        if (this.userProfile.language === 'very_formal') {
            adapted = adapted.replace(/Hola/g, 'Buenos días');
            adapted = adapted.replace(/OK/g, 'De acuerdo');
            adapted = adapted.replace(/Dale/g, 'Procedamos');
        } else if (this.userProfile.language === 'casual') {
            adapted = adapted.replace(/Buenos días/g, 'Qué tal');
            adapted = adapted.replace(/De acuerdo/g, 'Dale');
            adapted = adapted.replace(/Procedamos/g, 'Vamos');
        }

        // Adaptar según paciencia
        if (this.userProfile.patience === 'low') {
            // Hacer respuestas más cortas y directas
            adapted = adapted.split('.').slice(0, 2).join('.');
        }

        return adapted;
    }

    calculateAverageResponseTime(messages) {
        // Simular cálculo de tiempo promedio entre mensajes
        return 15000; // 15 segundos promedio
    }
}

function updateDynamicVariables() {
    if (selectedSeller) {
        dynamicVariables = new DynamicVariables(selectedSeller, orderData);
    }
}

// AÑADIR al código - Verificar si existe una orden activa guardada en localStorage
function checkActiveOrder() {
    const savedOrder = localStorage.getItem('activeP2POrder');
    if (savedOrder) {
        activeOrder = JSON.parse(savedOrder);

        const timeElapsed = (new Date().getTime() - new Date(activeOrder.timestamp).getTime()) / 1000;
        if (timeElapsed > 15 * 60) {
            orderData = { ...activeOrder };
            localStorage.removeItem('activeP2POrder');
            saveP2PTransaction('cancelled');
            activeOrder = null;
            showToast('error', 'Orden Expirada', 'Tu orden anterior ha expirado.');
            return false;
        }

        selectedSeller = activeOrder.seller;
        orderData = activeOrder;

        const modal = document.getElementById('orderModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        currentStep = activeOrder.currentStep || 3;
        if (currentStep === 3) prepareStep2();
        if (currentStep === 4) prepareStep3();
        updateSteps();

        showToast('info', 'Orden en Curso', 'Tienes una orden P2P pendiente.');
        return true;
    }
    return false;
}

function saveP2PTransaction(status = 'pending') {
    try {
        const storageKey = 'remeexTransactions';
        const data = JSON.parse(localStorage.getItem(storageKey) || '{"transactions":[]}');
        const tx = {
            id: orderData.orderId,
            type: 'deposit',
            description: 'Compra P2P USDT',
            amount: orderData.amount,
            date: new Date().toLocaleString('es-VE'),
            status
        };
        if (!Array.isArray(data.transactions)) data.transactions = [];
        const idx = data.transactions.findIndex(t => t.id === tx.id);
        if (idx >= 0) {
            data.transactions[idx] = { ...data.transactions[idx], status: tx.status };
        } else {
            data.transactions.push(tx);
        }
        localStorage.setItem(storageKey, JSON.stringify(data));
        updateOperationsBadge();
    } catch (e) {
        console.error('Error saving P2P transaction', e);
    }
}

function getPendingOrdersCount() {
    try {
        const data = JSON.parse(localStorage.getItem('remeexTransactions') || '{"transactions":[]}');
        return data.transactions.filter(t => t.status === 'pending').length;
    } catch (e) {
        return 0;
    }
}

function updateOperationsBadge() {
    const count = getPendingOrdersCount();
    ['ordersIndicator', 'operationsIndicator'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (count > 0) {
            el.textContent = count;
            el.style.display = 'inline-block';
        } else {
            el.style.display = 'none';
        }
    });
}

function loadUserInfo() {
    try {
        const user = JSON.parse(sessionStorage.getItem('remeexUser') || '{}');
        if (user.name) {
            const avatar = document.querySelector('.user-avatar span');
            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
            if (avatar) avatar.textContent = initials;
        }
    } catch (e) {
        console.error('Error loading user info', e);
    }
}

// Sistema de Chat Expandido para P2P
// AÑADIR AL CÓDIGO - Sistema de respuestas expandido
const expandedResponsePatterns = {
    // Respuestas basadas en el estado del pago
    paymentStatus: {
        waiting: [
            "Estoy esperando que realices el pago. ¿Necesitas los datos bancarios nuevamente?",
            "Cuando hagas el pago, avísame para verificarlo de inmediato.",
            "Recuerda que tienes 15 minutos para completar el pago.",
            "Los datos bancarios están en la pantalla. ¿Tienes alguna duda?",
            "Tómate tu tiempo, aquí estoy esperando. Avísame cuando transfieras."
        ],
        processing: [
            "Estoy revisando mi banca en línea, dame un momento.",
            "Ya estoy verificando, el banco a veces tarda un poco.",
            "Entrando a mi cuenta bancaria para confirmar tu pago.",
            "Revisando las notificaciones del banco, ya casi termino.",
            "Perfecto, estoy en eso. El sistema del banco está un poco lento hoy."
        ],
        confirmed: [
            "¡Listo! Ya confirmé tu pago, procedo a liberar los USDT.",
            "Pago recibido correctamente. Liberando tus USDT ahora.",
            "Todo en orden, ya vi el pago. En segundos tendrás tus USDT.",
            "Confirmado! Gracias por tu pago puntual. Liberando...",
            "Excelente, llegó perfecto. Ya libero tus criptos."
        ]
    },

    // Respuestas por categorías temáticas
    categories: {
        greeting: [
            "¡Hola! Bienvenido, vamos a hacer esta transacción rápida y segura.",
            "Saludos! Estoy aquí para ayudarte con tu compra de USDT.",
            "¡Buenas! Será un placer ayudarte con esta operación.",
            "Hola! Gracias por elegirme para tu compra. Vamos a hacerlo rápido.",
            "¡Qué tal! Listo para procesar tu orden de USDT."
        ],
        
        urgency: [
            "Entiendo que tienes prisa, haré esto lo más rápido posible.",
            "No te preocupes, soy de los vendedores más rápidos de la plataforma.",
            "Tranquilo, en menos de 5 minutos tendrás tus USDT.",
            "Comprendo la urgencia, dame solo unos minutos.",
            "Voy a priorizar tu orden, dame un momento."
        ],
        
        trust: [
            "Puedes estar tranquilo, tengo más de 1000 operaciones exitosas.",
            "Mi reputación habla por sí sola, 98% de satisfacción.",
            "Revisa mis estadísticas, soy vendedor verificado.",
            "Llevo 2 años en la plataforma, puedes confiar.",
            "Todas mis operaciones son seguras y rápidas."
        ],
        
        technical: [
            "A veces Pago Móvil se congestiona, pero llegará.",
            "El sistema interbancario puede tardar unos minutos.",
            "Si el banco te da error, intenta de nuevo en 2 minutos.",
            "Verifica que el monto sea exacto para evitar retrasos.",
            "Asegúrate de poner el número de referencia correcto."
        ],
        
        clarification: [
            "Te explico: necesito el comprobante para verificar más rápido.",
            "Es importante que el monto sea exacto por temas de conciliación.",
            "El proceso es simple: pagas, verifico y libero.",
            "Déjame aclararte ese punto...",
            "Te explico mejor cómo funciona..."
        ],
        
        waiting: [
            "Todavía no veo el pago, pero puede estar en camino.",
            "Los pagos a veces tardan 2-3 minutos en reflejarse.",
            "Voy a actualizar mi banco nuevamente.",
            "Dame un minuto más, voy a revisar otra vez.",
            "A veces hay retraso entre bancos, revisaré en un momento."
        ],
        
        problems: [
            "¿Qué error te aparece exactamente?",
            "Déjame ayudarte a resolver ese problema.",
            "Eso puede pasar, vamos a solucionarlo.",
            "No te preocupes, encontraremos una solución.",
            "Ha pasado antes, sé cómo resolverlo."
        ],
        
        confirmation: [
            "¿Me confirmas que ya realizaste la transferencia?",
            "¿Todo listo por tu lado?",
            "¿Pudiste hacer el pago sin problemas?",
            "¿El banco te procesó la transferencia?",
            "¿Me avisas cuando hayas transferido?"
        ],
        
        closing: [
            "¡Perfecto! Fue un placer hacer negocios contigo.",
            "Excelente transacción. ¡Hasta la próxima!",
            "Gracias por tu confianza. ¡Éxito con tus USDT!",
            "Todo listo. Espero verte pronto por aquí.",
            "¡Transacción completada! Gracias por elegirme."
        ]
    },

    // Respuestas específicas por banco
    bankSpecific: {
        "Banesco": [
            "Banesco está funcionando bien hoy, debería llegar rápido.",
            "Con Banesco suele ser inmediato el Pago Móvil.",
            "Banesco a veces se pone lento los lunes, pero ya llegará."
        ],
        "Mercantil": [
            "Mercantil está excelente hoy, sin retrasos.",
            "El Pago Móvil de Mercantil es de los más rápidos.",
            "Mercantil actualiza cada 2 minutos, ya debe aparecer."
        ],
        "Banco de Venezuela": [
            "Venezuela está un poco lento hoy, pero funcionando.",
            "Con Banco de Venezuela puede tardar 5 minutos.",
            "El BDV tiene mantenimiento después de las 8pm, apúrate."
        ],
        "BBVA Provincial": [
            "Provincial está perfecto, sin problemas reportados.",
            "BBVA suele ser muy rápido con los Pago Móvil.",
            "Provincial tiene el mejor sistema, llegará pronto."
        ]
    },

    // Respuestas basadas en montos
    amountBased: {
        small: [ // Menos de 50 USDT
            "Perfecto, es un monto pequeño, será super rápido.",
            "Estos montos los proceso al instante.",
            "Con montos pequeños no hay problema, va rápido."
        ],
        medium: [ // 50-200 USDT
            "Buen monto, lo proceso sin problemas.",
            "Este es el rango más común, ya estoy acostumbrado.",
            "Perfecto el monto, en unos minutos está listo."
        ],
        large: [ // Más de 200 USDT
            "Es un monto considerable, verificaré con cuidado.",
            "Con montos grandes soy más minucioso, dame unos minutos.",
            "Excelente operación, la procesaré con prioridad."
        ]
    },

    // Respuestas según tiempo transcurrido
    timeBasedResponses: {
        immediate: [ // 0-2 minutos
            "Acabo de recibir tu orden, empecemos.",
            "Perfecto, orden nueva. Vamos con todo.",
            "Listo, ya tengo tu solicitud. Procedamos."
        ],
        normal: [ // 2-10 minutos
            "Vamos bien de tiempo, no hay apuro.",
            "Todo va según lo planeado, tranquilo.",
            "Estamos dentro del tiempo normal, sin problemas."
        ],
        warning: [ // 10-13 minutos
            "Recuerda que quedan pocos minutos para completar.",
            "Vamos a apurarnos un poco, queda poco tiempo.",
            "Necesitamos agilizar, el tiempo se está acabando."
        ],
        critical: [ // 13-15 minutos
            "¡Urgente! Quedan menos de 2 minutos.",
            "Si no pagas ya, la orden se cancelará.",
            "¡Último aviso! El tiempo está por agotarse."
        ]
    }
};

// Mensajes Automáticos del Sistema
// AÑADIR AL CÓDIGO - Mensajes automáticos del vendedor
const automatedSellerMessages = {
    // Mensajes programados por tiempo
    timedMessages: [
        {
            delay: 5000,
            condition: 'no_greeting',
            messages: [
                "¡Hola! Vi que creaste una orden. ¿Comenzamos?",
                "Buenas, estoy listo para procesar tu compra.",
                "Saludos! ¿Listo para comprar tus USDT?"
            ]
        },
        {
            delay: 30000,
            condition: 'no_payment',
            messages: [
                "¿Todo bien? ¿Necesitas ayuda con el pago?",
                "Si tienes alguna duda con el proceso, pregúntame.",
                "Recuerda que tienes 15 minutos para completar el pago."
            ]
        },
        {
            delay: 60000,
            condition: 'no_payment',
            messages: [
                "¿Hay algún problema con el banco?",
                "Si no puedes pagar ahora, podemos cancelar y hacerlo luego.",
                "El tiempo sigue corriendo, ¿necesitas ayuda?"
            ]
        },
        {
            delay: 300000, // 5 minutos
            condition: 'no_payment',
            messages: [
                "Han pasado 5 minutos. ¿Sigues ahí?",
                "Te quedan 10 minutos para completar el pago.",
                "Si no respondes, tendré que liberar los USDT para otros compradores."
            ]
        },
        {
            delay: 600000, // 10 minutos
            condition: 'no_payment',
            messages: [
                "⚠️ Quedan solo 5 minutos antes de que se cancele la orden.",
                "Último aviso: la orden se cancelará pronto.",
                "Si ya pagaste, por favor envíame el comprobante YA."
            ]
        }
    ],

    // Mensajes reactivos a eventos
    eventMessages: {
        orderCreated: [
            "¡Nueva orden recibida! Monto: {amount} USDT",
            "Perfecto, orden por {amount} USDT creada exitosamente.",
            "Orden #{orderId} iniciada. Esperando tu pago."
        ],

        fileUploaded: [
            "Veo que subiste un archivo. Déjame revisarlo.",
            "Comprobante recibido, verificando...",
            "Perfecto, ya tengo tu comprobante. Revisando el pago."
        ],

        paymentVerified: [
            "✅ Pago verificado! Liberando {amount} USDT",
            "¡Confirmado! Tu pago llegó perfecto. Liberando ahora.",
            "Todo en orden. Procesando liberación de USDT."
        ],

        orderCompleted: [
            "✅ ¡Transacción completada exitosamente!",
            "¡Listo! Tus USDT han sido liberados.",
            "Operación finalizada. ¡Gracias por tu confianza!"
        ],

        orderCancelled: [
            "Orden cancelada según lo solicitado.",
            "He cancelado la orden. Puedes crear una nueva cuando quieras.",
            "Cancelación procesada. ¿Necesitas algo más?"
        ]
    },

    // Respuestas según hora del día
    timeOfDayMessages: {
        morning: [ // 6 AM - 12 PM
            "Buenos días! Empecemos bien el día con esta transacción.",
            "Qué bueno empezar temprano! Vamos con tu compra."
        ],
        afternoon: [ // 12 PM - 6 PM
            "Buenas tardes! Alta demanda a esta hora, pero te atiendo rápido.",
            "Hola! Hora pico, pero no te preocupes, soy rápido."
        ],
        evening: [ // 6 PM - 10 PM
            "Buenas noches! Todavía trabajando a full.",
            "¡Saludos! Cerremos el día con esta transacción."
        ],
        night: [ // 10 PM - 6 AM
            "Trabajando hasta tarde! Te atiendo sin problema.",
            "A estas horas hay menos congestión bancaria, irá rápido."
        ]
    }
};

// AÑADIR AL CÓDIGO - Plantillas de conversación
const conversationTemplates = {
    // Conversación de comprador primerizo
    firstTimeBuyer: [
        {
            trigger: /primera vez|nuevo|no sé|cómo funciona/i,
            responses: [
                "No te preocupes, te guío paso a paso. Es muy fácil.",
                "Primero: haces el Pago Móvil con los datos que te di.",
                "Segundo: subes el comprobante o me avisas cuando pagues.",
                "Tercero: yo verifico y libero tus USDT. ¡Así de simple!",
                "Todo el proceso toma menos de 10 minutos. ¿Comenzamos?"
            ]
        }
    ],

    // Conversación de problema técnico
    technicalIssue: [
        {
            trigger: /error|no funciona|no puedo|problema técnico/i,
            responses: [
                "Veo que tienes un problema técnico. ¿Qué error específico te aparece?",
                "Si es error del banco, prueba estos pasos:",
                "1. Cierra la app del banco y vuelve a abrir",
                "2. Verifica que tengas saldo suficiente",
                "3. Intenta con un monto sin decimales",
                "Si persiste, podemos intentar en 5 minutos cuando el sistema se descongestion."
            ]
        }
    ],

    // Conversación de verificación de identidad
    identityVerification: [
        {
            trigger: /eres real|bot|automático|persona/i,
            responses: [
                "Soy {sellerName}, vendedor verificado de la plataforma.",
                "Puedes ver mi historial: {orders} órdenes completadas.",
                "Mi calificación es {rating} con {completion}% de éxito.",
                "Estoy aquí para asegurar que tu transacción sea segura."
            ]
        }
    ],

    // Conversación de negociación
    negotiation: [
        {
            trigger: /descuento|mejor precio|caro|rebaja/i,
            responses: [
                "Mi precio es competitivo: {rate} Bs/USDT",
                "Es el mejor precio que puedo ofrecer manteniendo la calidad del servicio.",
                "Revisa otros vendedores si quieres, pero considera mi velocidad y confiabilidad.",
                "El precio incluye transacción rápida y segura."
            ]
        }
    ]
};

// AÑADIR AL CÓDIGO - Respuestas para situaciones especiales
const specialSituationResponses = {
    allCapsResponse: [
        "Veo que estás alterado. Calmemos y resolvamos esto juntos.",
        "Entiendo tu frustración. Déjame ayudarte mejor.",
        "Tranquilo, vamos a solucionar esto paso a paso."
    ],
    profanityResponse: [
        "Mantengamos el respeto mutuo. ¿En qué puedo ayudarte?",
        "Entiendo que estés molesto, pero hablemos con calma.",
        "Prefiero mantener una conversación profesional. ¿Qué necesitas?"
    ],
    longMessageResponse: [
        "Veo que tienes varias dudas. Vamos por partes...",
        "Ok, mucha información. Déjame responder punto por punto.",
        "Entiendo todo. Primero resolvamos lo más importante."
    ],
    spamResponse: [
        "Ya recibí tu mensaje. Dame un momento para responder.",
        "No necesitas repetir, ya te estoy atendiendo.",
        "Mensaje recibido. Paciencia, ya te respondo."
    ],
    emojiResponse: [
        "👍 ¡Perfecto!",
        "😊 ¡Me alegra!",
        "💪 ¡Vamos con todo!"
    ],
    foreignLanguage: {
        english: [
            "I speak Spanish. Hablo español.",
            "Please write in Spanish. Por favor escribe en español."
        ],
        portuguese: [
            "Falo espanhol. Hablo español.",
            "Por favor escreva em espanhol."
        ]
    },
    competitorMention: [
        "Prefiero enfocarme en darte el mejor servicio aquí.",
        "Cada plataforma tiene sus ventajas, aquí te ofrezco seguridad y rapidez.",
        "Estás aquí ahora, hagamos una excelente transacción."
    ],
    inappropriateRequest: [
        "Solo proceso transacciones de USDT según las reglas de la plataforma.",
        "No puedo ayudarte con eso. Sigamos con la compra de USDT.",
        "Eso está fuera del servicio. ¿Continuamos con tu orden?"
    ]
};

// Sellers Data
const sellersData = [
    {
        id: 1,
        name: "Carlos Rodríguez",
        initials: "CR",
        rating: 4.9,
        orders: 1543,
        completion: 98.5,
        rate: 189.50,
        bank: "Banesco",
        limits: { min: 20, max: 5000 },
        available: 8500,
        avgTime: "8 min",
        verified: true,
        phone: "0414-1234567",
        cedula: "V-12345678",
        terms: sellerTerms,
        online: true
    },
    {
        id: 2,
        name: "María González",
        initials: "MG",
        rating: 4.8,
        orders: 892,
        completion: 97.2,
        rate: 188.75,
        bank: "Mercantil",
        limits: { min: 20, max: 3000 },
        available: 5200,
        avgTime: "10 min",
        verified: true,
        phone: "0424-9876543",
        cedula: "V-87654321",
        terms: sellerTerms,
        online: true
    },
    {
        id: 3,
        name: "José Martínez",
        initials: "JM",
        rating: 4.7,
        orders: 2103,
        completion: 96.8,
        rate: 190.25,
        bank: "Banco de Venezuela",
        limits: { min: 20, max: 10000 },
        available: 15000,
        avgTime: "12 min",
        verified: true,
        phone: "0412-5551234",
        cedula: "V-15678234",
        terms: sellerTerms,
        online: true
    },
    {
        id: 4,
        name: "Ana Pérez",
        initials: "AP",
        rating: 5.0,
        orders: 567,
        completion: 99.1,
        rate: 187.90,
        bank: "BBVA Provincial",
        limits: { min: 20, max: 2000 },
        available: 3500,
        avgTime: "5 min",
        verified: true,
        phone: "0416-7778899",
        cedula: "V-23456789",
        terms: sellerTerms,
        online: false
    },
    {
        id: 5,
        name: "Luis Fernández",
        initials: "LF",
        rating: 4.6,
        orders: 3421,
        completion: 95.5,
        rate: 191.00,
        bank: "BNC",
        limits: { min: 20, max: 8000 },
        available: 12000,
        avgTime: "15 min",
        verified: false,
        phone: "0426-3332211",
        cedula: "V-34567890",
        terms: sellerTerms,
        online: true
    },
    {
        id: 6,
        name: "Carmen Silva",
        initials: "CS",
        rating: 4.9,
        orders: 1876,
        completion: 98.0,
        rate: 189.00,
        bank: "Banco Exterior",
        limits: { min: 20, max: 4000 },
        available: 6800,
        avgTime: "9 min",
        verified: true,
        phone: "0414-9998877",
        cedula: "V-45678901",
        terms: sellerTerms,
        online: true
    },
    {
        id: 7,
        name: "Roberto Díaz",
        initials: "RD",
        rating: 4.5,
        orders: 423,
        completion: 94.2,
        rate: 192.50,
        bank: "Bicentenario",
        limits: { min: 20, max: 1500 },
        available: 2200,
        avgTime: "18 min",
        verified: false,
        phone: "0424-6665544",
        cedula: "V-56789012",
        terms: sellerTerms,
        online: true
    },
    {
        id: 8,
        name: "Patricia Morales",
        initials: "PM",
        rating: 4.8,
        orders: 1234,
        completion: 97.5,
        rate: 188.25,
        bank: "Banco Plaza",
        limits: { min: 20, max: 6000 },
        available: 9500,
        avgTime: "7 min",
        verified: true,
        phone: "0412-4443322",
        cedula: "V-67890123",
        terms: sellerTerms,
        online: false
    },
    {
        id: 9,
        name: "Miguel Herrera",
        initials: "MH",
        rating: 4.7,
        orders: 789,
        completion: 96.0,
        rate: 190.75,
        bank: "Banesco",
        limits: { min: 20, max: 3500 },
        available: 5500,
        avgTime: "11 min",
        verified: true,
        phone: "0416-2221100",
        cedula: "V-78901234",
        terms: sellerTerms,
        online: true
    },
    {
        id: 10,
        name: "Sofía Vargas",
        initials: "SV",
        rating: 4.9,
        orders: 2567,
        completion: 98.3,
        rate: 187.50,
        bank: "Mercantil",
        limits: { min: 20, max: 7000 },
        available: 11000,
        avgTime: "6 min",
        verified: true,
        phone: "0426-8887766",
        cedula: "V-89012345",
        terms: sellerTerms,
        online: true
    },
    {
        id: 11,
        name: "Alejandro Ruiz",
        initials: "AR",
        rating: 4.4,
        orders: 234,
        completion: 93.0,
        rate: 193.25,
        bank: "Banco de Venezuela",
        limits: { min: 20, max: 1000 },
        available: 1800,
        avgTime: "20 min",
        verified: false,
        phone: "0414-5554433",
        cedula: "V-90123456",
        terms: sellerTerms,
        online: true
    },
    {
        id: 12,
        name: "Elena Castro",
        initials: "EC",
        rating: 5.0,
        orders: 1789,
        completion: 99.5,
        rate: 186.75,
        bank: "BBVA Provincial",
        limits: { min: 20, max: 5500 },
        available: 8200,
        avgTime: "4 min",
        verified: true,
        phone: "0424-3332211",
        cedula: "V-01234567",
        terms: sellerTerms,
        online: true
    },
    {
        id: 13,
        name: "Fernando López",
        initials: "FL",
        rating: 4.6,
        orders: 567,
        completion: 95.8,
        rate: 191.50,
        bank: "BNC",
        limits: { min: 20, max: 2500 },
        available: 4000,
        avgTime: "13 min",
        verified: false,
        phone: "0412-7776655",
        cedula: "V-11223344",
        terms: sellerTerms,
        online: false
    },
    {
        id: 14,
        name: "Isabel Mendoza",
        initials: "IM",
        rating: 4.8,
        orders: 3456,
        completion: 97.8,
        rate: 188.00,
        bank: "Banco Exterior",
        limits: { min: 20, max: 9000 },
        available: 14000,
        avgTime: "8 min",
        verified: true,
        phone: "0416-9998877",
        cedula: "V-22334455",
        terms: sellerTerms,
        online: true
    },
    {
        id: 15,
        name: "Diego Ramírez",
        initials: "DR",
        rating: 4.5,
        orders: 890,
        completion: 94.5,
        rate: 192.00,
        bank: "Bicentenario",
        limits: { min: 20, max: 3000 },
        available: 4500,
        avgTime: "16 min",
        verified: false,
        phone: "0426-6665544",
        cedula: "V-33445566",
        terms: sellerTerms,
        online: true
    },
    {
        id: 16,
        name: "Laura Torres",
        initials: "LT",
        rating: 4.9,
        orders: 2345,
        completion: 98.7,
        rate: 187.25,
        bank: "Banco Plaza",
        limits: { min: 20, max: 8500 },
        available: 13000,
        avgTime: "5 min",
        verified: true,
        phone: "0414-4443322",
        cedula: "V-44556677",
        terms: sellerTerms,
        online: true
    },
    {
        id: 17,
        name: "Pedro Sánchez",
        initials: "PS",
        rating: 4.7,
        orders: 1567,
        completion: 96.5,
        rate: 189.75,
        bank: "Banesco",
        limits: { min: 20, max: 4500 },
        available: 7000,
        avgTime: "10 min",
        verified: true,
        phone: "0424-2221100",
        cedula: "V-55667788",
        terms: sellerTerms,
        online: false
    },
    {
        id: 18,
        name: "Gabriela Flores",
        initials: "GF",
        rating: 4.8,
        orders: 678,
        completion: 97.0,
        rate: 188.50,
        bank: "Mercantil",
        limits: { min: 20, max: 2800 },
        available: 4200,
        avgTime: "9 min",
        verified: true,
        phone: "0412-8887766",
        cedula: "V-66778899",
        terms: sellerTerms,
        online: true
    },
    {
        id: 19,
        name: "Ricardo Jiménez",
        initials: "RJ",
        rating: 4.6,
        orders: 456,
        completion: 95.2,
        rate: 191.25,
        bank: "Banco de Venezuela",
        limits: { min: 20, max: 2000 },
        available: 3000,
        avgTime: "14 min",
        verified: false,
        phone: "0416-5554433",
        cedula: "V-77889900",
        terms: sellerTerms,
        online: true
    },
    {
        id: 20,
        name: "Natalia Rojas",
        initials: "NR",
        rating: 5.0,
        orders: 2890,
        completion: 99.2,
        rate: 186.50,
        bank: "BBVA Provincial",
        limits: { min: 20, max: 10000 },
        available: 16000,
        avgTime: "3 min",
        verified: true,
        phone: "0426-3332211",
        cedula: "V-88990011",
        terms: sellerTerms,
        online: true
    }
];

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    renderSellers();
    setupEventListeners();
    initializeFilters();
    loadBanks();
    loadUserInfo();
    updateUI();
    checkActiveOrder();
    updateOperationsBadge();
}

// Render Sellers
function renderSellers() {
    const sellersList = document.getElementById('sellersList');
    if (!sellersList) return;

    sellersList.innerHTML = '';
    
    sellersData.forEach((seller, index) => {
        const sellerCard = createSellerCard(seller);
        sellerCard.style.animationDelay = `${index * 0.05}s`;
        sellersList.appendChild(sellerCard);
    });
}

function createSellerCard(seller) {
    const card = document.createElement('div');
    card.className = 'seller-card';
    card.innerHTML = `
        <div class="seller-header">
            <div class="seller-info">
                <div class="seller-avatar" style="background: linear-gradient(135deg, ${getRandomGradient()})">
                    <span>${seller.initials}</span>
                </div>
                <div class="seller-details">
                    <div class="seller-name">
                        ${seller.name}
                        ${seller.verified ? `
                            <span class="verified-badge">
                                <svg width="12" height="12" viewBox="0 0 12 12">
                                    <path d="M4.5 7.5L2 5l1-1 1.5 1.5L8 2l1 1-4.5 4.5z" fill="white"/>
                                </svg>
                            </span>
                        ` : ''}
                    </div>
                    <div class="seller-stats">
                        <span class="stat-item">
                            <svg width="14" height="14" viewBox="0 0 14 14">
                                <path d="M7 1l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z" fill="#F0B90B"/>
                            </svg>
                            ${seller.rating}
                        </span>
                        <span class="stat-item">${seller.orders} órdenes</span>
                        <span class="stat-item">${seller.completion}% completado</span>
                        <span class="stat-item" style="color: ${seller.online ? '#0ECB81' : '#848E9C'}">
                            ${seller.online ? '● En línea' : '● Desconectado'}
                        </span>
                    </div>
                </div>
            </div>
            <div class="seller-price">
                <div class="price-label">Precio</div>
                <div class="price-value">${formatBs(seller.rate)} <span class="price-currency">Bs/USDT</span></div>
            </div>
            <div class="trust-indicators">
                <div class="trust-badge">
                    <span class="trust-score">${seller.trustScore || 95}%</span>
                    <small>Confiabilidad</small>
                </div>
                <div class="response-time">
                    <span class="response-value">${seller.avgResponseTime || '2 min'}</span>
                    <small>Respuesta</small>
                </div>
            </div>
        </div>
        <div class="seller-body">
            <div class="seller-detail">
                <span class="detail-label">Límites</span>
                <span class="detail-value">${seller.limits.min} - ${seller.limits.max.toLocaleString()} USDT</span>
            </div>
            <div class="seller-detail">
                <span class="detail-label">Disponible</span>
                <span class="detail-value">${seller.available.toLocaleString()} USDT</span>
            </div>
            <div class="seller-detail">
                <span class="detail-label">Tiempo promedio</span>
                <span class="detail-value">${seller.avgTime}</span>
            </div>
            <div class="seller-detail">
                <span class="detail-label">Banco</span>
                <span class="detail-value"><img src="${getBankLogoByName(seller.bank)}" alt="${seller.bank}" class="bank-logo-small">${seller.bank}</span>
            </div>
        </div>
        <div class="seller-footer">
            <div class="payment-methods-list">
                <span class="payment-badge">
                    <svg width="14" height="14" viewBox="0 0 14 14">
                        <rect x="2" y="3" width="10" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
                        <circle cx="7" cy="7" r="2" fill="currentColor"/>
                    </svg>
                    Pago Móvil
                </span>
                <span class="payment-badge disabled">Transferencia</span>
                <span class="payment-badge disabled">Zelle</span>
            </div>
            <button class="buy-button" onclick="openOrderModal(${seller.id})">
                Comprar USDT
            </button>
        </div>
        <div class="seller-guarantees">
            <div class="guarantee-item">
                <span class="guarantee-icon">🛡️</span>
                <span>Protección escrow</span>
            </div>
            <div class="guarantee-item">
                <span class="guarantee-icon">⚡</span>
                <span>Liberación rápida</span>
            </div>
            <div class="guarantee-item">
                <span class="guarantee-icon">📞</span>
                <span>Soporte 24/7</span>
            </div>
        </div>
    `;
    return card;
}

// Modal Functions
function openOrderModal(sellerId) {
    selectedSeller = sellersData.find(s => s.id === sellerId);
    if (!selectedSeller) return;

    orderData.seller = selectedSeller;
    orderData.rate = selectedSeller.rate;

    // El modal principal ahora solo sirve para introducir el monto
    // y no para toda la operación.
    resetModal();
    updateModalSellerInfo();
    updateOrderCalculations();
    
    const modal = document.getElementById('orderModal');
    modal.classList.add('active');
    
    document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

function closeConfirmModal() {
    document.getElementById('confirmOrderModal').classList.remove('active');
    document.body.style.overflow = '';
}

function proceedToConfirm() {
    if (!validateStep1()) return;

    document.getElementById('confirmPrice').textContent = `${formatBs(orderData.rate)} Bs/USDT`;
    document.getElementById('confirmAmountUSDT').textContent = `${orderData.amount.toFixed(2)} USDT`;
    document.getElementById('confirmTotalVES').textContent = `${formatBs(orderData.total)} Bs`;

    const termsBox = document.getElementById('sellerTermsBox');
    termsBox.innerHTML = '<ul>' + selectedSeller.terms.map(term => `<li>${term}</li>`).join('') + '</ul>';

    document.getElementById('acceptTerms').checked = false;
    document.getElementById('finalizeOrderBtn').disabled = true;
    document.getElementById('confirmOrderModal').classList.add('active');
}

function openCancelModal() {
    document.getElementById('cancelOrderModal').classList.add('active');
}

function closeCancelModal() {
    document.getElementById('cancelOrderModal').classList.remove('active');
}

function closeReasonsModal() {
    document.getElementById('cancelReasonsModal').classList.remove('active');
}

function showCancelReasons() {
    closeCancelModal();
    const reasonsList = document.getElementById('reasonsList');
    reasonsList.innerHTML = '';

    reasonsList.innerHTML += `<h4>Debido al comprador</h4>`;
    cancelReasons.buyer.forEach(reason => {
        reasonsList.innerHTML += `
            <label class="cancel-reason-item">
                <input type="radio" name="cancelReason" value="${reason}"> ${reason}
            </label>
        `;
    });
    reasonsList.innerHTML += `<h4 style="margin-top:16px;">Debido al vendedor</h4>`;
    cancelReasons.seller.forEach(reason => {
        reasonsList.innerHTML += `
            <label class="cancel-reason-item">
                <input type="radio" name="cancelReason" value="${reason}"> ${reason}
            </label>
        `;
    });

    document.getElementById('cancelReasonsModal').classList.add('active');

    document.querySelectorAll('input[name="cancelReason"]').forEach(radio => {
        radio.addEventListener('change', () => {
            document.getElementById('confirmCancelBtn').disabled = false;
            document.querySelectorAll('.cancel-reason-item').forEach(label => label.classList.remove('selected'));
            radio.parentElement.classList.add('selected');
        });
    });
}

function confirmCancellation() {
    const selectedReason = document.querySelector('input[name="cancelReason"]:checked').value;
    console.log("Orden cancelada por el motivo:", selectedReason);

    showToast('error', 'Orden Cancelada', 'La orden ha sido cancelada exitosamente.');
    localStorage.removeItem('activeP2POrder');
    saveP2PTransaction('cancelled');
    activeOrder = null;

    closeReasonsModal();
    closeOrderModal();
}

function showTerms() {
    alert('Términos de servicio próximamente.');
}

function showPrivacy() {
    alert('Política de privacidad próximamente.');
}

function completeWelcome() {
    if (!document.getElementById('agreeTerms').checked) {
        alert('Debes aceptar los términos de servicio y la política de privacidad.');
        return;
    }
    const name = document.getElementById('userBasicName').value.trim();
    const phone = document.getElementById('userBasicPhone').value.trim();
    localStorage.setItem('basicInfo', JSON.stringify({ name, phone }));
    localStorage.setItem('welcomeCompleted', 'true');
    document.getElementById('welcomeModal').classList.remove('active');
    document.body.style.overflow = '';
}

// AÑADIR al código - Iniciar el proceso de la orden y guardarla en localStorage
function startOrderProcess() {
    // Esconder el modal de selección de monto
    document.getElementById('orderModal').classList.remove('active');

    // Crear el objeto de la orden activa
    orderData.orderId = 'RMX' + Date.now().toString().slice(-8);
    orderData.timestamp = new Date();
    orderData.currentStep = 3;

    activeOrder = { ...orderData };
    localStorage.setItem('activeP2POrder', JSON.stringify(activeOrder));
    saveP2PTransaction('pending');

    // Abrir el modal principal y preparar el paso 2
    const modal = document.getElementById('orderModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    currentStep = 3;
    prepareStep2();
    updateSteps();
    startCountdown();
}

function resetModal() {
    currentStep = 1;
    updateSteps();
    document.getElementById('orderAmount').value = 100;
    orderData.amount = 100;
}

function updateModalSellerInfo() {
    if (!selectedSeller) return;

    document.getElementById('modalSellerInitials').textContent = selectedSeller.initials;
    document.getElementById('modalSellerName').textContent = selectedSeller.name;
    document.getElementById('modalSellerRating').textContent = selectedSeller.rating;
    document.getElementById('modalSellerOrders').textContent = `${selectedSeller.orders} órdenes`;
    document.getElementById('modalSellerCompletion').textContent = `${selectedSeller.completion}% completado`;
    const verifyName = document.getElementById('verifySellerName');
    if (verifyName) verifyName.textContent = selectedSeller.name;
    const verifyRating = document.getElementById('verifySellerRating');
    if (verifyRating) verifyRating.textContent = selectedSeller.rating;
    const verifyRate = document.getElementById('verifyRate');
    if (verifyRate) verifyRate.textContent = `${formatBs(selectedSeller.rate)} Bs/USDT`;
}

// Step Navigation
// MODIFICAR - Guardar el estado de la orden al avanzar al paso 3
function nextStep() {
    if (currentStep === 3) {
        if (!validateStep2()) return;
        currentStep++;
        if (activeOrder) {
            activeOrder.currentStep = 4;
            localStorage.setItem('activeP2POrder', JSON.stringify(activeOrder));
        }
        prepareStep3();
    } else {
        currentStep++;
    }
    updateSteps();
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateSteps();
    }
}

// Help Center functions
function toggleHelpCenter() {
    const panel = document.getElementById('helpPanel');
    if (panel) {
        panel.classList.toggle('active');
    }
}

function openTutorial() {
    alert('Tutorial próximamente');
}

function openFAQ() {
    alert('Preguntas frecuentes próximamente');
}

function contactSupport() {
    alert('Conectando con soporte...');
}

function showSafetyTips() {
    alert('Recuerda verificar los datos antes de pagar.');
}

function updateSteps() {
    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 === currentStep) {
            step.classList.add('active');
        } else if (index + 1 < currentStep) {
            step.classList.add('completed');
        }
    });
    
    // Update step content
    document.querySelectorAll('.step-content').forEach((content, index) => {
        content.classList.remove('active');
        if (index + 1 === currentStep) {
            content.classList.add('active');
        }
    });
}

function validateStep1() {
    const amount = parseFloat(document.getElementById('orderAmount').value);
    
    if (isNaN(amount) || amount < selectedSeller.limits.min) {
        showToast('error', 'Error', `El monto mínimo es ${selectedSeller.limits.min} USDT`);
        return false;
    }
    
    if (amount > selectedSeller.limits.max) {
        showToast('error', 'Error', `El monto máximo es ${selectedSeller.limits.max} USDT`);
        return false;
    }
    
    if (amount > selectedSeller.available) {
        showToast('error', 'Error', 'El vendedor no tiene suficiente USDT disponible');
        return false;
    }
    
    return true;
}

function validateStep2() {
    const fileInput = document.getElementById('paymentProof');
    if (!fileInput.files || fileInput.files.length === 0) {
        showToast('warning', 'Advertencia', 'Debes adjuntar el comprobante de pago');
        return false;
    }
    return true;
}

function prepareStep2() {
    document.getElementById('paymentBank').textContent = selectedSeller.bank;
    const bankLogo = document.getElementById('paymentBankLogo');
    if (bankLogo) {
        bankLogo.src = getBankLogoByName(selectedSeller.bank);
        bankLogo.alt = selectedSeller.bank;
    }
    document.getElementById('paymentPhone').textContent = selectedSeller.phone;
    document.getElementById('paymentID').textContent = selectedSeller.cedula;
    document.getElementById('paymentName').textContent = selectedSeller.name;
    document.getElementById('amountToPay').textContent = formatBs(orderData.total);
}

function prepareStep3() {
    // Asegurar que el ID y la marca de tiempo existan
    if (!orderData.orderId) {
        orderData.orderId = 'RMX' + Date.now().toString().slice(-8);
    }
    if (!orderData.timestamp) {
        orderData.timestamp = new Date();
    }

    // Actualizar detalles de confirmación
    document.getElementById('orderID').textContent = orderData.orderId;
    document.getElementById('summaryAmount').textContent = `${orderData.amount} USDT`;
    document.getElementById('summaryTotal').textContent = `${formatBs(orderData.total)} Bs`;

    // Simular mensajes del vendedor
    setTimeout(() => {
        addSellerMessage("Hola! He recibido tu orden. Estoy verificando el pago.");
    }, 3000);

    setTimeout(() => {
        addSellerMessage("Por favor, espera un momento mientras confirmo la transacción.");
    }, 8000);
}

// Order Calculations
function updateOrderCalculations() {
    const amount = parseFloat(document.getElementById('orderAmount').value) || 0;
    orderData.amount = amount;
    orderData.total = amount * orderData.rate;

    updateDynamicVariables();
    document.getElementById('totalAmount').textContent = formatBs(orderData.total);
}

function adjustAmount(delta) {
    const input = document.getElementById('orderAmount');
    let current = parseFloat(input.value) || 0;
    current = Math.max(20, current + delta);
    input.value = current;
    updateOrderCalculations();
}

function setAmount(amount) {
    document.getElementById('orderAmount').value = amount;
    updateOrderCalculations();
}

// File Upload
function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('paymentProof');
    
    if (!uploadArea || !fileInput) return;
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-color)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border-color)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-color)';
        
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

function handleFileSelect(file) {
    const uploadArea = document.getElementById('uploadArea');
    const uploadedFile = document.getElementById('uploadedFile');
    const fileName = document.getElementById('fileName');
    
    uploadArea.style.display = 'none';
    uploadedFile.style.display = 'flex';
    fileName.textContent = file.name;
}

function removeFile() {
    const uploadArea = document.getElementById('uploadArea');
    const uploadedFile = document.getElementById('uploadedFile');
    const fileInput = document.getElementById('paymentProof');
    
    uploadArea.style.display = 'flex';
    uploadedFile.style.display = 'none';
    fileInput.value = '';
}

// Countdown Timer
function startCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    let seconds = 15 * 60; // 15 minutos

    countdownInterval = setInterval(() => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;

        const display = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        const confirmTimer = document.getElementById('countdown');
        if (confirmTimer) confirmTimer.textContent = display;
        const payTimer = document.getElementById('paymentCountdown');
        if (payTimer) payTimer.textContent = display;

        if (seconds <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            cancelActiveOrder();
        }

        seconds--;
    }, 1000);
}

function cancelActiveOrder() {
    showToast('warning', 'Orden cancelada', 'El tiempo de pago expiró');
    localStorage.removeItem('activeP2POrder');
    saveP2PTransaction('cancelled');
    activeOrder = null;
    closeOrderModal();
}

// Chat Functions (continuación)
function openChat() {
    const chatModal = document.getElementById('chatModal');
    chatModal.classList.add('active');
    
    document.getElementById('chatUserInitials').textContent = selectedSeller.initials;
    document.getElementById('chatUserName').textContent = selectedSeller.name;
    
    // Initialize chat with welcome message
    if (chatMessages.length === 0) {
        addSystemMessage('Chat iniciado con el vendedor');
    }
}

function closeChat() {
    const chatModal = document.getElementById('chatModal');
    chatModal.classList.remove('active');
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addUserMessage(message);
    input.value = '';
    
    // Simulate automated responses
    processAutomatedResponse(message);
}

function sendQuickMessage(text) {
    addUserMessage(text);
    processAutomatedResponse(text);
}

function addUserMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-sent';
    
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        ${message}
        <div class="message-time">${time}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    chatMessages.push({ type: 'sent', message, time });
}

function addSellerMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-received';
    
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        ${message}
        <div class="message-time">${time}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    chatMessages.push({ type: 'received', message, time });
}

function addSystemMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-system';
    
    messageDiv.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 11a1 1 0 110-2 1 1 0 010 2zm1-3H7V4h2v5z" fill="#848E9C"/>
        </svg>
        <span>${message}</span>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function processAutomatedResponse(userMessage) {
    // Inicializar sistemas si no existen
    if (!window.chatSystem) {
        window.chatSystem = new ChatResponseSystem();
        window.dynamicVars = new DynamicVariables(selectedSeller, orderData);
        window.learningSystem = new ConversationLearning();
    }

    // Analizar mensaje del usuario
    const response = window.chatSystem.generateContextualResponse(userMessage);
    
    // Reemplazar variables dinámicas
    const personalizedResponse = window.dynamicVars.replaceVariables(response);
    
    // Adaptar según el perfil del usuario
    const adaptedResponse = window.learningSystem.adaptResponse(personalizedResponse);
    
    // Agregar indicador de escritura
    showTypingIndicator();
    
    // Calcular delay realista basado en la longitud del mensaje
    const typingDelay = Math.min(adaptedResponse.length * 20, 3000);
    
    setTimeout(() => {
        hideTypingIndicator();
        
        // Si es un mensaje largo, dividirlo en múltiples mensajes
        if (adaptedResponse.length > 100) {
            const sentences = adaptedResponse.match(/[^.!?]+[.!?]+/g) || [adaptedResponse];
            sentences.forEach((sentence, index) => {
                setTimeout(() => {
                    addSellerMessage(sentence.trim());
                }, index * 1500);
            });
        } else {
            addSellerMessage(adaptedResponse);
        }
        
        // Programar mensajes automáticos según el contexto
        scheduleAutomatedMessages();
    }, typingDelay);
}

// Nueva función para mensajes automáticos programados
function scheduleAutomatedMessages() {
    const context = window.chatSystem.conversationContext;
    
    // Si no ha pagado después de 2 minutos, enviar recordatorio
    if (!context.hasPaid && context.messageCount < 3) {
        setTimeout(() => {
            if (!context.hasPaid) {
                const reminder = automatedSellerMessages.timedMessages[1].messages;
                const message = reminder[Math.floor(Math.random() * reminder.length)];
                showTypingIndicator();
                setTimeout(() => {
                    hideTypingIndicator();
                    addSellerMessage(message);
                }, 2000);
            }
        }, 120000);
    }
}

// Función para manejar eventos especiales
function handleSpecialEvents(eventType, data) {
    const eventMessage = automatedSellerMessages.eventMessages[eventType];
    if (eventMessage) {
        const message = eventMessage[Math.floor(Math.random() * eventMessage.length)];
        const personalizedMessage = window.dynamicVars.replaceVariables(message);
        
        setTimeout(() => {
            addSellerMessage(personalizedMessage);
        }, 1000);
    }
}

function checkSpecialSituations(message, lowerMessage) {
    // Mensajes en mayúsculas
    if (message === message.toUpperCase() && message.replace(/[^A-ZÁÉÍÓÚÑ]/gi, '').length > 5) {
        return getRandom(specialSituationResponses.allCapsResponse);
    }

    // Detección de malas palabras
    const profanityWords = ['puta', 'mierda', 'coño', 'joder'];
    if (profanityWords.some(w => lowerMessage.includes(w))) {
        return getRandom(specialSituationResponses.profanityResponse);
    }

    // Mensajes muy largos
    if (message.length > 180) {
        return getRandom(specialSituationResponses.longMessageResponse);
    }

    // Mensajes repetidos (spam)
    const lastMessage = chatMessages[chatMessages.length - 1];
    if (lastMessage && lastMessage.type === 'sent' && lastMessage.message === message) {
        return getRandom(specialSituationResponses.spamResponse);
    }

    // Solo emojis
    const emojiRegex = /[\u{1F300}-\u{1FAFF}]/u;
    if (emojiRegex.test(message) && message.replace(emojiRegex, '').trim() === '') {
        return getRandom(specialSituationResponses.emojiResponse);
    }

    // Idioma extranjero
    if (/\b(hello|hi|please|thanks)\b/i.test(lowerMessage)) {
        return getRandom(specialSituationResponses.foreignLanguage.english);
    }
    if (/\b(ola|obrigado|por favor)\b/i.test(lowerMessage)) {
        return getRandom(specialSituationResponses.foreignLanguage.portuguese);
    }

    // Menciones de competencia
    if (/\b(binance|paxful|localbitcoins|airtm)\b/i.test(lowerMessage)) {
        return getRandom(specialSituationResponses.competitorMention);
    }

    // Solicitudes inapropiadas
    if (/\b(sexo|drogas|hack|ilegal)\b/i.test(lowerMessage)) {
        return getRandom(specialSituationResponses.inappropriateRequest);
    }

    return null;
}

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function sendTemplateResponses(responses, index = 0) {
    if (index >= responses.length) return;
    showTypingIndicator();
    setTimeout(() => {
        hideTypingIndicator();
        addSellerMessage(responses[index]);
        sendTemplateResponses(responses, index + 1);
    }, 1500);
}

function formatTemplateResponse(response) {
    if (!dynamicVariables) return response;
    return dynamicVariables.replaceVariables(response);
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    
    // Remove existing typing indicator if any
    hideTypingIndicator();
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message message-received typing-indicator';
    typingDiv.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Toast Notifications
function showToast(type, title, message) {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#0ECB81"/>',
        error: '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#F6465D"/>',
        warning: '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="#FCD535"/>'
    };
    
    toast.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24">
            ${iconMap[type]}
        </svg>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2"/>
            </svg>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Copy to Clipboard
function copyText(elementId, label = 'Dato') {
    const el = document.getElementById(elementId);
    if (!el) return;
    const text = el.textContent.trim();
    navigator.clipboard.writeText(text).then(() => {
        showToast('success', 'Copiado', `${label} copiado al portapapeles`);
    });
}

function copyAmount() {
    copyText('amountToPay', 'Monto');
}

// Filters
function initializeFilters() {
    const amountInput = document.querySelector('.amount-input');
    const bankSelect = document.querySelector('.filter-select');
    const applyButton = document.querySelector('.filter-apply');
    
    if (amountInput) {
        amountInput.addEventListener('input', debounce(filterSellers, 500));
    }
    
    if (bankSelect) {
        bankSelect.addEventListener('change', filterSellers);
    }
    
    if (applyButton) {
        applyButton.addEventListener('click', filterSellers);
    }
}

function loadBanks() {
    const bankSelect = document.getElementById('bankFilter');
    const logosContainer = document.getElementById('bankLogos');
    if (!bankSelect || !logosContainer) return;

    // Limpia los elementos existentes
    bankSelect.innerHTML = '<option value="all">Todos los bancos</option>';
    logosContainer.innerHTML = '';

    // Obtiene los bancos únicos usados por los vendedores
    const uniqueBanks = [...new Set(sellersData.map(s => s.bank))];

    // Crea dinámicamente las opciones y los logos
    uniqueBanks.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        bankSelect.appendChild(opt);

        const logo = getBankLogoByName(name);
        if (logo) {
            const img = document.createElement('img');
            img.src = logo;
            img.alt = name;
            logosContainer.appendChild(img);
        }
    });
}

function filterSellers() {
    const amount = parseFloat(document.querySelector('.amount-input').value) || 100;
    const selectedBank = document.querySelector('.filter-select').value;
    
    const filteredSellers = sellersData.filter(seller => {
        const amountValid = amount >= seller.limits.min && amount <= seller.limits.max;
        const bankValid = selectedBank === 'all' || seller.bank === selectedBank;
        return amountValid && bankValid;
    });
    
    renderFilteredSellers(filteredSellers);
}

function renderFilteredSellers(sellers) {
    const sellersList = document.getElementById('sellersList');
    if (!sellersList) return;
    
    sellersList.innerHTML = '';
    
    if (sellers.length === 0) {
        sellersList.innerHTML = `
            <div class="no-results">
                <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" fill="none"/>
                    <path d="M16 16l16 16M32 16L16 32" stroke="currentColor" stroke-width="2"/>
                </svg>
                <p>No se encontraron vendedores con los filtros aplicados</p>
            </div>
        `;
        return;
    }
    
    sellers.forEach((seller, index) => {
        const sellerCard = createSellerCard(seller);
        sellerCard.style.animationDelay = `${index * 0.05}s`;
        sellersList.appendChild(sellerCard);
    });
}

function getBankLogoByName(name) {
    if (!window.BANK_DATA) return '';
    const banks = [...BANK_DATA.NACIONAL, ...BANK_DATA.INTERNACIONAL, ...BANK_DATA.FINTECH];
    const bank = banks.find(b => b.name === name);
    return bank ? bank.logo : '';
}

// Sort Functions
function setupSortButtons() {
    const sortButtons = document.querySelectorAll('.sort-btn');
    
    sortButtons.forEach(button => {
        button.addEventListener('click', function() {
            sortButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const sortType = this.textContent.trim();
            sortSellers(sortType);
        });
    });
}

function sortSellers(sortType) {
    let sortedSellers = [...sellersData];
    
    switch(sortType) {
        case 'Mejor Precio':
            sortedSellers.sort((a, b) => a.rate - b.rate);
            break;
        case 'Mayor Volumen':
            sortedSellers.sort((a, b) => b.available - a.available);
            break;
        case 'Mejor Calificación':
            sortedSellers.sort((a, b) => b.rating - a.rating);
            break;
    }
    
    renderFilteredSellers(sortedSellers);
}

// Loading Functions
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.remove('active');
}

// Event Listeners
function setupEventListeners() {
    // Modal close on overlay click
    document.getElementById('orderModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeOrderModal();
        }
    });
    
    // Chat input enter key
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // File upload
    setupFileUpload();
    
    // Sort buttons
    setupSortButtons();
    
    // Order amount input
    const orderAmountInput = document.getElementById('orderAmount');
    if (orderAmountInput) {
        orderAmountInput.addEventListener('input', updateOrderCalculations);
    }
    
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Handle navigation
            const section = this.textContent.trim();
            handleNavigation(section);
        });
    });
    
    // Report issue function
    window.reportIssue = function() {
        showToast('info', 'Soporte', 'Abriendo formulario de reporte...');
    };

    document.getElementById('acceptTerms').addEventListener('change', function() {
        document.getElementById('finalizeOrderBtn').disabled = !this.checked;
    });

    document.getElementById('finalizeOrderBtn').addEventListener('click', function() {
        closeConfirmModal();
       startOrderProcess();
    });

    document.getElementById('confirmCancelBtn').addEventListener('click', confirmCancellation);

    const resumeBtn = document.getElementById('resumeOrderBtn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            if (!checkActiveOrder()) {
                showToast('info', 'Operaciones', 'No tienes operaciones en proceso.');
            }
        });
    }
}

function handleNavigation(section) {
    switch(section) {
        case 'Comprar':
            // Already on buy page
            break;
        case 'Vender':
            showToast('info', 'Próximamente', 'La función de venta estará disponible pronto');
            break;
        case 'Órdenes':
            showToast('info', 'Órdenes', 'No tienes órdenes activas');
            break;
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function getRandomGradient() {
    const gradients = [
        '#667eea, #764ba2',
        '#f093fb, #f5576c',
        '#4facfe, #00f2fe',
        '#43e97b, #38f9d7',
        '#fa709a, #fee140',
        '#30cfd0, #330867',
        '#a8edea, #fed6e3',
        '#ff9a9e, #fecfef',
        '#fbc2eb, #a6c1ee',
        '#fdcbf1, #e6dee9'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
}

function updateUI() {
    // Update real-time elements
    updatePriceAverage();
    updateVolume();
    updateOnlineStatus();
}

function updatePriceAverage() {
    const avgPrice = sellersData.reduce((sum, seller) => sum + seller.rate, 0) / sellersData.length;
    const priceElement = document.querySelector('.info-value');
    if (priceElement) {
        priceElement.textContent = `${formatBs(avgPrice)} Bs/USDT`;
    }
}

function updateVolume() {
    const totalVolume = sellersData.reduce((sum, seller) => sum + seller.available, 0);
    const volumeElement = document.querySelectorAll('.info-value')[1];
    if (volumeElement) {
        volumeElement.textContent = `${totalVolume.toLocaleString()} USDT`;
    }
}

function updateOnlineStatus() {
    // Simulate random online status changes
    setInterval(() => {
        const randomSeller = Math.floor(Math.random() * sellersData.length);
        sellersData[randomSeller].online = Math.random() > 0.3;
        
        // Update UI if needed
        const sellerCards = document.querySelectorAll('.seller-card');
        if (sellerCards[randomSeller]) {
            const statusElement = sellerCards[randomSeller].querySelector('.stat-item:last-child');
            if (statusElement) {
                statusElement.style.color = sellersData[randomSeller].online ? '#0ECB81' : '#848E9C';
                statusElement.textContent = sellersData[randomSeller].online ? '● En línea' : '● Desconectado';
            }
        }
    }, 30000); // Every 30 seconds
}

// Simulate real-time price updates
function simulatePriceUpdates() {
    setInterval(() => {
        sellersData.forEach(seller => {
            // Random small price fluctuation
            const change = (Math.random() - 0.5) * 0.5;
            seller.rate = Math.max(185, Math.min(195, seller.rate + change));
        });
        
        // Update displayed prices
        const priceElements = document.querySelectorAll('.price-value');
        priceElements.forEach((element, index) => {
            if (sellersData[index]) {
                element.innerHTML = `${formatBs(sellersData[index].rate)} <span class="price-currency">Bs/USDT</span>`;
            }
        });
        
        updatePriceAverage();
    }, 60000); // Every minute
}

// Initialize animations
function initializeAnimations() {
    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.seller-card').forEach(card => {
        observer.observe(card);
    });
}

// Mobile optimizations
function initializeMobileOptimizations() {
    // Prevent zoom on input focus
    const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            document.querySelector('meta[name="viewport"]').setAttribute('content', 
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        });
    });
    
    // Handle mobile menu
    if (window.innerWidth <= 768) {
        setupMobileMenu();
    }
}

function setupMobileMenu() {
    // Add hamburger menu for mobile
    const header = document.querySelector('.header-container');
    const hamburger = document.createElement('button');
    hamburger.className = 'mobile-menu-toggle';
    hamburger.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    
    hamburger.addEventListener('click', toggleMobileMenu);
    header.insertBefore(hamburger, header.firstChild);
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('mobile-active');
}

// Performance optimizations
function optimizePerformance() {
    // Lazy load images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // Throttle scroll events
    let ticking = false;
    function handleScroll() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                // Handle scroll-based animations
                ticking = false;
            });
            ticking = true;
        }
    }
    window.addEventListener('scroll', handleScroll);
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    initializeMobileOptimizations();
    optimizePerformance();
    simulatePriceUpdates();
});

// Handle window resize
window.addEventListener('resize', debounce(() => {
    if (window.innerWidth <= 768 && !document.querySelector('.mobile-menu-toggle')) {
        setupMobileMenu();
    }
}, 250));

// Export functions for global access
window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.nextStep = nextStep;
window.previousStep = previousStep;
window.adjustAmount = adjustAmount;
window.setAmount = setAmount;
window.copyAmount = copyAmount;
window.copyText = copyText;
window.openChat = openChat;
window.closeChat = closeChat;
window.sendMessage = sendMessage;
window.sendQuickMessage = sendQuickMessage;
window.removeFile = removeFile;
window.openCancelModal = openCancelModal;
window.closeCancelModal = closeCancelModal;
window.showCancelReasons = showCancelReasons;
window.closeReasonsModal = closeReasonsModal;
window.confirmCancellation = confirmCancellation;
window.completeWelcome = completeWelcome;
window.showTerms = showTerms;
window.showPrivacy = showPrivacy;
window.toggleHelpCenter = toggleHelpCenter;
window.openTutorial = openTutorial;
window.openFAQ = openFAQ;
window.contactSupport = contactSupport;
window.showSafetyTips = showSafetyTips;

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('welcomeCompleted')) {
        document.getElementById('welcomeModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
});

// Add CSS for typing indicator
const style = document.createElement('style');
style.textContent = `
    .typing-indicator {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 12px 16px;
    }
    
    .typing-indicator span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--text-secondary);
        animation: typing 1.4s infinite;
    }
    
    .typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
    }
    
    .typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
    }
    
    @keyframes typing {
        0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
        }
        30% {
            transform: translateY(-10px);
            opacity: 1;
        }
    }
    
    .no-results {
        text-align: center;
        padding: 60px 20px;
        color: var(--text-secondary);
    }
    
    .no-results svg {
        margin-bottom: 20px;
        opacity: 0.5;
    }
    
    .no-results p {
        font-size: 16px;
    }
    
    .mobile-menu-toggle {
        display: none;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 8px;
    }
    
    .mobile-menu-toggle span {
        display: block;
        width: 24px;
        height: 2px;
        background: var(--text-primary);
        margin: 5px 0;
        transition: var(--transition-fast);
    }
    
    @media (max-width: 768px) {
        .mobile-menu-toggle {
            display: block;
        }
        
        .nav-menu {
            position: fixed;
            top: 64px;
            left: -100%;
            width: 250px;
            height: calc(100vh - 64px);
            background: var(--bg-secondary);
            flex-direction: column;
            padding: 20px;
            transition: var(--transition-medium);
            z-index: 999;
            box-shadow: var(--shadow-lg);
        }
        
        .nav-menu.mobile-active {
            left: 0;
        }
    }
    
    .animated {
        animation: fadeIn 0.5s ease forwards;
    }
`;
document.head.appendChild(style);

console.log('Remeex P2P - Sistema inicializado correctamente');

// Inicializar el sistema de chat mejorado cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Código existente...

    // Inicializar sistema de chat expandido
    console.log('Sistema de chat expandido cargado con éxito');
    console.log('Total de patrones de respuesta:', Object.keys(expandedResponsePatterns).length);
    console.log('Plantillas de conversación disponibles:', Object.keys(conversationTemplates).length);
});

// Ejemplo de uso cuando se crea una orden
function onOrderCreated() {
    handleSpecialEvents('orderCreated', {
        amount: orderData.amount,
        orderId: orderData.orderId
    });
}

// Ejemplo de uso cuando se verifica el pago
function onPaymentVerified() {
    handleSpecialEvents('paymentVerified', {
        amount: orderData.amount
    });
}
