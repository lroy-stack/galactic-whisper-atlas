import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { galacticCoordinatesToXYZ, validateCoordinates, getRegionZBounds } from '@/lib/galacticCoordinates';
import { TestTube, MapPin, Calculator } from 'lucide-react';

interface TestCase {
  gridCoords: string;
  region: string;
  systemName: string;
  population?: number;
  classification?: string;
  expected?: string;
}

const predefinedTests: TestCase[] = [
  {
    gridCoords: "L-9",
    region: "Core Worlds", 
    systemName: "Coruscant",
    population: 1000000000000, // 1 trillion
    classification: "Capital",
    expected: "Centro galáctico, Z bajo"
  },
  {
    gridCoords: "R-16", 
    region: "Outer Rim",
    systemName: "Tatooine",
    population: 200000,
    classification: "Desert",
    expected: "Outer Rim, Z alto"
  },
  {
    gridCoords: "M-10",
    region: "Mid Rim",
    systemName: "Naboo", 
    population: 600000000,
    classification: "Agricultural",
    expected: "Mid Rim, Z medio"
  },
  {
    gridCoords: "S-5",
    region: "Unknown Regions",
    systemName: "Kamino",
    population: 1000000,
    classification: "Research",
    expected: "Región desconocida, Z muy alto"
  },
  {
    gridCoords: "A-1",
    region: "Core Worlds",
    systemName: "Test System A1",
    population: 0,
    classification: "Uninhabited",
    expected: "Extremo de la galaxia"
  },
  {
    gridCoords: "Z-24", 
    region: "Wild Space",
    systemName: "Test System Z24",
    population: 5000,
    classification: "Frontier",
    expected: "Otro extremo de la galaxia"
  }
];

export default function CoordinateTest() {
  const [customTest, setCustomTest] = useState<TestCase>({
    gridCoords: "L-9",
    region: "Core Worlds",
    systemName: "Custom System",
    population: 1000000,
    classification: "Trade Hub"
  });
  const [results, setResults] = useState<Array<{
    test: TestCase;
    result: any;
    valid: boolean;
    error?: string;
  }>>([]);

  const runTest = (testCase: TestCase) => {
    try {
      const result = galacticCoordinatesToXYZ(
        testCase.gridCoords,
        testCase.region,
        testCase.systemName,
        testCase.population,
        testCase.classification
      );

      if (!result) {
        return {
          test: testCase,
          result: null,
          valid: false,
          error: "Invalid grid coordinates"
        };
      }

      const valid = validateCoordinates(result);
      
      return {
        test: testCase,
        result: {
          ...result,
          // Convert to light-years for display
          x_ly: result.x,
          y_ly: result.y,
          z_ly: result.z,
          // Convert to scene units (1:5000 scale)
          x_scene: result.x / 5000,
          y_scene: result.y / 5000,
          z_scene: result.z / 5000
        },
        valid,
        error: valid ? undefined : "Coordinates out of expected bounds"
      };
    } catch (error) {
      return {
        test: testCase,
        result: null,
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  };

  const runAllTests = () => {
    const allResults = predefinedTests.map(runTest);
    setResults(allResults);
  };

  const runCustomTest = () => {
    const result = runTest(customTest);
    setResults(prev => [result, ...prev]);
  };

  const getRegionInfo = (region: string) => {
    const bounds = getRegionZBounds(region);
    return `Z: ${bounds.min.toLocaleString()} to ${bounds.max.toLocaleString()} ly`;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test de Conversión de Coordenadas Galácticas 3D
        </CardTitle>
        <CardDescription>
          Prueba la función de conversión de coordenadas 2D → 3D antes de aplicarla a la base de datos
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Test buttons */}
        <div className="flex gap-2">
          <Button onClick={runAllTests} className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Ejecutar Tests Predefinidos
          </Button>
        </div>

        {/* Custom test form */}
        <div className="border p-4 rounded-lg space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Test Personalizado
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Coordenadas (ej: L-9)</label>
              <Input 
                value={customTest.gridCoords}
                onChange={(e) => setCustomTest(prev => ({ ...prev, gridCoords: e.target.value }))}
                placeholder="L-9"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Región</label>
              <select 
                className="w-full p-2 border rounded"
                value={customTest.region}
                onChange={(e) => setCustomTest(prev => ({ ...prev, region: e.target.value }))}
              >
                <option value="Core Worlds">Core Worlds</option>
                <option value="Colonies">Colonies</option>
                <option value="Inner Rim">Inner Rim</option>
                <option value="Mid Rim">Mid Rim</option>
                <option value="Outer Rim">Outer Rim</option>
                <option value="Wild Space">Wild Space</option>
                <option value="Unknown Regions">Unknown Regions</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Nombre del Sistema</label>
              <Input 
                value={customTest.systemName}
                onChange={(e) => setCustomTest(prev => ({ ...prev, systemName: e.target.value }))}
                placeholder="Nombre del sistema"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Población</label>
              <Input 
                type="number"
                value={customTest.population || ''}
                onChange={(e) => setCustomTest(prev => ({ ...prev, population: parseInt(e.target.value) || undefined }))}
                placeholder="1000000"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Clasificación</label>
            <Input 
              value={customTest.classification || ''}
              onChange={(e) => setCustomTest(prev => ({ ...prev, classification: e.target.value }))}
              placeholder="Trade Hub, Mining, Capital, etc."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Región {customTest.region}: {getRegionInfo(customTest.region)}
            </p>
          </div>
          <Button onClick={runCustomTest} variant="outline">
            Probar Conversión Personalizada
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold">Resultados de Tests:</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className={`border p-3 rounded-lg ${result.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <strong>{result.test.systemName}</strong> ({result.test.gridCoords})
                      <Badge variant="outline" className="ml-2">
                        {result.test.region}
                      </Badge>
                    </div>
                    <Badge variant={result.valid ? "default" : "destructive"}>
                      {result.valid ? "✓ Válido" : "✗ Error"}
                    </Badge>
                  </div>
                  
                  {result.error && (
                    <p className="text-red-600 text-sm mb-2">{result.error}</p>
                  )}
                  
                  {result.result && (
                    <div className="text-sm space-y-1">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <span className="font-medium">Años Luz:</span>
                          <br />X: {result.result.x_ly.toLocaleString()}
                          <br />Y: {result.result.y_ly.toLocaleString()}
                          <br />Z: {result.result.z_ly.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Unidades 3D:</span>
                          <br />X: {result.result.x_scene.toFixed(1)}
                          <br />Y: {result.result.y_scene.toFixed(1)}
                          <br />Z: {result.result.z_scene.toFixed(1)}
                        </div>
                        <div>
                          <span className="font-medium">Info:</span>
                          <br />Pop: {result.test.population?.toLocaleString() || 'N/A'}
                          <br />Tipo: {result.test.classification || 'N/A'}
                          <br />{result.test.expected || 'Test personalizado'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Información del Test:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Coordenadas válidas: X ±70,000 ly, Y ±65,000 ly, Z ±25,000 ly</li>
            <li>Escala 3D: 1 unidad = 5,000 años luz</li>
            <li>Sistemas más poblados tienden hacia el plano galáctico (Z cerca de 0)</li>
            <li>Tipos "Capital/Trade Hub" se centralizan, "Frontier/Mining" se dispersan</li>
            <li>Cada sistema mantiene posición consistente basada en su nombre</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}