
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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

  const goToJobs = () => {
    navigate("/jobs");
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={goToJobs} 
        className="w-full mb-4"
        variant="outline"
      >
        <Users className="mr-2" />
        Browse Jobs to Chat
      </Button>
      
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
        <div className="text-center py-8 space-y-4">
          <p className="text-muted-foreground">No chats yet</p>
          <p className="text-sm text-muted-foreground">
            Visit the jobs page to find job listings and start a conversation
          </p>
        </div>
      )}
    </div>
  );
}
