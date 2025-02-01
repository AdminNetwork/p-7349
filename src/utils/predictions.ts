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

  const allPredictions: PredictionData[] = [];

  // Pour chaque groupe, générer des prédictions
  for (const [key, data] of groupedData.entries()) {
    const [fournisseur, axe] = key.split('-');
    
    // Trier les données par année
    data.sort((a, b) => a.year - b.year);
    
    // Préparer les données pour le modèle
    const values = data.map(d => d.value);
    const years = data.map(d => d.year);
    
    // Calculer la moyenne
    const mean = tf.mean(values);

    // Calculer l'écart-type manuellement
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
        predictedValue: Math.max(0, prediction), // Éviter les valeurs négatives
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
  }

  console.log("Prédictions générées:", allPredictions);
  return allPredictions;
}