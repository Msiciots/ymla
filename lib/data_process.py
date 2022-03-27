from collections import Counter
import warnings
warnings.filterwarnings("ignore")
import pandas as pd
import numpy as np
# pd.set_option('display.max_rows', None)
# pd.set_option('display.max_columns', None)
import json
import scipy.stats
from statsmodels.stats.multitest import multipletests
from math import log10
import gc
import os, sys, time
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed, wait
# from channels.layers import get_channel_layer
# from asgiref.sync import async_to_sync
from lib.debug import debug

def cal_pvalue(x, input_ids, GENES_No):
    """
    A == No. of intersections
    B == No. of input genes
    C == No. of feature_term genes
    D == No. of total genes
    """

    input_set = set(input_ids)
    term_genes = x["Systematic Name"]
    
    intersections = list(set(term_genes) & input_set)
    A = len(intersections)
    B = len(input_set)
    C = len(term_genes) 
    D = GENES_No

    pvalue_greater = scipy.stats.fisher_exact(
        [[A, C - A], [B - A, D - C - B + A]], "greater"
    )[1]
    if pvalue_greater==0:
        pvalue_greater = sys.float_info.min
    return (pvalue_greater, intersections, A)

def cal_pvalue_quant(x, input_ids, feature):
    """
    A == No. of intersections
    B == No. of input genes
    C == No. of feature_term genes
    D == No. of total genes
    """
    
    total_ids = []
    term_ids = x["Systematic Name"]
    term_name = x[feature]
    term_name = term_name[:term_name.find("(")-1]

    df = pd.read_csv("./static/data/quant_feature/"+term_name+"_data.csv")
    total_ids = df['Systematic Name'].tolist()

    input_ids = list(set(total_ids) & set(input_ids))

    GENES_No = len(total_ids)


    intersections = list(set(term_ids) & set(input_ids))

    A = len(intersections)
    B = len(input_ids)
    C = len(term_ids)
    D = GENES_No
    pvalue_greater = scipy.stats.fisher_exact(
        [[A, C - A], [B - A, D - C - B + A]], "greater"
    )[1]
    if pvalue_greater==0:
        pvalue_greater = sys.float_info.min
    return (pvalue_greater, intersections, A)
def cal_pvalue_custom(x, input_ids, feature,GENES_No):
    """
    A == No. of intersections
    B == No. of input genes
    C == No. of feature_term genes
    D == No. of total genes
    """

    term_ids = x["Systematic Name"]
    term = x[feature]
    if term[-1]==")":
        term_name = term[:term.find("(")-1]
        df = pd.read_csv("./static/data/quant_feature/"+term_name+"_data.csv")
        total_ids = df['Systematic Name'].tolist()
        input_ids = list(set(total_ids) & set(input_ids))
        GENES_No = len(total_ids)
    else: # gene group
        pass

    intersections = list(set(term_ids) & set(input_ids))

    A = len(intersections)
    B = len(input_ids)
    C = len(term_ids)
    D = GENES_No
    pvalue_greater = scipy.stats.fisher_exact(
        [[A, C - A], [B - A, D - C - B + A]], "greater"
    )[1]
    if pvalue_greater==0:
        pvalue_greater = sys.float_info.min
    return (pvalue_greater, intersections, A)
class DataProcess:

    name_map_data_col = {
        "go_f": "Gene Ontology Term", 
        "go_p": "Gene Ontology Term", 
        "go_c": "Gene Ontology Term",
        "complex": "Protein Complex Term",
        "disease": "DO Term",
        "phenotype":"Mutant Phenotype",
        "pathway": "Pathway Name",
        "protein_domain":"Pfam Domain",
    }
    
    def __init__(self, feature, df_input_file, socket_key):
        self.df_idInfo = pd.read_csv("./static/data/yeast_genome/ORF.csv")
        self.GENES_No = len(self.df_idInfo)  # Total gene number
        self.df_input = df_input_file  # user input file
        self.dfs_pvalue = []  # store pvalue processed, dataframe in list.
        self.corr = "FDR"
        self.cut_off = 0.01
        self.bottom_percent = 0
        self.top_percent = 0
        self.yAxis_id = []  # heatmap and table y Axis
        self.df_feature_map_id = 0
        self.df_feature_data = 0
        self.feature = feature
        self.socket_key = socket_key

        f = open('static/config/feature_name_map.json', 'r') 
        self.name_map = json.load(f)
        f = open('static/config/quant_feature.json', 'r') 
        self.quant_feature = json.load(f)

        if feature in self.quant_feature:
            self.quant_feature_preprocess(30,30)
        elif feature == "gene_group":
            self.df_feature_map_id = pd.read_csv("./static/data/gene_group_feature/"+feature+"_map_id.csv")
        elif feature == "custom":
            pass
        else: # Common feature
            self.df_feature_map_id = pd.read_csv("./static/data/common_feature/"+feature+"_map_id.csv")
            self.df_feature_data = pd.read_csv("./static/data/common_feature/"+feature+"_data.csv")

        try:
            self.df_feature_map_id['Systematic Name'] = self.df_feature_map_id['Systematic Name'].apply(lambda x: eval(x))
        except:
            pass

        gc.enable()

        # debug(self.df_feature_map_id,"before self.df_feature_map_id")

        # self.filter_gene(gene_orf)

        # debug(self.df_feature_map_id,"after self.df_feature_map_id")

        # self.df_feature_map_id = filter_gene(self.df_feature_map_id,gene_orf)


    # def filter_gene(self, bg_gene):
    #     try:
    #         self.df_feature_map_id['Systematic Name'] = self.df_feature_map_id['Systematic Name'].apply(lambda x: eval(x))
    #     except:
    #         pass
            
    #     if self.feature == "gene_group":
    #         self.df_input = self.df_input[self.df_input.isin(bg_gene)]
    #         self.GENES_No = len(bg_gene)
    #         debug(self.df_input,'self.df_input')

    #     elif self.feature not in self.quant_feature:
            

    #         # debug(self.df_feature_map_id,"before self.df_feature_map_id")

    #         self.df_feature_map_id['Systematic Name'] = self.df_feature_map_id['Systematic Name'].apply(lambda x: sorted(list(set(x) & set(bg_gene))))
    #         self.df_feature_map_id['count'] = self.df_feature_map_id['Systematic Name'].apply(lambda x: len(x))
    #         self.df_feature_map_id = self.df_feature_map_id[self.df_feature_map_id['count'] >= 1]
        
       
    #         gene_list = self.df_feature_map_id['Systematic Name'].tolist()
    #         total_gene = []
    #         for l in gene_list:
    #             total_gene += l
    #         self.df_input = self.df_input[self.df_input.isin(list(set(total_gene)))]
          
    #         self.GENES_No = len(list(set(total_gene)))
 

    def quant_feature_preprocess(self, low, high):
        """
        Build df_feature_map_id for quant feature
        """
        self.bottom_percent = low
        self.top_percent = high
        term = []
        count = []
        systematic_name = []
        # self.df_feature_data = {}

        for f in self.quant_feature[self.feature]:
            df = pd.read_csv("./static/data/quant_feature/"+f+"_data.csv")   
            row_no = len(df)
            low_no = row_no * (low/100)
            high_no = row_no * ((100-high)/100)
            low_group = df['Systematic Name'][df.index <= low_no].tolist()
            high_group = df['Systematic Name'][df.index >= high_no].tolist()

            term.append(f+" (B "+str(low)+"%)")
            count.append(len(low_group))
            systematic_name.append(low_group)
            term.append(f+" (T "+str(high)+"%)")
            count.append(len(high_group))
            systematic_name.append(high_group)

        data = {
            self.feature : term,
            'count' : count,
            'Systematic Name':systematic_name,
        }

        self.df_feature_map_id = pd.DataFrame(data = data)
        return self

    def custom_feature_preprocess(self, feature_term,low, high):

        gene_group_map_id = pd.read_csv("./static/data/gene_group_feature/gene_group_map_id.csv")
        gene_group_term = gene_group_map_id['gene_group'].tolist()
        
        gp_terms = list(set(feature_term) & set(gene_group_term))
        qu_terms = list(set(feature_term) - set(gene_group_term))
        self.df_feature_map_id = gene_group_map_id[gene_group_map_id['gene_group'].isin(gp_terms)]
        self.df_feature_map_id = self.df_feature_map_id.rename(columns={"gene_group": "custom"})
        
        try:
            self.df_feature_map_id['Systematic Name'] = self.df_feature_map_id['Systematic Name'].apply(lambda x: eval(x))
        except:
            pass

        if qu_terms:
            data = {}
            data['custom'] = []
            data['count'] = []
            data['Systematic Name'] = []

            for term in qu_terms:
                term_name = term[:term.find('(')-1]
                df = pd.read_csv('./static/data/quant_feature/'+term_name+'_data.csv')
                index = 0
                genes = []
                if term[-2] == "B":
                    index = (low/100)*len(df)
                    genes = df['Systematic Name'][df.index <= index].tolist()
                    data['custom'].append(term_name+" (B "+str(low)+"%)")
                elif term[-2] == "T":
                    index = ((100-high)/100)*len(df)
                    genes = df['Systematic Name'][df.index >= index].tolist()
                    data['custom'].append(term_name+" (T "+str(high)+"%)")
                
                data['count'].append(len(genes))
                data['Systematic Name'].append(genes)

            df_quant = pd.DataFrame(data=data)
            self.df_feature_map_id = self.df_feature_map_id.append(df_quant)

        self.df_feature_map_id = self.df_feature_map_id.reset_index(drop=True)
        return self
            
    def enrichment_parallelize(self):
        r = []
        self.dfs_pvalue = []
        with ProcessPoolExecutor() as executor:
            input_index = 0
            for column in self.df_input:
                self.dfs_pvalue.append(0)
                t = executor.submit(self._enrichment_analysis,self.df_input[column].dropna().tolist(),input_index)
                r.append(t)
                input_index += 1
             
            for res in as_completed(r):
                tmp = res.result()
                self.dfs_pvalue[tmp[0]] = tmp[1]
    
        # if self.feature != "custom":
        #     channel_layer = get_channel_layer()
        #     async_to_sync(channel_layer.group_send)(self.socket_key, {
        #         'type': 'log_message',
        #         # 'log': " "+self.feature+" finished: {0:.2f}\n".format(end-start)
        #         # 'log': "Analyze Feature ( "+self.name_map[self.feature]+" ): Done"
        #         'log': str(self.progress_unit)
        #     })
            
        return self 
        
    def _enrichment_analysis(self, input_ids, input_index):
        df = self.df_feature_map_id

        if self.feature in self.quant_feature:
            df["pvalue"], df["genes_intersec"], df["intersec_no"]= zip(
                *df.apply(cal_pvalue_quant, axis=1, args=([input_ids,self.feature]))
            )
        elif self.feature=="custom":
            df["pvalue"], df["genes_intersec"], df["intersec_no"]= zip(
                *df.apply(cal_pvalue_custom, axis=1, args=([input_ids,self.feature,self.GENES_No]))
            )
        else:
            df["pvalue"], df["genes_intersec"], df["intersec_no"] = zip(
                *df.apply(cal_pvalue, axis=1, args=([input_ids, self.GENES_No]))
            )
        
        df["FDR"] = multipletests(df["pvalue"].tolist(), method="fdr_bh")[1]
        df["Bonferroni"] = multipletests(df["pvalue"].tolist(), method="bonferroni")[1]
        df["pvalue"] = df["pvalue"].apply(lambda x: round(-1 * log10(x), 1))
        df["FDR"] = df["FDR"].apply(lambda x: round(-1 * log10(x), 1))
        df["Bonferroni"] = df["Bonferroni"].apply(lambda x: round(-1 * log10(x), 1))

        return [input_index, df]
    
    def result(self, cut_off, correction, socket_key):
        '''
        Process data which render heatmap, table and network in front end  
        '''
        self.cut_off = round(-log10(cut_off), 1)
        self.corr = correction

        self.yAxis_id = []
        # for df in dic_pvalue[select_feature]:
        for df in self.dfs_pvalue:
            df = df[df[self.corr] >= self.cut_off].sort_values(by=self.corr, ascending=False)
            self.yAxis_id += df.index.tolist()
    
        if (self.feature in self.quant_feature) or (self.feature == "custom"):
            self.yAxis_id = sorted(list(set(self.yAxis_id)), reverse=True)
        else:
            counter=Counter(self.yAxis_id)
            self.yAxis_id = [ k for k,v in reversed(counter.most_common())]

        yAxis_categories = list(
            map(
                lambda x: '<a href="/YMLA/show_row_detail?term='+self.df_feature_map_id[self.feature][x]+'&feature='+self.feature+'&socket_key='+socket_key+'" target="_blank">'
                + self.df_feature_map_id[self.feature][x]
                + "</a>",
                self.yAxis_id,
            )
        )
        xAxis_categories = []
        i = 0
        for col in self.df_input.columns:
            l = self.dfs_pvalue[i][self.corr][self.dfs_pvalue[i][self.corr] >= self.cut_off].reindex(self.yAxis_id).dropna().tolist()
            if l:
                xAxis_categories.append('<a href="/YMLA/show_column_detail?column_name='+col+'&feature='+self.feature+'&socket_key='+socket_key+'" target="_blank">'
                + col
                + "</a>")
            else:
                xAxis_categories.append(col)
            i += 1

        # xAxis_categories = list(
        #     map(
        #         lambda x: '<a href="/show_column_detail?column_name='+x+'&feature='+self.feature+'&socket_key='+socket_key+'" target="_blank">'
        #         + x
        #         + "</a>",
        #         list(self.df_input.columns),
        #     )
        # )

        table_data = {}
        for i in range(len(self.dfs_pvalue)):
            table_data[i] = []

        nodes = []
        edges = []
        # Gene group feature and quant feature additionally plot network
        if self.feature in self.quant_feature or self.feature == "gene_group" or self.feature == "custom":
            for col in self.df_input.columns:
                nodes.append({"id":col, "marker":{"radius":30,}, "color":"#FFDEDE", "mass":2})
                edges.append([col, col])

            cell_data = []  # store <= cut_off
            y_index = 0

            img_file = open("./lib/img/feature")      
            rec_url = img_file.readline() 

            pmax = self.dfs_pvalue[0][self.corr].max()
            for df in self.dfs_pvalue:
                m = df[self.corr].max()
                if m > pmax:
                    pmax = m
                
            for id in self.yAxis_id:
                x_index = 0
                name = self.df_feature_map_id[self.feature][id]
                nodes.append({"id":name, "marker":{"radius":25,"width":len(name)*7+12,"height":40,"symbol": "url(data:image/png;base64,"+rec_url+")",}, "color":'#9ccaf5', "mass":1})
                # nodes.append({"id":name, "marker":{"radius":15,}, "color":"#34A853"})
                for col_name in list(self.df_input.columns):
                    cell_data.append(
                        dict(
                            zip(
                                ["x", "y", "value", "id","color"],
                                [
                                    x_index,
                                    y_index,
                                    self.dfs_pvalue[x_index][self.corr][id],
                                    str(x_index) + "_" + str(id),
                                    "#FFFFFF" if self.dfs_pvalue[x_index][self.corr][id] < self.cut_off else "",
                                ],
                            )
                        )
                    )
                    table_data[x_index].append(self.dfs_pvalue[x_index][self.corr][id])
                    if self.dfs_pvalue[x_index][self.corr][id] >= self.cut_off:
                        p = self.dfs_pvalue[x_index][self.corr][id] 
                        line_width = (p/pmax)*8        
                        edges.append([col_name, self.df_feature_map_id[self.feature][id], self.dfs_pvalue[x_index][self.corr][id],line_width]) 

                    x_index += 1
                y_index += 1
        else:  # Common feature don't plot network
            cell_data = []  # store <= cut_off
            y_index = 0
            for id in self.yAxis_id:
                x_index = 0
                for col_name in list(self.df_input.columns):
                    cell_data.append(
                        dict(
                            zip(
                                ["x", "y", "value", "id","color"],
                                [
                                    x_index,
                                    y_index,
                                    self.dfs_pvalue[x_index][self.corr][id],
                                    str(x_index) + "_" + str(id),
                                    "#FFFFFF" if self.dfs_pvalue[x_index][self.corr][id] < self.cut_off else "",
                                ],
                            )
                        )
                    )
                    table_data[x_index].append(self.dfs_pvalue[x_index][self.corr][id])

                    x_index += 1
                y_index += 1
            
        data = {
            "cut_off": self.cut_off,
            "xAxis_categories": json.dumps(xAxis_categories),
            "yAxis_categories": json.dumps(yAxis_categories),
            "yAxis_id": json.dumps(self.yAxis_id),
            "yAxis_count": len(self.yAxis_id),
            "table_data": json.dumps(table_data),
            "heatmap_data": json.dumps(cell_data),
            "nodes": json.dumps(nodes),
            "edges": json.dumps(edges),
            "socket_key":socket_key,
        }
    
        return self, data
    
    def block_detail(self,click_block_id):
 
        input_index, term_index = click_block_id.split("_")
        input_index, term_index = int(input_index), int(term_index)
        input_column = self.df_input.columns[input_index]
        term_gene_no = self.df_feature_map_id["count"][term_index]
        input_term_gene_no = self.dfs_pvalue[input_index]["intersec_no"][term_index]
        input_total_gene_no = len(self.df_input[input_column].dropna().tolist())

        input_ids = self.df_input[self.df_input.columns[input_index]].dropna().tolist()
        

        term = self.df_feature_map_id[self.feature][term_index]
        GENES_No = self.GENES_No

        # data of intersection genes  
        genes_intersec = self.dfs_pvalue[input_index]["genes_intersec"][term_index]
        df = self.df_idInfo[self.df_idInfo['Systematic Name'].isin(genes_intersec)]
        df = df[['Systematic Name','Standard Name','Sgd Alias','Description']]
        df = df.replace(np.nan, ' ', regex=True)
        intersection_genes_data = df.to_dict('records')
        df = pd.DataFrame()
        
        # Create Evidence table content for each feature term
        if term[-1] == ")":
            term_name = term[:term.find("(")-1]
            df_feature_data = pd.read_csv("./static/data/quant_feature/"+term_name+"_data.csv")
            input_genes = self.df_input[input_column].dropna().tolist()
            input_genes = list(set(input_genes)&set(df_feature_data['Systematic Name'].tolist()))
            input_total_gene_no = len(input_genes)
            GENES_No = len(df_feature_data)
            df = df_feature_data[df_feature_data['Systematic Name'].isin(genes_intersec)]
            df['Standard Name'] = df['Systematic Name'].map(dict(zip(self.df_idInfo['Systematic Name'], self.df_idInfo['Standard Name'])))
            df['Systematic Name'] = df['Systematic Name'].map(dict(zip(self.df_idInfo['Systematic Name'], self.df_idInfo['gene_link'])))
            df = df[['Systematic Name','Standard Name',term_name]]
            df = df.fillna('')
        elif self.feature == "gene_group" or self.feature == "custom":
            term = self.df_feature_map_id['term_link'][term_index]
            df = self.df_idInfo[self.df_idInfo['Systematic Name'].isin(genes_intersec)]
            df = df[['gene_link','Standard Name']]
            df = df.rename(columns={"gene_link": "Systematic Name"})
            df['Evidence'] = [self.df_feature_map_id['Evidence'][term_index]]*len(df)
        elif self.feature == "genetic_interaction" or self.feature == "physical_interaction":
            gene_id = self.df_feature_map_id[self.feature+"_id"][term_index]
            term = self.df_feature_data['term_link'][self.df_feature_data['Systematic Name (Bait)'] == gene_id].tolist()[0]
            if not term:
                term = self.df_feature_data['term_link'][self.df_feature_data['Systematic Name (Hit)'] == gene_id].tolist()[0]
            df1 = self.df_feature_data[self.df_feature_data['Systematic Name (Bait)'] == gene_id]
            df2 = self.df_feature_data[self.df_feature_data['Systematic Name (Hit)'] == gene_id]
            df = pd.concat([df1, df2], ignore_index=True)
            cols = ['Bait_link','Standard Name (Bait)','Hit_link','Standard Name (Hit)','Experiment Type','Reference']
            df = df[cols]
            df = df.rename(columns={"Bait_link": "Systematic Name (Bait)",'Hit_link':"Systematic Name (Hit)"})
        elif self.feature == "regulator":
            gene_id = self.df_feature_map_id[self.feature+"_id"][term_index]
            term = self.df_feature_data['term_link'][self.df_feature_data[self.feature] == gene_id].tolist()[0]
            df = self.df_feature_data[self.df_feature_data[self.feature] == gene_id]
            df = df[['gene_link','Standard Name','Regulation Evidence','Reference']]
            df = df.rename(columns={"gene_link": "Systematic Name"})
        else:
            df = self.df_feature_data[self.df_feature_data['Systematic Name'].isin(genes_intersec)]
            df = df[df[self.feature] == term]
            cols = list(df.columns)
            gl_index, tl_index = cols.index('gene_link'), cols.index('term_link')
            cols[cols.index('Systematic Name')], cols[cols.index(self.feature)] = "gene_link", 'term_link'
            del cols[gl_index], cols[tl_index]
            df = df[cols]
            df = df.rename(columns={"gene_link": "Systematic Name",'term_link':self.name_map_data_col[self.feature]})
            df = df.reset_index(drop=True)
            term = self.df_feature_data['term_link'][self.df_feature_data[self.feature] == term].tolist()[0]
            if "Reference" in df.columns:
                if df['Reference'][0] == " ":
                    df = df.drop('Reference', 1)

        df = df.replace(np.nan, ' ', regex=True)
        evidence_data = df.to_dict('index')
        raw_data_col = list(df.columns)

        data = {
            "term": term,
            "Expected_ratio": str(term_gene_no)
            + " / "
            + str(GENES_No)
            + " ( "
            + str(round(term_gene_no * 100 / GENES_No, 2))
            + "% )",
            "Observed_ratio": '<spin style="color:red;">' + str(input_term_gene_no) + '</spin>'
            + " / "
            + str(input_total_gene_no)
            + " ( "
            + str(round(input_term_gene_no * 100 / input_total_gene_no, 2))
            + "% )",
            "P_value": self.dfs_pvalue[input_index][self.corr][term_index],
            "corr": self.corr,
            "cut-off": self.cut_off,
            "feature_type": self.feature,
            "input_no": len(self.df_input[input_column].dropna()),
            "percent": "TOP {}%".format(self.top_percent) if term[-6] == "T" else "BOTTOM {}%".format(self.bottom_percent),
            # "feature_data": json.dumps(feature_data),
            "input_title": self.df_input.columns[input_index],
            "intersection_number": str(self.dfs_pvalue[input_index]["intersec_no"][term_index]),
            "raw_data_col": raw_data_col,
            "evidence_data": json.dumps(evidence_data),
            "intersection_genes_data": json.dumps(intersection_genes_data),
        }
        return self, data

    def column_detail(self, column_name, socket_key):


        column_index = list(self.df_input.columns).index(column_name)
        # for i in self.df_input.columns:
        #     if i == column_name:
        #         break
        #     column_index += 1

        table_data = {}
        dict_index = 0
        volcano_data = []
        input_total_gene_no = len(self.df_input[column_name].dropna().tolist())
        # Create every row in Table View
        for term_index in self.yAxis_id:
            # Only show >= cutoff
            if self.dfs_pvalue[column_index][self.corr][term_index] >= self.cut_off:
                term = self.df_feature_map_id[self.feature][term_index]
                GENES_No = self.GENES_No
                table_data[dict_index] = {}
                table_data[dict_index]["ID"] = term_index
                term_gene_no = self.df_feature_map_id["count"][term_index]      
                input_term_gene_no = self.dfs_pvalue[column_index]["intersec_no"][term_index]

                if term[-1] == ")":
                    term_name = term[:term.find("(")-1]
                    df = pd.read_csv("./static/data/quant_feature/"+term_name+"_data.csv")
                    GENES_No = len(df)
                    total_ids = df['Systematic Name'].tolist()
                    input_ids = self.df_input[column_name].tolist()
                    input_total_gene_no = len(list(set(input_ids) & set(total_ids)))
                    table_data[dict_index]["input_no"] = "<a onclick=\"return false;\" href='#' id='data_"+str(term_index)+"_A'>"+str(input_total_gene_no)+"</a>"
                    table_data[dict_index]["term_no"] = "<a onclick=\"return false;\" href='#' id='data_"+str(term_index)+"_D'>"+str(term_gene_no)+"</a>"
                    table_data[dict_index]["data_no"] = "<a onclick=\"return false;\" href='#' id='data_"+str(term_index)+"_C'>"+str(GENES_No)+"</a>"
                else:
                    table_data[dict_index]["input_no"] = str(input_total_gene_no)
                    table_data[dict_index]["term_no"] = str(term_gene_no)
                    table_data[dict_index]["data_no"] =str(GENES_No)

                table_data[dict_index]["Observed_ratio"] = str(round(input_term_gene_no * 100 / input_total_gene_no, 2))
                table_data[dict_index]["Expected_ratio"] = " ( "+ str(round(term_gene_no * 100 / GENES_No, 2))+ "% )"
                table_data[dict_index]["insection_no"] = str(input_term_gene_no)
                fold_change = round((input_term_gene_no / input_total_gene_no)/(term_gene_no / GENES_No),2)
                table_data[dict_index]["Fold_change"] = fold_change

                if term[-1] == ")":
                    table_data[dict_index]["term"] = self.df_feature_map_id[self.feature][term_index]
                elif self.feature == "gene_group" or self.feature == "custom":
                    table_data[dict_index]["term"] = self.df_feature_map_id["term_link"][term_index]
                elif self.feature == "physical_interaction" or self.feature == "genetic_interaction":
                    gene_id = self.df_feature_map_id[self.feature+"_id"][term_index]
                    term_list = self.df_feature_data["term_link"][self.df_feature_data['Systematic Name (Bait)'] == gene_id].tolist()
                    if not term_list:
                        term_list = self.df_feature_data["term_link"][self.df_feature_data['Systematic Name (Hit)'] == gene_id].tolist()
                    table_data[dict_index]["term"] = term_list[0]
                elif self.feature == "regulator":
                    gene_id = self.df_feature_map_id[self.feature+"_id"][term_index]
                    table_data[dict_index]["term"] = self.df_feature_data["term_link"][self.df_feature_data[self.feature] == gene_id].tolist()[0]
                else:
                    table_data[dict_index]["term"] = self.df_feature_data["term_link"][self.df_feature_data[self.feature] == term].tolist()[0]

                table_data[dict_index]["P-value"] = self.dfs_pvalue[column_index][self.corr][term_index]
     
                # volcano_data.append(
                #     dict(
                #         zip(
                #             ["x", "y", "name","index"],
                #             [
                #                 fold_change,
                #                 self.dfs_pvalue[column_index][self.corr][term_index],
                #                 self.df_feature_map_id[self.feature][term_index],
                #                 dict_index,
                #             ],
                #         )
                #     )
                # )

                dict_index += 1
        data = {
            "click_column_name": column_name,
            "click_column_index": column_index,
            "feature": self.feature,
            "input_no": len(self.df_input[column_name].dropna()),
            "corr": self.corr,
            "cut-off": self.cut_off,
            "table_data": json.dumps(table_data),
            # "volcano_data": json.dumps(volcano_data),
            "socket_key":socket_key,
            "quant_terms": ", ".join(self.quant_feature[self.feature]) if self.feature in self.quant_feature else "",
            "bottom_percent": str(self.bottom_percent)+"%",
            "top_percent": str(self.top_percent)+"%",
        }

        return data

    def row_detail(self, term, socket_key):
        dict_index = 0
        click_row_detail = {}
        term_index = self.df_feature_map_id.index[
            self.df_feature_map_id[self.feature] == term
        ].tolist()[0]
        term_gene_no = self.df_feature_map_id["count"][term_index]
        volcano_data = []

        GENES_No = self.GENES_No

        for input_index in range(len(self.df_input.columns)):
            input_term_gene_no = self.dfs_pvalue[input_index]["intersec_no"][term_index]
            input_total_gene_no = len(self.df_input[self.df_input.columns[input_index]].dropna().tolist())
            if term[-1] == ")":
                term_name = term[:term.find("(")-1]
                df = pd.read_csv("./static/data/quant_feature/"+term_name+"_data.csv")
                GENES_No = len(df)
                total_ids = df['Systematic Name'].tolist()
                input_ids = self.df_input[self.df_input.columns[input_index]].tolist()
                input_total_gene_no = len(list(set(input_ids) & set(total_ids)))
                input_no = "<a onclick=\"return false;\" href='#' id='data_A-"+str(input_index)+"'>"+str(input_total_gene_no)+"</a>"
                term_no = "<a onclick=\"return false;\" href='#' id='data_D-"+str(input_index)+"'>"+str(term_gene_no)+"</a>"
                data_no = "<a onclick=\"return false;\" href='#' id='data_C-"+str(input_index)+"'>"+str(GENES_No)+"</a>"

            else:
                input_no = str(input_total_gene_no)
                term_no = str(term_gene_no)
                data_no = str(GENES_No)

            fold_change = round((input_term_gene_no / input_total_gene_no)/(term_gene_no / GENES_No),2)

            click_row_detail[dict_index] = {
                "Input list": self.df_input.columns[input_index],
                "Expected_ratio": " ( "+ str(round(term_gene_no * 100 / GENES_No, 2)) + "% )",
                "input_no": input_no,
                "term_no":term_no,
                "data_no":data_no,
                "Observed_ratio": str(round(input_term_gene_no * 100 / input_total_gene_no, 2)),
                "Fold_change": fold_change,
                "insection_no": int(input_term_gene_no),
                "p_value": self.dfs_pvalue[input_index][self.corr][term_index],
                "Domain ID": str(term_index),
                "input_index": str(input_index),
                "cut_off": self.cut_off,
            }
            dict_index += 1

            # volcano_data.append(
            #     dict(
            #         zip(
            #             ["x", "y", "name","color"],
            #             [
            #                 fold_change,
            #                 self.dfs_pvalue[input_index][self.corr][term_index],
            #                 self.df_input.columns[input_index],
            #                 "#C0C0C0" if self.dfs_pvalue[input_index][self.corr][term_index] < self.cut_off else "",
            #             ],
            #         )
            #     )
            # )


        input_list_no = []
        for col in self.df_input.columns:
            input_list_no.append(len(self.df_input[col].dropna().tolist()))

    
        if term[-1] == ")":
            term = self.df_feature_map_id[self.feature][term_index]
        elif self.feature == "gene_group" or self.feature == "custom":
            term = self.df_feature_map_id["term_link"][term_index]
        elif self.feature == "physical_interaction" or self.feature == "genetic_interaction":
            gene_id = self.df_feature_map_id[self.feature+"_id"][term_index]
            term = self.df_feature_data["term_link"][self.df_feature_data['Systematic Name (Bait)'] == gene_id].tolist()[0]
        elif self.feature == "regulator":
            gene_id = self.df_feature_map_id[self.feature+"_id"][term_index]
            term = self.df_feature_data["term_link"][self.df_feature_data[self.feature] == gene_id].tolist()[0]
        else:
            term = self.df_feature_data["term_link"][self.df_feature_data[self.feature] == term].tolist()[0]


        data = {
            "click_row_detail": json.dumps(click_row_detail),
            "feature": self.feature,
            "feature_index":term_index,
            "term": term,
            "percent": "TOP {}%".format(self.top_percent) if term[-6] == "T" else "BOTTOM {}%".format(self.bottom_percent),
            "input_list": json.dumps(list(self.df_input.columns)),
            "input_list_no": json.dumps(input_list_no),
            "corr": self.corr, 
            "cut-off": self.cut_off,
            # "volcano_data": json.dumps(volcano_data),
            "socket_key":socket_key,
        }
        return data

    def quant_data(self, input_index, feature_index, feature, no_type):
        data = {}
        term = self.df_feature_map_id[feature][int(feature_index)]
        term_name = term[:term.find("(")-1]
        df_quant_data = pd.read_csv("./static/data/quant_feature/"+term_name+"_data.csv")
        genes = 0
        input_index = int(input_index)
        input_name = self.df_input.columns[input_index]
        if no_type == "A":
            genes = self.df_input[input_name].dropna().tolist()
            data['Systematic Name'] = genes   
        
        elif no_type == "D":
            genes = self.df_feature_map_id['Systematic Name'][int(feature_index)]
            data['Systematic Name'] = genes

        elif no_type == "C":
            genes = df_quant_data['Systematic Name'].tolist()
            data['Systematic Name'] = genes

        df = pd.DataFrame(data=data)

        df['Standard Name']  = df['Systematic Name'].map(dict(zip(self.df_idInfo['Systematic Name'],self.df_idInfo['Standard Name'])))
        
        df_quant_data = df_quant_data[df_quant_data['Systematic Name'].isin(genes)]
        gene_data = df_quant_data['Systematic Name'].tolist()

        df[term_name] = df['Systematic Name'].apply(lambda x: df_quant_data[term_name][df_quant_data['Systematic Name'] == x].tolist()[0] if x in gene_data else "")

        df = df[['Systematic Name','Standard Name',term_name]]
        df = df.fillna('')

        table_data = df.to_html(index=False, classes="table table-bordered table-hover",justify="center", table_id="unknown_datatable")

        title = ""
        if no_type == "A":
            title = '<spin style="color: red;">'+str(len(gene_data))+'</spin> (out of '+str(len(genes))+') input genes have [<spin style="color:blue;">'+term_name+'</spin>] data'
        elif no_type == "D":
            title = '<spin style="color: red;">'+str(len(genes))+'</spin> genes in the genome are associated with the term [<spin style="color:blue;">'+term+'</spin>]'
        elif no_type == "C":
            title = '<spin style="color: red;">'+str(len(gene_data))+'</spin> (out of 6611) genes in the genome have [<spin style="color:blue;">'+term_name+'</spin>] data'

        data = {
            "title":title,
            "table_data":table_data,
        }
        return data
