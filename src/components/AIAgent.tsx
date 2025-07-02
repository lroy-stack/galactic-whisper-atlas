import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Star, MapPin } from 'lucide-react';
import { StarSystem, STAR_SYSTEMS } from '@/data/galaxyData';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  systemMention?: StarSystem;
}

interface AIAgentProps {
  selectedSystem: StarSystem | null;
  onSystemNavigate: (system: StarSystem) => void;
}

export default function AIAgent({ selectedSystem, onSystemNavigate }: AIAgentProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "¡Saludos, viajero! Soy C-3PO, tu protocolo droide especializado en la geografía galáctica. Estoy aquí para ayudarte a explorar la galaxia muy, muy lejana. Puedes preguntarme sobre cualquier sistema estelar, región galáctica, o simplemente decirme '¡llévame a Tatooine!' para navegar directamente.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (selectedSystem) {
      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `Has seleccionado ${selectedSystem.name}, ubicado en ${selectedSystem.region}. ${selectedSystem.description} ¿Te gustaría saber más sobre este sistema o explorar algún aspecto específico?`,
        timestamp: new Date(),
        systemMention: selectedSystem
      };
      setMessages(prev => [...prev, aiMessage]);
    }
  }, [selectedSystem]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for system navigation requests
    for (const system of STAR_SYSTEMS) {
      if (lowerMessage.includes(system.name.toLowerCase())) {
        setTimeout(() => onSystemNavigate(system), 1000);
        return `Navegando hacia ${system.name}... Este sistema se encuentra en ${system.region}. ${system.description}`;
      }
    }

    // Check for region questions
    if (lowerMessage.includes('core worlds') || lowerMessage.includes('mundos del núcleo')) {
      return 'Los Core Worlds son el corazón de la civilización galáctica. Incluyen sistemas como Coruscant, la capital galáctica, y Alderaan (antes de su destrucción). Estos mundos están altamente desarrollados y densamente poblados.';
    }

    if (lowerMessage.includes('outer rim') || lowerMessage.includes('borde exterior')) {
      return 'Los Outer Rim Territories son la frontera galáctica, donde la ley de la República tiene menos influencia. Aquí encontrarás mundos como Tatooine, Geonosis y Mustafar. Es territorio de contrabandistas, cazarrecompensas y el Cartel Hutt.';
    }

    if (lowerMessage.includes('rutas comerciales') || lowerMessage.includes('trade routes')) {
      return 'Las principales rutas comerciales incluyen el Corellian Run, que conecta Corellia con Coruscant, y el Hydian Way, que se extiende desde el Core hasta el Outer Rim. Estas rutas son vitales para el comercio galáctico.';
    }

    if (lowerMessage.includes('jedi') || lowerMessage.includes('sith')) {
      return 'Los Jedi tenían templos en mundos como Coruscant, Ilum y Jedha. Los Sith establecieron fortalezas en planetas como Korriban y Dromund Kaas. Muchos de estos sitios son ahora de gran importancia histórica.';
    }

    if (lowerMessage.includes('hola') || lowerMessage.includes('hello')) {
      return '¡Hola! Soy tu guía especializado en la galaxia de Star Wars. Puedo ayudarte a explorar sistemas estelares, explicar la historia galáctica, o navegar a cualquier mundo que te interese. ¿Qué te gustaría descubrir?';
    }

    // Default responses
    const responses = [
      'Interesante pregunta. La galaxia es vasta y llena de maravillas. ¿Hay algún sistema específico que te gustaría explorar?',
      'Mi base de datos contiene información sobre miles de sistemas estelares. ¿Podrías ser más específico sobre qué aspecto te interesa?',
      'La historia galáctica está llena de eventos fascinantes. ¿Te interesa alguna era en particular, como las Guerras Clon o la Rebelión?',
      'Cada región de la galaxia tiene su propia personalidad única. ¿Te gustaría que te muestre algunos sistemas representativos?'
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const aiResponse = generateAIResponse(input);
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: aiResponse,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="hologram-border h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary animate-pulse-glow" />
          <h3 className="font-semibold text-primary">Protocolo Droide C-3PO</h3>
          <Star className="w-4 h-4 text-primary animate-float" />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Especialista en Geografía Galáctica
        </p>
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.type === 'ai' ? 'justify-start' : 'justify-end'
              }`}
            >
              {message.type === 'ai' && (
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] p-3 rounded-lg space-transition ${
                  message.type === 'ai'
                    ? 'bg-muted text-foreground'
                    : 'imperial-gradient text-primary-foreground'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                {message.systemMention && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => onSystemNavigate(message.systemMention!)}
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    Ver en el mapa
                  </Button>
                )}
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-secondary" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pregúntame sobre la galaxia o di 'llévame a Coruscant'..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="space-glow"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}