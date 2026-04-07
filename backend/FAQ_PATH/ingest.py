import pandas as pd


def load_multiple_datasets(file_paths):
    dfs = []

    for path in file_paths:
        df = pd.read_csv(path, encoding="utf-8", on_bad_lines="skip")
        dfs.append(df)

    # Combine all datasets
    combined_df = pd.concat(dfs, ignore_index=True)

    return combined_df


def create_chunks(df):
    chunks = []

    for _, row in df.iterrows():
        # Handle different column names safely
        issue = ""
        solution = ""

        # Try common column names
        if "ticket_description" in df.columns:
            issue = str(row.get("ticket_description", ""))
        elif "issue" in df.columns:
            issue = str(row.get("issue", ""))

        if "resolution" in df.columns:
            solution = str(row.get("resolution", ""))
        elif "solution" in df.columns:
            solution = str(row.get("solution", ""))

        text = f"Issue: {issue} Solution: {solution}"
        chunks.append(text)

    return chunks