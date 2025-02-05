import * as tf from '@tensorflow/tfjs';
import type { BudgetData, DetailedPredictionData } from '@/types/budget';

export type { DetailedPredictionData as PredictionData };

function getYearFromColumnName(columnName: string): number | null {
  const match = columnName.match(/(?:ANNEE|BUDGET|PLAN)_(\d{4})/);
  return match ? parseInt(match[1]) : null;
}

function extractAvailableYears(data: BudgetData): {
  actualYears: number[];
  budgetYears: number[];
  planYears: number[];
} {
  const years = {
    actualYears: [],
    budgetYears: [],
    planYears: []
  };

  Object.keys(data).forEach(key => {
    const year = getYearFromColumnName(key);
    if (!year) return;

    if (key.startsWith('ANNEE_')) {
      years.actualYears.push(year);
    } else if (key.startsWith('BUDGET_')) {
      years.budgetYears.push(year);
    } else if (key.startsWith('PLAN_')) {
      years.planYears.push(year);
    }
  });

  return {
    actualYears: [...new Set(years.actualYears)].sort(),
    budgetYears: [...new Set(years.budgetYears)].sort(),
    planYears: [...new Set(years.planYears)].sort()
  };
}

export async function generatePredictions(
  historicalData: BudgetData[],
  yearsToPredict: number = 10
): Promise<DetailedPredictionData[]> {
  console.log("Début de la génération des prédictions avec les données:", historicalData);

  if (!historicalData || historicalData.length === 0) {
    console.error("Aucune donnée historique fournie");
    return [];
  }

  const allPredictions: DetailedPredictionData[] = [];
  const currentYear = new Date().getFullYear();
  const maxPredictionYear = currentYear + yearsToPredict;

  // Filter to only keep "Total" rows
  const totalRows = historicalData.filter(entry => 
    entry.Axe_IT?.toLowerCase().includes('total ')
  );

  console.log("Nombre de lignes Total trouvées:", totalRows.length);
  console.log("Lignes Total:", totalRows);

  if (totalRows.length === 0) {
    console.error("Aucune ligne 'Total' trouvée dans les données");
    return [];
  }

  // Process each total row
  for (const entry of totalRows) {
    const axeName = entry.Axe_IT.replace(/total /i, '');
    console.log(`Traitement de l'axe: ${axeName}`);
    
    const { actualYears, budgetYears, planYears } = extractAvailableYears(entry);
    console.log(`Années disponibles pour ${axeName}:`, { actualYears, budgetYears, planYears });

    const dataPoints = [];

    // Process actual values
    actualYears.forEach(year => {
      const realKey = `ANNEE_${year}`;
      if (entry[realKey] !== undefined && entry[realKey] !== null && entry[realKey] !== '') {
        const value = typeof entry[realKey] === 'string' ? 
          parseFloat(entry[realKey].replace(/[^\d.-]/g, '')) : 
          entry[realKey];
        
        if (!isNaN(value)) {
          dataPoints.push({
            year,
            actualValue: value,
            predictedValue: value,
            hasBudget: false
          });
        }
      }
    });

    // Process budget values
    budgetYears.forEach(year => {
      const budgetKey = `BUDGET_${year}`;
      if (entry[budgetKey] !== undefined && entry[budgetKey] !== null) {
        const budgetValue = typeof entry[budgetKey] === 'string' ? 
          parseFloat(entry[budgetKey].replace(/[^\d.-]/g, '')) : 
          entry[budgetKey];

        if (!isNaN(budgetValue)) {
          // Check if we have an "atterrissage" value for this year
          const atterrissageKey = `ATTERISSAGE_${year}`;
          const finalValue = entry[atterrissageKey] !== undefined ? 
            (typeof entry[atterrissageKey] === 'string' ? 
              parseFloat(entry[atterrissageKey].replace(/[^\d.-]/g, '')) : 
              entry[atterrissageKey]) : 
            budgetValue;

          if (!isNaN(finalValue)) {
            dataPoints.push({
              year,
              actualValue: null,
              predictedValue: finalValue,
              hasBudget: true
            });
          }
        }
      }
    });

    // Process plan values
    planYears.forEach(year => {
      const planKey = `PLAN_${year}`;
      if (entry[planKey] !== undefined && entry[planKey] !== null) {
        const planValue = typeof entry[planKey] === 'string' ? 
          parseFloat(entry[planKey].replace(/[^\d.-]/g, '')) : 
          entry[planKey];

        if (!isNaN(planValue)) {
          dataPoints.push({
            year,
            actualValue: null,
            predictedValue: planValue,
            hasBudget: true
          });
        }
      }
    });

    console.log(`Points de données complets pour ${axeName}:`, dataPoints);

    if (dataPoints.length < 2) {
      console.log(`Pas assez de points de données pour ${axeName}, minimum 2 requis`);
      continue;
    }

    try {
      // Filter points for training (exclude years with budget)
      const trainingPoints = dataPoints.filter(point => !point.hasBudget);
      console.log(`Points d'entraînement pour ${axeName}:`, trainingPoints);
      
      // Generate predictions for remaining years up to maxPredictionYear
      const predictions = await generatePredictionsForDataset(trainingPoints, dataPoints, maxPredictionYear - currentYear);
      console.log(`Prédictions générées pour ${axeName}:`, predictions);
      
      predictions.forEach(pred => {
        allPredictions.push({
          ...pred,
          axe: axeName,
          isTotal: true,
          contrepartie: entry.CONTRE_PARTIE,
          libLong: entry.Contrepartie_et_lib_long
        });
      });
    } catch (error) {
      console.error(`Erreur lors de la génération des prédictions pour ${axeName}:`, error);
    }
  }

  console.log("Toutes les prédictions générées:", allPredictions);
  return allPredictions;
}

async function generatePredictionsForDataset(
  trainingPoints: { year: number; actualValue: number | null; predictedValue: number; hasBudget: boolean }[],
  allDataPoints: { year: number; actualValue: number | null; predictedValue: number; hasBudget: boolean }[],
  yearsToPredict: number
): Promise<DetailedPredictionData[]> {
  const values = trainingPoints.map(d => d.predictedValue);
  const years = trainingPoints.map(d => d.year);

  // Normalize data
  const mean = tf.mean(values);
  const std = tf.moments(values).variance.sqrt();
  const normalizedValues = tf.sub(values, mean).div(std);

  // Create and train model
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
  
  await model.compile({
    optimizer: tf.train.adam(0.1),
    loss: 'meanSquaredError'
  });

  const xs = tf.linspace(0, trainingPoints.length - 1, trainingPoints.length);
  await model.fit(xs.reshape([-1, 1]), normalizedValues, {
    epochs: 100,
    verbose: 0
  });

  const predictions: DetailedPredictionData[] = [];

  // Add all historical and budgeted data
  allDataPoints.forEach(d => {
    predictions.push({
      year: d.year,
      actualValue: d.actualValue || undefined,
      predictedValue: d.predictedValue,
      axe: '', // will be filled by calling function
      isTotal: false // will be filled by calling function
    });
  });

  // Generate predictions for future years up to 2030
  const lastYear = Math.max(...allDataPoints.map(d => d.year));
  const lastDataPoint = allDataPoints.find(d => d.year === lastYear);
  
  if (!lastDataPoint?.hasBudget) {
    for (let i = 1; i <= yearsToPredict; i++) {
      const normalizedPrediction = model.predict(
        tf.tensor2d([trainingPoints.length + i - 1], [1, 1])
      ) as tf.Tensor;
      
      const prediction = normalizedPrediction
        .mul(std)
        .add(mean)
        .dataSync()[0];

      if (lastYear + i <= 2030) {
        predictions.push({
          year: lastYear + i,
          predictedValue: Math.max(0, prediction),
          axe: '', // will be filled by calling function
          isTotal: false // will be filled by calling function
        });
      }
    }
  }

  // Clean up tensors
  model.dispose();
  mean.dispose();
  std.dispose();
  normalizedValues.dispose();
  xs.dispose();

  return predictions;
}
