import pandas as pd
import os

#Load data from a CSV or Parquet file based on the file extension
def load_data(file_path):
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    elif file_path.endswith('.parquet'):
        df = pd.read_parquet(file_path)
    else:
        raise ValueError("Unsupported file format. Use CSV or Parquet")
    
    return df

#Performs data validation checks
def validate_data(df):
    try:
        df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
        print("Timestamp format is valid.")
    except Exception as e:
        print(f"Error converting timestamp format: {e}")

    # Check for duplicates
    duplicates = df[df.duplicated(subset=['timestamp'])]
    if not duplicates.empty:
        print("Duplicates found:")
        print(duplicates)
    else:
        print("No duplicates found.")

    # Check for missing values
    missing_values = df.isnull().sum()
    if missing_values.any():
        print("Missing values found:")
        print(missing_values)
        df = df.dropna()  # Remove rows with missing values
    else:
        print("No missing values found")
    
    return df

#Computes the hourly average of the data
def compute_hourly_average(df, value_column):
    df['value'] = pd.to_numeric(df[value_column], errors='coerce')  # Convert non-numeric values to NaN
    df = df.dropna(subset=['value'])  # Remove rows with missing values
    df = df.copy()  # Create a copy of the data to avoid warnings
    df['Hour'] = df['timestamp'].dt.floor('h')  # Round down to the nearest hour
    hourly_avg = df.groupby('Hour')['value'].mean().reset_index()
    return hourly_avg

#Saves the result to a CSV file
def save_to_csv(df, output_file):
    df.to_csv(output_file, index=False)
    print(f"Result saved to file: {output_file}")
    print() 

# File paths
csv_file = "time_series.csv"
parquet_file = "time_series (4).parquet"

# Process each file
for file_path in [csv_file, parquet_file]:
    if os.path.exists(file_path):
        print(f"--- Processing file: {file_path} ---")
        data = load_data(file_path)
        data = validate_data(data)
        
        # Select the correct value column for each file type
        if file_path.endswith('.csv'):
            value_column = 'value'
        elif file_path.endswith('.parquet'):
            value_column = 'mean_value'
        
        hourly_avg = compute_hourly_average(data, value_column)
        save_to_csv(hourly_avg, f"hourly_avg_{os.path.splitext(file_path)[0]}.csv")
    else:
        print(f"File {file_path} not found")
