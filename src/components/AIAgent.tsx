import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Star, MapPin } from 'lucide-react';
import { StarSystem, STAR_SYSTEMS } from '@/data/galaxyData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      content: "¡Saludos, viajero! Soy C-3PO, tu protocolo droide especializado en la geografía galáctica. Ahora estoy conectado a la red galáctica principal. Puedo ayudarte a explorar sistemas, analizar relaciones comerciales, generar datos planetarios, y establecer rutas de comercio. ¡Pregúntame cualquier cosa o di comandos como 'analizar relaciones de Coruscant' o 'generar planetas para Tatooine'!",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dbSystems, setDbSystems] = useState<StarSystem[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load systems from database for enhanced navigation
  useEffect(() => {
    async function loadSystems() {
      try {
        const { data: systems } = await supabase
          .from('galactic_systems')
          .select('id, name, region, classification, coordinate_x, coordinate_y, coordinate_z');
        
        if (systems) {
          const convertedSystems: StarSystem[] = systems.map((sys) => ({
            id: sys.id,
            name: sys.name,
            region: sys.region as any,
            classification: sys.classification as any,
            coordinates: [
              (sys.coordinate_x || 0) / 5000,
              (sys.coordinate_y || 0) / 5000,
              (sys.coordinate_z || 0) / 5000
            ] as [number, number, number],
            galacticCoordinates: '',
            description: '',
            planets: [],
            significance: 1
          }));
          setDbSystems(convertedSystems);
        }
      } catch (error) {
        console.error('Error loading systems:', error);
      }
    }
    loadSystems();
  }, []);

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
    
    // Enhanced system navigation with database systems
    if (message.includes('navegar') || message.includes('ir a') || message.includes('mostrar') || message.includes('llévame')) {
      const systemName = extractSystemName(message);
      if (systemName) {
        setTimeout(() => {
          const allSystems = dbSystems.length > 0 ? dbSystems : STAR_SYSTEMS;
          const system = allSystems.find(s => 
            s.name.toLowerCase().includes(systemName.toLowerCase())
          );
          if (system && onSystemNavigate) {
            onSystemNavigate(system);
          }
        }, 1000);
        return `Navegando al sistema ${systemName}... Accediendo a la base de datos galáctica para obtener coordenadas precisas. ¡Sistema localizado! Preparando información detallada del sistema.`;
      }
    }

    // Backend function commands
    if (message.includes('analizar relaciones') || message.includes('analyze relationships')) {
      if (selectedSystem) {
        try {
          setIsLoading(true);
          const { data, error } = await supabase.functions.invoke('analyze-system-relationships', {
            body: { systemId: selectedSystem.id }
          });
          
          if (error) throw error;
          
          toast({
            title: "Análisis Completado",
            description: `He analizado las relaciones del sistema ${selectedSystem.name}`,
          });
          
          return `¡Análisis de relaciones completado para ${selectedSystem.name}! He procesado las conexiones comerciales, políticas y militares. Los datos han sido actualizados en el sistema. Puedes revisar los detalles en el panel de información del sistema.`;
        } catch (error) {
          return `Error al analizar las relaciones de ${selectedSystem.name}. Verificando conexiones con la red galáctica...`;
        }
      } else {
        return 'Para analizar relaciones, necesito que selecciones primero un sistema en el mapa 3D. Una vez seleccionado, podré procesar todas sus conexiones galácticas.';
      }
    }

    if (message.includes('establecer rutas') || message.includes('establish routes') || message.includes('rutas comerciales')) {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.functions.invoke('establish-trade-routes');
        
        if (error) throw error;
        
        toast({
          title: "Rutas Comerciales Establecidas",
          description: "He procesado y establecido nuevas rutas comerciales galácticas",
        });
        
        return '¡Rutas comerciales establecidas exitosamente! He analizado las relaciones comerciales existentes y calculado las rutas más eficientes. Las nuevas rutas incluyen distancias, tiempos de viaje y clasificaciones de seguridad.';
      } catch (error) {
        return 'Error al establecer rutas comerciales. La red comercial galáctica podría estar experimentando interferencias...';
      }
    }

    // Enhanced enrichment requests with backend integration
    if (message.includes('enriquecer') || message.includes('generar') || message.includes('más información')) {
      if (selectedSystem) {
        const currentSystem = selectedSystem;
        
        // Determine what type of enrichment to perform
        let enrichmentType = '';
        if (message.includes('planeta') || message.includes('mundo')) {
          enrichmentType = 'planets';
        } else if (message.includes('especie') || message.includes('habitantes')) {
          enrichmentType = 'species';
        } else if (message.includes('historia') || message.includes('evento')) {
          enrichmentType = 'history';
        } else if (message.includes('recurso') || message.includes('comercio')) {
          enrichmentType = 'resources';
        }

        if (enrichmentType) {
          try {
            setIsLoading(true);
            const { data, error } = await supabase.functions.invoke('galactic-enrichment', {
              body: {
                systemName: currentSystem.name,
                enrichmentType
              }
            });
            
            if (error) throw error;
            
            toast({
              title: "Enriquecimiento Completado",
              description: `Se ha enriquecido ${currentSystem.name} con datos de ${enrichmentType}`,
            });
            
            return `¡Generación exitosa! He enriquecido el sistema ${currentSystem.name} con información detallada sobre ${enrichmentType}. Los datos han sido almacenados en la base de datos galáctica y están disponibles en el panel de detalles del sistema.`;
          } catch (error) {
            return `Error al generar información de ${enrichmentType} para ${currentSystem.name}. Reintentando conexión con los archivos galácticos...`;
          }
        } else {
          return `Puedo enriquecer el sistema ${currentSystem.name} con información detallada sobre planetas, especies, historia y recursos. Especifica qué tipo de información deseas generar, por ejemplo: "generar planetas para ${currentSystem.name}" o "crear especies para este sistema".`;
        }
      } else {
        return 'Para generar información adicional, necesitas seleccionar primero un sistema en el mapa 3D. Una vez seleccionado, podré conectarme a los archivos galácticos y generar datos detallados.';
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
    // Try to extract system names from both database and hardcoded systems
    const allSystems = dbSystems.length > 0 ? dbSystems : STAR_SYSTEMS;
    for (const system of allSystems) {
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