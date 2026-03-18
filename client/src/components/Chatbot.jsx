import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send } from 'lucide-react';
import { askChatbot } from '../services/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm AeroBot. Ask me anything about Air Quality.", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await askChatbot(userMessage.text);
      const botMessage = { text: res.reply, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting right now.", sender: 'bot' }]);
    }
    setIsLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open Chatbot"
      >
        <MessageSquare size={26} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-28 right-8 w-[350px] h-[500px] z-50 flex flex-col overflow-hidden rounded-2xl border bg-background shadow-xl"
          >
            <div className="bg-muted px-4 py-3 flex justify-between items-center border-b">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-primary" size={20} />
                <h3 className="m-0 text-base font-semibold">AeroBot</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-background/50">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${
                    msg.sender === 'user' 
                      ? 'self-end bg-primary text-primary-foreground rounded-br-sm' 
                      : 'self-start bg-muted text-foreground border rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {isLoading && (
                <div className="self-start text-muted-foreground text-sm flex gap-1 items-center bg-muted px-3 py-2 rounded-2xl rounded-bl-sm">
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              )}
            </div>

            <form onSubmit={sendMessage} className="p-3 border-t bg-background flex gap-2">
              <input 
                type="text" 
                value={input} 
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about AQI..."
                className="flex h-10 w-full rounded-full border border-input bg-muted/50 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={!input.trim()}
                className="w-10 h-10 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Send size={16} className="-ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
