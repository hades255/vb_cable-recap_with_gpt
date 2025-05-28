export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  message: string;
  timestamp: string;
}

export interface chatPrompt {
  message: Message;
  timestamp: string;
}

export interface Chat {
  token: string;
  lastMessage: string;
  timestamp: string;
}
