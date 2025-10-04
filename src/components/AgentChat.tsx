import { MessageCircle, X, Upload } from 'lucide-react';
import { AgentMessage } from '@/types/game';

interface AgentChatProps {
  showAgent: boolean;
  setShowAgent: (show: boolean) => void;
  agentMessages: AgentMessage[];
  mode: string | null;
  screen: string;
  setShowDataEntry?: (show: boolean) => void;
}

const AgentChat = ({ showAgent, setShowAgent, agentMessages, mode, screen, setShowDataEntry }: AgentChatProps) => {
  return (
    <div className="fixed bottom-2 right-2 z-50">
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

          {mode === 'monitoring' && screen === 'game' && setShowDataEntry && (
            <div className="p-2 border-t border-border">
              <button
                onClick={() => setShowDataEntry(true)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-all"
              >
                <Upload size={12} />
                Add Data
              </button>
            </div>
          )}
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
