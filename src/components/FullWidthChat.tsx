import { Send, Sprout, Droplet, TrendingUp, FileText } from 'lucide-react';
import { AgentMessage } from '@/types/game';
import { useState } from 'react';
import TerranautAvatar from './TerranautAvatar';
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
  const [showActions, setShowActions] = useState(false);
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
  return <div className="fixed bottom-0 left-0 right-0 w-full h-[40vh] md:h-[30vh] bg-card border-t border-border shadow-2xl z-50">
      <div className="h-full flex flex-col">
        {/* Chat Header with Avatar */}
        <div className="bg-gradient-to-r from-primary to-accent p-2 flex items-center gap-3">
          
          <div className="flex-1">
            <p className="font-bold text-sm text-primary-foreground">Terra AI</p>
            <p className="text-xs text-primary-foreground/80">Your Farming Assistant</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 bg-muted/30">
          <div className="flex flex-wrap gap-2 pb-2">
            {agentMessages.slice(-5).map((msg, idx) => <div key={idx} className={`flex-shrink-0 max-w-xs p-2 rounded-lg text-xs ${msg.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' : msg.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' : msg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
                {msg.text}
              </div>)}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-2 bg-background border-t border-border">
          <div className="flex gap-2">
            <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="Ask Terra AI anything..." disabled={isLoading} className="flex-1 px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
            <button onClick={handleSendMessage} disabled={isLoading || !userInput.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Farm Actions Button */}
        <div className="p-2 bg-background border-t border-border">
          <button onClick={() => setShowActions(!showActions)} className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground py-2 px-4 rounded-lg font-semibold text-sm transition-all">
            {showActions ? 'Hide' : 'Show'} Farm Actions
          </button>
          
          {/* Action Buttons - No overlay */}
          {showActions && <div className="grid grid-cols-4 gap-2 mt-2">
              <button onClick={onWaterCrop} className="flex flex-col items-center gap-1 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all">
                <Droplet size={20} />
                <span className="text-xs font-medium">Water</span>
              </button>
              <button onClick={onApplyFertilizer} className="flex flex-col items-center gap-1 p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all">
                <Sprout size={20} />
                <span className="text-xs font-medium">Fertilize</span>
              </button>
              <button onClick={onCheckMarket} className="flex flex-col items-center gap-1 p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-all">
                <TrendingUp size={20} />
                <span className="text-xs font-medium">Market</span>
              </button>
              <button onClick={onViewLogs} className="flex flex-col items-center gap-1 p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all">
                <FileText size={20} />
                <span className="text-xs font-medium">Logs</span>
              </button>
            </div>}
        </div>
      </div>
    </div>;
};
export default FullWidthChat;