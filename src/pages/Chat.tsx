
import { useState } from "react";
import AppLayout from "@/components/Layout/AppLayout";
import ChatList from "@/components/Chat/ChatList";
import ChatMessages from "@/components/Chat/ChatMessages";

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();

  return (
    <AppLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <ChatList 
              onSelectChat={setSelectedChatId}
              selectedChatId={selectedChatId}
            />
          </div>
          
          <div className="md:col-span-2">
            {selectedChatId ? (
              <ChatMessages chatId={selectedChatId} />
            ) : (
              <div className="h-[500px] flex items-center justify-center border rounded-lg bg-background">
                <p className="text-muted-foreground">
                  Select a chat to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
