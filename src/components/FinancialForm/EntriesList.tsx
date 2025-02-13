
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash } from "lucide-react";
import type { FinancialFormData } from "@/types/budget";

interface EntriesListProps {
  entries: FinancialFormData[];
  onEdit: (entry: FinancialFormData) => void;
  onDelete: (id: number) => void;
}

export function EntriesList({ entries, onEdit, onDelete }: EntriesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrées Enregistrées</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">{entry.axeIT}</p>
                <p className="text-sm text-muted-foreground">
                  {entry.annee} - {entry.contrePartie}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(entry)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => entry.id && onDelete(entry.id)}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
