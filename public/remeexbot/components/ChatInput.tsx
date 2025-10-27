import React, { useState, useRef } from 'react';
import { SendHorizontal, Paperclip, X } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string, file?: File) => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = text.trim();
    if ((trimmedText || file) && !disabled) {
      onSend(trimmedText, file || undefined);
      setText('');
      setFile(null);
       if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      inputRef.current?.focus();
    }
  };

  const canSend = (text.trim().length > 0 || file) && !disabled;

  return (
    <>
      {file && (
        <div className="file-preview">
          <Paperclip size={14} className="file-preview-icon" />
          <span className="file-preview-name">{file.name}</span>
          <button onClick={handleRemoveFile} className="file-preview-remove" aria-label="Quitar archivo">
            <X size={14} />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="input-area">
        <button
          type="button"
          onClick={handleAttachClick}
          className="attach-button"
          aria-label="Adjuntar archivo"
          disabled={disabled}
        >
          <Paperclip size={20} />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
          disabled={disabled}
          className="message-input"
          aria-label="Escribe un mensaje"
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          type="submit"
          disabled={!canSend}
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