import { Send, Sprout, Droplet, MessageCircle, FileText, EyeOff } from 'lucide-react';
import { AgentMessage } from '@/types/game';
import { useState } from 'react';
import TerranautAvatar from './TerranautAvatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
interface FullWidthChatProps {
  agentMessages: AgentMessage[];
  mode: string | null;
  location?: {
    lat: number;
    lon: number;
  };
  onAddMessage?: (message: AgentMessage) => void;
  onWaterCrop?: () => void;
  onApplyFertilizer?: () => void;
  onCheckMarket?: () => void;
  onViewLogs?: () => void;
}
const FullWidthChat = ({
  agentMessages,
  mode,
  location,
  onAddMessage,
  onWaterCrop,
  onApplyFertilizer,
  onCheckMarket,
  onViewLogs
}: FullWidthChatProps) => {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const playSound = (frequency: number) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };
  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;
    const userMessage = userInput;
    setUserInput('');
    if (onAddMessage) {
      onAddMessage({
        text: `You: ${userMessage}`,
        type: 'info',
        timestamp: Date.now()
      });
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          message: userMessage,
          includeData: mode === 'monitoring',
          location: location
        })
      });
      if (!response.ok || !response.body) {
        throw new Error('Failed to get AI response');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';
      while (true) {
        const {
          done,
          value
        } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                aiResponse += content;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
      if (aiResponse && onAddMessage) {
        onAddMessage({
          text: aiResponse,
          type: 'success',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      if (onAddMessage) {
        onAddMessage({
          text: 'Sorry, I encountered an error. Please try again.',
          type: 'error',
          timestamp: Date.now()
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  return <>
    {/* Chat Dialog Popup */}
    <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] fixed bottom-0 top-auto translate-y-0 data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary">
              <TerranautAvatar />
            </div>
            <div>
              <h2 className="text-xl font-bold">Terra AI Assistant</h2>
              <p className="text-sm text-muted-foreground">Your farming companion</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-muted/30 rounded-lg max-h-[50vh]">
          <div className="space-y-3">
            {agentMessages.slice(-10).map((msg, idx) => {
              const isUserMessage = msg.text.startsWith('You:');
              return (
                <div 
                  key={idx} 
                  className={`flex ${isUserMessage ? 'justify-start' : 'justify-end'}`}
                >
                  <div 
                    className={`p-3 rounded-lg text-sm max-w-[80%] ${
                      isUserMessage
                        ? 'bg-blue-100 text-blue-900 border border-blue-200 rounded-tl-none'
                        : msg.type === 'error' 
                        ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-tr-none' 
                        : msg.type === 'warning' 
                        ? 'bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-tr-none' 
                        : msg.type === 'success' 
                        ? 'bg-green-50 text-green-800 border border-green-200 rounded-tr-none' 
                        : 'bg-primary/10 text-primary border border-primary/20 rounded-tr-none'
                    }`}
                  >
                    {isUserMessage ? msg.text.replace('You: ', '') : msg.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Input Area */}
        <div className="flex gap-2 pt-4 border-t">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Terra AI anything..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Fixed Bottom Action Bar */}
    <div className="fixed bottom-0 left-0 right-0 w-full bg-card border-t border-border shadow-2xl z-50">
      <div className="p-2 bg-background">
        <div className="grid grid-cols-4 gap-2">
          <button 
            onClick={() => {
              playSound(523);
              onWaterCrop?.();
            }} 
            className="flex flex-col items-center gap-1 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all active:scale-95 active:animate-scale-in"
          >
            <Droplet size={20} />
            <span className="text-xs font-medium">Water</span>
          </button>
          <button 
            onClick={() => {
              playSound(659);
              onApplyFertilizer?.();
            }} 
            className="flex flex-col items-center gap-1 p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all active:scale-95 active:animate-scale-in"
          >
            <Sprout size={20} />
            <span className="text-xs font-medium">Fertilize</span>
          </button>
          <button 
            onClick={() => {
              playSound(784);
              setIsChatOpen(true);
            }} 
            className="flex flex-col items-center gap-1 p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all active:scale-95 active:animate-scale-in"
          >
            <MessageCircle size={20} />
            <span className="text-xs font-medium">Talk with Terra</span>
          </button>
          <button 
            onClick={() => {
              playSound(440);
            }} 
            className="flex flex-col items-center gap-1 p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all active:scale-95 active:animate-scale-in"
          >
            <EyeOff size={20} />
            <span className="text-xs font-medium">Monitor, do nothing</span>
          </button>
        </div>
      </div>
    </div>
  </>;
};
export default FullWidthChat;