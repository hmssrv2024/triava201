import React, { useState } from 'react';
import { Paperclip } from 'lucide-react';

interface TicketFlowProps {
  onTicketCreated: (confirmationMessage: string) => void;
  onCancel: () => void;
}

const TicketFlow: React.FC<TicketFlowProps> = ({ onTicketCreated, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    clientId: '',
    incidentDate: '',
    category: '',
    priority: '',
    description: '',
    file: null as File | null,
    resolution: '',
    comments: ''
  });

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelect = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    handleNext();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, file: e.target.files[0] }));
    }
  };

  const handleSubmit = () => {
    const ticketId = `REMEEX-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString().slice(-4)}`;
    const confirmationMessage = `
**🎫 TICKET GENERADO EXITOSAMENTE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Número de Ticket:** ${ticketId}
**Estado Actual:** EN REVISIÓN
**Asignado a:** Equipo de Resolución de Conflictos

Hemos enviado una confirmación a **${formData.email}** y activado el seguimiento por WhatsApp. Puedes consultar el estado escribiendo "ESTADO TICKET ${ticketId}".
`;
    onTicketCreated(confirmationMessage);
  };


  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="ticket-header">
              <h3>PASO 1: INFORMACIÓN PERSONAL</h3>
            </div>
            <div className="ticket-form">
              <input name="name" value={formData.name} onChange={handleChange} placeholder="👤 Nombre completo" />
              <input name="email" value={formData.email} onChange={handleChange} placeholder="📧 Email de contacto" type="email" />
              <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="📱 WhatsApp" type="tel" />
              <input name="clientId" value={formData.clientId} onChange={handleChange} placeholder="🆔 Número de cliente (opcional)" />
              <input name="incidentDate" value={formData.incidentDate} onChange={handleChange} placeholder="📅 Fecha del incidente" type="date" />
            </div>
            <div className="ticket-controls">
                <button onClick={onCancel} className="ticket-btn-secondary">Cancelar</button>
                <button onClick={handleNext} className="ticket-btn-primary">✅ Sí, continuar</button>
            </div>
          </>
        );
      case 2:
        return (
            <>
              <div className="ticket-header">
                <h3>PASO 2: TIPO DE RECLAMO</h3>
              </div>
              <div className="ticket-options">
                {['Demoras en servicios', 'Problemas de facturación', 'Atención deficiente', 'Errores en documentación', 'Otro'].map(cat => (
                  <button key={cat} onClick={() => handleSelect('category', cat)}>{cat}</button>
                ))}
              </div>
              <div className="ticket-controls">
                <button onClick={handleBack} className="ticket-btn-secondary">Atrás</button>
              </div>
            </>
        );
      case 3:
        return (
             <>
              <div className="ticket-header">
                <h3>PASO 3: NIVEL DE PRIORIDAD</h3>
              </div>
              <div className="ticket-options">
                  <button onClick={() => handleSelect('priority', 'Crítica')}>🔴 Crítica</button>
                  <button onClick={() => handleSelect('priority', 'Alta')}>🟠 Alta</button>
                  <button onClick={() => handleSelect('priority', 'Media')}>🟡 Media</button>
              </div>
              <div className="ticket-controls">
                <button onClick={handleBack} className="ticket-btn-secondary">Atrás</button>
              </div>
            </>
        );
      case 4:
        return (
            <>
              <div className="ticket-header">
                <h3>PASO 4: DESCRIPCIÓN DETALLADA</h3>
              </div>
              <div className="ticket-form">
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  placeholder="Describe detalladamente tu reclamo aquí..." 
                  rows={5}
                />
                <label htmlFor="file-upload" className="ticket-file-upload">
                  <Paperclip size={16} />
                  <span>{formData.file ? formData.file.name : 'Adjuntar Archivos'}</span>
                </label>
                <input id="file-upload" type="file" onChange={handleFileChange} style={{display: 'none'}} />
              </div>
              <div className="ticket-controls">
                <button onClick={handleBack} className="ticket-btn-secondary">Atrás</button>
                <button onClick={handleNext} className="ticket-btn-primary">Continuar</button>
              </div>
            </>
        );
        case 5:
         return (
             <>
              <div className="ticket-header">
                <h3>PASO 5: SOLUCIÓN ESPERADA</h3>
              </div>
              <div className="ticket-options">
                {['Reembolso', 'Repetir servicio', 'Acelerar proceso', 'Disculpa oficial', 'Compensación'].map(res => (
                  <button key={res} onClick={() => handleSelect('resolution', res)}>{res}</button>
                ))}
              </div>
               <div className="ticket-controls">
                <button onClick={handleBack} className="ticket-btn-secondary">Atrás</button>
              </div>
            </>
        );
      case 6:
        return (
            <>
              <div className="ticket-header">
                <h3>PASO 6: CONFIRMACIÓN Y ENVÍO</h3>
              </div>
              <div className="ticket-summary">
                <p><strong>Nombre:</strong> {formData.name}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Tipo:</strong> {formData.category}</p>
                <p><strong>Prioridad:</strong> {formData.priority}</p>
                <p><strong>Descripción:</strong> {formData.description.substring(0, 100)}...</p>
                <p><strong>Resolución:</strong> {formData.resolution}</p>
              </div>
              <div className="ticket-controls">
                <button onClick={handleBack} className="ticket-btn-secondary">✏️ Editar</button>
                <button onClick={handleSubmit} className="ticket-btn-confirm">🚀 ENVIAR RECLAMO</button>
              </div>
            </>
        );
      default:
        return null;
    }
  };

  return <div className="ticket-flow-container">{renderStep()}</div>;
};

export default TicketFlow;
