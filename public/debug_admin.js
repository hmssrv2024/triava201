// Debug script para verificar event listeners
console.log('🔍 Debug: Verificando event listeners...');

// Verificar si los elementos existen
const sendBtn = document.getElementById('send-btn');
const composerForm = document.getElementById('composer-form');
const quickResponsesSendBtn = document.querySelector('.quick-responses__send-btn');

console.log('📝 Send button:', sendBtn);
console.log('📝 Composer form:', composerForm);
console.log('📝 Quick responses send button:', quickResponsesSendBtn);

// Verificar event listeners
if (sendBtn) {
    console.log('✅ Send button encontrado');
    sendBtn.addEventListener('click', (e) => {
        console.log('🖱️ Send button clicked!', e);
    });
} else {
    console.log('❌ Send button no encontrado');
}

if (composerForm) {
    console.log('✅ Composer form encontrado');
    composerForm.addEventListener('submit', (e) => {
        console.log('📤 Composer form submitted!', e);
    });
} else {
    console.log('❌ Composer form no encontrado');
}

// Verificar estado del bot
const statusIndicator = document.getElementById('bot-status');
console.log('🤖 Bot status:', statusIndicator);

// Verificar si hay un chat activo
const activeNumber = window.state?.activeNumber;
console.log('💬 Active number:', activeNumber);

// Verificar socket
if (typeof io !== 'undefined') {
    console.log('🔌 Socket.IO disponible');
    if (window.socket) {
        console.log('🔌 Socket conectado:', window.socket.connected);
    } else {
        console.log('⚠️ Socket no inicializado aún');
    }
} else {
    console.log('❌ Socket.IO no cargado');
}

console.log('🔍 Debug completado');
