import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Network, Save, Eye, Users } from 'lucide-react';

interface AnalyzedRelationship {
  system_a_name: string;
  system_b_name: string;
  relationship_type: string;
  strength: number;
  description: string;
  trade_volume_credits?: number;
  military_cooperation?: boolean;
  cultural_exchange?: boolean;
}

interface AnalysisResult {
  success: boolean;
  relationshipsAnalyzed: number;
  totalSystemsProcessed: number;
  relationships: AnalyzedRelationship[];
}

export default function SystemRelationshipAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedRelationships, setSelectedRelationships] = useState<Set<number>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [forceReanalysis, setForceReanalysis] = useState(false);
  const { toast } = useToast();

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisResult(null);
    setSelectedRelationships(new Set());
    
    try {
      const batchSize = 15; // Smaller batch to avoid timeouts
      
      toast({
        title: "Iniciando análisis",
        description: "Analizando relaciones entre sistemas galácticos...",
      });

      const { data, error } = await supabase.functions.invoke('analyze-system-relationships', {
        body: { 
          batchSize,
          forceReanalysis
        }
      });

      if (error) {
        throw error;
      }

      const result = data as AnalysisResult;
      setAnalysisResult(result);
      setProgress(100);

      // Select all relationships by default
      if (result.relationships) {
        setSelectedRelationships(new Set(result.relationships.map((_, index) => index)));
      }

      toast({
        title: "¡Análisis completado!",
        description: `Se identificaron ${result.relationshipsAnalyzed} relaciones entre ${result.totalSystemsProcessed} sistemas.`,
      });

    } catch (error) {
      console.error('Error running analysis:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Error durante el análisis: ${error.message}`,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveSelectedRelationships = async () => {
    if (!analysisResult || selectedRelationships.size === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay relaciones seleccionadas para guardar.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const relationshipsToSave = analysisResult.relationships
        .filter((_, index) => selectedRelationships.has(index))
        .map(rel => ({
          system_a: rel.system_a_name, // Note: This will need system IDs, but for demo using names
          system_b: rel.system_b_name,
          relationship_type: rel.relationship_type,
          strength: rel.strength,
          description: rel.description,
          trade_volume_credits: rel.trade_volume_credits,
          military_cooperation: rel.military_cooperation,
          cultural_exchange: rel.cultural_exchange
        }));

      const { data, error } = await supabase.functions.invoke('save-system-relationships', {
        body: { relationships: relationshipsToSave }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "¡Relaciones guardadas!",
        description: `Se guardaron ${data.successCount} relaciones exitosamente.`,
      });

      // Clear analysis after saving
      setAnalysisResult(null);
      setSelectedRelationships(new Set());

    } catch (error) {
      console.error('Error saving relationships:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Error guardando relaciones: ${error.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRelationshipSelection = (index: number) => {
    const newSelection = new Set(selectedRelationships);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedRelationships(newSelection);
  };

  const toggleAllRelationships = () => {
    if (!analysisResult) return;
    
    if (selectedRelationships.size === analysisResult.relationships.length) {
      setSelectedRelationships(new Set());
    } else {
      setSelectedRelationships(new Set(analysisResult.relationships.map((_, index) => index)));
    }
  };

  const getRelationshipTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'allied': return 'bg-green-100 text-green-800';
      case 'trade_partners': return 'bg-blue-100 text-blue-800';
      case 'dependent': return 'bg-yellow-100 text-yellow-800';
      case 'rival': return 'bg-red-100 text-red-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          Análisis de Relaciones entre Sistemas
        </CardTitle>
        <CardDescription>
          Analiza las relaciones políticas, económicas y estratégicas entre sistemas galácticos usando IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4 flex-wrap">
          <Button 
            onClick={runAnalysis} 
            disabled={isAnalyzing || isSaving}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Network className="h-4 w-4" />
            )}
            {isAnalyzing ? 'Analizando...' : 'Iniciar Análisis'}
          </Button>

          {analysisResult && (
            <>
              <Button 
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Ocultar' : 'Ver'} Relaciones
              </Button>

              <Button 
                variant="default"
                onClick={saveSelectedRelationships}
                disabled={isSaving || selectedRelationships.size === 0}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar Seleccionadas ({selectedRelationships.size})
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="force-reanalysis"
            checked={forceReanalysis}
            onCheckedChange={(checked) => setForceReanalysis(checked as boolean)}
          />
          <label htmlFor="force-reanalysis" className="text-sm">
            Forzar re-análisis (sobrescribir relaciones existentes)
          </label>
        </div>

        {isAnalyzing && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Analizando relaciones...</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="flex justify-center">
              <Badge variant="secondary" className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Procesando sistemas con IA...
              </Badge>
            </div>
          </div>
        )}

        {analysisResult && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {analysisResult.relationshipsAnalyzed} relaciones identificadas entre {analysisResult.totalSystemsProcessed} sistemas
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllRelationships}
                className="flex items-center gap-2"
              >
                <Users className="h-3 w-3" />
                {selectedRelationships.size === analysisResult.relationships.length ? 'Deseleccionar' : 'Seleccionar'} Todas
              </Button>
            </div>

            {showPreview && analysisResult.relationships.length > 0 && (
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-3">
                <h4 className="font-medium">Relaciones Detectadas:</h4>
                {analysisResult.relationships.map((relationship, index) => (
                  <div 
                    key={index}
                    className={`p-3 border rounded-md space-y-2 ${
                      selectedRelationships.has(index) ? 'bg-primary/5 border-primary' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedRelationships.has(index)}
                          onCheckedChange={() => toggleRelationshipSelection(index)}
                        />
                        <span className="font-medium text-sm">
                          {relationship.system_a_name} ↔ {relationship.system_b_name}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getRelationshipTypeColor(relationship.relationship_type)}`}
                        >
                          {relationship.relationship_type.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Fuerza: {relationship.strength}/10
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {relationship.description}
                    </p>
                    
                    <div className="flex gap-2 flex-wrap">
                      {relationship.trade_volume_credits && (
                        <Badge variant="outline" className="text-xs">
                          Comercio: {relationship.trade_volume_credits}B créditos
                        </Badge>
                      )}
                      {relationship.military_cooperation && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                          Cooperación Militar
                        </Badge>
                      )}
                      {relationship.cultural_exchange && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                          Intercambio Cultural
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="border-t pt-4 text-sm text-muted-foreground">
          <p><strong>Tipos de Relaciones Detectadas:</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-1 mt-2">
            <li><strong>Allied:</strong> Alianzas políticas o militares fuertes</li>
            <li><strong>Trade Partners:</strong> Relaciones principalmente económicas</li>
            <li><strong>Dependent:</strong> Dependencia de recursos o protección</li>
            <li><strong>Rival:</strong> Intereses competitivos o conflictos</li>
            <li><strong>Neutral:</strong> Sin relaciones significativas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}