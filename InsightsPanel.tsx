
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { SendHorizonal, Bot, User, LoaderCircle } from 'lucide-react';

interface InsightsPanelProps {
  insights: string;
  chatHistory: ChatMessage[];
  onChatSubmit: (message: string) => void;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, chatHistory, onChatSubmit }) => {
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    
    setIsSending(true);
    await onChatSubmit(userInput);
    setUserInput('');
    setIsSending(false);
  };
  
  // The first message from the model is the initial insight, we check if there are more messages to determine if it's a chat
  const isChatStarted = chatHistory.length > 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Initial AI Analysis</h3>
        <div className="prose prose-sm text-gray-600 max-w-none">
          {insights.split('\n').map((line, index) => {
              if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={index} className="font-bold text-gray-800">{line.replace(/\*\*/g, '')}</p>;
              }
              if (line.startsWith('* ')) {
                return <li key={index}>{line.substring(2)}</li>
              }
              return <p key={index}>{line}</p>;
          })}
        </div>
      </div>

      <div className="md:col-span-2 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col" style={{ height: '60vh' }}>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Ask a question about your data</h3>
          <p className="text-sm text-gray-500">e.g., "Which category has the highest average sales?"</p>
        </div>
        <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-4">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600"><Bot size={20}/></span>}
              <div className={`px-4 py-2 rounded-lg max-w-md ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                <p className="text-sm">{msg.parts[0].text}</p>
              </div>
              {msg.role === 'user' && <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 text-gray-600"><User size={20}/></span>}
            </div>
          ))}
          {isSending && (
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600"><Bot size={20}/></span>
              <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800">
                <LoaderCircle className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="p-4 border-t flex items-center">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your question here..."
            className="flex-grow border-white-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
            disabled={isSending}
          />
          <button type="submit" className="ml-2 bg-primary-600 text-black p-2 rounded-full hover:bg-primary-700 disabled:bg-gray-400" disabled={isSending || !userInput.trim()}>
            <SendHorizonal className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default InsightsPanel;
