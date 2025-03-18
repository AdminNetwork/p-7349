
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash } from "lucide-react";
import type { FinancialFormData } from "@/types/budget";
import { Skeleton } from "@/components/ui/skeleton";

interface EntriesListProps {
  entries: FinancialFormData[];
  onEdit: (entry: FinancialFormData) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
}

export function EntriesList({ entries, onEdit, onDelete, isLoading = false }: EntriesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrées Enregistrées</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-3 w-[180px]" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-9 rounded" />
                  <Skeleton className="h-9 w-9 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">Aucune entrée n'a été enregistrée.</p>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{entry.axeIT1}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.annee} - {entry.fournisseur}
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
        )}
      </CardContent>
    </Card>
  );
}
