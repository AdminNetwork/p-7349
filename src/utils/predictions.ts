import * as tf from '@tensorflow/tfjs';

export interface PredictionData {
  year: number;
  actualValue?: number;
  predictedValue: number;
  axe: string;
}

export async function generatePredictions(
  historicalData: Array<any>,
  yearsToPredict: number = 10
): Promise<PredictionData[]> {
  console.log("Début de la génération des prédictions avec les données:", historicalData);

  // Identifier les colonnes qui contiennent les années (ANNEE_XXXX)
  const yearColumns = Object.keys(historicalData[0] || {}).filter(key => 
    key.startsWith('ANNEE_') && !isNaN(parseInt(key.split('_')[1]))
  );

  console.log("Colonnes d'années trouvées:", yearColumns);

  // Transformer les données en format utilisable
  const validData = historicalData
    .filter(entry => entry.Axe_IT && entry.Axe_IT.startsWith('Total'))
    .map(entry => {
      const dataPoints = yearColumns.map(col => ({
        year: parseInt(col.split('_')[1]),
        value: typeof entry[col] === 'string' 
          ? parseFloat(entry[col].replace(/[^\d.-]/g, ''))
          : entry[col]
      })).filter(point => !isNaN(point.value));

      return {
        axe: entry.Axe_IT.replace('Total ', ''),
        dataPoints
      };
    })
    .filter(entry => entry.dataPoints.length > 0);

  console.log("Données transformées par axe IT:", validData);

  if (validData.length === 0) {
    throw new Error("Aucune donnée valide trouvée pour générer les prédictions");
  }

  const allPredictions: PredictionData[] = [];

  // Pour chaque axe IT, générer des prédictions
  for (const entry of validData) {
    if (entry.dataPoints.length < 2) {
      console.log(`Données insuffisantes pour l'axe ${entry.axe}`);
      continue;
    }

    try {
      // Préparer les données pour le modèle
      const values = entry.dataPoints.map(d => d.value);
      const years = entry.dataPoints.map(d => d.year);

      // Normaliser les données
      const mean = tf.mean(values);
      const std = tf.moments(values).variance.sqrt();
      const normalizedValues = tf.sub(values, mean).div(std);

      // Créer et entraîner le modèle
      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
      
      await model.compile({
        optimizer: tf.train.adam(0.1),
        loss: 'meanSquaredError'
      });

      const xs = tf.linspace(0, entry.dataPoints.length - 1, entry.dataPoints.length);
      await model.fit(xs.reshape([-1, 1]), normalizedValues, {
        epochs: 100,
        verbose: 0
      });

      // Générer les prédictions
      const lastYear = Math.max(...years);
      for (let i = 1; i <= yearsToPredict; i++) {
        const yearToPredict = lastYear + i;
        const normalizedPrediction = model.predict(
          tf.tensor2d([entry.dataPoints.length + i - 1], [1, 1])
        ) as tf.Tensor;
        
        const prediction = normalizedPrediction
          .mul(std)
          .add(mean)
          .dataSync()[0];

        allPredictions.push({
          year: yearToPredict,
          predictedValue: Math.max(0, prediction),
          axe: entry.axe
        });
      }

      // Ajouter les données historiques
      entry.dataPoints.forEach(d => {
        allPredictions.push({
          year: d.year,
          actualValue: d.value,
          predictedValue: d.value,
          axe: entry.axe
        });
      });

      // Nettoyer les tenseurs
      model.dispose();
      mean.dispose();
      std.dispose();
      normalizedValues.dispose();
      xs.dispose();

    } catch (error) {
      console.error(`Erreur lors de la génération des prédictions pour l'axe ${entry.axe}:`, error);
    }
  }

  if (allPredictions.length === 0) {
    throw new Error("Aucune prédiction n'a pu être générée");
  }

  console.log("Prédictions générées avec succès:", allPredictions);
  return allPredictions;
}