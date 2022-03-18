import pandas as pd
import numpy as np
import re
total_genes = []
total_name = []

df_name_id_same = pd.read_csv("./static/data/input_check/name_id_same.csv")
df_name_id = pd.read_csv("./static/data/input_check/name_map_id.csv")
df_orf = pd.read_csv("./static/data/yeast_genome/ORF.csv")
total_genes = df_orf['Systematic Name'].tolist()
total_name = dict(zip(df_name_id['Name/Alias'].apply(lambda x: x.upper()).tolist(),df_name_id['Name/Alias'].tolist()))

def string_process(x):
    global total_genes, total_name
    if str(x)=="nan":
        return x

    if "".join(x.split()).upper() in total_genes:
        return "".join(x.split()).upper()

    if "".join(x.split()).upper() in total_name:
        return total_name["".join(x.split()).upper()]
    
    if re.search(" +", x) or x=="\n" or x =="":
        return np.NaN
    
    return x

def input_check(df_input):
    global df_name_id_same, df_name_id, df_orf, total_genes, total_name
    # Check for ambiguity

    for col in df_input:
        df_input[col] = df_input[col].apply(lambda x: string_process(x))
     
    data = {}
    data["isError"] = False
    for col in df_input.columns:
        data[col] = []
        tmp = df_input[col].isin(df_name_id_same["Name/Alias"])
        if tmp.any():
            df_input[col] = df_input[col][~tmp] # exclude name id same gene
            itmes = df_input[col][tmp].tolist()
            for item in itmes:
                tmp = df_name_id_same["Name/Alias"] == item
                record = [
                    item,
                    item + ", " + df_name_id_same["Systematic Name"][tmp].tolist()[0],
                ]
                data[col].append(record)
                data["isError"] = True
        tmp = df_input[col].isin(df_name_id["Name/Alias"])
        if tmp.any():
            items = df_input[col][tmp].tolist()
            for item in items:
                tmp = df_name_id["Name/Alias"] == item
                ids = eval(df_name_id["Systematic Name"][tmp].tolist()[0])
                if len(ids) > 1:
                    record = [item, ", ".join(ids)]
                    data[col].append(record)
                    data["isError"] = True
                    tmp = df_input[col] == item
                    df_input[col] = df_input[col][~tmp] 
                else:
                    tmp = df_input[col] == item
                    df_input[col][tmp] = ids[0]

        df_tmp = df_input[col][df_input[col].notna()]
        tmp = df_tmp.isin(df_orf["Systematic Name"])
        if not tmp.all():
            items = df_tmp[~tmp].tolist()
            for item in items:
                record = [item, "Unknown ID"]
                data[col].append(record)
                data["isError"] = True
        df_input[col] = df_input[col][df_input[col].isin(df_orf["Systematic Name"])]

    return data, df_input
