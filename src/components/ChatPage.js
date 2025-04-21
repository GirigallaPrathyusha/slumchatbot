import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from './LoadingSpinner';

export default function ChatPage() {
  // State declarations
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);

  // Get user session on component mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Department classification function
  const classifyDepartment = async (prompt) => {
    const apiKey = process.env.REACT_APP_GOOGLE_AI_API_KEY;
    const apiUrl = process.env.REACT_APP_GOOGLE_AI_API_URL;

    const classificationPrompt = `Classify this user message into one of these departments: 
    water, electricity, sanitation, housing, or general. 
    Only respond with the department name. Message: "${prompt}"`;

    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: classificationPrompt }]
        }]
      })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.toLowerCase().trim();
  };

  // Handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Add user message to chat
    setMessages(prev => [...prev, { text: input, sender: 'user' }]);
    setInput('');
    setLoading(true);

    try {
      const apiKey = process.env.REACT_APP_GOOGLE_AI_API_KEY;
      const apiUrl = process.env.REACT_APP_GOOGLE_AI_API_URL;

      // Classify the department first
      const department = await classifyDepartment(input);
      const departments = ['water', 'electricity', 'sanitation', 'housing'];

      if (departments.includes(department)) {
        // Forward to department flow
        await supabase
          .from('department_issues')
          .insert({
            user_id: user?.id,
            department,
            description: input,
            status: 'pending'
          });

        setMessages(prev => [
          ...prev,
          { 
            text: `Thank you for your ${department} issue report. We've forwarded this to the ${department} department (Ticket #${Math.floor(Math.random() * 1000)}). A representative will contact you within 24 hours.`,
            sender: 'bot' 
          }
        ]);
      } else {
        // Normal chatbot response
        const response = await fetch(`${apiUrl}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: input }]
            }]
          })
        });
        const data = await response.json();
        setMessages(prev => [
          ...prev,
          { text: data.candidates[0].content.parts[0].text, sender: 'bot' }
        ]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { text: "Sorry, I encountered an error. Please try again later.", sender: 'bot' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle user sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chatbot</h2>
        {user && (
          <div className="user-info">
            <span>{user.email}</span>
            <button onClick={handleSignOut}>Sign Out</button>
          </div>
        )}
      </div>
      
      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <p>Welcome to the chatbot! Start by sending a message.</p>
          </div>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.text}
          </div>
        ))}
        {loading && (
          <div className="message bot">
            <LoadingSpinner />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? <LoadingSpinner /> : 'Send'}
        </button>
      </form>
    </div>
  );
}
