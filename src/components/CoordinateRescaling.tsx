import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConversionResult {
  success: boolean;
  message: string;
  details?: {
    totalSystems: number;
    convertedSystems: number;
    conversionErrors: number;
    regionStats: Record<string, number>;
    validation: {
      withinBounds: number;
      outOfBounds: number;
    };
    newCoordinateSystem: {
      scale: string;
      diskDiameter: string;
      diskHeight: string;
      coordinate_system: string;
    };
  };
  error?: string;
}

export function CoordinateRescaling() {
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const { toast } = useToast();

  const handleConversion = async () => {
    setIsConverting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('convert-2d-to-3d-coordinates');

      if (error) {
        throw new Error(error.message);
      }

      setResult(data);
      
      if (data.success) {
        toast({
          title: "Coordinates Converted Successfully",
          description: `Converted ${data.details?.convertedSystems} systems to 3D galactic disk coordinates`,
        });
      } else {
        toast({
          title: "Conversion Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setResult({
        success: false,
        message: 'Failed to convert coordinates',
        error: errorMessage
      });
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          2D → 3D Galactic Coordinate Conversion
        </CardTitle>
        <CardDescription>
          Convert existing 2D grid coordinates (L-9, M-12, etc.) to realistic 3D galactic disk coordinates.
          This creates a proper galactic disk structure with regional distribution based on Star Wars galaxy layout.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">Galactic Disk Structure:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Scale:</strong> 1 unit = 25 light-years (100,000 light-year galaxy)</li>
            <li>• <strong>Deep Core:</strong> Radius 0-100, Height ±20 units</li>
            <li>• <strong>Core Worlds:</strong> Radius 100-200, Height ±30 units</li>
            <li>• <strong>Inner Regions:</strong> Radius 200-750, Height ±40-60 units</li>
            <li>• <strong>Mid Rim:</strong> Radius 750-1200, Height ±80 units</li>
            <li>• <strong>Outer Rim:</strong> Radius 1200-1800, Height ±100 units</li>
            <li>• <strong>Wild Space:</strong> Radius 1800-2000, Height ±120 units</li>
            <li>• Population & classification affect height placement</li>
          </ul>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> This will convert all existing 2D grid coordinates to 3D galactic disk positions. 
            The conversion uses the existing grid coordinates (L-9, M-12, etc.) and preserves regional logic.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleConversion} 
          disabled={isConverting}
          className="w-full"
        >
          {isConverting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Converting to 3D Galactic Disk...
            </>
          ) : (
            'Convert 2D → 3D Galactic Coordinates'
          )}
        </Button>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <p>{result.message}</p>
                {result.details && (
                  <div className="text-sm space-y-1">
                    <p><strong>Total Systems:</strong> {result.details.totalSystems}</p>
                    <p><strong>Converted Systems:</strong> {result.details.convertedSystems}</p>
                    <p><strong>Conversion Errors:</strong> {result.details.conversionErrors}</p>
                    <p><strong>Validation:</strong> {result.details.validation.withinBounds} within bounds, {result.details.validation.outOfBounds} out of bounds</p>
                    <p><strong>Coordinate System:</strong> {result.details.newCoordinateSystem.coordinate_system}</p>
                    <p><strong>Scale:</strong> {result.details.newCoordinateSystem.scale}</p>
                    {result.details.regionStats && (
                      <details className="mt-2">
                        <summary className="cursor-pointer font-medium">Region Statistics</summary>
                        <div className="mt-1 pl-2">
                          {Object.entries(result.details.regionStats).map(([region, count]) => (
                            <p key={region}>{region}: {count} systems</p>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
                {result.error && (
                  <p className="text-sm text-destructive">Error: {result.error}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}