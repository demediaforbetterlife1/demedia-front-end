import { createContext, useContext, useState, ReactNode } from "react";

interface ChatContextType {
  selectedChatId: string | null;
  setSelectedChatId: (id: string) => void;
}
// comment
const ChatContext = createContext<ChatContextType>({
  selectedChatId: null,
  setSelectedChatId: () => {},
});

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  return (
    <ChatContext.Provider value={{ selectedChatId, setSelectedChatId }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
