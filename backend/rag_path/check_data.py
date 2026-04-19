import pandas as pd
import json

def check_data():
    res = {}
    try:
        df1 = pd.read_csv("data/rag_ticket_data.csv", nrows=3)
        res['rag'] = {'cols': df1.columns.tolist(), 'data': df1.head(1).to_dict('records')}
    except Exception as e:
        res['rag'] = str(e)

    try:
        df2 = pd.read_csv("data/aa_dataset-tickets-english-only.csv", nrows=3)
        res['aa'] = {'cols': df2.columns.tolist(), 'data': df2.head(1).to_dict('records')}
    except Exception as e:
        res['aa'] = str(e)

    with open('data_info.json', 'w') as f:
        json.dump(res, f, indent=2)

if __name__ == "__main__":
    check_data()
