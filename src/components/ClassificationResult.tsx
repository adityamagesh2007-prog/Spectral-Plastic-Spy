import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Recycle, AlertTriangle, Beaker, Leaf, Clock, Trash2, Brain, BarChart3, ShieldAlert } from "lucide-react";

export interface ClassificationData {
  predicted_plastic: string;
  recycling_code: number;
  confidence_score: number;
  recyclability: string;
  common_uses: string[];
  chemical_structure_summary: string;
  health_risks: string;
  environmental_impact: string;
  decomposition_time_estimate: string;
  recommended_disposal_method: string;
  scientific_reasoning: string;
  alternative_predictions: {
    plastic_type: string;
    confidence: number;
    recycling_code: number;
  }[];
}

function ConfidenceMeter({ score }: { score: number }) {
  const color = score >= 80 ? "bg-primary" : score >= 60 ? "bg-warning" : "bg-destructive";
  const label = score >= 80 ? "High" : score >= 60 ? "Moderate" : "Uncertain";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-muted-foreground">Confidence</span>
        <span>{score}% — {label}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function ImpactBadge({ impact }: { impact: string }) {
  const variant = impact === "Low" ? "default" : impact === "Medium" ? "secondary" : "destructive";
  return <Badge variant={variant}>{impact} Impact</Badge>;
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-sm font-mono text-primary">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <div className="text-sm text-secondary-foreground leading-relaxed pl-6">{children}</div>
    </div>
  );
}

export function ClassificationResult({ data }: { data: ClassificationData }) {
  const isUncertain = data.confidence_score < 60;

  return (
    <div className="space-y-4">
      {/* Main result */}
      <Card className={`border-glow ${isUncertain ? "border-destructive/40" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 font-mono text-xl font-bold text-primary">
                {data.recycling_code}
              </div>
              <div>
                <CardTitle className="text-xl">{data.predicted_plastic}</CardTitle>
                <p className="text-xs text-muted-foreground font-mono">Recycling Code #{data.recycling_code}</p>
              </div>
            </div>
            <ImpactBadge impact={data.environmental_impact} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <ConfidenceMeter score={data.confidence_score} />
          {isUncertain && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Uncertain — Additional sensor data recommended for accurate classification.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed report */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Section icon={Beaker} title="Chemical Structure">{data.chemical_structure_summary}</Section>
          <Separator />
          <Section icon={Brain} title="Scientific Reasoning">{data.scientific_reasoning}</Section>
          <Separator />
          <Section icon={Recycle} title="Recyclability">{data.recyclability}</Section>
          <Separator />
          <Section icon={Leaf} title="Environmental Impact">
            <div className="space-y-1">
              <p>{data.environmental_impact} environmental impact</p>
              <p className="text-muted-foreground">Common uses: {data.common_uses.join(", ")}</p>
            </div>
          </Section>
          <Separator />
          <Section icon={ShieldAlert} title="Health Risks">{data.health_risks}</Section>
          <Separator />
          <Section icon={Clock} title="Decomposition Time">{data.decomposition_time_estimate}</Section>
          <Separator />
          <Section icon={Trash2} title="Recommended Disposal">{data.recommended_disposal_method}</Section>
        </CardContent>
      </Card>

      {/* Alternative predictions */}
      {data.alternative_predictions?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent" />
              <CardTitle className="text-sm font-mono">Alternative Predictions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.alternative_predictions.map((alt, i) => (
                <div key={i} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-4">#{alt.recycling_code}</span>
                    <span className="text-sm">{alt.plastic_type}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{alt.confidence}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
