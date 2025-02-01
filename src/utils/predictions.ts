import * as tf from '@tensorflow/tfjs';

export interface PredictionData {
  year: number;
  actualValue?: number;
  predictedValue: number;
  fournisseur: string;
  axe: string;
}

export async function generatePredictions(
  historicalData: Array<any>,
  yearsToPredict: number = 10
): Promise<PredictionData[]> {
  console.log("Début de la génération des prédictions avec les données brutes:", historicalData);

  // Filtrer et transformer les données valides
  const validData = historicalData
    .filter(entry => {
      const hasRequiredFields = 
        entry.Fournisseur && 
        entry.Axe && 
        entry.Annee && 
        entry.Montant !== undefined && 
        entry.Montant !== null;
      
      if (!hasRequiredFields) {
        console.log("Ligne ignorée car données manquantes:", entry);
      }
      return hasRequiredFields;
    })
    .map(entry => ({
      fournisseur: String(entry.Fournisseur),
      axe: String(entry.Axe),
      year: typeof entry.Annee === 'string' ? parseInt(entry.Annee) : entry.Annee,
      value: typeof entry.Montant === 'string' ? parseFloat(entry.Montant.replace(/[^\d.-]/g, '')) : entry.Montant
    }))
    .filter(entry => !isNaN(entry.year) && !isNaN(entry.value));

  console.log("Données valides après filtrage:", validData);

  if (validData.length === 0) {
    throw new Error("Aucune donnée valide trouvée pour générer les prédictions");
  }

  // Grouper les données par fournisseur et axe
  const groupedData = new Map<string, Array<{ year: number; value: number }>>();
  
  validData.forEach(entry => {
    const key = `${entry.fournisseur}-${entry.axe}`;
    if (!groupedData.has(key)) {
      groupedData.set(key, []);
    }
    groupedData.get(key)?.push({
      year: entry.year,
      value: entry.value
    });
  });

  const allPredictions: PredictionData[] = [];

  // Pour chaque groupe, générer des prédictions
  for (const [key, data] of groupedData.entries()) {
    const [fournisseur, axe] = key.split('-');
    
    if (data.length < 2) {
      console.log(`Données insuffisantes pour ${fournisseur}-${axe}. Au moins 2 points sont nécessaires.`);
      continue;
    }

    // Trier les données par année
    data.sort((a, b) => a.year - b.year);
    
    try {
      // Préparer les données pour le modèle
      const values = data.map(d => d.value);
      const years = data.map(d => d.year);
      
      // Calculer la moyenne et l'écart-type
      const mean = tf.mean(values);
      const squaredDiffs = tf.sub(values, mean).square();
      const variance = tf.mean(squaredDiffs);
      const standardDeviation = tf.sqrt(variance);

      // Normaliser les données
      const normalizedValues = tf.sub(values, mean).div(standardDeviation);

      // Créer et entraîner le modèle
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
    }
  }

  if (allPredictions.length === 0) {
    throw new Error("Aucune prédiction n'a pu être générée");
  }

  console.log("Prédictions générées avec succès:", allPredictions);
  return allPredictions;
}