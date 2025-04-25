
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface Chat {
  id: string;
  jobId: string;
  jobTitle: string;
  participants: string[];
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: any;
  };
}

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  selectedChatId?: string;
}

export default function ChatList({ onSelectChat, selectedChatId }: ChatListProps) {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessage.createdAt", "desc")
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const newChats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Chat[];
      setChats(newChats);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="space-y-4">
      {chats.map((chat) => (
        <Card 
          key={chat.id}
          className={`cursor-pointer transition-colors hover:bg-accent ${
            selectedChatId === chat.id ? "border-primary" : ""
          }`}
          onClick={() => onSelectChat(chat.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{chat.jobTitle}</h3>
                {chat.lastMessage && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                    {chat.lastMessage.text}
                  </p>
                )}
              </div>
              <MessageCircle className="text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
      
      {chats.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No chats yet</p>
        </div>
      )}
    </div>
  );
}
