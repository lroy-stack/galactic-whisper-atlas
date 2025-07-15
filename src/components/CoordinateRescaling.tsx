import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RescalingResult {
  success: boolean;
  message: string;
  details?: {
    totalSystems: number;
    updatedSystems: number;
    originalBounds: any;
    galacticCenter: any;
    regionCenters: string[];
  };
  error?: string;
}

export function CoordinateRescaling() {
  const [isRescaling, setIsRescaling] = useState(false);
  const [result, setResult] = useState<RescalingResult | null>(null);
  const { toast } = useToast();

  const handleRescaling = async () => {
    setIsRescaling(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('rescale-galactic-coordinates');

      if (error) {
        throw new Error(error.message);
      }

      setResult(data);
      
      if (data.success) {
        toast({
          title: "Coordinates Rescaled Successfully",
          description: `Updated ${data.details?.updatedSystems} systems out of ${data.details?.totalSystems}`,
        });
      } else {
        toast({
          title: "Rescaling Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setResult({
        success: false,
        message: 'Failed to rescale coordinates',
        error: errorMessage
      });
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRescaling(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Galactic Coordinate Rescaling
        </CardTitle>
        <CardDescription>
          Rescale all galactic system coordinates to optimize visualization for 4500+ systems.
          This will normalize coordinates to a manageable range (-200 to +200) with region-based scaling.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">Rescaling Features:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Deep Core: Max radius 15 units (most compact)</li>
            <li>• Core Worlds: Max radius 25 units</li>
            <li>• Inner Rim/Colonies: Max radius 50 units</li>
            <li>• Mid Rim/Expansion: Max radius 100 units</li>
            <li>• Outer Rim/Wild Space: Max radius 180-200 units (most dispersed)</li>
            <li>• Minimum 2.5 unit separation between systems</li>
            <li>• Maintains relative spatial relationships</li>
          </ul>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> This operation will update coordinates for all galactic systems in the database. 
            Make sure you want to proceed as this cannot be easily undone.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleRescaling} 
          disabled={isRescaling}
          className="w-full"
        >
          {isRescaling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Rescaling Coordinates...
            </>
          ) : (
            'Start Coordinate Rescaling'
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
                  <div className="text-sm">
                    <p>Total Systems: {result.details.totalSystems}</p>
                    <p>Updated Systems: {result.details.updatedSystems}</p>
                    <p>Regions Processed: {result.details.regionCenters.join(', ')}</p>
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