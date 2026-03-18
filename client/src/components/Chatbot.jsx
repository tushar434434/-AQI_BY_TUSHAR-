import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
      const res = await axios.post(`${API_URL}/api/chat`, { message: userMessage.text });
      const botMessage = { text: res.data.reply, sender: 'bot' };
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
        className="glass-panel"
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          width: '60px', height: '60px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0, 230, 118, 0.3)',
          background: 'linear-gradient(135deg, var(--accent-color), #00b0ff)',
          color: '#000', zIndex: 1000,
          transition: 'transform 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <MessageSquare size={28} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="glass-panel"
            style={{
              position: 'fixed', bottom: '100px', right: '30px',
              width: '350px', height: '500px', zIndex: 1000,
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
          >
            <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare className="gradient-text" size={20} />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>AeroBot</h3>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ 
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.sender === 'user' ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${msg.sender === 'user' ? 'rgba(0, 230, 118, 0.3)' : 'var(--glass-border)'}`,
                  padding: '10px 15px', borderRadius: '12px', maxWidth: '85%',
                  borderBottomRightRadius: msg.sender === 'user' ? '0' : '12px',
                  borderBottomLeftRadius: msg.sender === 'bot' ? '0' : '12px',
                  color: msg.sender === 'user' ? '#fff' : 'var(--text-secondary)'
                }}>
                  {msg.text}
                </div>
              ))}
              {isLoading && (
                <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Typing...
                </div>
              )}
            </div>

            <form onSubmit={sendMessage} style={{ padding: '15px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                value={input} onChange={e => setInput(e.target.value)}
                placeholder="Ask about AQI..."
                style={{ 
                  flex: 1, padding: '10px 15px', borderRadius: '20px', 
                  border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', 
                  color: '#fff', outline: 'none' 
                }}
              />
              <button 
                type="submit"
                style={{ 
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-color), #00b0ff)',
                  color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Send size={18} style={{ marginLeft: '-2px' }} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
