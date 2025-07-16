import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertTriangle } from 'lucide-react';

interface CleaningResult {
  success: boolean;
  totalProcessed: number;
  systemsToClean: number;
  remainingSystems: number;
  isComplete: boolean;
  batches: Array<{
    batch: number;
    processed: number;
    cleared: number;
    totalProcessed: number;
    progress: number;
    timeMs: number;
  }>;
  summary: {
    startedWith: number;
    processed: number;
    remaining: number;
  };
}

export default function CoordinateCleaner() {
  const [isCleaning, setIsCleaning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalSystems, setTotalSystems] = useState(0);
  const [processedSystems, setProcessedSystems] = useState(0);
  const [result, setResult] = useState<CleaningResult | null>(null);

  const clearCoordinates = async (): Promise<void> => {
    setIsCleaning(true);
    setProgress(0);
    setCurrentBatch(0);
    setTotalSystems(0);
    setProcessedSystems(0);
    setResult(null);
    
    try {
      console.log('🧹 Starting coordinate cleaning...');
      
      const { data, error } = await supabase.functions.invoke('clear-galactic-coordinates');

      if (error) {
        console.error('Error clearing coordinates:', error);
        throw error;
      }

      const cleaningResult = data as CleaningResult;
      setResult(cleaningResult);
      
      if (cleaningResult.batches && cleaningResult.batches.length > 0) {
        // Simulate progressive updates for visual feedback
        for (const batch of cleaningResult.batches) {
          setCurrentBatch(batch.batch);
          setProgress(batch.progress);
          setProcessedSystems(batch.totalProcessed);
          setTotalSystems(cleaningResult.systemsToClean);
          
          // Small delay for visual effect
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      setProgress(100);
      console.log('✅ Coordinate cleaning completed successfully');
      
    } catch (error) {
      console.error('Error in coordinate cleaning:', error);
      setResult({
        success: false,
        totalProcessed: 0,
        systemsToClean: 0,
        remainingSystems: 0,
        isComplete: false,
        batches: [],
        summary: { startedWith: 0, processed: 0, remaining: 0 }
      } as CleaningResult);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Limpiar Coordenadas Galácticas
        </CardTitle>
        <CardDescription>
          Elimina todas las coordenadas 3D existentes para preparar el mapa para un nuevo mapeo
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Warning Alert */}
        <div className="flex items-start gap-3 p-4 border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              ⚠️ Acción Irreversible
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Esta operación eliminará TODAS las coordenadas 3D existentes. 
              Solo procede si quieres mapear las coordenadas desde cero.
            </p>
          </div>
        </div>

        {/* Control Button */}
        <div className="flex justify-center">
          <Button
            onClick={clearCoordinates}
            disabled={isCleaning}
            variant="destructive"
            size="lg"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isCleaning ? 'Limpiando...' : 'Limpiar Todas las Coordenadas'}
          </Button>
        </div>

        {/* Progress */}
        {isCleaning && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progreso de limpieza (Lote {currentBatch})</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="text-center text-sm text-muted-foreground">
              Procesados: {processedSystems} / {totalSystems} sistemas
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">Resultado de la limpieza:</h4>
              <Badge variant={result.success ? "default" : "destructive"}>
                {result.success ? 'Exitoso' : 'Error'}
              </Badge>
            </div>

            {result.success && (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {result.summary.startedWith}
                    </div>
                    <div className="text-sm text-muted-foreground">Sistemas Iniciales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {result.summary.processed}
                    </div>
                    <div className="text-sm text-muted-foreground">Procesados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.summary.remaining}
                    </div>
                    <div className="text-sm text-muted-foreground">Restantes</div>
                  </div>
                </div>

                {/* Completion Status */}
                <div className="text-center">
                  <Badge 
                    variant={result.isComplete ? "default" : "secondary"}
                    className="text-lg py-2 px-4"
                  >
                    {result.isComplete ? 
                      '✅ Mapa Completamente Limpio' : 
                      `⚠️ ${result.remainingSystems} sistemas aún tienen coordenadas`
                    }
                  </Badge>
                </div>

                {/* Batch Details */}
                {result.batches && result.batches.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Detalles del procesamiento:</h5>
                    <div className="text-sm space-y-1">
                      <div>• Total de lotes procesados: {result.batches.length}</div>
                      <div>• Sistemas procesados: {result.totalProcessed}</div>
                      <div>• Tiempo promedio por lote: {
                        Math.round(result.batches.reduce((sum, b) => sum + b.timeMs, 0) / result.batches.length)
                      }ms</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>Una vez limpiadas las coordenadas, el mapa 3D estará vacío hasta que uses el Mapeador de Coordenadas.</p>
        </div>
      </CardContent>
    </Card>
  );
}