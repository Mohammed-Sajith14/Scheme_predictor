import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import pickle
import os

def generate_synthetic_data(num_samples=5000):
    np.random.seed(42)
    
    # Generate random features
    age = np.random.randint(15, 80, size=num_samples)
    income = np.random.exponential(scale=200000, size=num_samples) + 20000
    income = np.clip(income, 10000, 1500000)
    
    student_status = np.random.choice([0, 1], p=[0.7, 0.3], size=num_samples)
    # Correct student status for older ages
    student_status = np.where(age > 30, 0, student_status)
    
    farmer_status = np.random.choice([0, 1], p=[0.8, 0.2], size=num_samples)
    disability_status = np.random.choice([0, 1], p=[0.95, 0.05], size=num_samples)
    
    coverage = np.random.uniform(20, 100, size=num_samples)
    rule_match = np.random.uniform(0, 100, size=num_samples)
    # rule_match can't be higher than coverage by definition, so let's clip it
    rule_match = np.minimum(rule_match, coverage)
    
    total_requirements = np.random.randint(1, 6, size=num_samples)
    
    # Target function: calculate realistic probability
    # Base match ratio
    match_ratio = np.where(coverage > 0, rule_match / coverage, 1.0)
    
    # Primary factor is rule_match ratio
    base_prob = match_ratio * 0.7
    
    # Secondary factor is coverage (having more info increases confidence)
    base_prob += (coverage / 100.0) * 0.2
    
    # Small variations based on profile (e.g. low income increases probability of matching welfare)
    income_factor = np.where(income < 200000, 0.08, np.where(income < 500000, 0.03, -0.05))
    base_prob += income_factor
    
    # Add random noise
    noise = np.random.normal(0, 0.05, size=num_samples)
    prob = base_prob + noise
    
    # Clip between 0.0 and 1.0
    prob = np.clip(prob, 0.0, 1.0)
    
    df = pd.DataFrame({
        'age': age,
        'income': income,
        'student_status': student_status,
        'farmer_status': farmer_status,
        'disability_status': disability_status,
        'coverage': coverage,
        'rule_match': rule_match,
        'total_requirements': total_requirements,
        'probability': prob
    })
    
    return df

def train_and_save_model():
    print("Generating synthetic dataset...")
    df = generate_synthetic_data()
    
    X = df[['age', 'income', 'student_status', 'farmer_status', 'disability_status', 'coverage', 'rule_match', 'total_requirements']]
    y = df['probability']
    
    print("Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X, y)
    
    os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model.pkl')
    
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
        
    print(f"Model trained and saved to {model_path}")
    return model_path

if __name__ == '__main__':
    train_and_save_model()
