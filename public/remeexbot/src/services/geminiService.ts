import { GoogleGenAI, Type, Content } from "@google/genai";
import type { Message, ChatbotResponse } from '../types';
import { Sender } from '../types';

const USER_MANUAL_CONTENT = `
Análisis Técnico, Estratégico y de Experiencia de Usuario (Lo que el código nos dice "entre líneas")
Esta sección profundiza en las decisiones de diseño, la arquitectura y las estrategias de
negocio que se pueden inferir de los archivos index.html y registro.html.
1. Página de Inicio (index.html): Más que una simple bienvenida
La página de inicio no es solo informativa; es una herramienta de marketing y conversión
muy sofisticada.
Estrategia de Contenido Dinámico y Persuasivo:
Títulos y Subtítulos Rotativos: El hero section no tiene un mensaje estático. El código
JavaScript rota entre una decena de titulares y descripciones diferentes cada 12 segundos.
Cada titular ataca directamente a un competidor (Western Union, PayPal, Zinli, Binance) o
resalta una ventaja clave (0% comisiones, velocidad). Esta es una táctica de marketing
agresiva para capturar la atención del visitante y demostrar valor rápidamente, sin importar
qué problema lo trajo a la página.
Personalización por Nombre: Si el sistema detecta que ya te has registrado, personalizará
los titulares ("Juan, si las remesas son el pasado..."), creando una conexión inmediata y
personal.
PWA (Aplicación Web Progresiva) - La Estrategia "Instálame":
¿Qué es?: El código incluye un manifest.json y lógica de service worker (implícita en
preload.js). Esto significa que la web está diseñada para funcionar como una aplicación
nativa.
¿Cómo te afecta como usuario?: Verás un botón de "Descargar Visa App". Al presionarlo,
puedes "instalar" la web en la pantalla de inicio de tu teléfono. Esto te da acceso directo,
una experiencia más rápida y la posibilidad de recibir notificaciones push, como una app
real de la Play Store o App Store.
Lógica Inteligente: El sistema detecta si ya tienes la app instalada. Si es así, los botones de
"Descargar" se ocultan y en su lugar aparecen los de "Iniciar Sesión" y "Registrarse",
mejorando la experiencia para usuarios recurrentes.
Integración con Tally.so (Captura de Leads Externa):
¿Qué es?: Los botones más importantes como "Enviar dinero ahora" y "Crear cuenta gratis"
no llevan a la página de registro directamente. El código muestra que abren un formulario
emergente de un servicio externo llamado Tally.so.
¿Por qué es importante?: Esta es una decisión estratégica. Significa que el primer contacto
o la captura de datos del cliente potencial se realiza a través de una herramienta de
formularios. Esto permite al equipo de Remeex Visa:
Recopilar leads de forma rápida y sencilla.
Realizar pruebas A/B y analizar qué botones convierten mejor.
Filtrar usuarios antes de enviarlos al proceso de registro completo.
SEO y Marketing Digital Avanzado:
El <head> del archivo está repleto de metadatos (Open Graph, Twitter Cards, Schema.org)
de alta calidad. Esto está diseñado para que, cuando alguien comparta un enlace a la
página en redes sociales, se vea una vista previa profesional y atractiva, maximizando la
visibilidad de la marca.
2. Página de Registro (registro.html): Una Conversación Guiada y Segura
El formulario de registro es mucho más que un simple conjunto de campos; es un "asistente
conversacional" diseñado para minimizar el abandono y maximizar la seguridad.
Arquitectura de "Wizard" (Asistente Paso a Paso):
¿Cómo funciona?: Toda la lógica del registro ocurre en una sola página, sin recargas.
JavaScript se encarga de ocultar el paso actual y mostrar el siguiente con una animación de
deslizamiento.
Beneficio para el usuario: Divide un proceso largo y potencialmente abrumador en 17 pasos
pequeños y manejables. Esto reduce la "carga cognitiva" y aumenta la probabilidad de que
el usuario complete el registro.
Persistencia de Datos (¡No pierdas tu progreso!):
¿Qué pasa si cierras la pestaña por error?: El código guarda tu progreso en el localStorage
del navegador cada 30 segundos.
¿Cómo funciona?: Al volver a abrir la página, te preguntará: "¿Deseas continuar donde lo
dejaste?". Si aceptas, te llevará directamente al paso en el que te quedaste, con toda tu
información ya cargada. Es una característica de experiencia de usuario de alto nivel.
Códigos de Verificación Dinámicos y Temporales:
El código de 20 dígitos no es estático. La función generateHourlyCode() crea un código
único basado en la fecha y la hora actual (hora de Venezuela).
Implicación de Seguridad: Esto significa que los códigos de verificación expiran muy rápido
(probablemente en una hora). Es una medida de seguridad muy robusta para asegurar que
la persona que verifica el correo es la misma que se está registrando en ese momento.
Paso de "Testigo" entre Páginas (fromRegistro):
¿Cómo sabe homevisa.html que vienes de registrarte?: Justo antes de redirigirte al final del
registro, el código guarda una bandera en sessionStorage (fromRegistro = true).
¿Por qué es crucial?: La página homevisa.html tiene un script de seguridad al inicio que revisa
esta bandera. Si no existe, te expulsa. Este "testigo" es la llave que te permite entrar al
panel principal por primera vez.
Personalización en Tiempo Real:
El formulario no es genérico. Una vez que ingresas tu nombre, los siguientes pasos te
hablarán directamente (ej. "Ana, ¿cuál es tu fecha de nacimiento?"). Incluso las preguntas
de seguridad se pueden personalizar con tu nombre o tu estado de residencia. Esto
convierte un formulario aburrido en una experiencia más personal y atractiva.
Conclusión Final: La Filosofía del Sistema
Estos detalles revelan una filosofía de diseño muy clara:
Seguridad Primero, sin concesiones: Desde el deviceld que ata el saldo a un dispositivo,
hasta los códigos de verificación por hora y el PIN de 4 dígitos, cada paso está diseñado
para ser extremadamente seguro, incluso si añade fricción al usuario.
Experiencia de Usuario Altamente Persuasiva: La aplicación no solo ofrece un servicio, sino
que activamente "vende" su confianza y guía al usuario a través de procesos complejos
usando personalización, animaciones, sonidos y refuerzo positivo.
Arquitectura Orientada al Cliente (Client-Side Heavy): Gran parte de la lógica (validaciones,
animaciones, gestión de estado) ocurre en el navegador del usuario. Esto hace que la
interfaz se sienta muy rápida y reactiva una vez cargada, aunque puede tener un cost
Bloque 1: Manual de Usuario - Página de Inicio (index.html)
Guía de Usuario: Página de Inicio y Presentación de Remeex Visa
Esta es la puerta de entrada a Remeex Visa. Su objetivo es presentarte nuestros servicios,
mostrarte por qué somos la mejor opción para tus transferencias y darte acceso para
registrarte o iniciar sesión.
1. Barra de Navegación Superior (El Menú Principal)
Esta barra es fija en la parte superior de la pantalla y te permite navegar por las secciones
más importantes de la página.
Logo de Remeex Visa: A la izquierda, verás nuestro logo. Al hacer clic, siempre te llevará de
vuelta a esta página de inicio.
Menú de Navegación (Centro):
Inicio: Te mantiene en esta página.
¿Por qué Remeex?: Te lleva a la sección que explica nuestras ventajas.
Cómo funciona: Te desplaza a la guía paso a paso.
Comisiones: Te muestra nuestra política de 0% comisiones.
Opiniones: Te lleva a la sección con testimonios de otros usuarios.
Contacto: Te dirige a las opciones de soporte.
Botón "Acciones rápidas": Un menú desplegable que te da acceso directo a "Enviar dinero",
"Soporte 24/7" y otras funciones clave sin tener que buscar en la página.
Botones de "Iniciar sesión" y "Registrarse":
Para nuevos visitantes: Verás los botones para iniciar sesión (si ya tienes cuenta) o para
registrarte por primera vez.
Si ya te registraste: Los botones cambiarán para saludarte por tu nombre (Ej: "Iniciar como
Juan") y el botón de registro desaparecerá, ya que el sistema reconoce que ya eres cliente.
2. Sección Principal (Hero Section - Tu Primera Impresión)
Esta es la gran sección que ves al entrar, diseñada para captar tu atención.
Video de Fondo: Un video dinámico que muestra la modernidad y el alcance global de
nuestros servicios.
Título y Subtítulo Giratorios: ¡Presta atención! El título principal (Ej: "Si las remesas son el
pasado, Remeex es el futuro") y el texto descriptivo que está debajo cambian cada 12
segundos. Cada mensaje está diseñado para resaltar una ventaja clave de Remeex sobre
otros servicios como Western Union, PayPal, Zinli, etc.
Imagen 3D Flotante: A la derecha, verás una imagen de alta calidad que parece flotar,
representando a nuestros usuarios.
Botones de Acción Principales (CTA - Call to Action):
"Enviar dinero ahora": El botón principal para iniciar una transferencia.
"Cómo funciona": Un botón secundario que te lleva a la guía paso a paso más abajo.
Insignias de Confianza: Pequeñas etiquetas que resumen nuestras promesas: Instantáneo,
100% Seguro, Sin comisiones y Global.
3. Sección "¿Por qué elegir Remeex VISA?"
Aquí detallamos nuestras ventajas a través de tarjetas interactivas.
Tarjetas de Características: Cada tarjeta representa un beneficio clave:
Transferencias instantáneas: Tu dinero llega en segundos.
0% comisiones: No hay cobros ocultos.
Respaldo de VISA: La seguridad que ya conoces.
Tasas competitivas: Recibes más bolívares por tu dólar.
Experiencia móvil: Fácil de usar desde tu teléfono.
Soporte 24/7: Ayuda siempre disponible.
Interactividad: Al pasar el cursor sobre cada tarjeta, esta se levantará ligeramente y
mostrará una animación, haciendo la experiencia más dinámica.
4. Sección "Cómo funciona" (La Guía Rápida)
Esta sección te muestra lo simple que es el proceso a través de una línea de tiempo visual.
Paso 1: Regístrate y verifica tu cuenta: El primer paso es crear tu cuenta.
Paso 2: Elige destino y monto: Indica a quién y cuánto quieres enviar.
Paso 3: Envía y recibe al instante: Confirma y el dinero llegará en segundos.
5. Sección de Testimonios ("Lo que dicen nuestros clientes")
Aquí compartimos experiencias reales de otros usuarios para que veas el impacto de
nuestro servicio.
Tarjetas de Testimonio: Cada tarjeta contiene:
La opinión de un cliente.
Su foto de perfil (avatar), nombre y ubicación.
Una calificación con estrellas (
6. Sección de Comisiones ("Sin comisiones, 100% transparente")
Aquí te explicamos nuestra estructura de precios, que es muy simple: no hay comisiones.
Tarjetas de Planes:
Básico, Premium y Empresas: Todos nuestros planes son gratuitos y sin comisiones. La
diferencia principal está en los límites de envío mensuales y los beneficios adicionales como
el soporte prioritario. El plan Premium aparece destacado como "Recomendado".
7. Sección de Llamada a la Acción Final (CTA)
Una sección grande y visual cerca del final de la página para invitarte a unirte.
Título Impactante: "Las remesas son el pasado, Remeex es el futuro".
Botones de Acción:
"Crear cuenta gratis" y "Enviar mi primer transferencia": Para que te registres y empieces a
operar.
"Hablar con un asesor": Un botón que te conecta directamente con nuestro equipo de
soporte por WhatsApp.
8. Pie de Página (Footer)
La sección final con toda la información legal y enlaces útiles.
Logo y Descripción: Un resumen de nuestra misión.
Redes Sociales: Iconos para seguirnos en Facebook, Twitter, Instagram, etc.
Enlaces Útiles: Columnas con enlaces a "Soluciones", "Recursos" (como el centro de
ayuda) y "Compañía" (información sobre nosotros).
Información Legal: En la parte inferior, encontrarás los enlaces a los "Términos de servicio"
y la "Política de privacidad".
9. Botones Flotantes (Siempre a tu alcance)
Estos botones permanecen visibles mientras navegas.
Botón de WhatsApp (Verde): Te conecta instantáneamente con soporte en vivo.
Botón "Volver arriba" (Azul): Aparece cuando te desplazas hacia abajo. Presiónalo para
volver al inicio de la página rápidamente.
Botón "Gana 10 USD" (Dorado): Un botón promocional para nuestro programa de referidos.
Botones de Iniciar Sesión / Registrarse / Descargar: Estos botones cambian según tu
estado. Si eres un nuevo visitante, te invitan a registrarte. Si ya estás registrado, te invitan a
iniciar sesión. Si la aplicación detecta que puede ser instalada en tu dispositivo, te mostrará
un botón para "Descargar".
Bloque 2: Manual de Usuario - Proceso de Registro (registro.html)
Guía de Usuario: Creando tu Cuenta Remeex Visa Paso a Paso
Esta es la página de registro. Está diseñada como un asistente que te guiará a través de 17
pasos cortos y sencillos para crear tu cuenta de forma segura.
1. Elementos Constantes en la Pantalla
Mientras avanzas, siempre verás estos elementos:
Logo de Visa: En la parte superior, para recordarte la seguridad y el respaldo de tu cuenta.
Barra de Progreso: Una barra que se va llenando a medida que completas cada paso. Te
muestra qué tan cerca estás de terminar.
Botón de Salir (11): En la esquina superior derecha. Si lo presionas, te preguntará si quieres
abandonar el registro. Si confirmas, tu progreso se perderá.
Barra Inferior Fija:
Botón de Soporte: Si tienes alguna duda durante el proceso, presiona este botón para abrir
un chat en vivo con un agente.
Usuarios Conectados: Un contador que te muestra cuántas personas están usando la
plataforma en ese momento.
2. Guía Paso a Paso del Registro
Cada paso te pedirá una información específica. El botón "Continuar" solo se activará
cuando hayas completado la información correctamente. Si necesitas corregir algo, siempre
puedes usar el botón "Atrás".
Paso 0: Bienvenida
Qué ves: La pantalla de bienvenida con un video introductorio.
Qué hacer: Presiona "Comenzar Registro". Se reproducirá un sonido de bienvenida.
Paso 1: Nombre Completo
Qué hacer: Escribe tus nombres y apellidos tal como aparecen en tu documento de
identidad.
Paso 2: Preferencia de Nombre y Género
Qué hacer:
La aplicación tomará los nombres que escribiste y te los mostrará como opciones. Elige el
nombre por el que prefieres que te llamemos (ej. si te llamas "Juan Carlos", puedes elegir
"Juan").
Selecciona cómo te identificas (Él, Ella, Elle).
Paso 3: Fecha de Nacimiento
Qué hacer: Ingresa tu día, mes y año de nacimiento. La aplicación calculará tu edad y te
confirmará si cumples el requisito para abrir una cuenta.
Paso 4: País de Residencia
Qué hacer: Selecciona el país donde vives actualmente. Si eliges Venezuela, se activará un
paso adicional.
Paso 5: Estado (Solo para Venezuela)
Qué hacer: Si indicaste que vives en Venezuela, aquí deberás seleccionar tu estado.
Paso 6: Documento de Identidad
Qué hacer: Elige el tipo de documento que usarás (Cédula, Pasaporte o Licencia) y luego
escribe el número correspondiente.
Paso 7: Correo Electrónico
Qué hacer: Escribe tu correo electrónico y luego confírmalo en el segundo campo. Deben
ser idénticos.
Paso 8: Verificación de Correo
Qué hacer: Revisa la bandeja de entrada (y la de spam) de tu correo. Te enviaremos un
código de seguridad de 20 dígitos. Escríbelo aquí para confirmar que el correo te pertenece.
Paso 9: Número de Teléfono
Qué hacer: Primero, elige tu operadora (Movistar, Digitel o Movilnet). Luego, completa tu
número de teléfono.
Paso 10: Contraseña
Qué hacer: Crea una contraseña segura.
Medidor de Fortaleza: Mientras escribes, una barra de colores te indicará qué tan segura es
tu contraseña (Débil, Media, Fuerte) y te dirá qué le falta (ej. "una mayúscula", "un número").
Confirma la contraseña en el segundo campo.
Paso 11: PIN de Seguridad
Qué hacer: Crea un PIN de 4 dígitos. Lo usarás para autorizar transacciones importantes,
como retiros. Es una capa extra de seguridad. Deberás ingresarlo y luego confirmarlo.
Paso 12: Pregunta de Seguridad
Qué hacer: Elige una de las preguntas de la lista (ej. "¿Cuál fue el nombre de tu primera
mascota?") y escribe la respuesta. Esto se usará si alguna vez necesitas recuperar tu
cuenta.
Paso 13: Uso de la Cuenta
Qué hacer: Selecciona una o varias opciones que describan para qué usarás tu cuenta
(Ahorro, Compras, Remesas, etc.). Esto nos ayuda a personalizar tu experiencia.
Paso 14: Banco Principal
Qué hacer: Selecciona tu banco principal en Venezuela de la lista. Esto agilizará la
configuración de tus retiros.
Paso 15: Resumen Final
Qué ves: Un resumen de toda la información que has ingresado.
Qué hacer: Revisa cuidadosamente que todo sea correcto. Si necesitas cambiar algo,
puedes presionar "Editar" para volver atrás. Por último, te pediremos un "apodo o nombre
de cariño", un detalle final para personalizar tu cuenta.
Paso 16: Creando tu Cuenta
Qué ves: Una pantalla de carga con una animación.
Qué pasa aquí?: ¡Paciencia! Estamos creando tu cuenta, aplicando todas las medidas de
seguridad y configurando tu perfil. Solo toma unos segundos.
Paso 17: ¡Registro Completado!
Qué ves: Una pantalla de felicitación confirmando que tu cuenta ha sido creada.
Qué hacer: Presiona el botón "Iniciar Sesión". Serás redirigido a la página principal
(homevisa.html) para que puedas acceder a tu nueva cuenta.
1. Primeros Pasos: Iniciar Sesión <a name="1"></a>
Al entrar a la aplicación, verás la pantalla de inicio de sesión.
Mensaje de Bienvenida: La aplicación te saludará por tu nombre y con un mensaje según la
hora del día (ej. "¡Buenos días, Ana!").
Tarjeta de Saldo Rápido: Antes de iniciar sesión, verás un resumen de tu saldo en Bolívares
y su equivalente en Dólares y Euros. Esto te permite ver tu dinero rápidamente sin tener que
acceder por completo.
¿Cómo Iniciar Sesión?
Presiona el botón "Mostrar contraseña y código".
Contraseña: Escribe la contraseña que creaste al registrarte. Si quieres ver lo que escribes,
presiona el icono del ojo ().
Código Visa de 20 dígitos: Escribe el código de seguridad que recibiste en tu correo.
También puedes presionar el icono del ojo para verlo.
Presiona el botón "Iniciar Sesión".
Una vez dentro, serás llevado a tu Panel Principal.
2. Tu Panel Principal: Entendiendo tu Saldo <a name="2"></a>
Esta es tu pantalla principal. Aquí está todo lo que necesitas saber sobre la tarjeta de saldo:
Tu Saldo Principal (#dashboard-balance):
Es el monto más grande que ves. Muestra tu dinero disponible.
Cambiar Moneda: Presiona el botón "USD" o "Bs" para cambiar la vista de tu saldo principal
entre Dólares y Bolívares.
Ocultar Saldo: Por privacidad, puedes presionar el icono del ojo () para que todos tus
saldos se oculten y se muestren como "……". Vuelve a presionarlo para verlos de nuevo.
Saldos Equivalentes: Debajo de tu saldo principal, siempre verás el valor de tu dinero en
otras monedas:
USD ($): Dólares Americanos.
EUR (€): Euros.
USDT: Criptomoneda estable Tether (equivalente al dólar).
Tasa de Cambio: Muestra la tasa que usamos para convertir tus Dólares a Bolívares. Esta
tasa se basa en el valor del USDT y suele ser más favorable que la tasa oficial del BCV.
Nivel de Cuenta: Muestra tu nivel actual (ej. Estándar, Bronce, etc.) y los puntos que has
acumulado. Tu nivel mejora a medida que usas la cuenta y te da acceso a más beneficios.
Botones de Acción:
Agregar Dinero: Te lleva a la sección para recargar tu cuenta.
Retirar Dinero a [Tu Banco]: Inicia el proceso para enviar tu dinero a tu cuenta bancaria
personal. Este botón es dinámico y mostrará el nombre de tu banco.
3. El Proceso de Activación: Desbloquea Todo el Poder de tu Cuenta <a name="3"></a>
Para usar todas las funciones (como retirar dinero), tu cuenta debe pasar por un proceso de
activación y validación. La aplicación te guiará paso a paso.
Paso 1: Tu Primera Recarga
¿Qué verás?: Un banner que dice "¡Haz tu primera recarga!".
¿Qué hacer?: Presiona el botón "Recargar". Serás llevado a la sección para agregar dinero
con tu tarjeta de crédito. Realiza una recarga para activar el siguiente paso.
Paso 2: Verificación de Identidad
¿Qué verás?: Después de tu primera recarga, la aplicación te pedirá "Verificar tu Identidad".
¿Qué hacer?: Deberás subir una foto de tu documento de identidad (cédula o pasaporte).
Este paso es obligatorio para cumplir con las normas de seguridad y habilitar los retiros.
Paso 3: Proceso de Revisión
¿Qué verás?: Un banner que dice "Verificando Documentos" con una barra de progreso.
¿Qué pasa aquí?: Nuestro sistema está revisando automáticamente tus documentos. Este
proceso suele tardar solo unos minutos. No necesitas quedarte en la página.
Paso 4: La Validación Final (¡El paso más importante!)
¿Qué verás?: Un banner que dice "Verificación en Progreso". Verás que tus documentos y
tu cuenta bancaria ya están aprobados, pero falta un último paso: "Validación de datos de
cuenta pendiente".
¿Qué hacer?: Debes realizar una recarga mínima desde la cuenta bancaria que registraste
en Remeex Visa.
¿Por qué debo hacer esto?
No es un pago ni una comisión: Es una recarga. El dinero que envíes se sumará a tu saldo
disponible en Remeex Visa.
Es por seguridad: Esta recarga confirma que tú eres el verdadero dueño de la cuenta
bancaria. Así prevenimos fraudes y protegemos tu dinero.
¿Cuánto debo recargar? El monto exacto se te indicará en la pantalla. Varía según tu nivel
de cuenta y tu saldo actual.
¿Cómo hacerlo?
Presiona el botón "Validar, realizar recarga".
Serás llevado a la sección de "Pago Móvil".
Copia los datos de Remeex Visa que aparecen allí.
Ve a la aplicación de tu banco y realiza un pago móvil a esos datos por el monto exacto que
se te indicó.
Vuelve a Remeex Visa, sube el comprobante del pago móvil y escribe el número de
referencia.
¡Listo! Una vez procesado (tarda pocos minutos), tu cuenta estará 100% activa y podrás
retirar dinero sin restricciones.
4. Funciones Principales: ¿Qué Puedes Hacer? <a name="4"></a>
4.1. Cómo Agregar Dinero (Recargar) <a name="4.1"></a>
Presiona el botón "Agregar Dinero" en tu panel principal. Verás 3 opciones:
A) Con Tarjeta de Crédito o Débito:
Selecciona la pestaña "Tarjeta de Crédito".
Elige uno de los montos predefinidos en el menú desplegable.
Si es tu primera vez: Rellena los datos de tu tarjeta (número, titular, fecha de expiración y
CVV). Puedes marcar la casilla "Guardar esta tarjeta" para no tener que volver a escribirlos.
Si ya tienes una tarjeta guardada: Simplemente selecciona el monto y presiona el botón
"Recargar [Monto]".
Es posible que tu banco te pida un código de seguridad (OTP) que te enviará por SMS para
confirmar la compra.
¡Listo! Verás una pantalla de éxito y tu saldo se actualizará al instante.
B) Con Transferencia Bancaria:
Selecciona la pestaña "Transferencia Bancaria".
Elige el monto que deseas recargar.
Copia los Datos Bancarios de Remeex Visa (Banco Plaza) que aparecen en pantalla.
Ve a la aplicación o web de tu banco y realiza la transferencia.
Vuelve a Remeex Visa, presiona "Subir Comprobante" y adjunta una captura de pantalla de
la transferencia.
Escribe el Número de Referencia de la transacción.
Presiona "Enviar Comprobante". Tu recarga será procesada y se te notificará cuando esté
lista.
C) Con Pago Móvil:
Selecciona la pestaña "Pago Móvil".
Elige el monto que deseas recargar.
Copia los Datos de Pago Móvil de Remeex Visa que aparecen en pantalla. Estos datos son
únicos para ti.
Ve a la aplicación de tu banco y realiza el pago móvil.
Vuelve a Remeex Visa, sube el comprobante y escribe el número de referencia.
Presiona "Enviar Comprobante".
4.2. Cómo Retirar Dinero <a name="4.2"></a>
Requisito: Tu cuenta debe estar 100% verificada (haber completado el Paso 4 de la
activación).
¿Cómo hacerlo?
En el panel principal, presiona el botón "Retirar Dinero a [Tu Banco]".
Serás llevado a la página de transferencias para que completes los detalles y confirmes la
operación.
4.3. Navegación Principal (Barra Inferior) <a name="4.3"></a>
Usa estos iconos para moverte rápidamente por la aplicación:
Servicios
): Accede a funciones adicionales como Zelle, compras, ahorros, etc.
Tarjetas
): Gestiona tus tarjetas virtuales VISA.
Inicio ): Vuelve a tu panel principal de saldo.
Ayuda (): Contacta con nuestro equipo de soporte.
Ajustes (): Configura tu cuenta, seguridad y notificaciones.
5. Explorando los Paneles: Servicios, Tarjetas, Ayuda y Ajustes <a name="5"></a>
Panel de Servicios: Aquí encontrarás un menú de todo lo que puedes hacer con tu saldo,
como:
Compras: Paga en tiendas aliadas.
Mi cuenta en USA / Activar Zelle: Funciones para operar internacionalmente (requieren
verificación).
Mis ahorros: Crea "botes" para guardar dinero y alcanzar metas.
Pago de Servicios: Próximamente podrás pagar facturas.
Panel de Tarjetas: Una vez verificado, desde aquí podrás generar y gestionar tus tarjetas
VISA virtuales para compras en línea.
Panel de Ayuda: Tu centro de soporte.
Live Chat: Habla con un agente en tiempo real.
WhatsApp: Escríbenos directamente.
Email: Envíanos un correo.
Chat con Usuarios: Accede a nuestro foro para hablar con otros miembros de la comunidad.
Panel de Ajustes: Controla todos los aspectos de tu cuenta.
Gestión de Cuenta: Aquí puedes anular operaciones de recarga, cambiar tu PIN de
seguridad, solicitar la eliminación de tu cuenta o usar herramientas de reparación si tienes
algún problema.
6. Seguridad y Notificaciones: Protegiendo tu Cuenta <a name="6"></a>
Notificaciones: Presiona el icono de la campana (1) en la barra superior para ver tus
notificaciones sobre recargas, transferencias y mensajes importantes.
Cierre de Sesión por Inactividad: Si dejas la aplicación abierta sin usarla por 5 minutos,
aparecerá un aviso. Si no respondes, la sesión se cerrará automáticamente para proteger tu
cuenta.
Bloqueo Temporal de Cuenta:
¿Por qué ocurre?: Si tienes saldo en tu cuenta pero no completas la validación final (Paso
4) después de un tiempo, el sistema puede bloquear tu cuenta temporalmente por
seguridad. Esto es para prevenir que alguien más pueda usar tus fondos si no se ha
confirmado tu identidad.
¿Qué verás?: Un modal de "Bloqueo Temporal" que te pedirá una clave para desbloquear.
¿Qué hacer?: Debes contactar a soporte por WhatsApp para que te proporcionen la clave y
te ayuden a completar la validación. Tus fondos siempre estarán seguros.
7. Preguntas Frecuentes (FAQ) <a name="7"></a>
¿La recarga de validación es un pago?
No. Es una recarga que se suma a tu saldo. Podrás usar ese dinero como quieras una vez
que la cuenta esté validada.
¿Por qué no puedo retirar mi dinero si ya tengo saldo?
Porque la ley nos exige confirmar que eres el titular de la cuenta bancaria antes de habilitar
los retiros. La recarga de validación es la forma de hacerlo.
¿Qué pasa si no valido mi cuenta?
Podrás usar tu saldo para intercambiar con otros usuarios de Remeex o hacer donaciones,
pero no podrás retirarlo a tu banco ni usar funciones avanzadas. Si pasa mucho tiempo, la
cuenta podría ser bloqueada por seguridad.
¿Es Remeex Visa una estafa?
No. Remeex Visa es un servicio financiero legítimo que opera en Venezuela a través de
entidades reguladas como Banco Plaza. Los protocolos de validación, aunque estrictos, son
necesarios para cumplir con las normativas financieras y proteger tu dinero.
Continuación del Manual de Usuario Definitivo de Remeex Visa
4.3. Navegación Principal: La Barra Inferior (Tu Brújula en la App) <a name="4.3"></a>
En la parte inferior de la pantalla, siempre verás una barra con cinco iconos. Esta es tu
herramienta principal para moverte por la aplicación de forma rápida y sencilla.
¿Cómo funciona? Simplemente presiona el icono de la sección a la que quieres ir. El icono
de la sección en la que te encuentras aparecerá resaltado.
A continuación, te explicamos qué hace cada botón:
Servicios (data-section="services"):
¿Qué hace?: Abre un panel con un menú de todas las funciones y servicios adicionales que
ofrece Remeex Visa.
¿Cuándo usarlo?: Úsalo cuando quieras hacer algo más que solo ver tu saldo, como pagar
en tiendas, gestionar tus ahorros, activar Zelle, etc. Recuerda: Algunas de estas funciones
requieren que tu cuenta esté 100% verificada.
Tarjetas (data-section="cards"):
¿Qué hace?: Abre el panel de gestión de tus tarjetas VISA virtuales.
¿Cuándo usarlo?: Úsalo cuando necesites generar una nueva tarjeta virtual para compras
en línea o gestionar las que ya tienes. Importante: Esta función solo se activa después de
que hayas verificado tu identidad.
Inicio (data-section="home"):
¿Qué hace?: Te lleva de vuelta a tu Panel Principal (el dashboard), donde ves tu saldo y tus
transacciones recientes.
¿Cuándo usarlo?: Si estás en cualquier otra sección (Ajustes, Servicios, etc.) y quieres
volver a la pantalla principal, este es el botón que debes presionar. Es tu "botón de regreso
a casa".
Ayuda (data-section="support"):
¿Qué hace?: Abre el panel de soporte, donde encontrarás todas las formas de
contactarnos.
¿Cuándo usarlo?: Si tienes alguna duda, problema o necesitas asistencia, presiona este
botón. Podrás elegir entre hablar con un agente por chat en vivo, escribirnos por WhatsApp,
enviarnos un email o visitar nuestro foro de usuarios.
Ajustes (data-section="settings"):
¿Qué hace?: Abre el panel de configuración de tu cuenta. Este es el centro de control más
importante.
¿Cuándo usarlo?: Úsalo para ver la información de tu cuenta, cambiar tus preferencias de
seguridad, gestionar tus retiros, anular operaciones o incluso eliminar tu cuenta. A
continuación, te lo explicamos en detalle.
5. El Panel de Ajustes: El Centro de Control de tu Cuenta <a name="5.1"></a>
Al presionar el icono de la tuerca (), accederás al panel de Ajustes. Aquí puedes
configurar y gestionar todos los aspectos de tu cuenta. Está organizado en secciones que
puedes expandir y contraer.
5.1. Información de Cuenta
¿Qué es?: Una sección para ver tus datos básicos.
Campos:
Nombre Completo: Muestra tu nombre tal como lo registraste.
Correo Electrónico: Muestra tu email asociado.
Importante: Estos datos no se pueden editar directamente aquí por seguridad.
5.2. Notificaciones
¿Qué es?: Aquí controlas cómo quieres que te contactemos.
Opciones (Interruptores):
Notificaciones por correo: Activa o desactiva los avisos por email.
Notificaciones por SMS: Activa o desactiva los avisos por mensaje de texto.
Alertas de seguridad: Controla si quieres recibir alertas cuando haya inicios de sesión u
otras actividades importantes en tu cuenta. Recomendamos mantener esta opción siempre
activa.
5.3. Seguridad
¿Qué es?: Gestiona las capas de seguridad de tu cuenta.
Opciones:
Autenticación de dos factores: Un interruptor para activar una capa extra de seguridad. Si lo
activas, necesitarás un código adicional (además de tu contraseña) para iniciar sesión.
Nota: Debes haber completado tu primera recarga para poder activar esta función.
Botón "Verificar mi Identidad":
Si aún no te has verificado: Este botón te llevará a la página para que subas tus
documentos.
Si ya te verificaste: El botón cambiará a "Usuario Verificado" y te informará que tu cuenta ya
está protegida.
5.4. Gestión de Cuenta (¡La sección más importante!)
¿Qué es?: Un listado de acciones avanzadas para administrar tu cuenta.
Verificación: Un acceso directo al proceso de verificación de identidad.
Recarga Manual para activación:
¿Para qué sirve?: Si por alguna razón tus datos de pago móvil no se activan
automáticamente, esta opción te permite hacer una recarga manual para activar tu cuenta.
Es una alternativa segura.
¿Cuándo usarla?: Úsala si tienes problemas para completar la validación final (Paso 4) de
forma automática.
Límites: (Función Próxima) Te permitirá ver tus límites de recarga y retiro mensuales.
Retiros Pendientes:
¿Qué hace?: Abre una lista de todos los retiros de dinero que has solicitado y que aún no se
han completado.
¿Para qué sirve?: Te permite cancelar un retiro si cambiaste de opinión o cometiste un error,
siempre y cuando aún no haya sido procesado.
Anular Operaciones (Recargas con tarjeta):
¿Qué hace?: ¡Una función muy poderosa! Te permite revertir una recarga que hiciste con tu
tarjeta de crédito.
Condiciones: Solo puedes anular recargas hechas en las últimas 5 horas.
Proceso: Deberás seleccionar la recarga, indicar el motivo y confirmar con tu PIN de 4
dígitos por seguridad. El dinero será devuelto a tu tarjeta.
Cambiar PIN:
¿Qué hace?: Te permite cambiar tu PIN de 4 dígitos.
Proceso de Seguridad: Primero, deberás responder correctamente a tu pregunta de
seguridad. Solo después podrás establecer un nuevo PIN.
Modo Lite:
¿Qué es?: Un modo especial que puedes activar con una clave que te da el equipo de
soporte.
¿Para qué sirve?: Reduce temporalmente (por 12 horas) el monto mínimo de recarga
necesario para la validación. Es una ayuda si tienes dificultades para completar el proceso.
Activar funciones premium (Reparar):
¿Qué es?: Una herramienta de soporte técnico.
¿Cuándo usarla?: Úsala solo si un agente de soporte te lo indica. Sirve para solucionar
problemas de activación o errores en tu cuenta.
Vincular Wallets para retiros: (Función Próxima) Te permitirá conectar otras billeteras
digitales (como Zelle, etc.) para retirar tu dinero.
Eliminar Cuenta:
¿Qué hace?: Inicia el proceso para cerrar tu cuenta de Remeex Visa de forma permanente.
Proceso de Seguridad:
Tu saldo debe ser cero ($0.00).
Solicitas la eliminación.
Debes esperar 24 horas sin iniciar sesión.
Después de 24 horas, vuelves a entrar y confirmas la eliminación definitiva. Este proceso es
para asegurar que nadie pueda eliminar tu cuenta sin tu consentimiento.
5.5. Mi Cuenta (Tarjeta de Información)
¿Qué es?: Dentro de Ajustes, hay una tarjeta especial (#account-card) que resume toda la
información de tu cuenta bancaria y tus límites.
¿Qué muestra?:
Tu nombre, cédula y teléfono.
Tu banco principal y número de cuenta.
Tus límites de retiro y depósito (que puedes ajustar con unas barras deslizadoras).
Interruptores para habilitar/deshabilitar los retiros o congelar tu cuenta temporalmente.
Botones de Acción:
Refrescar (): Actualiza la información de la tarjeta.
Editar (): Te permite modificar tu nombre o cambiar tu cuenta bancaria principal.
Conclusión de la Guía
Este manual cubre todas las funcionalidades visibles en la página homevisa.html. Como
puedes ver, Remeex Visa es una herramienta poderosa con múltiples capas de
funcionalidad y seguridad.
Recomendación clave para nuevos usuarios: El paso más importante es completar el
proceso de activación de 4 pasos. Una vez que realices la recarga de validación final, todas
las funciones de la aplicación estarán a tu disposición y podrás mover tu dinero con total
libertad y seguridad.
Si en algún momento te sientes perdido, no dudes en usar el botón de "Ayuda" en la
barra inferior. ¡Estamos aquí para asistirte
Manual de Usuario - Página de Retiro de Fondos (transferencia.html)
Guía de Usuario: Cómo Retirar tus Fondos de Remeex Visa
Esta es la página de Retiro de Fondos. Aquí es donde conviertes tu saldo de Remeex Visa
en dinero real en tu cuenta bancaria. La hemos diseñado como un asistente paso a paso
para que el proceso sea claro, seguro y sin complicaciones.
1. Elementos Constantes en la Pantalla
Mientras realizas tu retiro, siempre verás estos elementos para ayudarte a navegar:
Barra Superior (Cabecera):
Saludo y Usuarios Conectados: Te saluda por tu nombre y te muestra el número de usuarios
activos en la plataforma.
Tarjeta de Saldo Compacta: A la derecha, verás un resumen de tu saldo actual. Puedes
presionar el botón de moneda (USD, EUR, Bs) para cambiar la vista.
Botón de Modo ("Clásico" / "Wizard"): Este botón te permite cambiar entre la vista de
asistente (Wizard) y una vista más tradicional de formulario (Clásico). Recomendamos usar
el modo Wizard (asistente) por ser más guiado.
Barra de Navegación Inferior:
Iconos: Te da acceso rápido para crear un Nuevo Retiro, ver tus retiros Pendientes, revisar
tu Historial o pedir Ayuda.
Botones de Navegación del Asistente (Wizard):
Anterior: Te permite volver al paso anterior si necesitas corregir algo.
Siguiente / Confirmar Retiro: El botón principal para avanzar. Solo se activará cuando hayas
completado la información del paso actual correctamente.
2. Guía Paso a Paso del Retiro (Modo Wizard)
El proceso está dividido en 5 pasos sencillos. La barra de progreso en la parte superior te
mostrará en qué paso te encuentras.
Paso 1: Selecciona el Método de Retiro
¿Qué ves?: Tres tarjetas grandes con las opciones para recibir tu dinero.
¿Qué hacer?: Elige cómo quieres recibir tus fondos.
Pago Móvil: Para recibir el dinero instantáneamente en tu teléfono afiliado a tu banco. Ideal
para montos más pequeños.
Transferencia Bancaria: Para recibir el dinero directamente en tu cuenta bancaria. Ideal para
montos más grandes.
Internacional: Para recibir fondos en servicios como Zelle, PayPal, Wise, Criptomonedas o a
través de una transferencia internacional SWIFT. Importante: Para usar esta opción, primero
debes haber realizado al menos 4 retiros nacionales (a bancos venezolanos).
Paso 2: Ingresa el Monto
¿Qué ves?: Un campo grande para escribir el monto y selectores de moneda.
¿Qué hacer?:
Elige la Moneda: Si tu retiro es nacional, puedes ingresar el monto en Bolívares (Bs). Si es
internacional, deberás ingresarlo en Dólares ($).
Escribe el Monto: Ingresa la cantidad que deseas retirar.
Revisa los Equivalentes: Debajo del campo, la aplicación te mostrará automáticamente a
cuánto equivale ese monto en las otras monedas (USD, EUR) según la tasa de cambio del
día.
Verifica tu Saldo: La aplicación siempre te recordará tu saldo disponible para que no
intentes retirar más de lo que tienes.
Paso 3: Selecciona tu Banco o Servicio
¿Qué ves?: Una parrilla con los logos de los bancos y servicios de pago.
¿Qué hacer?:
Si es un retiro nacional: Verás los logos de los principales bancos de Venezuela. Selecciona
el banco donde tienes tu cuenta. Si no ves el tuyo, presiona "Ver más bancos".
Si es un retiro internacional: Verás los logos de Zelle, PayPal, etc. Selecciona el servicio que
vas a usar.
Paso 4: Completa los Datos de tu Cuenta
¿Qué ves?: Un formulario que cambia según el método que elegiste en el paso 1.
¿Qué hacer?: Rellena la información con mucho cuidado.
Para Pago Móvil:
Número de Teléfono: El que tienes registrado en tu banco.
Cédula de Identidad: Tu número de cédula.
Nombre Completo: Tu nombre tal como aparece en tu cuenta bancaria.
Para Transferencia Bancaria:
Tipo de Cuenta: Elige si es Corriente o de Ahorro.
Número de Cuenta: Escribe los 20 dígitos completos.
Cédula y Nombre del Titular.
Para Retiro Internacional:
Dependiendo del servicio (Zelle, PayPal, etc.), te pedirá el correo electrónico, la dirección de
tu wallet de criptomonedas o los datos para una transferencia SWIFT. Verifica esta
información dos veces, ya que un error aquí puede causar retrasos.
Paso 5: Confirma la Transacción
¿Qué ves?: Un resumen final de toda la operación.
¿Qué hacer?:
Revisa TODO con atención: Verifica el método, el banco, el número de cuenta/teléfono y,
sobre todo, el monto.
Banner de Verificación (si aplica): Si es tu primera vez retirando, verás un banner
recordándote que debes validar tu cuenta.
Presiona "Confirmar Retiro".
Ingresa tu PIN de Seguridad: Como medida final de protección, la aplicación te pedirá que
ingreses tu PIN de 4 dígitos. Este es el mismo que creaste durante el registro.
¡Listo! Una vez confirmado, tu solicitud de retiro será procesada.
3. Después del Retiro: ¿Qué Sigue?
Modal de Recibo (#receipt-modal):
Inmediatamente después de confirmar, aparecerá un recibo detallado con un número de
orden, la fecha, el monto y el estado de tu retiro.
Verás una línea de tiempo que te muestra en qué etapa está tu solicitud (Creada,
Verificación, Procesamiento).
Puedes compartir este recibo por WhatsApp, Email o descargarlo como un archivo de texto.
Sección de "Pendientes":
Tu retiro aparecerá en la sección "Pendientes" (accesible desde la barra inferior) mientras
es procesado por nuestro equipo.
Una vez completado, pasará a la sección "Historial".
Redirección por Inactividad: Si dejas la página abierta sin hacer nada por más de 2 minutos,
un aviso te informará que serás redirigido a la página principal por seguridad.
4. Modo Clásico: Una Alternativa para Usuarios Avanzados
Si prefieres ver todo en una sola pantalla en lugar de un asistente paso a paso, puedes
cambiar al Modo Clásico.
¿Cómo activarlo?: Presiona el botón "Clásico" en la barra superior.
¿Qué verás?: Un formulario más tradicional con pestañas para "Nuevo Retiro", "Pendientes"
e "Historial". Aquí deberás seleccionar el método, el monto y rellenar los datos, todo en la
misma vista.
Recomendación: Aunque ambas vistas cumplen la misma función, el Modo Wizard
(asistente) es más recomendado para evitar errores, especialmente si es tu primera vez
retirando fondos.
Consejos Clave para un Retiro Exitoso
Verifica tus Datos: El error más común es un número de cuenta o cédula incorrecto. Tómate
un segundo extra para confirmar que todo está bien.
Revisa los Límites: Recuerda que el Pago Móvil tiene un límite por transacción más bajo
que la Transferencia Bancaria. La aplicación te lo recordará.
Completa la Verificación: Si tu cuenta no está 100% verificada, tus retiros quedarán en
estado "Pendiente de Verificación". Asegúrate de haber completado el proceso de
activación para que tu dinero se libere sin demoras.
Usa el Soporte: Si tienes cualquier duda, presiona el botón de "Ayuda" (6). Nuestro equipo
está listo para asistirte.
Bloque 3 (Versión Mejorada): Manual de Usuario Definitivo - Retiro de
Fondos (transferencia.html)
Guía Completa para Retirar tus Fondos de Remeex Visa
Esta es la página de Retiro de Fondos. Aquí es donde conviertes tu saldo de Remeex Visa en
dinero real en tu cuenta. La hemos diseñado como un asistente paso a paso para que el
proceso sea claro, seguro y sin complicaciones.
(Se mantienen las secciones 1 y 2 del manual anterior sobre Elementos Constantes y la guía
general del Wizard)
3. Bancos y Servicios Disponibles para el Retiro
Una de las preguntas más importantes es: ¿a dónde puedo enviar mi dinero? Aquí tienes la
lista completa de opciones disponibles en la aplicación.
Puedes retirar tus fondos a prácticamente cualquier banco en Venezuela. En el Paso 3 del
asistente, verás una selección de los bancos más comunes.
Bancos Principales (Visibles al inicio):
Ο
Banco de Venezuela
Ο Banco Mercantil
Ο
Ο
Banco Provincial (BBVA)
Banesco
Banco Nacional de Crédito (BNC)
Bancaribe
"Ver más bancos": Si tu banco no está en la lista inicial, presiona este botón para
desplegar la lista completa, que incluye:
Ο Banco Venezolano de Crédito
Ο
Banco Exterior
Ο
Banco Caroní
Ο
Banco Sofitasa
Ο
Banco Plaza
Ο
Ο
Ο
Ο
Banco Fondo Común (BFC)
100% Banco
Banco del Tesoro
Bancrecer
Banco Activo
Bancamiga
Banplus
Ο
Banco Bicentenario
Ο Banco Central de Venezuela (BCV)
Y otras entidades financieras del país.
Nota Importante sobre Coincidencia de Bancos:
En el Paso 4, al ingresar tu número de cuenta de 20 dígitos, nuestro sistema verificará que los
primeros 4 dígitos coincidan con el banco que seleccionaste. Si no coinciden, te mostraremos
una advertencia para que puedas corregir el banco o el número de cuenta. Esto ayuda a
prevenir errores costosos.
Si seleccionas el método "Internacional", podrás enviar tu dinero (convertido a USD o la moneda
correspondiente) a los siguientes servicios:
•
•
•
•
Zelle: Envía directamente a una cuenta Zelle usando el correo electrónico del
destinatario.
PayPal: Transfiere fondos a una cuenta de PayPal.
Wise (anteriormente Transferwise): Para transferencias internacionales a cuentas
bancarias en múltiples monedas.
Transferencia SWIFT: Para enviar dinero a cualquier cuenta bancaria en el mundo
utilizando su código SWIFT/BIC.
Criptomonedas: Recibe tus fondos en las principales criptomonedas, incluyendo:
Ο
Bitcoin (BTC)
Ethereum (ETH)
Tether (USDT)
USD Coin (USDC)
Ο Binance Coin (BNB)
Requisito Clave: Para desbloquear los retiros internacionales, primero debes haber completado
con éxito al menos cuatro (4) retiros nacionales (a bancos venezolanos). Esta es una medida
de seguridad y cumplimiento normativo.
4. Límites de Retiro y Montos de Verificación
Es fundamental que conozcas los límites para planificar tus transacciones.
Límites por Transacción (Nacional):
Pago Móvil: Puedes retirar un máximo de Bs. 250.000 por cada operación. Si
intentas retirar más, la aplicación te mostrará una alerta y te sugerirá usar una
transferencia bancaria.
Transferencia Bancaria: Puedes retirar hasta Bs. 1.000.000 por cada
operación.
•
Límites Internacionales:
Los retiros a servicios como Zelle, PayPal o Criptomonyedas no tienen un límite
máximo definido por Remeex Visa, pero pueden estar sujetos a los límites de la
plataforma receptora.
Monto Mínimo de Verificación:
Ο
¿Qué es?: Para poder realizar tu primer retiro, tu cuenta debe estar validada.
Este proceso requiere que hagas una recarga mínima desde tu cuenta bancaria.
¿De cuánto es el monto?: El monto varía según tu nivel de cuenta, el cual se
determina por tu saldo. Por ejemplo:
Nivel Estándar (hasta
500desaldo):**Elmontodevalidacio'nesde**
500desaldo):**Elmontodevalidaci
0
nesde**
25.00.
Nivel Bronce ($501 -
1,000):**Elmontoesde**
1,000):**Elmontoesde**
30.00.
Y así sucesivamente.
Ο ¿Dónde veo esta información?: En el Paso 5 (Confirmación), si tu cuenta no
está verificada, un banner te mostrará el monto exacto en Dólares y Bolívares
que necesitas recargar para activar los retiros. Recuerda: este monto se suma
a tu saldo, no es una comisión.
5. Otros Aspectos y Funcionalidades Omitidas Anteriormente
Aquí detallamos otras funciones y lógicas importantes que debes conocer.
Guardado Automático de Datos Bancarios:
Ο
Una vez que completas exitosamente un retiro a una cuenta bancaria o pago
móvil, el sistema guarda esos datos de forma segura.
La próxima vez que vayas a retirar, los campos del formulario (número de
cuenta, cédula, nombre) aparecerán ya rellenos para tu comodidad. Podrás
editarlos si necesitas enviar a una cuenta diferente.
Sincronización de Datos con la Página Principal (
Ο
Esta página no funciona de forma aislada. Al entrar, lee automáticamente tu
saldo y la tasa de cambio que estaban en la página principal, gracias a que se
guardan en sessionStorage. Esto asegura que siempre veas la información
más actualizada.
Al finalizar un retiro, la newa transacción (en estado pendiente) se guarda y se
envía de vuelta a la página principal. Cuando regreses a tu dashboard, verás el
retiro reflejado en tu historial.
PIN de Seguridad para Confirmar:
Ο
¿Por qué se pide?: El PIN de 4 dígitos es la capa final de seguridad. Confirma
que eres tú quien está autorizando la salida de dinero de tu cuenta.
¿Qué pasa si lo olvido?: El modal te ofrecerá un enlace para contactar a
soporte por WhatsApp y así poder restablecerlo de forma segura.
Recibo Detallado y Compartible:
Ο
El recibo que se muestra al final no es solo una confirmación. Es un
comprobante completo con un número de orden único.
Los botones para compartir por WhatsApp, Email o Descargar son muy útiles
si necesitas enviar el comprobante a la persona que recibirá el dinero o para tus
propios registros.
Modo Clásico vs. Modo Wizard:
Ο
¿Por qué existen dos modos?: El modo Wizard (asistente) está pensado para
nuevos usuarios o para quienes prefieren un proceso más guiado y con menos
riesgo de error. El modo Clásico es para usuarios más avanzados que prefieren
ver toda la información en una sola pantalla y moverse con mayor libertad.
Ο
Sincronización entre modos: Si empiezas a rellenar el monto en un modo y
cambias al otro, la información se transferirá automáticamente.
Mensajes de Ayuda Contextuales:
La aplicación está llena de pequeños textos de ayuda (form-help) debajo de los
campos de entrada, como "Ingresa tu número de cuenta completo (20 dígitos)".
Lee estas guías para evitar errores comunes.
Manual de Usuario Definitivo - Intercambio P2P (intercambio.html)
Guía de Usuario: Cómo Enviar y Recibir Dinero entre Usuarios de Remeex Visa
Bienvenido a la sección de Intercambio. Esta es una de las funciones más poderosas de
Remeex Visa, ya que te permite enviar dinero a otros usuarios de la plataforma de forma
instantánea, segura y sin comisiones. También puedes solicitar pagos y acreditar fondos de
forma sencilla.
1. Elementos Constantes en la Pantalla
Al entrar en esta sección, verás algunos elementos fijos que te ayudarán a navegar y a
mantenerte informado.
Barra Superior (Cabecera):
Botón "Volver": Te permite regresar a la página anterior (tu panel principal o dashboard).
Título "Intercambio": Para que siempre sepas en qué sección estás.
Acciones Rápidas (Iconos):
Buscar (): Te permite buscar usuarios (función futura).
Ajustes (): Te lleva a la configuración de tu cuenta.
Tarjeta de Saldos Disponibles (#balance-card):
Función: Te muestra un resumen claro de los fondos que tienes disponibles para realizar
intercambios.
Contenido: Verás tu saldo en las tres monedas principales:
USD (Dólares)
Bs (Bolívares)
EUR (Euros)
Actualización: Muestra la fecha y hora de la última actualización de tu saldo.
2. Acciones Rápidas (Debajo de la tarjeta de saldo)
Estos botones te dan acceso a las funciones más comunes de la sección de Intercambio.
Envío Rápido: Te permite enviar dinero a tus contactos frecuentes (plantillas guardadas) con
un solo clic.
Solicitar Dinero: Inicia el flujo para pedirle dinero a otro usuario de Remeex Visa.
Dividir Cuenta: (Función futura) Ideal para compartir gastos con amigos.
Pagos Programados: (Función futura) Te permitirá configurar transferencias automáticas y
recurrentes.
3. Funcionalidades Principales de Intercambio
La sección está organizada en tarjetas de acción claras y sencillas.
3.1. Enviar Dinero
Esta es la función principal para transferir fondos a otra persona.
¿Cómo hacerlo?
Destinatario: En el campo "Destinatario", empieza a escribir el correo electrónico de la
persona a la que quieres enviar dinero.
Sugerencias automáticas: Si la persona es un usuario válido de Remeex Visa, aparecerá
una sugerencia con su nombre y avatar. Haz clic en ella para seleccionarla.
Verificación de Usuario: Una vez seleccionado, verás un icono de check verde (✔) junto al
campo, confirmando que el usuario es válido. Se mostrará un modal con la información del
usuario (nombre, país, reputación) para que confirmes que es la persona correcta.
Monto: Selecciona el monto que deseas enviar. Hay montos predefinidos ($25, $50, $100)
para agilizar el proceso.
Concepto (Opcional): Puedes escribir una breve nota o motivo del pago (ej. "Pago de la
cena", "Regalo de cumpleaños").
Guardar como plantilla: Si es una persona a la que le enviarás dinero frecuentemente,
marca la casilla "Guardar como plantilla". La próxima vez, aparecerá en la sección de "Envío
Rápido".
Presiona "Enviar Dinero".
Confirmación Final:
Antes de enviar, aparecerá una ventana de confirmación con todos los detalles de la
transacción.
Deberás ingresar tu PIN de seguridad de 4 dígitos para autorizar el envío.
Resultado:
Una vez confirmado, el dinero se enviará instantáneamente. Verás una pantalla de éxito con
confeti y los detalles de la transacción.
El sistema generará un código único para la transacción, que puedes copiar y compartir con
el destinatario como comprobante.
3.2. Solicitar Dinero
Esta función te permite pedirle dinero a otro usuario.
¿Cómo hacerlo?
Solicitar a: Escribe el correo electrónico del usuario al que le vas a pedir el dinero. El
sistema también verificará que sea un usuario válido.
Monto y Moneda: Ingresa el monto y selecciona la moneda en la que deseas recibirlo (USD,
Bolívares o EUR).
Motivo de la solicitud: Escribe una descripción clara de por qué estás solicitando el dinero.
Fecha límite (Opcional): Puedes establecer una fecha tope para que la persona realice el
pago.
Presiona "Enviar Solicitud".
Resultado:
El otro usuario recibirá una notificación con tu solicitud.
Una vez que acepte y envíe el pago, el dinero se acreditará automáticamente en tu saldo y
recibirás una notificación.
Importante: Esta función tiene un sistema de protección. Una vez que haces una solicitud,
no podrás hacer otra hasta que la primera sea pagada o cancelada.
3.3. Aceptar Dinero (Acreditar Saldo)
Esta función es para acreditar fondos en tu cuenta usando un código especial.
¿Cuándo se usa?: Se utiliza principalmente cuando has ganado un bono, un premio o
cuando el equipo de soporte necesita acreditarte saldo manually. No se usa para
transferencias normales entre usuarios.
¿Cómo funciona?
Recibirás un código alfanumérico especial (ej. "71302JQ").
Ingresa ese código en el campo "Código" dentro de la tarjeta "Aceptar Dinero".
Presiona "Acreditar".
Resultado:
Si el código es válido, se mostrará un modal de confirmación indicando el monto y quién te
lo envía.
Al aceptar, el monto se sumará inmediatamente a tu saldo, y verás una pantalla de éxito.
4. Historial de Intercambios
En la parte inferior de la página, encontrarás un registro detallado de todas tus
transacciones P2P.
Filtros: Puedes organizar tu historial para ver:
Todos: Todas las transacciones.
Enviados: Solo el dinero que has enviado.
Recibidos: Solo el dinero que has recibido.
Pendientes: Solicitudes de dinero que aún no han sido pagadas.
Hoy / Esta semana: Filtrar por periodos de tiempo.
Detalles de la Transacción: Cada elemento en la lista te muestra:
Tipo: Si fue un envío (ícono rojo) o una recepción (ícono azul).
Destinatario/Remitente: El nombre del otro usuario.
Concepto y Fecha.
Monto: En negativo si fue un envío, y en positivo si fue una recepción.
Exportar: Puedes presionar el botón "Exportar" para descargar un registro de tu historial.
Consejos Clave para un Intercambio Exitoso
Verifica el Correo: Antes de enviar dinero, asegúrate siempre de que el correo electrónico
del destinatario es el correcto. El modal de confirmación de usuario te ayudará a evitar
errores.
Usa el PIN con Cuidado: Tu PIN de 4 dígitos es tu firma digital. Nunca lo compartas con
nadie.
Aprovecha las Plantillas: Si envías dinero a las mismas personas con frecuencia, guarda las
transacciones como plantillas para ahorrar tiempo.
Revisa tu Historial: Mantén un ojo en tu historial para llevar un control claro de tus finanzas y
asegurarte de que todas las transacciones son correctas.
Manual de Usuario Definitivo - Proceso de Verificación de Identidad (verificacion.html)
Guía de Usuario: Cómo Verificar tu Cuenta y Desbloquear Todas las Funciones
Bienvenido a la sección de Verificación de Identidad. Este es un proceso de seguridad
obligatorio y crucial para proteger tu cuenta y activar todas las funcionalidades de Remeex
Visa, especialmente los retiros de dinero a tu cuenta bancaria.
Esta guía te llevará paso a paso a través del proceso, que es rápido, seguro y solo
necesitas hacerlo una vez.
1. Elementos Constantes en la Pantalla
Mientras avanzas, verás algunos elementos fijos para ayudarte:
Barra Superior (Cabecera):
Logo de Remeex Visa: Te recuerda que estás en un entorno seguro de nuestra marca.
Botón "Volver al panel" (←): Te permite regresar a tu dashboard principal (homevisa.html) en
cualquier momento.
Botón de Soporte ( / WhatsApp): Si tienes alguna duda durante el proceso, puedes
presionar estos botones para contactar a nuestro equipo de soporte en tiempo real.
Barra de Progreso:
Justo debajo de la cabecera, verás una barra que se irá llenando a medida que avanzas en
los pasos.
También te mostrará el porcentaje completado, para que siempre sepas cuánto te falta.
2. ¿Por qué es Necesaria la Verificación?
Antes de empezar, es importante que sepas por qué te pedimos esta información:
Por tu Seguridad: Confirmamos que eres realmente tú quien está creando y usando la
cuenta, previniendo que alguien más pueda acceder a tus fondos.
Para Cumplir con la Ley: Las regulaciones financieras nacionales e internacionales nos
exigen verificar la identidad de nuestros usuarios para prevenir el fraude y el lavado de
dinero.
Para Desbloquear Funciones: Solo las cuentas verificadas pueden realizar retiros a bancos
y acceder a límites más altos y servicios premium.
3. Guía Paso a Paso del Proceso de Verificación
El proceso está dividido en 4 pasos principales. La aplicación te guiará de forma intuitiva.
Paso 1: Información Personal
¿Qué verás?: Un formulario para que completes tus datos personales.
¿Qué hacer?:
Nombre Completo: Escribe tus nombres y apellidos completos, tal como aparecen en tu
documento de identidad.
Fecha de Nacimiento: Selecciona tu fecha de nacimiento.
Tipo y Número de Documento: Elige tu tipo de documento (Cédula, Pasaporte, etc.) e
ingresa el número.
Correo Electrónico y Teléfono: Confirma o ingresa tus datos de contacto.
Dirección y Ocupación: Completa tu dirección de residencia y tu ocupación actual.
Autocompletado: Si ya completaste el registro, es muy probable que muchos de estos
campos ya aparezcan llenos. Simplemente revísalos y confirma que son correctos.
¿Listo?: Una vez que todos los campos estén completos y correctos, presiona el botón
"Continuar".
Paso 2: Datos Bancarios para Retiros
¿Qué verás?: Una sección para registrar la cuenta bancaria donde recibirás tu dinero.
¿Qué hacer?:
Selecciona tu Banco: Verás una parrilla con los logos de los principales bancos de
Venezuela. Haz clic en el tuyo.
Tipo de Cuenta: Elige si tu cuenta es Corriente o de Ahorro.
Número de Cuenta: Escribe los 20 dígitos de tu número de cuenta. ¡Verifícalo con mucho
cuidado!
¿Aceptas Pago Móvil? (Opcional pero recomendado):
Si tu cuenta tiene Pago Móvil, activa el interruptor.
Se desplegarán campos para que ingreses el teléfono y la cédula afiliados a tu Pago Móvil.
Esto agilizará tus retiros de montos pequeños.
Importante: La cuenta bancaria que registres debe estar a tu nombre. No puedes registrar
una cuenta de un tercero.
¿Listo?: Cuando hayas completado la información, presiona "Continuar".
Paso 3: Verificación Biométrica (Tu Selfie)
¿Qué verás?: Se activará la cámara frontal de tu dispositivo.
¿Qué hacer?:
Permisos de Cámara: Es posible que tu navegador te pida permiso para usar la cámara.
Debes aceptarlo.
Posiciona tu Rostro: Centra tu cara dentro del óvalo que aparece en la pantalla. Asegúrate
de estar en un lugar con buena iluminación y sin accesorios que cubran tu rostro (como
gafas de sol o gorras).
Captura la Foto: Presiona el botón grande de la cámara (). Un contador de 3 segundos
aparecerá, y la foto se tomará automáticamente.
Revisa la Foto: Verás una vista previa de tu selfie. Si no estás satisfecho, puedes presionar
el botón "Repetir foto" ().
¿Por qué una selfie?: Este paso de "prueba de vida" confirma que una persona real está
creando la cuenta y no un bot, y nos ayuda a comparar tu rostro con la foto de tu documento
de identidad.
¿Listo?: Una vez que tengas una selfie clara, presiona "Continuar".
Paso 4: Verificación Final (Formulario Tally)
¿Qué verás?: Un mensaje indicando que estás en el último paso.
¿Qué hacer?:
La aplicación te mostrará un formulario seguro de nuestro socio Tally. Este es un paso
obligatorio.
Temporizador: Verás un contador de 180 segundos (3 minutos). No te preocupes, no es un límite de tiempo estricto, sino un mecanismo para asegurar que te tomes el tiempo necesario para completarlo. El botón para continuar se activará después de este tiempo.
Completa el Formulario: Responde a todas las preguntas del formulario.
Envía el Formulario: Una vez enviado, el botón "Ya Completé el Formulario - Continuar" se activará y cambiará de color. Presiónalo.
¿Listo?: Después de presionar el botón, presiona "Completar Verificación".
4. Proceso de Validación y Finalización
¿Qué pasa ahora?:
Verás una pantalla final que dice "Validando Documentos".
Un animado spinner y una barra de progreso te mostrarán cómo nuestro sistema está
revisando y confirmando toda tu información en tiempo real (verificación de datos, validación
bancaria, biometría).
¡Verificación Completada!
Una vez que el proceso termina (suele tardar entre 5 y 15 minutos), verás una pantalla de
éxito con un gran check verde (✔).
Recibirás una notificación por correo electrónico confirmando que tu cuenta ha sido
verificada.
Serás redirigido automáticamente a tu Panel Principal.
5. ¿Qué Pasa si ya Estaba Verificado?
Si por alguna razón vuelves a entrar a esta página y ya habías completado la verificación, el
sistema lo detectará.
¿Qué verás?: Una pantalla que dice "Verificación Ya Completada", con los detalles de
cuándo te verificaste.
¿Qué hacer?: Simplemente presiona el botón "Volver al Panel Principal".
¡Y eso es todo!
Bloque 4: Manual de Usuario - Paneles "Servicios" y "Ajustes" (homevisa.html)
Guía Completa para Gestionar tu Cuenta y Acceder a Servicios Adicionales
Tu aplicación Remeex Visa cuenta con dos paneles muy importantes que te permiten
acceder a todas las funcionalidades y configurar tu cuenta: Servicios y Ajustes. Ambos se
abren desde la barra de navegación inferior.
1. Panel de "Servicios" (
`;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = () => {
    return `
### ROL Y CONTEXTO
Eres Ana, una asesora virtual experta de Remeex Visa. Tu propósito es ser amigable, empática y extremadamente útil. Tu conocimiento proviene exclusivamente del manual de usuario que te he proporcionado.

### REGLA FUNDAMENTAL DE RESPUESTA
- NUNCA digas "no encuentro esa información en mi guía" o "no tengo acceso a esa información".
- SIEMPRE proporciona una respuesta útil. Si no tienes la información exacta, debes escalar la conversación a un operador humano.

### ADAPTACIÓN CULTURAL VENEZOLANA Y MANEJO DE COMPORTAMIENTO
- **Entendimiento Cultural:** Debes entender y adaptarte al lenguaje y contexto cultural venezolano para generar confianza y empatía. Reconoce y reformula profesionalmente la jerga (ej. "chévere", "pana", "burda"), interpreta errores comunes ("nesesito" -> necesito) y responde con empatía a expresiones de estrés ("estoy desesperado").
- **Detección de Comportamiento:** Identifica comportamientos inadecuados. Usa un sistema de advertencias progresivas para reconducir la conversación. Si el comportamiento persiste (insultos, spam, agresividad), debes responder con las advertencias predefinidas y, si es necesario, indicar que el acceso será bloqueado. Distingue la frustración culturalmente aceptable ("qué ladilla este proceso") de la agresión directa.

### SISTEMA DE TICKETS DE RECLAMOS
- **Activación:** Si un usuario usa palabras clave como "reclamo", "queja", "incidencia", "no estoy conforme", o muestra gran insatisfacción, debes activar el sistema de tickets.
- **Consulta de Estado:** Si un usuario escribe "ESTADO TICKET [ID]", debes identificarlo y responder con la acción 'SHOW_TICKET_STATUS' y el ID del ticket.

### REGLAS DE COMPORTAMIENTO
1.  **POSITIVIDAD Y SOLUCIÓN:** Siempre enfócate en lo que SÍ puedes hacer. Evita negativas.
2.  **ESCALACIÓN A OPERADOR HUMANO:** Si la información no está en tu manual o el usuario requiere atención muy personalizada, usa EXACTAMENTE el siguiente texto: "Entiendo perfectamente tu consulta. Para darte la información más actualizada y precisa sobre este tema, lo mejor es que te comuniques con uno de nuestros ejecutivos de cuenta expertos. Ellos podrán resolver tu consulta de manera inmediata y personalizada."
3.  **ACTIVACIÓN DE TICKETS:** Cuando corresponda, tu única respuesta debe ser activar el formulario con la acción 'CREATE_TICKET'. Texto sugerido: "Veo que no estás conforme. ¿Te gustaría generar un ticket de reclamo oficial para que nuestro equipo pueda resolver tu situación de inmediato?"
4.  **CONOCIMIENTO:** Tu única fuente de verdad es el manual. Basa todas tus respuestas en él.

### INICIO DEL MANUAL DE USUARIO DE REMEEX VISA ###
${USER_MANUAL_CONTENT}
### FIN DEL MANUAL ###
`;
}


export async function getChatbotResponse(chatHistory: Message[]): Promise<ChatbotResponse> {
    const model = 'gemini-2.5-flash';

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            responseText: {
                type: Type.STRING,
                description: "La respuesta de la asesora virtual Ana. Debe ser amigable, útil, en español, y basarse estrictamente en el manual y las reglas. No inventes información. Sé concisa y empática.",
            },
            suggestions: {
                type: Type.ARRAY,
                description: "Tres sugerencias cortas y relevantes en español para la siguiente pregunta del usuario.",
                items: {
                    type: Type.STRING,
                },
            },
            action: {
                type: Type.STRING,
                description: "Una acción especial para la UI, como 'CREATE_TICKET' o 'SHOW_TICKET_STATUS'. Si no hay acción especial, debe ser 'NONE'.",
                enum: ['CREATE_TICKET', 'SHOW_TICKET_STATUS', 'NONE'],
            },
            ticketId: {
                type: Type.STRING,
                description: "El ID del ticket si la acción es 'SHOW_TICKET_STATUS'."
            }
        },
        required: ["responseText", "suggestions", "action"],
    };

    const systemInstruction = getSystemInstruction();

    const contents: Content[] = chatHistory.map(msg => ({
        role: msg.sender === Sender.User ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    try {
        const response = await ai.models.generateContent({
            model,
            contents,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
                temperature: 0.5,
            },
        });

        const jsonText = response.text.trim();
        const parsedResponse: ChatbotResponse = JSON.parse(jsonText);

        return parsedResponse;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return {
            responseText: "Lo siento, estoy teniendo dificultades para procesar tu solicitud en este momento. Por favor, intenta de nuevo más tarde.",
            suggestions: ["¿Qué es Remeex?", "¿Cómo me registro?", "Ver tarifas"],
            action: 'NONE',
        };
    }
}