import os
import re
import collections
import pandas as pd

# Convert the Excel file to a text file
excel_file = "logs.txt.xlsx"
txt_file = "logs.txt"

# Read the Excel file
df = pd.read_excel(excel_file, sheet_name=None)

# Select the first sheet if there are multiple sheets
sheet_name = list(df.keys())[0]  
data = df[sheet_name]

# Save to a text file
data.to_csv(txt_file, index=False, header=True, sep="\t")

# Delete the DataFrame from memory to free up space
del df

print(f"File saved as {txt_file}")

# Define file paths and chunk directory
input_file = txt_file
chunks_dir = os.path.join(os.getcwd(), "log_chunks")
os.makedirs(chunks_dir, exist_ok=True)

# Chunk size
chunk_size = 100000  

# Function to split the log file into smaller chunks
def split_file(input_file, chunk_size):
    with open(input_file, "r", encoding="latin-1") as infile:
        chunk = []
        for i, line in enumerate(infile):
            chunk.append(line)
            if (i + 1) % chunk_size == 0:  
                chunk_file = os.path.join(chunks_dir, f"chunk_{i // chunk_size}.txt")
                with open(chunk_file, "w", encoding="latin-1") as outfile:
                    outfile.writelines(chunk)
                chunk = []  # Clear the chunk after saving

        # Save remaining lines if any
        if chunk:
            chunk_file = os.path.join(chunks_dir, f"chunk_{i // chunk_size + 1}.txt")
            with open(chunk_file, "w", encoding="latin-1") as outfile:
                outfile.writelines(chunk)

# Function to count error codes in a chunk
def count_errors_in_chunk(chunk_file):
    error_counts = collections.Counter()
    pattern = re.compile(r"Error: (\w+)")
    
    with open(chunk_file, "r", encoding="latin-1") as file:
        for line in file:
            match = pattern.search(line)
            if match:
                error_code = match.group(1)
                error_counts[error_code] += 1

    return error_counts

# Function to find the top N most frequent error codes
def get_top_n_errors(N):
    split_file(input_file, chunk_size)  
    total_counts = collections.Counter()

    for chunk_file in os.listdir(chunks_dir):
        chunk_path = os.path.join(chunks_dir, chunk_file)
        chunk_counts = count_errors_in_chunk(chunk_path)
        total_counts.update(chunk_counts)

    return total_counts.most_common(N)

# Get user input for number of top errors to display
N = int(input("Enter N: "))

# Run the script and display results
top_errors = get_top_n_errors(N)
print("\nTop", N, "Errors:")
for error, count in top_errors:
    print(f"{error}: {count}")
