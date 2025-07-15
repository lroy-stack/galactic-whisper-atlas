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

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    const message = userMessage.toLowerCase();
    
    // Check for system navigation requests
    if (message.includes('navegar') || message.includes('ir a') || message.includes('mostrar')) {
      const systemName = extractSystemName(message);
      if (systemName) {
        setTimeout(() => {
          const system = STAR_SYSTEMS.find(s => 
            s.name.toLowerCase().includes(systemName.toLowerCase())
          );
          if (system && onSystemNavigate) {
            onSystemNavigate(system);
          }
        }, 1000);
        return `Navegando al sistema ${systemName}... ¡Fascinante! Este sistema tiene muchas características interesantes que puedo compartir contigo.`;
      }
    }

    // Check for enrichment requests
    if (message.includes('enriquecer') || message.includes('generar') || message.includes('más información')) {
      if (selectedSystem) {
        const currentSystem = selectedSystem;
        
        // Determine what type of enrichment to suggest
        if (message.includes('planeta') || message.includes('mundo')) {
          return `Puedo generar información detallada sobre los planetas del sistema ${currentSystem.name}. Esto incluiría datos sobre clima, terreno, población, especies nativas y recursos naturales. ¿Te gustaría que proceda con la generación de planetas?`;
        } else if (message.includes('especie') || message.includes('habitantes')) {
          return `Puedo crear un catálogo de especies que habitan el sistema ${currentSystem.name}, incluyendo características físicas, cultura, tecnología y sensibilidad a la Fuerza. ¿Deseas que genere esta información?`;
        } else if (message.includes('historia') || message.includes('evento')) {
          return `Puedo compilar los eventos históricos más significativos del sistema ${currentSystem.name}, desde batallas importantes hasta tratados y descubrimientos. ¿Te interesa conocer la historia de este sistema?`;
        } else if (message.includes('recurso') || message.includes('comercio')) {
          return `Puedo analizar los recursos naturales y especializaciones comerciales del sistema ${currentSystem.name}, incluyendo minerales, energía y productos únicos. ¿Quieres que genere esta información económica?`;
        } else {
          return `Puedo enriquecer el sistema ${currentSystem.name} con información detallada sobre planetas, especies, historia y recursos. ¿Qué aspecto te interesa más explorar? Simplemente selecciona las opciones de enriquecimiento en el panel de detalles del sistema.`;
        }
      } else {
        return 'Para generar información adicional, necesitas seleccionar primero un sistema en el mapa 3D. Una vez seleccionado, podrás usar las opciones de enriquecimiento para generar planetas, especies, historia y recursos del sistema.';
      }
    }
    
    // Answer questions about specific topics with enhanced knowledge
    if (message.includes('mundos del núcleo') || message.includes('core worlds')) {
      return 'Los Mundos del Núcleo son el corazón político y económico de la galaxia. Coruscant sirve como capital, mientras que sistemas como Corellia, Alderaan, y Kuat son centros de poder. Estos mundos tienen las civilizaciones más antiguas y avanzadas tecnológicamente. ¿Te gustaría explorar algún sistema específico del Núcleo?';
    }
    
    if (message.includes('borde exterior') || message.includes('outer rim')) {
      return 'El Borde Exterior representa la frontera salvaje de la galaxia. Aquí encontrarás sistemas como Tatooine (mundo desértico con dos soles), Dagobah (pantanoso y rico en la Fuerza), y Endor (luna boscosa de los Ewoks). Es una región de oportunidades y peligros, donde prosperan contrabandistas y aventureros.';
    }
    
    if (message.includes('rutas comerciales') || message.includes('hiperespaciales')) {
      return 'Las rutas hiperespaciales son fundamentales para el comercio galáctico. La Ruta Comercial Corelliana conecta Corellia con el Núcleo, la Perlemiana une Coruscant con el Borde Exterior, y la Hydiana facilita el comercio trans-galáctico. Estas rutas determinan el flujo de bienes, información y poder político.';
    }
    
    if (message.includes('jedi') || message.includes('sith') || message.includes('fuerza')) {
      return 'La Fuerza ha moldeado la historia galáctica. Los Jedi establecieron templos en Coruscant, Yavin 4, y Tython, mientras que los Sith dominaron Korriban, Dromund Kaas, y Malachor. Cada uno de estos mundos resuena con energía de la Fuerza y contiene secretos ancestrales.';
    }

    // Enhanced responses about the galaxy
    if (message.includes('región') || message.includes('regiones')) {
      return 'La galaxia se divide en varias regiones principales: el Núcleo Profundo (misterioso y poco explorado), los Mundos del Núcleo (centro político), el Borde Interior (sistemas industriales), el Borde Medio (equilibrio entre desarrollo y frontera), la Región de Expansión (colonización reciente), y el Borde Exterior (frontera salvaje). Cada región tiene características únicas.';
    }
    
    // Default enhanced responses
    const responses = [
      '¡Excelente pregunta! Como C-3PO, especialista en geografía galáctica, tengo acceso a extensas bases de datos sobre todos los sistemas conocidos. ¿Hay algún aspecto específico de la galaxia que desees explorar en detalle?',
      'La galaxia contiene millones de sistemas habitados, cada uno con sus propias maravillas. Desde antiguas civilizaciones del Núcleo hasta mundos fronterizos inexplorados, hay siempre algo fascinante que descubrir. ¿Qué región te llama la atención?',
      'Mi programación incluye conocimiento exhaustivo sobre sistemas estelares, rutas comerciales, especies, y eventos históricos. Puedo ayudarte a navegar tanto física como informativamente por la galaxia. ¿En qué puedo asistirte específicamente?',
      'Como protocolo especializado en relaciones galácticas y geografía, estoy equipado para proporcionar información detallada sobre cualquier sistema que desees explorar. También puedo generar datos adicionales usando mis conexiones con la red de información galáctica.',
      'La exploración galáctica es mi especialidad. Desde análisis de planetas habitables hasta rutas comerciales seguras, puedo proporcionarte toda la información necesaria para tu viaje. ¿Qué sistema o región te interesa investigar?'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const extractSystemName = (message: string): string | null => {
    // Try to extract system names from the message
    for (const system of STAR_SYSTEMS) {
      if (message.toLowerCase().includes(system.name.toLowerCase())) {
        return system.name;
      }
    }
    return null;
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

    const aiResponse = await generateAIResponse(userMessage.content);
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