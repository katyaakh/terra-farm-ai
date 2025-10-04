import { MessageCircle, X, Upload, Send } from 'lucide-react';
import { AgentMessage } from '@/types/game';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AgentChatProps {
  showAgent: boolean;
  setShowAgent: (show: boolean) => void;
  agentMessages: AgentMessage[];
  mode: string | null;
  screen: string;
  setShowDataEntry?: (show: boolean) => void;
  location?: { lat: number; lon: number };
  onAddMessage?: (message: AgentMessage) => void;
}

const AgentChat = ({ showAgent, setShowAgent, agentMessages, mode, screen, setShowDataEntry, location, onAddMessage }: AgentChatProps) => {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage = userInput;
    setUserInput('');
    
    // Add user message
    if (onAddMessage) {
      onAddMessage({ text: `You: ${userMessage}`, type: 'info', timestamp: Date.now() });
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: userMessage,
            includeData: mode === 'monitoring',
            location: location,
          }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error('Failed to get AI response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      while (true) {
        const { done, value } = await reader.read();
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
        onAddMessage({ text: aiResponse, type: 'success', timestamp: Date.now() });
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

  return (
    <div className="inline-block">
      {showAgent && agentMessages.length > 0 ? (
        <div className="bg-white rounded-lg shadow-2xl w-80 max-h-[40vh] flex flex-col">
          <div className="bg-gradient-to-r from-primary to-accent text-white p-2 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-sm">🌍</div>
              <div>
                <p className="font-bold text-xs">Terra AI</p>
                <p className="text-xs text-green-100">Farming Advisor</p>
              </div>
            </div>
            <button onClick={() => setShowAgent(false)} className="hover:bg-white hover:bg-opacity-20 rounded p-1 transition-all">
              <X size={14} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {agentMessages.slice(-4).map((msg, idx) => (
              <div key={idx} className="flex gap-2 items-start transition-all duration-300">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-xs flex-shrink-0">🌍</div>
                <div className={`flex-1 p-2 rounded-lg text-xs ${
                  msg.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                  msg.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                  msg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                  'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask Terra AI..."
                disabled={isLoading}
                className="flex-1 px-2 py-1.5 text-xs border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !userInput.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground p-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send size={14} />
              </button>
            </div>
            {mode === 'monitoring' && screen === 'game' && setShowDataEntry && (
              <button
                onClick={() => setShowDataEntry(true)}
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-all mt-2"
              >
                <Upload size={12} />
                Add Data
              </button>
            )}
          </div>
        </div>
      ) : !showAgent ? (
        <button
          onClick={() => setShowAgent(true)}
          className="bg-gradient-to-r from-primary to-accent text-primary-foreground p-3 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <MessageCircle size={20} />
        </button>
      ) : null}
    </div>
  );
};

export default AgentChat;
