import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Zap, Activity } from "lucide-react";

interface SensorData {
  red: number;
  green: number;
  blue: number;
  clear: number;
  ir: number;
  surface_reflectance: number;
}

interface SensorInputFormProps {
  onSubmit: (data: SensorData) => void;
  isLoading: boolean;
}

const SAMPLE_DATA: SensorData = {
  red: 1250,
  green: 980,
  blue: 760,
  clear: 2100,
  ir: 300,
  surface_reflectance: 0.82,
};

export function SensorInputForm({ onSubmit, isLoading }: SensorInputFormProps) {
  const [data, setData] = useState<SensorData>({
    red: 0, green: 0, blue: 0, clear: 0, ir: 0, surface_reflectance: 0,
  });

  const handleChange = (field: keyof SensorData, value: string) => {
    setData((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const loadSample = () => setData(SAMPLE_DATA);

  const fields: { key: keyof SensorData; label: string; color?: string }[] = [
    { key: "red", label: "Red (R)", color: "text-red-400" },
    { key: "green", label: "Green (G)", color: "text-green-400" },
    { key: "blue", label: "Blue (B)", color: "text-blue-400" },
    { key: "clear", label: "Clear (C)" },
    { key: "ir", label: "IR Reflectance" },
    { key: "surface_reflectance", label: "Surface Reflectance" },
  ];

  return (
    <Card className="border-glow">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle className="font-mono text-lg">Sensor Data Input</CardTitle>
        </div>
        <CardDescription>
          Enter RGB spectral values from your TCS34725 sensor or load sample data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {fields.map(({ key, label, color }) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={key} className={`text-xs font-mono ${color || "text-muted-foreground"}`}>
                {label}
              </Label>
              <Input
                id={key}
                type="number"
                step={key === "surface_reflectance" ? "0.01" : "1"}
                value={data[key] || ""}
                onChange={(e) => handleChange(key, e.target.value)}
                className="font-mono bg-muted/50 border-border"
                placeholder="0"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onSubmit(data)}
            disabled={isLoading || (!data.red && !data.green && !data.blue)}
            className="flex-1 glow-primary"
          >
            {isLoading ? (
              <><Loader2 className="animate-spin" /> Analyzing...</>
            ) : (
              <><Zap /> Classify Plastic</>
            )}
          </Button>
          <Button variant="outline" onClick={loadSample} disabled={isLoading}>
            Load Sample
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
