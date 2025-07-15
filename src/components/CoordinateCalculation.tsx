import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calculator, MapPin, Zap } from 'lucide-react';

interface CalculationResult {
  success: boolean;
  completed: number;
  errors: number;
  total: number;
  hasMore: boolean;
  nextOffset: number;
  updatedSystems: Array<{
    id: string;
    name: string;
    region: string;
    grid_coordinates: string;
    coordinates: { x: number; y: number; z: number };
  }>;
}

export default function CoordinateCalculation() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [lastBatchResults, setLastBatchResults] = useState<CalculationResult | null>(null);
  const [allResults, setAllResults] = useState<Array<CalculationResult>>([]);

  const calculateCoordinates = async (): Promise<void> => {
    setIsCalculating(true);
    setProgress(0);
    setTotalProcessed(0);
    setTotalCompleted(0);
    setAllResults([]);
    
    try {
      let offset = 0;
      const batchSize = 50;
      let hasMore = true;
      
      while (hasMore) {
        console.log(`🔄 Processing batch starting at offset ${offset}`);
        
        const { data, error } = await supabase.functions.invoke('calculate-3d-coordinates', {
          body: { batchSize, offset }
        });

        if (error) {
          console.error('Error calculating coordinates:', error);
          throw error;
        }

        const result = data as CalculationResult;
        setLastBatchResults(result);
        setAllResults(prev => [...prev, result]);
        
        setTotalProcessed(prev => prev + result.total);
        setTotalCompleted(prev => prev + result.completed);
        
        if (!result.hasMore) {
          hasMore = false;
          setProgress(100);
        } else {
          offset = result.nextOffset;
          // Update progress (rough estimate)
          setProgress(Math.min(95, (offset / 1000) * 100)); // Assume ~1000 total systems
        }

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('✅ All coordinates calculated successfully');
      
    } catch (error) {
      console.error('Error in coordinate calculation:', error);
    } finally {
      setIsCalculating(false);
      setProgress(100);
    }
  };

  const resetAndCalculate = async (): Promise<void> => {
    setLastBatchResults(null);
    setAllResults([]);
    await calculateCoordinates();
  };

  const totalErrors = allResults.reduce((sum, result) => sum + result.errors, 0);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Cálculo de Coordenadas 3D
        </CardTitle>
        <CardDescription>
          Convierte coordenadas galácticas 2D a posiciones 3D en años luz para el mapa estelar
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Control buttons */}
        <div className="flex gap-2">
          <Button
            onClick={calculateCoordinates}
            disabled={isCalculating}
            className="flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            {isCalculating ? 'Calculando...' : 'Calcular Coordenadas'}
          </Button>
          
          <Button
            variant="outline"
            onClick={resetAndCalculate}
            disabled={isCalculating}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Reiniciar y Calcular
          </Button>
        </div>

        {/* Progress */}
        {isCalculating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso del cálculo</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Statistics */}
        {(totalProcessed > 0 || totalCompleted > 0) && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalProcessed}</div>
              <div className="text-sm text-muted-foreground">Procesados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalCompleted}</div>
              <div className="text-sm text-muted-foreground">Completados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalErrors}</div>
              <div className="text-sm text-muted-foreground">Errores</div>
            </div>
          </div>
        )}

        {/* Last batch results */}
        {lastBatchResults && (
          <div className="space-y-4">
            <h4 className="font-semibold">Último lote procesado:</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline">
                  {lastBatchResults.completed}/{lastBatchResults.total} completados
                </Badge>
              </div>
              <div>
                <Badge variant={lastBatchResults.hasMore ? "secondary" : "default"}>
                  {lastBatchResults.hasMore ? 'Más lotes disponibles' : 'Proceso completo'}
                </Badge>
              </div>
            </div>

            {/* Show some recent systems */}
            {lastBatchResults.updatedSystems.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Sistemas actualizados recientemente:</h5>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {lastBatchResults.updatedSystems.slice(0, 5).map((system) => (
                    <div key={system.id} className="text-xs bg-muted p-2 rounded">
                      <div className="font-medium">{system.name}</div>
                      <div className="text-muted-foreground">
                        {system.region} • {system.grid_coordinates} → 
                        X: {system.coordinates.x.toFixed(0)}, 
                        Y: {system.coordinates.y.toFixed(0)}, 
                        Z: {system.coordinates.z.toFixed(0)} ly
                      </div>
                    </div>
                  ))}
                  {lastBatchResults.updatedSystems.length > 5 && (
                    <div className="text-xs text-muted-foreground text-center">
                      ... y {lastBatchResults.updatedSystems.length - 5} más
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>El sistema convierte coordenadas galácticas (ej: L-9) a posiciones 3D usando:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Letras A-Z → Coordenada X (-65,000 a +65,000 años luz)</li>
            <li>Números 1-24 → Coordenada Y (-60,000 a +60,000 años luz)</li>
            <li>Región galáctica → Coordenada Z (Core: ±2.5k, Outer: ±12.5k años luz)</li>
            <li>Ruido realista basado en población y clasificación</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}