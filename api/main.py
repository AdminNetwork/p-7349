from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from sklearn.linear_model import LinearRegression
import pandas as pd

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BudgetData(BaseModel):
    Axe_IT: str
    Annee: str
    Montant: float
    Contrepartie: Optional[str] = None
    Lib_Long: Optional[str] = None

class PredictionRequest(BaseModel):
    historicalData: List[dict]
    yearsToPredict: int = 10

@app.post("/predict")
async def generate_predictions(request: PredictionRequest):
    try:
        predictions = []
        current_year = 2024  # Année actuelle
        max_prediction_year = 2030

        # Convertir les données en DataFrame
        df = pd.DataFrame(request.historicalData)
        
        for axe in df['Axe_IT'].unique():
            axe_data = df[df['Axe_IT'] == axe]
            
            # Préparer les données d'entraînement
            years = []
            values = []
            
            # Collecter toutes les colonnes contenant des données annuelles
            for year in range(2020, current_year + 1):
                real_key = f'ANNEE_{year}'
                budget_key = f'BUDGET_{year}'
                atterissage_key = f'ATTERISSAGE_{year}'
                plan_key = f'PLAN_{year}'
                
                if real_key in axe_data.columns:
                    value = axe_data[real_key].iloc[0]
                    if pd.notna(value):
                        years.append(year)
                        values.append(float(str(value).replace(',', '')))
                elif budget_key in axe_data.columns:
                    value = axe_data[budget_key].iloc[0]
                    if pd.notna(value):
                        years.append(year)
                        values.append(float(str(value).replace(',', '')))
                elif atterissage_key in axe_data.columns:
                    value = axe_data[atterissage_key].iloc[0]
                    if pd.notna(value):
                        years.append(year)
                        values.append(float(str(value).replace(',', '')))
                elif plan_key in axe_data.columns:
                    value = axe_data[plan_key].iloc[0]
                    if pd.notna(value):
                        years.append(year)
                        values.append(float(str(value).replace(',', '')))

            if len(years) > 1:  # Besoin d'au moins 2 points pour la régression
                X = np.array(years).reshape(-1, 1)
                y = np.array(values)
                
                model = LinearRegression()
                model.fit(X, y)
                
                # Générer les prédictions
                future_years = range(current_year + 1, max_prediction_year + 1)
                X_future = np.array(future_years).reshape(-1, 1)
                future_predictions = model.predict(X_future)
                
                # Ajouter les prédictions à la liste
                for year, pred_value in zip(future_years, future_predictions):
                    predictions.append({
                        "year": int(year),
                        "predictedValue": float(max(0, pred_value)),  # Éviter les valeurs négatives
                        "axe": axe,
                        "isTotal": axe.startswith("Total "),
                        "contrepartie": axe_data['Contrepartie'].iloc[0] if 'Contrepartie' in axe_data.columns else None,
                        "libLong": axe_data['Lib_Long'].iloc[0] if 'Lib_Long' in axe_data.columns else None
                    })

        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)