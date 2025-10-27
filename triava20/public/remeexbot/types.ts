
export enum Sender {
  User = 'user',
  Bot = 'bot',
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  suggestions?: string[];
}

export interface ChatbotResponse {
    responseText: string;
    suggestions: string[];
    action: 'CREATE_TICKET' | 'SHOW_TICKET_STATUS' | 'NONE';
    ticketId?: string;
}
