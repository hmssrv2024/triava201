import React from 'react';
import { MessageCircle, Users, Star, Mail } from 'lucide-react';

const actions = [
  {
    icon: MessageCircle,
    label: 'Hablar con Ejecutivo',
    href: 'https://wa.me/17373018059',
  },
  {
    icon: Users,
    label: 'Foro Comunidad',
    href: 'https://visa.remeexvisa.com/fororemeex',
  },
  {
    icon: Star,
    label: 'Ver Opiniones',
    href: 'https://visa.remeexvisa.com/opiniones',
  },
  {
    icon: Mail,
    label: 'Enviar Email',
    href: 'mailto:info@remeexvisa.com',
  },
];

const QuickActions: React.FC = () => {
  return (
    <div className="quick-actions-container">
      {actions.map(({ icon: Icon, label, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="quick-action-btn"
        >
          <Icon size={16} />
          <span>{label}</span>
        </a>
      ))}
    </div>
  );
};

export default QuickActions;
