import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Play, CheckCircle, AlertCircle } from 'lucide-react';

interface CompletionResult {
  success: boolean;
  completedCount: number;
  totalProcessed: number;
  hasMore: boolean;
  nextOffset: number;
  systems?: Array<{
    name: string;
    region: string;
    classification: string;
  }>;
}

export default function SystemDataCompletion() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalSystems, setTotalSystems] = useState(0);
  const [completedSystems, setCompletedSystems] = useState(0);
  const [currentBatch, setCurrentBatch] = useState<CompletionResult | null>(null);
  const { toast } = useToast();

  const checkIncompleteCount = async () => {
    try {
      const { count } = await supabase
        .from('galactic_systems')
        .select('*', { count: 'exact', head: true })
        .is('description', null);
      
      setTotalSystems(count || 0);
      return count || 0;
    } catch (error) {
      console.error('Error checking incomplete systems:', error);
      return 0;
    }
  };

  const runCompletion = async () => {
    setIsRunning(true);
    setProgress(0);
    setCompletedSystems(0);
    
    try {
      const initialCount = await checkIncompleteCount();
      setTotalSystems(initialCount);

      if (initialCount === 0) {
        toast({
          title: "¡Completado!",
          description: "Todos los sistemas ya tienen información completa.",
        });
        setIsRunning(false);
        return;
      }

      let offset = 0;
      let totalCompleted = 0;
      const batchSize = 10;

      while (true) {
        try {
          const { data, error } = await supabase.functions.invoke('complete-galactic-systems', {
            body: { batchSize, offset }
          });

          if (error) {
            throw error;
          }

          const result = data as CompletionResult;
          setCurrentBatch(result);

          if (result.success) {
            totalCompleted += result.completedCount;
            setCompletedSystems(totalCompleted);
            setProgress((totalCompleted / initialCount) * 100);

            if (!result.hasMore) {
              toast({
                title: "¡Proceso completado!",
                description: `Se completaron ${totalCompleted} sistemas galácticos.`,
              });
              break;
            }

            offset = result.nextOffset;
          } else {
            throw new Error('Batch processing failed');
          }

          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (batchError) {
          console.error('Error in batch:', batchError);
          toast({
            variant: "destructive",
            title: "Error en el lote",
            description: `Error procesando lote en offset ${offset}. Continuando...`,
          });
          offset += batchSize;
        }
      }

    } catch (error) {
      console.error('Error running completion:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error ejecutando el proceso de completado.",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const resetAndCheck = async () => {
    const count = await checkIncompleteCount();
    setProgress(0);
    setCompletedSystems(0);
    setCurrentBatch(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          Completar Información de Sistemas Galácticos
        </CardTitle>
        <CardDescription>
          Usa IA para completar la información faltante de todos los sistemas en la base de datos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Button 
            onClick={runCompletion} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? 'Procesando...' : 'Iniciar Completado'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={resetAndCheck}
            disabled={isRunning}
          >
            Verificar Estado
          </Button>
        </div>

        {totalSystems > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progreso:</span>
              <span>{completedSystems} / {totalSystems} sistemas</span>
            </div>
            <Progress value={progress} className="w-full" />
            
            {isRunning && (
              <div className="flex justify-center">
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Procesando sistemas...
                </Badge>
              </div>
            )}
          </div>
        )}

        {currentBatch && currentBatch.systems && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Último lote completado:</h4>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {currentBatch.systems.map((system, index) => (
                <div 
                  key={index}
                  className="flex justify-between items-center p-2 bg-muted rounded text-xs"
                >
                  <span className="font-medium">{system.name}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {system.region}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {system.classification}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p>Este proceso completará automáticamente:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Descripción del sistema</li>
                <li>Población y clasificación</li>
                <li>Terreno y especies nativas</li>
                <li>Lealtad política y significancia histórica</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}