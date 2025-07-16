import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Map, Info } from 'lucide-react';

interface MappingResult {
  success: boolean;
  totalProcessed: number;
  totalMapped: number;
  systemsToMap: number;
  remainingSystems: number;
  isComplete: boolean;
  batches: Array<{
    batch: number;
    processed: number;
    mapped: number;
    totalProcessed: number;
    totalMapped: number;
    progress: number;
    timeMs: number;
  }>;
  summary: {
    startedWith: number;
    processed: number;
    mapped: number;
  };
}

export default function CoordinateMapper() {
  const [isMapping, setIsMapping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalSystems, setTotalSystems] = useState(0);
  const [processedSystems, setProcessedSystems] = useState(0);
  const [mappedSystems, setMappedSystems] = useState(0);
  const [result, setResult] = useState<MappingResult | null>(null);

  const mapCoordinates = async (): Promise<void> => {
    setIsMapping(true);
    setProgress(0);
    setCurrentBatch(0);
    setTotalSystems(0);
    setProcessedSystems(0);
    setMappedSystems(0);
    setResult(null);
    
    try {
      console.log('🗺️ Starting coordinate mapping...');
      
      const { data, error } = await supabase.functions.invoke('map-2d-to-3d-coordinates');

      if (error) {
        console.error('Error mapping coordinates:', error);
        throw error;
      }

      const mappingResult = data as MappingResult;
      setResult(mappingResult);
      
      if (mappingResult.batches && mappingResult.batches.length > 0) {
        // Simulate progressive updates for visual feedback
        for (const batch of mappingResult.batches) {
          setCurrentBatch(batch.batch);
          setProgress(batch.progress);
          setProcessedSystems(batch.totalProcessed);
          setMappedSystems(batch.totalMapped);
          setTotalSystems(mappingResult.systemsToMap);
          
          // Small delay for visual effect
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        // Handle case where no systems need mapping
        setProgress(100);
        setTotalSystems(mappingResult.systemsToMap);
      }
      
      setProgress(100);
      console.log('✅ Coordinate mapping completed successfully');
      
    } catch (error) {
      console.error('Error in coordinate mapping:', error);
      setResult({
        success: false,
        totalProcessed: 0,
        totalMapped: 0,
        systemsToMap: 0,
        remainingSystems: 0,
        isComplete: false,
        batches: [],
        summary: { startedWith: 0, processed: 0, mapped: 0 }
      } as MappingResult);
    } finally {
      setIsMapping(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Mapear Coordenadas 2D → 3D
        </CardTitle>
        <CardDescription>
          Convierte coordenadas galácticas 2D (ej: L-9) a posiciones 3D en años luz para el mapa estelar
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <div className="flex items-start gap-3 p-4 border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 rounded-lg">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Sistema de Coordenadas Mejorado
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Este mapeo usa las correcciones angulares, escalado realista (160x) y distribución en brazos espirales.
            </p>
          </div>
        </div>

        {/* Control Button */}
        <div className="flex justify-center">
          <Button
            onClick={mapCoordinates}
            disabled={isMapping}
            size="lg"
            className="flex items-center gap-2"
          >
            <Map className="h-4 w-4" />
            {isMapping ? 'Mapeando...' : 'Mapear Coordenadas 2D → 3D'}
          </Button>
        </div>

        {/* Progress */}
        {isMapping && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progreso del mapeo (Lote {currentBatch})</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="text-center text-sm text-muted-foreground">
              Procesados: {processedSystems} / {totalSystems} sistemas • Mapeados: {mappedSystems}
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">Resultado del mapeo:</h4>
              <Badge variant={result.success ? "default" : "destructive"}>
                {result.success ? 'Exitoso' : 'Error'}
              </Badge>
            </div>

            {result.success && (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.summary.startedWith}
                    </div>
                    <div className="text-sm text-muted-foreground">Sistemas a Mapear</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {result.summary.mapped}
                    </div>
                    <div className="text-sm text-muted-foreground">Mapeados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {result.remainingSystems}
                    </div>
                    <div className="text-sm text-muted-foreground">Sin Mapear</div>
                  </div>
                </div>

                {/* Completion Status */}
                <div className="text-center">
                  <Badge 
                    variant={result.isComplete ? "default" : "secondary"}
                    className="text-lg py-2 px-4"
                  >
                    {result.isComplete ? 
                      '✅ Mapeo Completado' : 
                      `⚠️ ${result.remainingSystems} sistemas sin coordenadas 2D`
                    }
                  </Badge>
                </div>

                {/* Special Cases */}
                {result.systemsToMap === 0 && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      No hay sistemas que necesiten mapeo. Todos los sistemas con coordenadas 2D ya tienen coordenadas 3D.
                    </p>
                  </div>
                )}

                {/* Batch Details */}
                {result.batches && result.batches.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Detalles del procesamiento:</h5>
                    <div className="text-sm space-y-1">
                      <div>• Total de lotes procesados: {result.batches.length}</div>
                      <div>• Sistemas procesados: {result.totalProcessed}</div>
                      <div>• Sistemas mapeados: {result.totalMapped}</div>
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
          <p><strong>Sistema de coordenadas:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Letras A-Z → Ángulo polar (0° a 360°)</li>
            <li>Números 1-24 → Radio galáctico (0 a ~65,000 años luz)</li>
            <li>Región galáctica → Altura Z (Core: ±2.5k, Outer: ±12.5k años luz)</li>
            <li>Brazos espirales y distribución realística aplicada</li>
            <li>Influencia de población y clasificación del sistema</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}