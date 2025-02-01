import * as tf from '@tensorflow/tfjs';

export interface PredictionData {
  year: number;
  actualValue?: number;
  predictedValue: number;
  fournisseur: string;
  axe: string;
}

export async function generatePredictions(
  historicalData: Array<{ fournisseur: string; axe: string; annee: string; montant: number }>,
  yearsToPredict: number = 10
): Promise<PredictionData[]> {
  console.log("Début de la génération des prédictions", historicalData);

  if (!historicalData || historicalData.length === 0) {
    console.error("Données historiques manquantes ou vides");
    throw new Error("Données historiques manquantes ou vides");
  }

  // Vérification des données d'entrée
  const invalidData = historicalData.some(entry => 
    !entry.fournisseur || 
    !entry.axe || 
    !entry.annee || 
    typeof entry.montant !== 'number' ||
    isNaN(entry.montant)
  );

  if (invalidData) {
    console.error("Format des données invalide");
    throw new Error("Format des données invalide - Vérifiez que toutes les entrées sont complètes et valides");
  }

  // Grouper les données par fournisseur et axe
  const groupedData = new Map<string, Array<{ year: number; value: number }>>();
  
  historicalData.forEach(entry => {
    const key = `${entry.fournisseur}-${entry.axe}`;
    if (!groupedData.has(key)) {
      groupedData.set(key, []);
    }
    groupedData.get(key)?.push({
      year: parseInt(entry.annee),
      value: entry.montant
    });
  });

  if (groupedData.size === 0) {
    console.error("Aucun groupe de données valide trouvé");
    throw new Error("Aucun groupe de données valide trouvé");
  }

  const allPredictions: PredictionData[] = [];

  // Pour chaque groupe, générer des prédictions
  for (const [key, data] of groupedData.entries()) {
    const [fournisseur, axe] = key.split('-');
    
    if (data.length < 2) {
      console.warn(`Données insuffisantes pour ${fournisseur}-${axe}. Au moins 2 points sont nécessaires.`);
      continue;
    }

    // Trier les données par année
    data.sort((a, b) => a.year - b.year);
    
    // Préparer les données pour le modèle
    const values = data.map(d => d.value);
    const years = data.map(d => d.year);
    
    try {
      // Calculer la moyenne
      const mean = tf.mean(values);
      const squaredDiffs = tf.sub(values, mean).square();
      const variance = tf.mean(squaredDiffs);
      const standardDeviation = tf.sqrt(variance);

      // Normaliser les données
      const normalizedValues = tf.sub(values, mean).div(standardDeviation);

      // Créer et entraîner un modèle simple de régression
      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
      
      await model.compile({
        optimizer: tf.train.adam(0.1),
        loss: 'meanSquaredError'
      });

      // Entraîner le modèle
      const xs = tf.linspace(0, data.length - 1, data.length);
      await model.fit(xs.reshape([-1, 1]), normalizedValues, {
        epochs: 100,
        verbose: 0
      });

      // Générer les prédictions
      const lastYear = Math.max(...years);
      for (let i = 1; i <= yearsToPredict; i++) {
        const yearToPredict = lastYear + i;
        const normalizedPrediction = model.predict(
          tf.tensor2d([data.length + i - 1], [1, 1])
        ) as tf.Tensor;
        
        const prediction = normalizedPrediction
          .mul(standardDeviation)
          .add(mean)
          .dataSync()[0];

        allPredictions.push({
          year: yearToPredict,
          predictedValue: Math.max(0, prediction),
          fournisseur,
          axe
        });
      }

      // Ajouter les données historiques
      data.forEach(d => {
        allPredictions.push({
          year: d.year,
          actualValue: d.value,
          predictedValue: d.value,
          fournisseur,
          axe
        });
      });

      // Nettoyer les tenseurs
      model.dispose();
      mean.dispose();
      standardDeviation.dispose();
      normalizedValues.dispose();
      xs.dispose();
    } catch (error) {
      console.error(`Erreur lors de la génération des prédictions pour ${fournisseur}-${axe}:`, error);
      throw new Error(`Erreur lors de la génération des prédictions pour ${fournisseur}-${axe}`);
    }
  }

  if (allPredictions.length === 0) {
    console.error("Aucune prédiction n'a pu être générée");
    throw new Error("Aucune prédiction n'a pu être générée");
  }

  console.log("Prédictions générées avec succès:", allPredictions);
  return allPredictions;
}