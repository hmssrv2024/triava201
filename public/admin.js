const socket = io();

const qs = (id) => document.getElementById(id);

const conversationListEl = qs('conversation-list');
const conversationCountEl = qs('conversation-count');
const messagesEl = qs('messages');
const chatTitleEl = qs('chat-title');
const chatSubtitleEl = qs('chat-subtitle');
const chatMetaEl = qs('chat-meta');
const composerFormEl = qs('composer-form');
const composerInputEl = qs('composer-input');
const composerStatusEl = qs('composer-status');
const improveBtnEl = qs('improve-btn');
const toneSelectEl = qs('tone-select');
const audienceSelectEl = qs('audience-select');
const lengthSelectEl = qs('length-select');
const languageSelectEl = qs('language-select');
const sendAudioEl = qs('send-audio');
const sendBtnEl = qs('send-btn');
const audioInputEl = qs('composer-audio');
const audioFilenameEl = qs('audio-filename');
const clearAudioBtnEl = qs('clear-audio');
const recordBtnEl = qs('record-btn');
const stopRecordBtnEl = qs('stop-record-btn');
const recordingIndicatorEl = qs('recording-indicator');
const composerImageEl = qs('composer-media');
const imageFilenameEl = qs('media-filename');
const clearImageBtnEl = qs('clear-media');
const alertsEl = qs('alerts');
const statusIndicatorEl = qs('bot-status');
const qrContainerEl = qs('qr-container');
const qrContentEl = qs('qr-content');
const personalizationPanelEl = qs('personalization-panel');
const personalizationFormEl = qs('personalization-form');
const personalizationNameEl = qs('personalization-name');
const personalizationBankEl = qs('personalization-bank');
const personalizationBalanceEl = qs('personalization-balance');
const personalizationFxEl = qs('personalization-fx');
const personalizationValidationEl = qs('personalization-validation');
const personalizationStatusEl = qs('personalization-status');
const personalizationClearBtnEl = qs('personalization-clear');
const libraryAudioSelectEl = qs('library-audio-select');
const sendLibraryAudioBtnEl = qs('send-library-audio');
const refreshLibraryAudioBtnEl = qs('refresh-library-audio');
const openSandboxChatBtnEl = qs('open-sandbox-chat');
const openToolAISpeechBtnEl = qs('open-tool-aispeech');
const openToolInviBtnEl = qs('open-tool-invi');
const externalOverlayEl = qs('external-overlay');
const externalOverlayBackdropEl = qs('external-overlay-backdrop');
const externalOverlayPanelEl = qs('external-overlay-panel');
const externalOverlayTitleEl = qs('external-overlay-title');
const externalOverlayFrameEl = qs('external-overlay-frame');
const externalOverlayInfoEl = qs('external-overlay-info');
const externalOverlayCloseBtnEl = qs('external-overlay-close');
const externalOverlayOpenNewBtnEl = qs('external-overlay-open-new');
const sandboxModalEl = qs('sandbox-modal');
const sandboxBackdropEl = qs('sandbox-modal-backdrop');
const sandboxPanelEl = qs('sandbox-modal-panel');
const sandboxFormEl = qs('sandbox-form');
const sandboxPromptEl = qs('sandbox-prompt');
const sandboxSystemPromptEl = qs('sandbox-system-prompt');
const sandboxSubmitBtnEl = qs('sandbox-submit');
const sandboxClearBtnEl = qs('sandbox-clear');
const sandboxOutputEl = qs('sandbox-output');
const sandboxCloseBtnEl = qs('sandbox-modal-close');
const sandboxModelSelectEl = qs('sandbox-model');
const directNumberEl = qs('direct-number');
const directSendBtnEl = qs('direct-send-btn');
const directMessageStatusEl = qs('direct-message-status');
const directMessageInputEl = qs('direct-message');
const togglePersonalizationEl = qs('toggle-personalization');

if (libraryAudioSelectEl) {
    libraryAudioSelectEl.disabled = true;
}
if (sendLibraryAudioBtnEl) {
    sendLibraryAudioBtnEl.disabled = true;
}

if (refreshLibraryAudioBtnEl && !refreshLibraryAudioBtnEl.dataset.label) {
    refreshLibraryAudioBtnEl.dataset.label = refreshLibraryAudioBtnEl.textContent || 'Actualizar lista';
}

if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
    if (recordBtnEl) {
        recordBtnEl.disabled = true;
        recordBtnEl.title = 'El navegador no soporta grabacion de audio';
    }
    if (stopRecordBtnEl) stopRecordBtnEl.disabled = true;
}

// Función para normalizar número de teléfono
function normalizePhoneNumber(number) {
    if (!number) return null;
    
    // Remover espacios, guiones y paréntesis
    let cleanNumber = number.replace(/[\s\-\(\)]/g, '');
    
    // Si no empieza con +, agregarlo
    if (!cleanNumber.startsWith('+')) {
        // Si empieza con 58 (Venezuela), agregar +
        if (cleanNumber.startsWith('58')) {
            cleanNumber = '+' + cleanNumber;
        } else {
            // Asumir que es un número local y agregar +58
            cleanNumber = '+58' + cleanNumber;
        }
    }
    
    // Validar que sea un número válido
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(cleanNumber)) {
        return null;
    }
    
    return cleanNumber;
}

const state = {
    conversations: new Map(),
    activeNumber: null,
    improving: false,
    botStatus: null,
    qrToken: null,
    audioFile: null,
    pendingAudioId: null,
    imageFile: null,
    pendingMediaId: null,
    isSending: false,
    recorder: null,
    recording: false,
    recordingChunks: [],
    recordingStart: null,
    recordingTimer: null,
    recordingStream: null,
    preparingAudio: false,
    audioUploadInfo: null,
    imageUploadInfo: null,
    typingAlerts: new Map(),
    personalizationSaving: false,
    personalizationStatusTimer: null,
    audioLibrary: [],
    sendingLibraryAudio: false,
    libraryLoading: false,
    externalOverlay: {
        open: false,
        url: null,
        title: null
    },
    sandbox: {
        open: false,
        loading: false,
        lastResponse: null,
        models: [],
        selectedModel: 'default',
        modelsLoaded: false
    },
    pendingSendContext: null,
    directMessage: {
        sending: false,
        number: null
    },
    quickResponses: {
        sending: false,
        sendBtn: null
    }
};

const normalizeNumber = (value) => (value || '').replace(/[^0-9]/g, '');

const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(Number(timestamp));
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short'
    });
};

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

const trimText = (text, max = 80) => {
    if (!text) return '';
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= max) return clean;
    return `${clean.slice(0, max - 1)}...`;
};

const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const pushAlert = (message, tone = 'info', ttl = 4000) => {
    if (!alertsEl) return;
    const div = document.createElement('div');
    div.className = `alert alert--${tone}`;
    div.textContent = message;
    alertsEl.appendChild(div);
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateY(-6px)';
        setTimeout(() => alertsEl.removeChild(div), 220);
    }, ttl);
};

const setLibraryLoading = (loading) => {
    state.libraryLoading = Boolean(loading);
    if (libraryAudioSelectEl) {
        libraryAudioSelectEl.disabled = state.libraryLoading || state.sendingLibraryAudio;
    }
    if (sendLibraryAudioBtnEl) {
        const hasAudios = state.audioLibrary.length > 0;
        sendLibraryAudioBtnEl.disabled = state.libraryLoading || state.sendingLibraryAudio || !hasAudios;
    }
    if (refreshLibraryAudioBtnEl) {
        refreshLibraryAudioBtnEl.disabled = state.libraryLoading;
        refreshLibraryAudioBtnEl.classList.toggle('is-loading', state.libraryLoading);
        if (state.libraryLoading) {
            refreshLibraryAudioBtnEl.dataset.label = refreshLibraryAudioBtnEl.dataset.label || refreshLibraryAudioBtnEl.textContent;
            refreshLibraryAudioBtnEl.textContent = 'Actualizando...';
        } else if (refreshLibraryAudioBtnEl.dataset.label) {
            refreshLibraryAudioBtnEl.textContent = refreshLibraryAudioBtnEl.dataset.label;
        }
    }
};

const renderSandboxPlaceholder = (message) => {
    if (!sandboxOutputEl) return;
    sandboxOutputEl.classList.remove('has-content');
    sandboxOutputEl.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'sandbox-modal__placeholder';
    p.textContent = message;
    sandboxOutputEl.appendChild(p);
};

const renderSandboxResult = (text) => {
    if (!sandboxOutputEl) return;
    sandboxOutputEl.classList.add('has-content');
    sandboxOutputEl.innerHTML = '';
    const pre = document.createElement('pre');
    pre.textContent = text;
    sandboxOutputEl.appendChild(pre);
};

const setSandboxLoading = (loading) => {
    state.sandbox.loading = Boolean(loading);
    if (sandboxSubmitBtnEl) {
        sandboxSubmitBtnEl.disabled = state.sandbox.loading;
        sandboxSubmitBtnEl.classList.toggle('is-loading', state.sandbox.loading);
    }
    if (sandboxClearBtnEl) {
        sandboxClearBtnEl.disabled = state.sandbox.loading;
    }
    if (sandboxPromptEl) {
        sandboxPromptEl.readOnly = state.sandbox.loading;
    }
    if (sandboxSystemPromptEl) {
        sandboxSystemPromptEl.readOnly = state.sandbox.loading;
    }
    if (state.sandbox.loading) {
        renderSandboxPlaceholder('Generando respuesta...');
    }
};

const clearSandboxForm = () => {
    if (sandboxPromptEl) sandboxPromptEl.value = '';
    if (sandboxSystemPromptEl) sandboxSystemPromptEl.value = '';
    state.sandbox.lastResponse = null;
    renderSandboxPlaceholder('La respuesta aparecera aqui.');
};

const openSandboxModal = () => {
    if (!sandboxModalEl) return;
    state.sandbox.open = true;
    sandboxModalEl.hidden = false;
    document.body.classList.add('overlay-open');
    if (!state.sandbox.modelsLoaded) {
        loadSandboxModels().catch((error) => {
            console.error('[UI] No se pudieron cargar los modelos del sandbox IA:', error);
        });
    } else {
        renderSandboxModelOptions();
    }
    setSandboxLoading(false);
    if (state.sandbox.lastResponse) {
        renderSandboxResult(state.sandbox.lastResponse);
    } else {
        renderSandboxPlaceholder('La respuesta aparecera aqui.');
    }
    requestAnimationFrame(() => {
        sandboxPanelEl?.focus({ preventScroll: true });
        sandboxPromptEl?.focus();
    });
};

const closeSandboxModal = ({ reset = false } = {}) => {
    if (!sandboxModalEl) return;
    state.sandbox.open = false;
    sandboxModalEl.hidden = true;
    setSandboxLoading(false);
    if (reset) {
        clearSandboxForm();
    }
    if (!state.externalOverlay.open) {
        document.body.classList.remove('overlay-open');
    }
};

const showExternalOverlay = (url, title) => {
    if (!url) return;
    if (!externalOverlayEl || !externalOverlayFrameEl) {
        window.open(url, '_blank', 'noopener');
        return;
    }

    state.externalOverlay.open = true;
    state.externalOverlay.url = url;
    state.externalOverlay.title = title;

    if (externalOverlayTitleEl) {
        externalOverlayTitleEl.textContent = title || 'Herramienta externa';
    }
    if (externalOverlayInfoEl) {
        externalOverlayInfoEl.hidden = false;
        externalOverlayInfoEl.textContent = 'Cargando la herramienta seleccionada... Si no se muestra, usa "Abrir en nueva pestaña".';
    }

    externalOverlayEl.hidden = false;
    document.body.classList.add('overlay-open');

    if (externalOverlayFrameEl) {
        externalOverlayFrameEl.src = 'about:blank';
        setTimeout(() => {
            if (state.externalOverlay.open) {
                externalOverlayFrameEl.src = url;
            }
        }, 50);
    }

    requestAnimationFrame(() => {
        externalOverlayPanelEl?.focus({ preventScroll: true });
    });
};

const hideExternalOverlay = () => {
    if (!externalOverlayEl) return;

    state.externalOverlay.open = false;
    state.externalOverlay.url = null;
    state.externalOverlay.title = null;

    if (externalOverlayFrameEl) {
        externalOverlayFrameEl.src = 'about:blank';
    }
    if (externalOverlayInfoEl) {
        externalOverlayInfoEl.hidden = false;
    }

    externalOverlayEl.hidden = true;
    if (!state.sandbox.open) {
        document.body.classList.remove('overlay-open');
    }
};

const isValidVoiceNoteFile = (file) => {
    if (!file) return false;
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    const mimeOk = type.includes('audio/ogg')
        || type.includes('audio/opus')
        || type.includes('audio/wav')
        || type.includes('audio/x-wav')
        || type.includes('audio/mpeg')
        || type.includes('audio/mp3')
        || type.includes('audio/webm')
        || type.includes('audio/weba')
        || type.includes('audio/aac')
        || type.includes('audio/m4a')
        || type.includes('audio/mp4')
        || type.includes('audio/x-m4a')
        || type.includes('audio/flac')
        || type.includes('audio/3gpp')
        || type.includes('audio/3gpp2')
        || type.includes('audio/amr')
        || type.includes('audio/x-ms-wma')
        || type.startsWith('audio/');
    const extOk = name.endsWith('.ogg')
        || name.endsWith('.opus')
        || name.endsWith('.mp3')
        || name.endsWith('.wav')
        || name.endsWith('.wave')
        || name.endsWith('.m4a')
        || name.endsWith('.mp4')
        || name.endsWith('.aac')
        || name.endsWith('.flac')
        || name.endsWith('.webm')
        || name.endsWith('.weba')
        || name.endsWith('.3gp')
        || name.endsWith('.3gpp')
        || name.endsWith('.3gpp2')
        || name.endsWith('.amr')
        || name.endsWith('.wma')
        || name.endsWith('.caf');
    return mimeOk || extOk;
};

const clearAudioSelection = () => {
    if (state.recording) {
        stopRecording();
    }
    resetRecordingState();
    state.audioFile = null;
    state.pendingAudioId = null;
    state.preparingAudio = false;
    state.audioUploadInfo = null;
    if (audioInputEl) audioInputEl.value = '';
    if (audioFilenameEl) {
        audioFilenameEl.textContent = '';
        audioFilenameEl.hidden = true;
    }
    if (clearAudioBtnEl) {
        clearAudioBtnEl.hidden = true;
    }
    if (sendAudioEl) {
        sendAudioEl.disabled = false;
    }
    if (!state.isSending && sendBtnEl) {
        sendBtnEl.disabled = false;
    }
    if (!state.isSending && composerStatusEl) {
        composerStatusEl.textContent = '';
    }
};

const clearImageSelection = () => {
    state.imageFile = null;
    state.pendingMediaId = null;
    state.imageUploadInfo = null;
    if (composerImageEl) composerImageEl.value = '';
    if (imageFilenameEl) {
        imageFilenameEl.textContent = '';
        imageFilenameEl.hidden = true;
    }
    if (clearImageBtnEl) {
        clearImageBtnEl.hidden = true;
    }
    if (!state.isSending && sendBtnEl && !state.preparingAudio) {
        sendBtnEl.disabled = false;
    }
    if (!state.isSending && composerStatusEl && !state.preparingAudio) {
        composerStatusEl.textContent = '';
    }
};

const prepareAudioAttachment = async (file) => {
    if (!file) return null;
    state.preparingAudio = true;
    if (!state.isSending && sendBtnEl) {
        sendBtnEl.disabled = true;
    }
    if (!state.isSending && composerStatusEl) {
        composerStatusEl.textContent = 'Convirtiendo audio a nota de voz...';
    }
    try {
        const result = await uploadAudioFile(file);
        if (!result?.id) {
            throw new Error('No se pudo preparar el audio.');
        }
        const sameSelection = state.audioFile === file;
        const converted = Boolean(result?.converted);
        if (sameSelection) {
            state.pendingAudioId = result.id;
            state.audioUploadInfo = result;
            if (!state.isSending && composerStatusEl) {
                composerStatusEl.textContent = converted
                    ? 'Nota de voz lista en formato Opus.'
                    : 'Nota de voz lista para enviar.';
            }
            pushAlert(
                converted ? 'Audio convertido a nota de voz listo para enviar.' : 'Audio listo para enviar.',
                'success',
                3000
            );
        }
        return result;
    } catch (error) {
        const message = error?.message || 'No se pudo preparar el audio.';
        clearAudioSelection();
        if (composerStatusEl) {
            composerStatusEl.textContent = message;
        }
        pushAlert(message, 'error', 5000);
        throw error;
    } finally {
        state.preparingAudio = false;
        if (!state.isSending && sendBtnEl) {
            sendBtnEl.disabled = false;
        }
    }
};

const applyImageSelection = async (file) => {
    if (!file) {
        clearImageSelection();
        return;
    }
    const type = (file.type || '').toLowerCase();
    if (!type.startsWith('image/')) {
        pushAlert('Solo se aceptan imagenes (JPG, PNG, WEBP).', 'error', 4000);
        clearImageSelection();
        return;
    }
    if (file.size > 12 * 1024 * 1024) {
        pushAlert('La imagen supera el limite de 12 MB.', 'error');
        clearImageSelection();
        return;
    }
    state.imageFile = file;
    if (imageFilenameEl) {
        imageFilenameEl.textContent = `${file.name} - ${formatBytes(file.size)}`;
        imageFilenameEl.hidden = false;
    }
    if (clearImageBtnEl) {
        clearImageBtnEl.hidden = false;
    }
    if (!state.isSending && sendBtnEl) {
        sendBtnEl.disabled = true;
    }
    composerStatusEl.textContent = 'Subiendo imagen...';
    try {
        const result = await uploadMediaFile(file);
        if (!result?.id) {
            throw new Error('No se pudo preparar la imagen.');
        }
        state.pendingMediaId = result.id;
        state.imageUploadInfo = result;
        if (imageFilenameEl) {
            const sizeLabel = result.size ? formatBytes(result.size) : formatBytes(file.size);
            imageFilenameEl.textContent = `${result.originalName || file.name} - ${sizeLabel}`;
        }
        composerStatusEl.textContent = 'Imagen lista para enviar.';
        pushAlert('Imagen lista para enviar.', 'success', 2500);
        if (!state.isSending && sendBtnEl) {
            sendBtnEl.disabled = false;
        }
    } catch (error) {
        const message = error?.message || 'No se pudo subir la imagen.';
        clearImageSelection();
        pushAlert(message, 'error', 4000);
    } finally {
        if (!state.isSending && sendBtnEl && !state.preparingAudio) {
            sendBtnEl.disabled = false;
        }
    }
};

const applyAudioSelection = async (file) => {
    state.audioFile = file;
    state.pendingAudioId = null;
    state.audioUploadInfo = null;
    if (audioFilenameEl) {
        audioFilenameEl.textContent = `${file.name} - ${formatBytes(file.size)}`;
        audioFilenameEl.hidden = false;
    }
    if (clearAudioBtnEl) {
        clearAudioBtnEl.hidden = false;
    }
    if (sendAudioEl) {
        sendAudioEl.checked = false;
        sendAudioEl.disabled = true;
    }
    if (composerStatusEl && !state.isSending) {
        composerStatusEl.textContent = 'Preparando nota de voz...';
    }

    const result = await prepareAudioAttachment(file);
    if (result && audioFilenameEl) {
        audioFilenameEl.textContent = `${result.originalName || file.name} - ${formatBytes(result.size || file.size)}`;
    }
    return result;
};

const uploadAudioFile = async (file) => {
    const formData = new FormData();
    formData.append('audio', file, file.name || 'nota.ogg');

    const response = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        let errorMessage = 'No se pudo subir el audio.';
        try {
            const data = await response.json();
            if (data?.error) {
                errorMessage = data.error;
            }
        } catch {
            // ignore parse errors
        }
        throw new Error(errorMessage);
    }

    return response.json();
};

const uploadMediaFile = async (file) => {
    const formData = new FormData();
    formData.append('media', file, file.name || 'imagen');

    const response = await fetch('/api/upload-media', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        let errorMessage = 'No se pudo subir la imagen.';
        try {
            const data = await response.json();
            if (data?.error) {
                errorMessage = data.error;
            }
        } catch {
            // ignore parse errors
        }
        throw new Error(errorMessage);
    }

    return response.json();
};

const resetRecordingState = () => {
    if (state.recordingTimer) {
        clearInterval(state.recordingTimer);
    }
    if (state.recordingStream) {
        state.recordingStream.getTracks().forEach((track) => track.stop());
    }
    state.recorder = null;
    state.recording = false;
    state.recordingChunks = [];
    state.recordingStart = null;
    state.recordingTimer = null;
    state.recordingStream = null;
    if (recordBtnEl) recordBtnEl.hidden = false;
    if (stopRecordBtnEl) stopRecordBtnEl.hidden = true;
    if (recordingIndicatorEl) {
        recordingIndicatorEl.hidden = true;
        recordingIndicatorEl.textContent = 'Grabando 00:00';
    }
    if (audioInputEl) audioInputEl.disabled = false;
    if (!state.audioFile && composerStatusEl && !state.isSending) {
        composerStatusEl.textContent = '';
    }
};

const updateRecordingIndicator = () => {
    if (!state.recordingStart || !recordingIndicatorEl) return;
    const elapsed = Math.floor((Date.now() - state.recordingStart) / 1000);
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');
    recordingIndicatorEl.textContent = `Grabando ${minutes}:${seconds}`;
};

const startRecording = async () => {
    if (state.recording) return;
    if (state.audioFile) {
        clearAudioSelection();
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeOptions = [
            'audio/ogg;codecs=opus',
            'audio/webm;codecs=opus',
            'audio/webm'
        ];
        let selectedMime = '';
        for (const option of mimeOptions) {
            if (MediaRecorder.isTypeSupported(option)) {
                selectedMime = option;
                break;
            }
        }
        const recorder = selectedMime ? new MediaRecorder(stream, { mimeType: selectedMime }) : new MediaRecorder(stream);
        state.recorder = recorder;
        state.recordingStream = stream;
        state.recordingChunks = [];
        state.recording = true;
        state.recordingStart = Date.now();
        if (recordBtnEl) recordBtnEl.hidden = true;
        if (stopRecordBtnEl) stopRecordBtnEl.hidden = false;
        if (recordingIndicatorEl) recordingIndicatorEl.hidden = false;
        updateRecordingIndicator();
        state.recordingTimer = setInterval(updateRecordingIndicator, 500);
        if (audioInputEl) audioInputEl.disabled = true;
        if (composerStatusEl) composerStatusEl.textContent = 'Grabando nota de voz...';

        recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                state.recordingChunks.push(event.data);
            }
        };

        recorder.onstop = async () => {
            const blob = new Blob(state.recordingChunks, { type: recorder.mimeType || 'audio/webm' });
            const ext = blob.type.includes('ogg') || blob.type.includes('opus') ? 'ogg' : blob.type.includes('webm') ? 'webm' : 'ogg';
            const fileName = `nota-${Date.now()}.${ext}`;
            const file = new File([blob], fileName, { type: blob.type || 'audio/webm' });
            if (composerStatusEl) composerStatusEl.textContent = 'Preparando nota de voz...';
            try {
                await applyAudioSelection(file);
            } catch (prepError) {
                console.error('[UI] Error preparando la nota de voz grabada:', prepError);
            }
            resetRecordingState();
        };

        recorder.start();
    } catch (error) {
        console.error('[UI] Error iniciando grabacion:', error);
        pushAlert('No se pudo acceder al microfono. Revisa permisos del navegador.', 'error', 6000);
        resetRecordingState();
    }
};

const stopRecording = () => {
    if (!state.recording || !state.recorder) {
        return;
    }
    try {
        state.recorder.stop();
    } catch (error) {
        console.error('[UI] Error deteniendo grabacion:', error);
        resetRecordingState();
    }
};

const ensureConversation = (number) => {
    const normalized = normalizeNumber(number);
    if (!normalized) return null;
    if (!state.conversations.has(normalized)) {
        state.conversations.set(normalized, {
            info: {
                number: normalized,
                name: normalized,
                lastPreview: '',
                lastMessageAt: null,
                unread: 0,
                isOnline: false,
                isTyping: false,
                lastSeen: null,
                personalization: {
                    name: null,
                    bank: null,
                    balanceUsd: null,
                    fxRate: null,
                    validationAmount: null
                }
            },
            messages: []
        });
    }
    return state.conversations.get(normalized);
};

const normalizeMessage = (payload) => {
    if (!payload) return null;
    return {
        id: payload.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        author: payload.author || (payload.direction === 'outbound' ? 'Admin' : 'Usuario'),
        direction: payload.direction === 'outbound' ? 'outbound' : 'inbound',
        text: typeof payload.text === 'string' ? payload.text : '',
        timestamp: payload.timestamp || Date.now(),
        type: payload.type || 'text',
        media: payload.media || null
    };
};

const defaultPersonalization = () => ({
    name: '',
    bank: '',
    balanceUsd: '',
    fxRate: '',
    validationAmount: ''
});

const getPersonalizationData = (info) => ({
    ...defaultPersonalization(),
    ...((info && info.personalization) || {})
});

const setPersonalizationStatus = (message = '', tone = 'info', ttl = 4000) => {
    if (!personalizationStatusEl) return;
    if (state.personalizationStatusTimer) {
        clearTimeout(state.personalizationStatusTimer);
        state.personalizationStatusTimer = null;
    }
    if (message) {
        personalizationStatusEl.textContent = message;
        personalizationStatusEl.dataset.tone = tone;
        state.personalizationStatusTimer = setTimeout(() => {
            personalizationStatusEl.textContent = '';
            personalizationStatusEl.dataset.tone = 'info';
            state.personalizationStatusTimer = null;
        }, ttl);
    } else {
        personalizationStatusEl.textContent = '';
        personalizationStatusEl.dataset.tone = 'info';
    }
};

const populatePersonalizationForm = (info) => {
    if (!personalizationFormEl) return;
    const data = getPersonalizationData(info);
    if (personalizationNameEl) personalizationNameEl.value = data.name || '';
    if (personalizationBankEl) personalizationBankEl.value = data.bank || '';
    if (personalizationBalanceEl) personalizationBalanceEl.value = data.balanceUsd || '';
    if (personalizationFxEl) personalizationFxEl.value = data.fxRate || '';
    if (personalizationValidationEl) personalizationValidationEl.value = data.validationAmount || '';
};

const updatePersonalizationPanel = (info) => {
    if (!personalizationPanelEl) return;
    if (!info) {
        personalizationPanelEl.hidden = true;
        populatePersonalizationForm(null);
        setPersonalizationStatus('');
        return;
    }
    personalizationPanelEl.hidden = false;
    populatePersonalizationForm(info);
};

const readPersonalizationForm = () => {
    const sanitize = (value) => {
        if (value === null || value === undefined) return null;
        const trimmed = String(value).trim();
        return trimmed.length ? trimmed : null;
    };
    return {
        name: sanitize(personalizationNameEl?.value),
        bank: sanitize(personalizationBankEl?.value),
        balanceUsd: sanitize(personalizationBalanceEl?.value),
        fxRate: sanitize(personalizationFxEl?.value),
        validationAmount: sanitize(personalizationValidationEl?.value)
    };
};

const populateLibraryAudioSelect = () => {
    if (!libraryAudioSelectEl) {
        return;
    }
    const previous = libraryAudioSelectEl.value;
    libraryAudioSelectEl.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = state.audioLibrary.length
        ? 'Selecciona un audio guardado...'
        : 'No hay audios guardados';
    libraryAudioSelectEl.appendChild(placeholder);
    state.audioLibrary.forEach((item) => {
        const option = document.createElement('option');
        option.value = item.filename;
        option.textContent = item.label || item.filename;
        libraryAudioSelectEl.appendChild(option);
    });
    if (state.audioLibrary.some((item) => item.filename === previous)) {
        libraryAudioSelectEl.value = previous;
    } else {
        libraryAudioSelectEl.value = '';
    }
    const hasAudios = state.audioLibrary.length > 0;
    if (libraryAudioSelectEl) {
        libraryAudioSelectEl.disabled = state.libraryLoading || state.sendingLibraryAudio || !hasAudios;
    }
    if (sendLibraryAudioBtnEl) {
        sendLibraryAudioBtnEl.disabled = state.libraryLoading || state.sendingLibraryAudio || !hasAudios;
    }
    if (refreshLibraryAudioBtnEl && !state.libraryLoading) {
        refreshLibraryAudioBtnEl.disabled = false;
        refreshLibraryAudioBtnEl.classList.remove('is-loading');
        if (refreshLibraryAudioBtnEl.dataset.label) {
            refreshLibraryAudioBtnEl.textContent = refreshLibraryAudioBtnEl.dataset.label;
        }
    }
};

const loadAudioLibrary = async () => {
    setLibraryLoading(true);
    try {
        const response = await fetch('/api/audio-library');
        if (!response.ok) {
            throw new Error('No se pudo cargar la biblioteca de audios.');
        }
        const data = await response.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        state.audioLibrary = items.map((entry) => {
            const size = Number.isFinite(entry.size) ? entry.size : null;
            return {
                filename: entry.filename,
                label: size ? `${entry.filename} (${formatBytes(size)})` : entry.filename,
                size
            };
        });
        populateLibraryAudioSelect();
    } catch (error) {
        console.error('[UI] Error cargando biblioteca de audios:', error);
        state.audioLibrary = [];
        populateLibraryAudioSelect();
        pushAlert('No se pudo cargar la biblioteca de audios.', 'error', 4000);
    } finally {
        setLibraryLoading(false);
    }
};

const setBotStatus = (status) => {
    console.log('[FRONTEND] setBotStatus llamado con:', status);
    state.botStatus = status;
    if (!statusIndicatorEl) {
        console.log('[FRONTEND] statusIndicatorEl no encontrado');
        return;
    }
    const dot = statusIndicatorEl.querySelector('.status-indicator__dot');
    const label = statusIndicatorEl.querySelector('.status-indicator__label');
    const logoutBtn = statusIndicatorEl.querySelector('#logout-btn');
    const ready = Boolean(status?.ready);
    const statusText = status?.status || 'unknown';
    
    console.log('[FRONTEND] ready:', ready, 'status.ready:', status?.ready, 'status:', statusText);
    
    if (ready) {
        dot.classList.remove('status-indicator__dot--offline');
        dot.classList.add('status-indicator__dot--online');
        label.textContent = 'Conectado';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        console.log('[FRONTEND] Estado cambiado a Conectado');
    } else {
        dot.classList.remove('status-indicator__dot--online');
        dot.classList.add('status-indicator__dot--offline');
        
        // Mostrar estado específico según el status
        if (statusText === 'disconnected') {
            label.textContent = 'Desconectado';
        } else if (statusText === 'initializing') {
            label.textContent = 'Iniciando...';
        } else {
            label.textContent = 'Sin conexión';
        }
        
        if (logoutBtn) logoutBtn.style.display = 'none';
        console.log('[FRONTEND] Estado cambiado a:', label.textContent);
    }
    const meta = [];
    if (status?.provider) meta.push(status.provider.toUpperCase());
    if (status?.model) meta.push(status.model);
    if (chatMetaEl) {
        chatMetaEl.textContent = meta.join(' - ') || '';
    }
};

const updateQrBanner = (token) => {
    console.log('[FRONTEND] updateQrBanner llamado con:', token ? 'QR recibido' : 'sin QR');
    state.qrToken = token;
    if (!qrContainerEl || !qrContentEl) {
        console.log('[FRONTEND] Elementos QR no encontrados');
        return;
    }
    if (token) {
        // Convertir texto QR a imagen visual
        const qrImage = convertQrToImage(token);
        qrContentEl.innerHTML = qrImage;
        qrContainerEl.hidden = false;
        console.log('[FRONTEND] QR mostrado en el panel');
    } else {
        qrContainerEl.hidden = true;
        qrContentEl.innerHTML = '';
        console.log('[FRONTEND] QR ocultado');
    }
};

function convertQrToImage(qrText) {
    // Crear un div con el QR como texto ASCII
    const qrDiv = document.createElement('div');
    qrDiv.style.fontFamily = 'monospace';
    qrDiv.style.fontSize = '6px';
    qrDiv.style.lineHeight = '6px';
    qrDiv.style.whiteSpace = 'pre';
    qrDiv.style.backgroundColor = 'white';
    qrDiv.style.padding = '8px';
    qrDiv.style.border = '1px solid #ccc';
    qrDiv.style.display = 'block';
    qrDiv.style.width = '100%';
    qrDiv.style.overflow = 'auto';
    qrDiv.style.maxHeight = '400px';
    qrDiv.textContent = qrText;
    return qrDiv.outerHTML;
}

const renderConversationList = () => {
    if (!conversationListEl) return;
    const items = Array.from(state.conversations.values())
        .map((entry) => entry.info)
        .sort((a, b) => {
            const aTimestamp = Math.max(a.pendingDraft?.timestamp || 0, a.lastMessageAt || 0);
            const bTimestamp = Math.max(b.pendingDraft?.timestamp || 0, b.lastMessageAt || 0);
            return bTimestamp - aTimestamp;
        });

    conversationListEl.innerHTML = '';
    items.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'conversation-list__item';
        if (item.number === state.activeNumber) {
            li.classList.add('conversation-list__item--active');
        }
        li.dataset.number = item.number;

        const name = document.createElement('p');
        name.className = 'conversation-list__name';
        name.textContent = item.name || item.number;
        if (item.pendingDraft?.text) {
            li.classList.add('conversation-list__item--draft');
        }

        const number = document.createElement('p');
        number.className = 'conversation-list__number';
        number.textContent = `+${item.number}`;

        const preview = document.createElement('p');
        preview.className = 'conversation-list__preview';
        if (item.isTyping) {
            preview.textContent = 'Escribiendo...';
        } else if (item.pendingDraft?.text) {
            preview.textContent = `Borrador IA: ${trimText(item.pendingDraft.text, 60)}`;
        } else if (item.lastPreview) {
            preview.textContent = trimText(item.lastPreview, 60);
        } else {
            preview.textContent = 'Sin mensajes recientes';
        }

        const meta = document.createElement('div');
        meta.className = 'conversation-list__meta';

        const time = document.createElement('span');
        time.className = 'badge badge--muted';
        if (item.isTyping) {
            time.textContent = 'En vivo';
        } else if (item.pendingDraft?.timestamp) {
            time.textContent = formatTime(item.pendingDraft.timestamp);
        } else if (item.lastMessageAt) {
            time.textContent = formatTime(item.lastMessageAt);
        } else {
            time.textContent = '-';
        }

        const unread = document.createElement('span');
        unread.className = 'badge';
        unread.textContent = item.unread || 0;
        unread.hidden = !(item.unread > 0);

        if (item.pendingDraft?.text) {
            const draftBadge = document.createElement('span');
            draftBadge.className = 'badge badge--draft';
            draftBadge.textContent = 'Borrador';
            meta.append(draftBadge);
        }

        meta.append(time, unread);
        li.append(name, meta, number, preview);
        conversationListEl.appendChild(li);
    });

    if (conversationCountEl) {
        conversationCountEl.textContent = `${items.length}`;
    }
};

const scrollMessagesToBottom = () => {
    if (!messagesEl) return;
    requestAnimationFrame(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    });
};

const renderMessages = (messages, info = null) => {
    if (!messagesEl) return;
    messagesEl.innerHTML = '';

    const hasMessages = Array.isArray(messages) && messages.length > 0;
    const hasDraft = Boolean(info?.pendingDraft?.text);

    if (!hasMessages && !hasDraft) {
        messagesEl.classList.remove('has-content');
        return;
    }

    messagesEl.classList.add('has-content');

    if (hasMessages) {
        messages.forEach((msg) => appendMessageToUI(msg));
    }

    if (hasDraft) {
        appendMessageToUI({
            id: `draft-${info.pendingDraft.timestamp || Date.now()}`,
            author: info.pendingDraft.author || 'Borrador IA',
            direction: 'draft',
            text: info.pendingDraft.text,
            timestamp: info.pendingDraft.timestamp || Date.now(),
            type: 'text',
            draft: true
        });
    }

    scrollMessagesToBottom();
};

const appendMessageToUI = (message, append = true) => {
    if (!messagesEl || !message) return;
    const li = document.createElement('div');
    li.className = 'message';
    const direction = message.direction || 'inbound';
    const isDraft = direction === 'draft';
    const isOutbound = direction === 'outbound';
    const isInbound = direction === 'inbound';

    if (isDraft) {
        li.classList.add('message--draft');
    } else if (isOutbound) {
        li.classList.add('message--outbound');
    } else {
        li.classList.add('message--inbound');
    }

    if (!isDraft && (message.author || '').toLowerCase() === 'bot') {
        li.classList.add('message--bot');
    }
    li.dataset.messageId = message.id || '';
    li.dataset.direction = message.direction || '';

    const bubble = document.createElement('div');
    bubble.className = 'message__bubble';

    const meta = document.createElement('span');
    meta.className = 'message__meta';
    const authorLabel = message.author || (isDraft ? 'Borrador IA' : isOutbound ? 'Admin' : 'Usuario');
    if (isDraft) {
        meta.textContent = `${authorLabel} • Pendiente de envio`;
    } else {
        meta.textContent = `${authorLabel} - ${formatTime(message.timestamp)}`;
    }

    const text = document.createElement('div');
    text.className = 'message__text';
    text.textContent = message.text || '';

    bubble.append(meta, text);

    if (message.media?.isImage && message.media.preview) {
        const img = document.createElement('img');
        img.className = 'message__media';
        img.src = message.media.preview;
        img.alt = 'Imagen recibida';
        bubble.appendChild(img);
    }

    if (!isDraft) {
        const actions = [];
        if (isOutbound && (message.text || '').trim().length > 0) {
            actions.push({ label: 'Editar', action: 'edit' });
        }
        if (isOutbound) {
            actions.push({ label: 'Eliminar para todos', action: 'delete' });
        }

        if (actions.length > 0) {
            li.classList.add('message--has-actions');
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'message__actions';
            actions.forEach(({ label, action }) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'message__action';
                btn.dataset.action = action;
                btn.dataset.messageId = message.id || '';
                btn.textContent = label;
                actionsContainer.appendChild(btn);
            });
            bubble.appendChild(actionsContainer);
        }
    } else {
        // Funcionalidad completa para borradores
        const draftControls = document.createElement('div');
        draftControls.className = 'message__draft-controls';
        
        // Textarea editable
        const draftTextarea = document.createElement('textarea');
        draftTextarea.className = 'message__draft-text';
        draftTextarea.value = message.text || '';
        draftTextarea.rows = 3;
        draftTextarea.placeholder = 'Edita el borrador aquí...';
        
        // Controles de edición
        const draftActions = document.createElement('div');
        draftActions.className = 'message__draft-actions';
        
        // Botón de mejorar texto
        const improveBtn = document.createElement('button');
        improveBtn.type = 'button';
        improveBtn.className = 'btn btn--ghost btn--compact message__draft-action';
        improveBtn.textContent = 'Mejorar';
        improveBtn.dataset.action = 'improve-draft';
        improveBtn.dataset.messageId = message.id || '';
        
        // Botón de personalizar
        const personalizeBtn = document.createElement('button');
        personalizeBtn.type = 'button';
        personalizeBtn.className = 'btn btn--ghost btn--compact message__draft-action';
        personalizeBtn.textContent = 'Personalizar';
        personalizeBtn.dataset.action = 'personalize-draft';
        personalizeBtn.dataset.messageId = message.id || '';
        
        // Botón de enviar
        const sendBtn = document.createElement('button');
        sendBtn.type = 'button';
        sendBtn.className = 'btn btn--primary btn--compact message__draft-action';
        sendBtn.textContent = 'Enviar';
        sendBtn.dataset.action = 'send-draft';
        sendBtn.dataset.messageId = message.id || '';
        
        // Botón de descartar
        const discardBtn = document.createElement('button');
        discardBtn.type = 'button';
        discardBtn.className = 'btn btn--ghost btn--compact message__draft-action';
        discardBtn.textContent = 'Descartar';
        discardBtn.dataset.action = 'discard-draft';
        discardBtn.dataset.messageId = message.id || '';
        
        draftActions.appendChild(improveBtn);
        draftActions.appendChild(personalizeBtn);
        draftActions.appendChild(sendBtn);
        draftActions.appendChild(discardBtn);
        
        draftControls.appendChild(draftTextarea);
        draftControls.appendChild(draftActions);
        
        bubble.appendChild(draftControls);
        
        // Nota informativa
        const note = document.createElement('div');
        note.className = 'message__note';
        note.textContent = 'Edita el borrador y envía directamente desde aquí.';
        bubble.appendChild(note);
    }

    li.appendChild(bubble);

    messagesEl.appendChild(li);
};

const refreshConversationInfo = (conversation) => {
    if (!conversation) return;
    const messages = conversation.messages || [];
    if (messages.length === 0) {
        conversation.info.lastPreview = '';
        conversation.info.lastMessageAt = null;
        return;
    }
    const last = messages[messages.length - 1];
    conversation.info.lastPreview = last.text
        || (last.media?.isImage ? 'Imagen recibida' : last.media ? 'Archivo adjunto' : 'Mensaje');
    conversation.info.lastMessageAt = last.timestamp || Date.now();
};

const getConversationStatusText = (info) => {
    if (!info) return '';
    if (info.isTyping) {
        return 'Escribiendo...';
    }
    if (info.isOnline) {
        return 'En linea';
    }
    if (info.lastSeen) {
        const lastSeen = Number(info.lastSeen);
        if (Number.isFinite(lastSeen) && lastSeen > 0) {
            return `Visto ${formatTime(lastSeen)}`;
        }
    }
    return `+${info.number}`;
};

const updateActiveConversationHeader = (conversation) => {
    if (!conversation) {
        chatTitleEl.textContent = 'Selecciona un chat';
        chatSubtitleEl.textContent = 'No hay conversacion activa';
        return;
    }
    chatTitleEl.textContent = conversation.info.name || `+${conversation.info.number}`;
    chatSubtitleEl.textContent = getConversationStatusText(conversation.info);
};

const removeMessagesFromConversation = (number, ids = []) => {
    if (!ids.length) return;
    const conversation = state.conversations.get(number);
    if (!conversation) return;
    const idSet = new Set(ids);
    conversation.messages = conversation.messages.filter((msg) => !idSet.has(msg.id));
    refreshConversationInfo(conversation);

    if (number === state.activeNumber) {
        renderMessages(conversation.messages, conversation.info);
        updateActiveConversationHeader(conversation);
    }

    renderConversationList();
};

// Función para mejorar texto (reutilizable)
async function improveText(text, options = {}) {
    const {
        tone = 'profesional',
        audience = 'general',
        length = 'normal',
        language = 'espanol'
    } = options;

    try {
        const response = await fetch('/api/improve-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                tone,
                audience,
                length,
                language
            })
        });
        
        if (!response.ok) {
            throw new Error('No se pudo mejorar el texto.');
        }
        
        const data = await response.json();
        return data?.improved || null;
    } catch (error) {
        console.error('Error mejorando texto:', error);
        throw error;
    }
}

const handleMessageAction = (action, messageId) => {
    if (!state.activeNumber || !action || !messageId) {
        return;
    }

    const conversation = ensureConversation(state.activeNumber);
    if (!conversation) return;

    const message = conversation.messages.find((msg) => msg.id === messageId);
    if (!message) {
        pushAlert('No se encontro el mensaje seleccionado.', 'error');
        return;
    }

    if (action === 'edit') {
        if (!message.text) {
            pushAlert('Este mensaje no contiene texto editable.', 'info');
            return;
        }
        composerInputEl.value = message.text;
        composerInputEl.focus();
        composerStatusEl.textContent = 'Edita el mensaje y presiona "Enviar mensaje" para reenviarlo.';
        return;
    }

    if (action === 'delete') {
        if (message.direction !== 'outbound') {
            pushAlert('Solo puedes eliminar para todos mensajes enviados por ti.', 'error');
            return;
        }
        const confirmed = window.confirm('Eliminar este mensaje para ambos usuarios?');
        if (!confirmed) {
            return;
        }
        socket.emit('message:delete', {
            number: state.activeNumber,
            ids: [messageId],
            everyone: true
        });
        composerStatusEl.textContent = 'Solicitando eliminacion del mensaje...';
    }

    // Acciones específicas para borradores
    if (action === 'improve-draft') {
        const draftElement = document.querySelector(`[data-message-id="${messageId}"] .message__draft-text`);
        if (!draftElement) return;
        
        const currentText = draftElement.value.trim();
        if (!currentText) {
            pushAlert('No hay texto para mejorar en el borrador.', 'error');
            return;
        }
        
        // Deshabilitar botón mientras se mejora
        const improveBtn = document.querySelector(`[data-message-id="${messageId}"][data-action="improve-draft"]`);
        if (improveBtn) {
            improveBtn.disabled = true;
            improveBtn.textContent = 'Mejorando...';
        }
        
        // Llamar a la función de mejorar texto
        improveText(currentText, {
            tone: 'profesional',
            audience: 'general',
            length: 'normal',
            language: 'espanol'
        }).then((improvedText) => {
            if (improvedText && improvedText.trim()) {
                draftElement.value = improvedText;
                pushAlert('Texto mejorado exitosamente.', 'success');
            } else {
                pushAlert('No se pudo mejorar el texto.', 'error');
            }
        }).catch((error) => {
            console.error('Error mejorando texto:', error);
            pushAlert('Error al mejorar el texto.', 'error');
        }).finally(() => {
            if (improveBtn) {
                improveBtn.disabled = false;
                improveBtn.textContent = 'Mejorar';
            }
        });
    }

    if (action === 'personalize-draft') {
        const draftElement = document.querySelector(`[data-message-id="${messageId}"] .message__draft-text`);
        if (!draftElement) return;
        
        const currentText = draftElement.value.trim();
        if (!currentText) {
            pushAlert('No hay texto para personalizar en el borrador.', 'error');
            return;
        }
        
        // Mostrar panel de personalización si está oculto
        const personalizationPanel = document.getElementById('personalization-panel');
        if (personalizationPanel && personalizationPanel.hidden) {
            personalizationPanel.hidden = false;
        }
        
        pushAlert('Usa el panel de personalización para agregar datos del cliente.', 'info');
    }

    if (action === 'send-draft') {
        const draftElement = document.querySelector(`[data-message-id="${messageId}"] .message__draft-text`);
        if (!draftElement) return;

        const draftText = draftElement.value.trim();
        if (!draftText) {
            pushAlert('El borrador está vacío.', 'error');
            return;
        }

        // Deshabilitar botón mientras se envía
        const sendBtn = document.querySelector(`[data-message-id="${messageId}"][data-action="send-draft"]`);
        if (state.pendingSendContext && state.pendingSendContext.type !== 'draft') {
            pushAlert('Hay otro envío en curso. Intenta nuevamente cuando finalice.', 'error');
            return;
        }
        if (sendBtn) {
            if (!sendBtn.dataset.defaultLabel) {
                sendBtn.dataset.defaultLabel = sendBtn.textContent || 'Enviar';
            }
            sendBtn.disabled = true;
            sendBtn.textContent = 'Enviando...';
        }

        state.pendingSendContext = {
            type: 'draft',
            number: state.activeNumber,
            messageId,
            text: draftText
        };

        socket.emit('adminMessage', {
            to: state.activeNumber,
            text: draftText,
            sendAudio: false
        });
    }

    if (action === 'discard-draft') {
        const confirmed = window.confirm('¿Estás seguro de que quieres descartar este borrador?');
        if (!confirmed) return;
        
        // Eliminar el borrador de la conversación
        if (conversation.info.pendingDraft) {
            conversation.info.pendingDraft = null;
            renderConversationList();
            renderMessages(conversation.messages, conversation.info);
        }
        
        pushAlert('Borrador descartado.', 'info');
    }
};

const setActiveConversation = (number) => {
    const normalized = normalizeNumber(number);
    state.activeNumber = normalized || null;
    const entry = normalized ? ensureConversation(normalized) : null;
    if (!entry) {
        chatTitleEl.textContent = 'Selecciona un chat';
        chatSubtitleEl.textContent = 'No hay conversacion activa';
        if (messagesEl) {
            messagesEl.innerHTML = '';
            messagesEl.classList.remove('has-content');
        }
        updatePersonalizationPanel(null);
        return;
    }

    entry.info.unread = 0;
    updateActiveConversationHeader(entry);
    renderMessages(entry.messages, entry.info);
    updatePersonalizationPanel(entry.info);
    setPersonalizationStatus('');
    renderConversationList();
    if (entry.info.pendingDraft?.text) {
        const draftText = entry.info.pendingDraft.text;
        const currentValue = composerInputEl.value.trim();
        if (!currentValue || currentValue.length === 0 || currentValue === draftText.trim()) {
            composerInputEl.value = draftText;
        }
        composerStatusEl.textContent = 'Borrador generado automaticamente. Revisa y envialo cuando estes listo.';
    } else if (!state.isSending && !state.improving) {
        composerStatusEl.textContent = '';
    }
    socket.emit('markConversationRead', { number: entry.info.number });
    socket.emit('request:history', { number: entry.info.number });
};

const upsertMessage = (number, message) => {
    const conversation = ensureConversation(number);
    if (!conversation || !message) return;

    const exists = conversation.messages.some((m) => m.id === message.id);
    if (!exists) {
        conversation.messages.push(message);
        conversation.messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    }

    if (message.direction === 'outbound') {
        conversation.info.pendingDraft = null;
    }

    refreshConversationInfo(conversation);
    if (message.direction === 'inbound' && number !== state.activeNumber) {
        conversation.info.unread = (conversation.info.unread || 0) + 1;
    }

    if (number === state.activeNumber) {
        conversation.info.unread = 0;
        renderMessages(conversation.messages, conversation.info);
        updateActiveConversationHeader(conversation);
    }

    renderConversationList();
};

audioInputEl?.addEventListener('change', async () => {
    const file = audioInputEl.files?.[0];
    if (!file) {
        clearAudioSelection();
        return;
    }

    if (file.size > MAX_AUDIO_BYTES) {
        pushAlert('El archivo supera el limite de 8 MB.', 'error');
        clearAudioSelection();
        return;
    }

    if (!isValidVoiceNoteFile(file)) {
        pushAlert('Selecciona un archivo de audio compatible (OGG, OPUS, MP3, WAV, M4A, AAC, FLAC, WEBM, etc.).', 'error');
        clearAudioSelection();
        return;
    }

    try {
        await applyAudioSelection(file);
    } catch (error) {
        console.error('[UI] Error preparando audio:', error);
    }
});

composerImageEl?.addEventListener('change', async () => {
    const file = composerImageEl.files?.[0];
    if (!file) {
        clearImageSelection();
        return;
    }
    await applyImageSelection(file);
});

clearImageBtnEl?.addEventListener('click', () => {
    clearImageSelection();
});

clearAudioBtnEl?.addEventListener('click', () => {
    clearAudioSelection();
});

recordBtnEl?.addEventListener('click', () => {
    startRecording();
});

stopRecordBtnEl?.addEventListener('click', () => {
    stopRecording();
});

conversationListEl?.addEventListener('click', (event) => {
    const target = event.target.closest('li');
    if (!target?.dataset?.number) return;
    setActiveConversation(target.dataset.number);
});

messagesEl?.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const { action, messageId } = target.dataset;
    if (!action || !messageId) return;
    handleMessageAction(action, messageId);
});

personalizationFormEl?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!state.activeNumber) {
        setPersonalizationStatus('Selecciona un chat para guardar los datos.', 'error', 4000);
        return;
    }
    if (state.personalizationSaving) {
        return;
    }
    const data = readPersonalizationForm();
    state.personalizationSaving = true;
    setPersonalizationStatus('Guardando datos personalizados...', 'info', 6000);
    socket.emit('personalization:update', {
        number: state.activeNumber,
        data
    });
});


refreshLibraryAudioBtnEl?.addEventListener('click', () => {
    loadAudioLibrary();
});

openSandboxChatBtnEl?.addEventListener('click', () => {
    openSandboxModal();
});

sandboxCloseBtnEl?.addEventListener('click', () => {
    closeSandboxModal();
});

sandboxBackdropEl?.addEventListener('click', (event) => {
    if (event.target === sandboxBackdropEl) {
        closeSandboxModal();
    }
});

sandboxModelSelectEl?.addEventListener('change', (event) => {
    const selected = event.target?.value || 'default';
    state.sandbox.selectedModel = selected;
});

sandboxClearBtnEl?.addEventListener('click', () => {
    clearSandboxForm();
    sandboxPromptEl?.focus();
});

sandboxFormEl?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const prompt = sandboxPromptEl?.value?.trim() || '';
    const systemPrompt = sandboxSystemPromptEl?.value?.trim() || '';
    if (!prompt) {
        renderSandboxPlaceholder('Debes escribir un prompt antes de solicitar una respuesta.');
        pushAlert('Escribe un prompt para el chat IA.', 'error', 3500);
        sandboxPromptEl?.focus();
        return;
    }
    try {
        setSandboxLoading(true);
        const response = await fetch('/api/ai-sandbox', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                systemPrompt: systemPrompt || undefined
            })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || 'No se pudo obtener respuesta de la IA.');
        }
        const data = await response.json();
        const resultText = (data?.result || '').trim();
        state.sandbox.lastResponse = resultText;
        if (resultText) {
            renderSandboxResult(resultText);
        } else {
            renderSandboxPlaceholder('La IA no devolvio contenido. Intenta con otra solicitud.');
        }
    } catch (error) {
        console.error('[UI] Error en sandbox IA:', error);
        renderSandboxPlaceholder(error.message || 'Ocurrio un error generando la respuesta.');
        pushAlert(error.message || 'No se pudo generar la respuesta de la IA.', 'error', 4000);
    } finally {
        setSandboxLoading(false);
    }
});

personalizationClearBtnEl?.addEventListener('click', () => {
    if (!personalizationFormEl) return;
    if (personalizationNameEl) personalizationNameEl.value = '';
    if (personalizationBankEl) personalizationBankEl.value = '';
    if (personalizationBalanceEl) personalizationBalanceEl.value = '';
    if (personalizationFxEl) personalizationFxEl.value = '';
    if (personalizationValidationEl) personalizationValidationEl.value = '';
    personalizationFormEl.dispatchEvent(new Event('submit'));
});

sendLibraryAudioBtnEl?.addEventListener('click', () => {
    if (!state.activeNumber) {
        pushAlert('Selecciona un chat para enviar audios guardados.', 'error', 3000);
        return;
    }
    if (state.sendingLibraryAudio) {
        return;
    }
    if (!state.audioLibrary.length) {
        pushAlert('No hay audios guardados disponibles.', 'error', 3000);
        return;
    }
    const selected = libraryAudioSelectEl?.value || '';
    if (!selected) {
        pushAlert('Selecciona un audio guardado.', 'error', 3000);
        composerStatusEl.textContent = 'Selecciona un audio guardado.';
        return;
    }
    state.sendingLibraryAudio = true;
    if (sendLibraryAudioBtnEl) sendLibraryAudioBtnEl.disabled = true;
    if (libraryAudioSelectEl) libraryAudioSelectEl.disabled = true;
    if (refreshLibraryAudioBtnEl) refreshLibraryAudioBtnEl.disabled = true;
    composerStatusEl.textContent = 'Enviando audio guardado...';
    socket.emit('audioLibrary:send', {
        number: state.activeNumber,
        filename: selected
    });
});

// Función para enviar mensaje
async function sendMessage() {
    if (state.isSending) {
        console.log('⚠️ Ya se está enviando un mensaje');
        return;
    }

    if (state.pendingSendContext && state.pendingSendContext.type && state.pendingSendContext.type !== 'composer') {
        composerStatusEl.textContent = 'Espera a que finalice el envío en curso antes de enviar un nuevo mensaje.';
        return;
    }

    const number = state.activeNumber;
    const text = composerInputEl.value.trim();
    const hasAudio = Boolean(state.audioFile) || Boolean(state.pendingAudioId);
    const hasMedia = Boolean(state.imageFile) || Boolean(state.pendingMediaId);

    console.log('📤 Enviando mensaje:', { number, text, hasAudio, hasMedia });

    if (!number) {
        composerStatusEl.textContent = 'Selecciona un chat para enviar mensajes.';
        console.log('❌ No hay chat seleccionado');
        return;
    }

    if (!text && !hasAudio && !hasMedia) {
        composerStatusEl.textContent = 'Escribe un mensaje, adjunta un audio o una imagen.';
        console.log('❌ No hay contenido para enviar');
        return;
    }

    if (state.preparingAudio) {
        composerStatusEl.textContent = 'El audio se esta convirtiendo. Espera un momento e intentalo de nuevo.';
        console.log('⏳ Audio en preparación');
        return;
    }

    state.isSending = true;
    if (sendBtnEl) sendBtnEl.disabled = true;
    if (improveBtnEl && !state.improving) improveBtnEl.disabled = true;
    if (audioInputEl) audioInputEl.disabled = true;
    if (composerImageEl) composerImageEl.disabled = true;

    let audioId = state.pendingAudioId || null;
    let mediaId = state.pendingMediaId || null;

    try {
        state.pendingSendContext = {
            type: 'composer',
            number,
            text
        };
        if (hasAudio && !audioId) {
            if (!state.audioFile) {
                throw new Error('El audio no esta listo para enviarse.');
            }
            composerStatusEl.textContent = 'Subiendo audio...';
            const uploadResult = await uploadAudioFile(state.audioFile);
            audioId = uploadResult?.id || null;
            state.pendingAudioId = audioId;
            if (uploadResult) {
                state.audioUploadInfo = uploadResult;
            }
        }

        if (hasMedia && !mediaId) {
            if (!state.imageFile) {
                throw new Error('La imagen no esta lista para enviarse.');
            }
            composerStatusEl.textContent = 'Subiendo imagen...';
            const uploadResult = await uploadMediaFile(state.imageFile);
            mediaId = uploadResult?.id || null;
            state.pendingMediaId = mediaId;
            if (uploadResult) {
                state.imageUploadInfo = uploadResult;
            }
        }

        composerStatusEl.textContent = 'Enviando mensaje...';

        socket.emit('adminMessage', {
            to: number,
            text,
            sendAudio: !hasAudio && !hasMedia && Boolean(sendAudioEl?.checked),
            audioId,
            mediaId,
            caption: text
        });
    } catch (error) {
        state.isSending = false;
        state.pendingSendContext = null;
        if (sendBtnEl) sendBtnEl.disabled = false;
        if (improveBtnEl) improveBtnEl.disabled = state.improving;
        if (audioInputEl) audioInputEl.disabled = false;
        if (composerImageEl) composerImageEl.disabled = false;
        const message = error?.message || 'No se pudo enviar el mensaje.';
        if (composerStatusEl) {
            composerStatusEl.textContent = message;
        }
        pushAlert(message, 'error');
    }
}

// Event listeners adicionales para asegurar que funcionen
composerFormEl?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await sendMessage();
});

sendBtnEl?.addEventListener('click', async (event) => {
    event.preventDefault();
    console.log('🖱️ Botón de enviar clickeado');
    await sendMessage();
});

// Función para enviar mensaje directo por número
async function sendDirectMessage() {
    if (!directNumberEl || !directMessageInputEl || !directMessageStatusEl) {
        console.warn('⚠️ Elementos de envío directo no disponibles');
        return;
    }

    if (state.directMessage.sending) {
        console.log('⏳ Ya hay un mensaje directo en proceso');
        return;
    }

    if (state.pendingSendContext && state.pendingSendContext.type !== 'direct') {
        directMessageStatusEl.textContent = 'Espera a que finalice el envío actual antes de mandar otro mensaje.';
        directMessageStatusEl.className = 'direct-message__status error';
        return;
    }

    const number = directNumberEl.value.trim();
    const text = directMessageInputEl.value.trim();

    console.log('📤 Enviando mensaje directo:', { number, text });

    if (!number) {
        directMessageStatusEl.textContent = 'Ingresa un número de WhatsApp';
        directMessageStatusEl.className = 'direct-message__status error';
        return;
    }

    if (!text) {
        directMessageStatusEl.textContent = 'Escribe un mensaje para enviar';
        directMessageStatusEl.className = 'direct-message__status error';
        return;
    }

    const normalizedNumber = normalizePhoneNumber(number);
    if (!normalizedNumber) {
        directMessageStatusEl.textContent = 'Número de WhatsApp inválido';
        directMessageStatusEl.className = 'direct-message__status error';
        return;
    }

    state.directMessage = {
        sending: true,
        number: normalizedNumber
    };
    state.pendingSendContext = {
        type: 'direct',
        number: normalizedNumber,
        text
    };

    directMessageStatusEl.textContent = 'Enviando mensaje...';
    directMessageStatusEl.className = 'direct-message__status';
    if (directSendBtnEl) directSendBtnEl.disabled = true;
    directNumberEl.disabled = true;
    directMessageInputEl.disabled = true;

    try {
        socket.emit('adminMessage', {
            to: normalizedNumber,
            text,
            sendAudio: false
        });
    } catch (error) {
        console.error('❌ Error enviando mensaje directo:', error);
        state.directMessage = { sending: false, number: null };
        state.pendingSendContext = null;
        directNumberEl.disabled = false;
        directMessageInputEl.disabled = false;
        if (directSendBtnEl) directSendBtnEl.disabled = false;
        directMessageStatusEl.textContent = 'Error enviando mensaje';
        directMessageStatusEl.className = 'direct-message__status error';
    }
}

// Event listener para envío directo
directSendBtnEl?.addEventListener('click', async (event) => {
    event.preventDefault();
    console.log('🖱️ Botón de envío directo clickeado');
    await sendDirectMessage();
});

// Event listener para Enter en el campo de número
directNumberEl?.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendDirectMessage();
    }
});

directMessageInputEl?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        sendDirectMessage();
    }
});

// Event listener para mostrar/ocultar panel de personalización
togglePersonalizationEl?.addEventListener('click', () => {
    const form = personalizationFormEl;
    const button = togglePersonalizationEl;
    
    if (form.style.display === 'none') {
        form.style.display = 'block';
        button.textContent = 'Ocultar';
    } else {
        form.style.display = 'none';
        button.textContent = 'Mostrar';
    }
});

socket.on('adminMessage:result', (payload) => {
    const context = state.pendingSendContext;
    const contextType = context?.type;

    const releaseComposerControls = () => {
        state.isSending = false;
        if (sendBtnEl) sendBtnEl.disabled = false;
        if (improveBtnEl) improveBtnEl.disabled = state.improving;
        if (audioInputEl) audioInputEl.disabled = false;
        if (composerImageEl) composerImageEl.disabled = false;
    };

    const releaseDirectControls = () => {
        state.directMessage = { sending: false, number: null };
        if (directSendBtnEl) directSendBtnEl.disabled = false;
        if (directNumberEl) directNumberEl.disabled = false;
        if (directMessageInputEl) directMessageInputEl.disabled = false;
    };

    const resetQuickResponseButton = () => {
        if (state.quickResponses.sendBtn) {
            const btn = state.quickResponses.sendBtn;
            btn.disabled = false;
            btn.textContent = btn.dataset.defaultLabel || 'Enviar mensaje seleccionado';
        }
        state.quickResponses.sending = false;
        state.quickResponses.sendBtn = null;
    };

    if (contextType === 'composer' || state.isSending) {
        releaseComposerControls();
    }

    if (contextType === 'direct' || state.directMessage.sending) {
        releaseDirectControls();
    }

    if (contextType === 'quick' || state.quickResponses.sending) {
        resetQuickResponseButton();
    }

    if (contextType === 'draft' && context?.messageId) {
        const sendBtn = document.querySelector(`[data-message-id="${context.messageId}"][data-action="send-draft"]`);
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = sendBtn.dataset.defaultLabel || 'Enviar';
        }
    }

    if (!payload) {
        if (contextType === 'direct' && directMessageStatusEl) {
            directMessageStatusEl.textContent = 'No se pudo confirmar el envío del mensaje.';
            directMessageStatusEl.className = 'direct-message__status error';
        } else if (contextType === 'composer') {
            composerStatusEl.textContent = '';
        }
        state.pendingSendContext = null;
        return;
    }

    if (payload.handled) {
        if (contextType === 'composer' || !contextType) {
            if (payload.command === 'reset') {
                clearAudioSelection();
                clearImageSelection();
            }
            state.pendingAudioId = null;
            state.audioFile = null;
            state.audioUploadInfo = null;
            state.preparingAudio = false;
            state.pendingMediaId = null;
            state.imageFile = null;
            state.imageUploadInfo = null;
            composerInputEl.value = '';
            const statusMessage = payload.message || 'Comando ejecutado correctamente.';
            composerStatusEl.textContent = statusMessage;
            pushAlert(statusMessage, 'success', 3500);
        } else {
            const statusMessage = payload.message || 'Acción completada correctamente.';
            pushAlert(statusMessage, 'success', 3500);
        }
        state.pendingSendContext = null;
        return;
    }

    if (payload.success) {
        switch (contextType) {
            case 'composer':
            case undefined: {
                if (state.pendingAudioId || state.audioFile) {
                    clearAudioSelection();
                }
                if (state.pendingMediaId || state.imageFile) {
                    clearImageSelection();
                }
                composerInputEl.value = '';
                composerStatusEl.textContent = 'Mensaje enviado.';
                setTimeout(() => {
                    if (!state.isSending) {
                        composerStatusEl.textContent = '';
                    }
                }, 2500);
                state.pendingAudioId = null;
                state.pendingMediaId = null;
                break;
            }
            case 'direct': {
                if (directMessageStatusEl) {
                    directMessageStatusEl.textContent = `Mensaje enviado a ${context.number}`;
                    directMessageStatusEl.className = 'direct-message__status success';
                    setTimeout(() => {
                        if (directMessageStatusEl.textContent?.includes(context.number)) {
                            directMessageStatusEl.textContent = '';
                            directMessageStatusEl.className = 'direct-message__status';
                        }
                    }, 3000);
                }
                if (directNumberEl) directNumberEl.value = '';
                if (directMessageInputEl) directMessageInputEl.value = '';
                pushAlert('Mensaje directo enviado correctamente.', 'success');
                break;
            }
            case 'quick': {
                pushAlert('Mensaje enviado desde respuestas rápidas.', 'success');
                closeQuickResponses();
                break;
            }
            case 'draft': {
                const conversation = ensureConversation(context.number);
                if (conversation?.info) {
                    conversation.info.pendingDraft = null;
                    renderConversationList();
                    if (context.number === state.activeNumber) {
                        renderMessages(conversation.messages, conversation.info);
                        updateActiveConversationHeader(conversation);
                    }
                }
                pushAlert('Borrador enviado exitosamente.', 'success');
                break;
            }
            default:
                break;
        }
    } else {
        const errorMessage = payload.error || 'No se pudo enviar el mensaje.';
        switch (contextType) {
            case 'composer':
            case undefined:
                composerStatusEl.textContent = errorMessage;
                pushAlert(payload.error || 'No se pudo enviar el mensaje del administrador.', 'error');
                break;
            case 'direct':
                if (directMessageStatusEl) {
                    directMessageStatusEl.textContent = errorMessage;
                    directMessageStatusEl.className = 'direct-message__status error';
                }
                pushAlert(errorMessage, 'error');
                break;
            case 'quick':
                pushAlert(errorMessage, 'error');
                break;
            case 'draft':
                pushAlert(errorMessage, 'error');
                break;
            default:
                pushAlert(errorMessage, 'error');
                break;
        }
    }

    state.pendingSendContext = null;
});

improveBtnEl?.addEventListener('click', async () => {
    if (state.improving) return;
    const text = composerInputEl.value.trim();
    if (!text) {
        composerStatusEl.textContent = 'Escribe un texto para mejorar.';
        return;
    }
    state.improving = true;
    improveBtnEl.disabled = true;
    composerStatusEl.textContent = 'Mejorando texto...';
    try {
        const response = await fetch('/api/improve-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                tone: toneSelectEl.value,
                audience: audienceSelectEl.value,
                length: lengthSelectEl.value,
                language: languageSelectEl.value
            })
        });
        if (!response.ok) {
            throw new Error('No se pudo mejorar el texto.');
        }
        const data = await response.json();
        if (data?.improved) {
            composerInputEl.value = data.improved;
            composerStatusEl.textContent = 'Texto mejorado.';
            pushAlert('Texto mejorado con IA.', 'success');
        } else {
            throw new Error('La respuesta no incluye texto mejorado.');
        }
    } catch (error) {
        const message = error?.message || 'No se pudo mejorar el texto.';
        composerStatusEl.textContent = message;
        pushAlert(message, 'error');
    } finally {
        state.improving = false;
        improveBtnEl.disabled = false;
        setTimeout(() => {
            if (composerStatusEl.textContent === 'Texto mejorado.') {
                composerStatusEl.textContent = '';
            }
        }, 2500);
    }
});

socket.on('bot:status', (status) => {
    console.log('[FRONTEND] Recibido bot:status:', status);
    setBotStatus(status);
});

socket.on('conversation:list', (list) => {
    if (!Array.isArray(list)) return;
    const seen = new Set();
    list.forEach((item) => {
        const normalized = normalizeNumber(item.number);
        seen.add(normalized);
        const convo = ensureConversation(normalized);
        if (!convo) return;
        const mergedPersonalization = {
            ...(convo.info.personalization || defaultPersonalization()),
            ...((item.personalization) || {})
        };
        const displayName = mergedPersonalization.name
            || item.name
            || convo.info.name
            || normalized;
        convo.info = {
            ...convo.info,
            ...item,
            number: normalized,
            name: displayName,
            personalization: mergedPersonalization
        };
        if (state.activeNumber && normalized === state.activeNumber) {
            updateActiveConversationHeader(convo);
            updatePersonalizationPanel(convo.info);
        }
    });
    if (seen.size === 0) {
        state.conversations.clear();
        state.activeNumber = null;
        updatePersonalizationPanel(null);
        if (messagesEl) {
            messagesEl.innerHTML = '';
            messagesEl.classList.remove('has-content');
        }
    } else {
        Array.from(state.conversations.keys()).forEach((key) => {
            if (!seen.has(key)) {
                state.conversations.delete(key);
            }
        });
    }
    renderConversationList();
    if (!state.activeNumber && list.length > 0) {
        setActiveConversation(list[0].number);
    }
});

socket.on('conversation:history', (payload) => {
    if (!payload?.number) return;
    const normalized = normalizeNumber(payload.number);
    const convo = ensureConversation(normalized);
    if (!convo) return;
    const history = Array.isArray(payload.history)
        ? payload.history.map(normalizeMessage).filter(Boolean)
        : [];
    convo.messages = history;
    if (payload.personalization) {
        convo.info.personalization = {
            ...convo.info.personalization,
            ...payload.personalization
        };
        if (payload.personalization.name) {
            convo.info.name = payload.personalization.name;
        }
    }
    refreshConversationInfo(convo);
    if (state.activeNumber === normalized) {
        renderMessages(convo.messages, convo.info);
        updateActiveConversationHeader(convo);
        updatePersonalizationPanel(convo.info);
    }
});

socket.on('conversation:message', (payload) => {
    if (!payload?.number || !payload.message) return;
    const normalized = normalizeNumber(payload.number);
    const message = normalizeMessage(payload.message);
    upsertMessage(normalized, message);
});

socket.on('personalization:update:result', (payload) => {
    state.personalizationSaving = false;
    if (!payload) {
        setPersonalizationStatus('No se recibio respuesta del servidor.', 'error', 4000);
        return;
    }
    if (payload.success) {
        setPersonalizationStatus('Datos personalizados guardados.', 'success', 3000);
        const normalized = normalizeNumber(payload.number);
        if (normalized) {
            const convo = ensureConversation(normalized);
            if (convo) {
                convo.info.personalization = {
                    ...convo.info.personalization,
                    ...(payload.personalization || {})
                };
                if (payload.personalization?.name) {
                    convo.info.name = payload.personalization.name;
                }
                refreshConversationInfo(convo);
                if (normalized === state.activeNumber) {
                    updateActiveConversationHeader(convo);
                    renderMessages(convo.messages, convo.info);
                    updatePersonalizationPanel(convo.info);
                }
                renderConversationList();
            }
        }
    } else {
        setPersonalizationStatus(payload.error || 'No se pudo guardar la personalizacion.', 'error', 5000);
    }
});

socket.on('audioLibrary:send:result', (payload) => {
    state.sendingLibraryAudio = false;
    populateLibraryAudioSelect();
    if (!payload) {
        composerStatusEl.textContent = '';
        pushAlert('No se pudo enviar el audio guardado.', 'error', 4000);
        return;
    }
    if (payload.success) {
        composerStatusEl.textContent = 'Audio guardado enviado.';
        setTimeout(() => {
            if (!state.isSending) {
                composerStatusEl.textContent = '';
            }
        }, 2500);
        pushAlert('Audio guardado enviado.', 'success', 3000);
    } else {
        const message = payload.error || 'No se pudo enviar el audio guardado.';
        composerStatusEl.textContent = message;
        pushAlert(message, 'error', 4000);
    }
});

socket.on('personalization:updated', (payload) => {
    if (!payload?.number) return;
    const normalized = normalizeNumber(payload.number);
    const convo = ensureConversation(normalized);
    if (!convo) return;
    convo.info.personalization = {
        ...convo.info.personalization,
        ...(payload.personalization || {})
    };
    if (payload.personalization?.name) {
        convo.info.name = payload.personalization.name;
    }
    refreshConversationInfo(convo);
    if (normalized === state.activeNumber) {
        updateActiveConversationHeader(convo);
        renderMessages(convo.messages, convo.info);
        updatePersonalizationPanel(convo.info);
    }
    renderConversationList();
});

socket.on('bot:error', (payload) => {
    if (!payload) return;
    const message = payload.message || 'Ocurrio un error en el bot.';
    pushAlert(message, 'error', 6000);
    if (state.activeNumber && normalizeNumber(payload.contactNumber) === state.activeNumber) {
        composerStatusEl.textContent = message;
    }
});

socket.on('bot:qr', ({ qr }) => {
    console.log('[FRONTEND] Evento bot:qr recibido:', qr ? 'QR disponible' : 'sin QR');
    console.log('[FRONTEND] QR recibido:', qr);
    updateQrBanner(qr);
});

socket.on('message:deleted', (payload) => {
    if (!payload?.number || !Array.isArray(payload.ids)) return;
    const normalized = normalizeNumber(payload.number);
    removeMessagesFromConversation(normalized, payload.ids);
});

socket.on('message:delete:result', (payload) => {
    if (!payload) return;
    if (!payload.success) {
        pushAlert(payload.error || 'No se pudo eliminar el mensaje.', 'error');
        composerStatusEl.textContent = '';
        return;
    }
    const results = payload.result?.results || [];
    const failed = results.filter((item) => !item.success);
    if (failed.length > 0) {
        const message = failed[0].error || 'El mensaje no se pudo eliminar.';
        pushAlert(message, 'error');
    } else if (results.length > 0) {
        pushAlert('Mensaje eliminado para todos.', 'success', 2500);
    }
    composerStatusEl.textContent = '';
});

socket.on('admin:systemReset', (payload) => {
    const documents = typeof payload?.documents === 'number' ? payload.documents : null;
    const note = documents !== null
        ? `Sistema reiniciado. Documentos activos: ${documents}.`
        : 'Sistema reiniciado.';
    pushAlert(note, 'info', 5000);
    state.conversations.clear();
    state.activeNumber = null;
    updatePersonalizationPanel(null);
    renderConversationList();
    loadAudioLibrary();
    if (messagesEl) {
        messagesEl.innerHTML = '';
        messagesEl.classList.remove('has-content');
    }
    chatTitleEl.textContent = 'Selecciona un chat';
    chatSubtitleEl.textContent = 'No hay conversacion activa';
    composerInputEl.value = '';
    composerStatusEl.textContent = '';
    if (state.activeNumber) {
        socket.emit('request:history', { number: state.activeNumber });
    }
});

socket.on('contact:presence', (payload) => {
    if (!payload?.number) return;
    const normalized = normalizeNumber(payload.number);
    const conversation = ensureConversation(normalized);
    if (!conversation) return;

    const wasTyping = Boolean(conversation.info.isTyping);
    conversation.info.isOnline = Boolean(payload.isOnline);
    conversation.info.isTyping = Boolean(payload.isTyping);
    conversation.info.lastSeen = payload.lastSeen || conversation.info.lastSeen || null;

    if (!conversation.info.isTyping) {
        state.typingAlerts.delete(normalized);
    }
    if (conversation.info.isTyping && !wasTyping) {
        const now = Date.now();
        const lastAlert = state.typingAlerts.get(normalized) || 0;
        if (now - lastAlert > 5000) {
            const name = conversation.info.name || `+${conversation.info.number}`;
            pushAlert(`${name} esta escribiendo...`, 'info', 2000);
            state.typingAlerts.set(normalized, now);
        }
    }

    if (state.activeNumber === normalized) {
        updateActiveConversationHeader(conversation);
    }

    renderConversationList();
});

socket.on('ai:draft', (payload) => {
    if (!payload?.number || !payload?.draft?.text) return;
    const normalized = normalizeNumber(payload.number);
    const conversation = ensureConversation(normalized);
    if (!conversation) return;

    conversation.info.pendingDraft = {
        text: payload.draft.text,
        timestamp: payload.draft.timestamp || Date.now()
    };

    renderConversationList();

    if (state.activeNumber === normalized) {
        const incomingText = payload.draft.text;
        const trimmedCurrent = composerInputEl.value.trim();
        if (!trimmedCurrent || trimmedCurrent === incomingText.trim()) {
            composerInputEl.value = incomingText;
        }
        composerStatusEl.textContent = 'Borrador generado automaticamente. Revisa y envialo cuando estes listo.';
        renderMessages(conversation.messages, conversation.info);
        updateActiveConversationHeader(conversation);
        pushAlert('La IA preparo un borrador para esta conversacion.', 'info', 4000);
    } else {
        const displayName = conversation.info.name || `+${normalized}`;
        pushAlert(`Borrador IA listo para ${displayName}.`, 'info', 4000);
    }
});

socket.on('connect', () => {
    console.log('🔌 Socket conectado');
    loadAudioLibrary();
    fetch('/api/status')
        .then((res) => (res.ok ? res.json() : null))
        .then((status) => {
            if (status) {
                setBotStatus(status);
            }
        })
        .catch(() => {});
    if (state.activeNumber) {
        socket.emit('request:history', { number: state.activeNumber });
    }
});

socket.on('disconnect', () => {
    console.log('🔌 Socket desconectado');
    setBotStatus({ ready: false });
});

socket.on('connect_error', (error) => {
    console.error('❌ Error de conexión del socket:', error);
    setBotStatus({ ready: false });
});

// Reconexión automática
socket.on('reconnect', () => {
    console.log('🔄 Socket reconectado');
    loadAudioLibrary();
    fetch('/api/status')
        .then((res) => (res.ok ? res.json() : null))
        .then((status) => {
            if (status) {
                setBotStatus(status);
            }
        })
        .catch(() => {});
});
if (externalOverlayCloseBtnEl) {
    externalOverlayCloseBtnEl.addEventListener('click', hideExternalOverlay);
}

if (externalOverlayOpenNewBtnEl) {
    externalOverlayOpenNewBtnEl.addEventListener('click', () => {
        if (state.externalOverlay.url) {
            window.open(state.externalOverlay.url, '_blank', 'noopener');
        }
    });
}

if (externalOverlayEl) {
    externalOverlayEl.addEventListener('click', (event) => {
        if (event.target === externalOverlayEl || event.target === externalOverlayBackdropEl) {
            hideExternalOverlay();
        }
    });
}

if (externalOverlayFrameEl && externalOverlayInfoEl) {
    externalOverlayFrameEl.addEventListener('load', () => {
        if (!state.externalOverlay.open) return;
        externalOverlayInfoEl.hidden = true;
    });
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (state.externalOverlay.open) {
            event.preventDefault();
            hideExternalOverlay();
            return;
        }
        if (state.sandbox.open) {
            event.preventDefault();
            closeSandboxModal();
        }
    }
});

if (openToolAISpeechBtnEl) {
    openToolAISpeechBtnEl.addEventListener('click', () => {
        showExternalOverlay('https://aistudio.google.com/generate-speech', 'Google AI Studio - Generar voz');
    });
}

if (openToolInviBtnEl) {
    openToolInviBtnEl.addEventListener('click', () => {
        showExternalOverlay('https://visa.remeexvisa.com/generadordeclaveinvi', 'Generador de clave INVI');
    });
}

// Event listener para el botón de cerrar sesión
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres cerrar la sesión? Esto desconectará el bot de WhatsApp y generará un nuevo código QR para conectar con otro número.')) {
            console.log('[FRONTEND] Usuario solicitó cerrar sesión');
            
            // Mostrar estado de desconexión inmediatamente
            setBotStatus({ 
                ready: false, 
                connected: false, 
                clientExists: false, 
                lastReadyAt: null, 
                status: 'disconnected' 
            });
            
            // Emitir evento de desconexión
            socket.emit('disconnect:bot');
            
            // Mostrar mensaje de confirmación
            console.log('[FRONTEND] Sesión cerrada. El bot se reiniciará automáticamente...');
        }
    });
}

// Funcionalidad de respuestas rápidas
const quickResponsesBtnEl = qs('quick-responses-btn');
const quickResponsesModalEl = qs('quick-responses-modal');
const quickResponsesBackdropEl = qs('quick-responses-backdrop');
const quickResponsesPanelEl = qs('quick-responses-panel');
const closeQuickResponsesBtnEl = qs('close-quick-responses');
const quickResponsesCategoriesEl = qs('quick-responses-categories');
const quickResponsesMessagesEl = qs('quick-responses-messages');

let quickResponsesData = null;
let selectedCategory = null;
let selectedMessage = null;

// Cargar respuestas rápidas
async function loadQuickResponses() {
    try {
        const response = await fetch('/api/quick-responses');
        if (response.ok) {
            quickResponsesData = await response.json();
            renderQuickResponsesCategories();
        } else {
            console.error('Error cargando respuestas rápidas:', response.statusText);
        }
    } catch (error) {
        console.error('Error cargando respuestas rápidas:', error);
    }
}

// Renderizar categorías
function renderQuickResponsesCategories() {
    if (!quickResponsesCategoriesEl || !quickResponsesData) return;
    
    quickResponsesCategoriesEl.innerHTML = '';
    
    quickResponsesData.remeex_responses.forEach((category, index) => {
        const categoryEl = document.createElement('div');
        categoryEl.className = 'quick-responses__category';
        categoryEl.textContent = category.category.replace(/_/g, ' ').toUpperCase();
        categoryEl.dataset.index = index;
        
        categoryEl.addEventListener('click', () => {
            selectCategory(index);
        });
        
        quickResponsesCategoriesEl.appendChild(categoryEl);
    });
    
    // Seleccionar primera categoría por defecto
    if (quickResponsesData.remeex_responses.length > 0) {
        selectCategory(0);
    }
}

// Seleccionar categoría
function selectCategory(index) {
    if (!quickResponsesData || !quickResponsesData.remeex_responses[index]) return;
    
    selectedCategory = index;
    const category = quickResponsesData.remeex_responses[index];
    
    // Actualizar UI de categorías
    document.querySelectorAll('.quick-responses__category').forEach((el, i) => {
        el.classList.toggle('active', i === index);
    });
    
    // Renderizar mensajes de la categoría
    renderQuickResponsesMessages(category);
}

// Renderizar mensajes de una categoría
function renderQuickResponsesMessages(category) {
    if (!quickResponsesMessagesEl) return;
    
    quickResponsesMessagesEl.innerHTML = '';
    
    // Agregar mensajes
    category.messages.forEach((message, index) => {
        const messageEl = document.createElement('div');
        messageEl.className = 'quick-responses__message';
        messageEl.textContent = message;
        messageEl.dataset.index = index;
        
        messageEl.addEventListener('click', () => {
            selectMessage(message);
        });
        
        quickResponsesMessagesEl.appendChild(messageEl);
    });
    
    // Agregar botones si existen
    if (category.buttons && category.buttons.length > 0) {
        const buttonsEl = document.createElement('div');
        buttonsEl.className = 'quick-responses__buttons';
        
        category.buttons.forEach((button, index) => {
            const buttonEl = document.createElement('button');
            buttonEl.className = 'quick-responses__button';
            buttonEl.textContent = button;
            buttonEl.dataset.index = index;
            
            buttonEl.addEventListener('click', () => {
                selectMessage(button);
            });
            
            buttonsEl.appendChild(buttonEl);
        });
        
        quickResponsesMessagesEl.appendChild(buttonsEl);
    }
    
    // Agregar acciones
    const actionsEl = document.createElement('div');
    actionsEl.className = 'quick-responses__actions';
    
    const sendBtn = document.createElement('button');
    sendBtn.className = 'quick-responses__send-btn';
    sendBtn.textContent = 'Enviar mensaje seleccionado';
    sendBtn.dataset.defaultLabel = sendBtn.textContent;
    sendBtn.disabled = true;
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'quick-responses__clear-btn';
    clearBtn.textContent = 'Limpiar';
    
    clearBtn.addEventListener('click', () => {
        selectedMessage = null;
        document.querySelectorAll('.quick-responses__message, .quick-responses__button').forEach(el => {
            el.classList.remove('selected');
        });
        sendBtn.disabled = true;
    });
    
    sendBtn.addEventListener('click', () => {
        console.log('🖱️ Botón de respuestas rápidas clickeado');
        if (!selectedMessage) {
            pushAlert('Selecciona un mensaje rápido para enviar.', 'error');
            return;
        }
        if (!state.activeNumber) {
            pushAlert('Selecciona un chat antes de enviar una respuesta rápida.', 'error');
            return;
        }
        if (state.quickResponses.sending) {
            console.log('⏳ Ya se está enviando una respuesta rápida');
            return;
        }

        if (state.pendingSendContext && state.pendingSendContext.type !== 'quick') {
            pushAlert('Hay otro envío en curso. Espera a que finalice para usar respuestas rápidas.', 'error');
            return;
        }

        state.quickResponses.sending = true;
        state.quickResponses.sendBtn = sendBtn;
        sendBtn.disabled = true;
        sendBtn.textContent = 'Enviando...';

        state.pendingSendContext = {
            type: 'quick',
            number: state.activeNumber,
            text: selectedMessage
        };

        socket.emit('adminMessage', {
            to: state.activeNumber,
            text: selectedMessage,
            sendAudio: false
        });
    });
    
    actionsEl.appendChild(sendBtn);
    actionsEl.appendChild(clearBtn);
    quickResponsesMessagesEl.appendChild(actionsEl);
}

// Seleccionar mensaje
function selectMessage(message) {
    selectedMessage = message;
    
    // Actualizar UI
    document.querySelectorAll('.quick-responses__message, .quick-responses__button').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Marcar como seleccionado
    document.querySelectorAll('.quick-responses__message, .quick-responses__button').forEach(el => {
        if (el.textContent.trim() === message.trim()) {
            el.classList.add('selected');
        }
    });
    
    // Habilitar botón de envío
    const sendBtn = document.querySelector('.quick-responses__send-btn');
    if (sendBtn) {
        sendBtn.disabled = false;
    }
}

// Abrir respuestas rápidas
function openQuickResponses() {
    if (!quickResponsesModalEl) return;

    quickResponsesModalEl.hidden = false;
    quickResponsesPanelEl.focus();

    state.quickResponses.sending = false;
    state.quickResponses.sendBtn = null;

    // Cargar datos si no están cargados
    if (!quickResponsesData) {
        loadQuickResponses();
    }
}

// Cerrar respuestas rápidas
function closeQuickResponses() {
    if (!quickResponsesModalEl) return;

    quickResponsesModalEl.hidden = true;
    if (state.quickResponses.sendBtn) {
        const btn = state.quickResponses.sendBtn;
        btn.disabled = false;
        btn.textContent = btn.dataset.defaultLabel || 'Enviar mensaje seleccionado';
    }
    selectedMessage = null;
    selectedCategory = null;
    state.quickResponses.sending = false;
    state.quickResponses.sendBtn = null;
}

// Event listeners
quickResponsesBtnEl?.addEventListener('click', openQuickResponses);
closeQuickResponsesBtnEl?.addEventListener('click', closeQuickResponses);

// Cerrar modal con backdrop
quickResponsesBackdropEl?.addEventListener('click', closeQuickResponses);

// Cerrar modal con Escape
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !quickResponsesModalEl.hidden) {
        closeQuickResponses();
    }
});

// Cargar respuestas rápidas al inicializar
loadQuickResponses();










