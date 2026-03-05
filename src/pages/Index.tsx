import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SensorInputForm } from "@/components/SensorInputForm";
import { ClassificationResult, type ClassificationData } from "@/components/ClassificationResult";
import { useToast } from "@/hooks/use-toast";
import { Microscope, Radio } from "lucide-react";

const Index = () => {
  const [result, setResult] = useState<ClassificationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClassify = async (sensorData: {
    red: number; green: number; blue: number; clear: number; ir: number; surface_reflectance: number;
  }) => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("classify-plastic", {
        body: sensorData,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data as ClassificationData);
    } catch (e: any) {
      toast({
        title: "Classification Failed",
        description: e.message || "Unable to classify plastic. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center gap-3 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Microscope className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">PolySpec AI</h1>
            <p className="text-xs text-muted-foreground font-mono">Optical Polymer Classification System</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Radio className="h-3 w-3 text-primary animate-pulse" />
            <span>Sensor Ready</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container py-8">
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <div className="space-y-4">
            <SensorInputForm onSubmit={handleClassify} isLoading={isLoading} />
            <div className="rounded-lg border border-border bg-card/30 p-4 text-xs text-muted-foreground font-mono space-y-1">
              <p className="text-primary text-xs font-semibold">// System Info</p>
              <p>Sensor: TCS34725 RGB+Clear</p>
              <p>AI Model: Gemini 3 Flash</p>
              <p>Classification: 7-type polymer</p>
              <p>Output: Structured JSON report</p>
            </div>
          </div>

          <div>
            {!result && !isLoading && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/20 p-16 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mb-4">
                  <Microscope className="h-8 w-8 text-primary/40" />
                </div>
                <p className="text-muted-foreground text-sm">Enter sensor readings and click <span className="text-primary font-mono">Classify</span> to begin analysis</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Or load sample data to test the system</p>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-primary/20 bg-card/20 p-16 text-center relative overflow-hidden">
                <div className="absolute inset-0 scan-line" />
                <div className="animate-pulse-glow h-16 w-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
                  <Microscope className="h-8 w-8 text-primary" />
                </div>
                <p className="text-primary font-mono text-sm">Analyzing spectral signature...</p>
                <p className="text-muted-foreground text-xs mt-1">Running polymer classification model</p>
              </div>
            )}

            {result && <ClassificationResult data={result} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
