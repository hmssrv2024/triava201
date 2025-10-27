import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Paperclip, X, Mic } from 'lucide-react';

// Declare SpeechRecognition types for window object to avoid TypeScript errors
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatInputProps {
  onSend: (text: string, file?: File) => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechApiAvailable, setIsSpeechApiAvailable] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechApiAvailable(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'es-ES';
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        setText(transcript);
      };

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => {
        setIsRecording(false);
        inputRef.current?.focus();
      };
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current || disabled) return;

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setText('');
      handleRemoveFile(); // Clear file and preview
      recognitionRef.current.start();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = text.trim();
    if ((trimmedText || file) && !disabled && !isRecording) {
      onSend(trimmedText, file || undefined);
      setText('');
      handleRemoveFile();
      inputRef.current?.focus();
    }
  };

  const canSend = (text.trim().length > 0 || file) && !disabled;

  return (
    <>
      {file && (
        <div className="file-preview">
          {previewUrl && <img src={previewUrl} alt="Preview" className="file-preview-image" />}
          <div className="file-preview-info">
             <span className="file-preview-name">{file.name}</span>
          </div>
          <button onClick={handleRemoveFile} className="file-preview-remove" aria-label="Quitar archivo">
            <X size={16} />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="input-area">
        <button
          type="button"
          onClick={handleAttachClick}
          className="attach-button"
          aria-label="Adjuntar archivo"
          disabled={disabled || isRecording}
        >
          <Paperclip size={20} />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isRecording ? 'Escuchando...' : 'Escribe un mensaje...'}
          disabled={disabled || isRecording}
          className="message-input"
          aria-label="Escribe un mensaje"
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={isRecording}
        />
        {isSpeechApiAvailable && (
          <button
            type="button"
            onClick={handleMicClick}
            className={`mic-button ${isRecording ? 'is-recording' : ''}`}
            aria-label={isRecording ? 'Detener grabación' : 'Grabar mensaje de voz'}
            disabled={disabled}
          >
            <Mic size={20} />
          </button>
        )}
        <button
          type="submit"
          disabled={!canSend || isRecording}
          className="send-button"
          aria-label="Enviar mensaje"
        >
          <SendHorizontal size={16} />
        </button>
      </form>
    </>
  );
};

export default ChatInput;