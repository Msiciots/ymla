from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, JsonResponse
import json
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed, wait
import pandas as pd
# from channels.layers import get_channel_layer
# from asgiref.sync import async_to_sync

# My data processing program
from lib.data_process import DataProcess
from lib.input_check import input_check
from lib.debug import debug
import math, time, random, string
import gc
gc.enable()
share_session = {}

def index(request):
    return render(request, "home.html")

def tool(request):
    # request.session.set_expiry(0)
    return render(request, "tool.html")

def download(request):
    return render(request, "download.html")
    
def help(request):
    return render(request, "help.html")

def contact(request):
    return render(request, "contact.html")

########## Ajax ##########
@csrf_exempt
def run_analysis(request):
    global share_session
    # socket_key = request.POST.get("socket_key")
    # debug(socket_key,'socket_key')
    # channel_layer = get_channel_layer()
    # async_to_sync(channel_layer.group_send)(socket_key, {
    #     'type': 'log_message',
    #     'log': ' Start Calculation...\n'
    # })
    socket_key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))

    gene_lists = request.POST.get("gene_lists")
    gene_lists = json.loads(gene_lists) 

    # gc.collect()
    
    input_file = request.FILES.get("upload_excel")
    select_features = request.POST.get("select_features").split(",")


    if not select_features[0]:
        select_features = []

    # request.session[socket_key] = {}
    share_session[socket_key] = {}
    session = share_session[socket_key]
    # session = request.session[socket_key]
    session["select_features"] = select_features
    # progress_unit = math.ceil(100/len(select_features))

    df_input = 0
    for key, value in gene_lists.items():
        gene_lists[key] = value.split('\n')

    if gene_lists:
        df_input = pd.DataFrame(dict([ (k,pd.Series(v)) for k,v in gene_lists.items() ]))
    else:
        df_input = pd.read_csv(input_file.temporary_file_path())

    data = {}
    # Check input valid
    data["Error_log"], df_input = input_check(df_input)
    # if data["isError"]:
    #     return JsonResponse(data, safe=False)

    session["df_input"] = df_input
    with ProcessPoolExecutor() as executor:
        res = []         
        for feature in select_features:
            session[feature] = DataProcess(feature,df_input,socket_key)
            res.append(executor.submit(session[feature].enrichment_parallelize))
        for r in as_completed(res):
            dp = r.result()
            session[dp.feature] = dp

    
    f = open('static/config/quant_feature.json', 'r') 
    quant_feature = json.load(f)

    data['socket_key'] = socket_key
    for feature in session["select_features"]:
        if feature in quant_feature or feature == "gene_group":
            correction = 'FDR'
            cut_off = '0.01'
        else:
            correction = 'Bonferroni'
            cut_off = '0.001'
        session[feature], data[feature] = session[feature].result(float(cut_off), correction, socket_key)
  
    data['input_list'] = json.dumps(list(df_input.columns))
    input_list_no = []
    for col in df_input.columns:
        input_list_no.append(len(df_input[col].dropna().tolist()))
    data['input_list_no'] = json.dumps(input_list_no)

    return JsonResponse(json.dumps(data), safe=False)

@csrf_exempt
def refresh_result(request):
    global share_session
    socket_key = request.POST.get("socket_key")
    # channel_layer = get_channel_layer()
    correction = request.POST.get("correction")
    cut_off = request.POST.get("cut_off")
    feature = request.POST.get("feature")
    num1 = request.POST.get("number1")
    num2 = request.POST.get("number2")

    try:
        feature_term = request.POST.get("feature_term").split(",")
    except:
        pass 

    session = share_session[socket_key]
    # session = request.session[socket_key]


    # Check if quant feature
    if num1:
        low = int(num1)
        high = int(num2)
        if feature == "custom":
            session["custom"] = session["custom"].custom_feature_preprocess(feature_term, low, high)
            session["custom"] = session["custom"].enrichment_parallelize()
        else:
            session[feature] = session[feature].quant_feature_preprocess(low,high)
            session[feature] = session[feature].enrichment_parallelize()


    session[feature], data = session[feature].result(float(cut_off), correction, socket_key) 
    return JsonResponse(json.dumps(data), safe=False)


@csrf_exempt
def show_block_detail(request):
    global share_session
    # click_block_id = request.POST["click_block_id"]
    # feature =request.POST["feature"]
    # socket_key = request.POST["socket_key"]
    click_block_id = request.GET["click_block_id"]
    feature =request.GET["feature"]
    socket_key = request.GET["socket_key"]

    session = share_session[socket_key]
    # session = request.session[socket_key]
    session[feature] ,data = session[feature].block_detail(click_block_id)
    # return JsonResponse(data, safe=False)
    return render(request, 'block_page.html',{'data':json.dumps(data)}) 

@csrf_exempt
def show_block_detail_ajax(request):
    global share_session
    click_block_id = request.POST["click_block_id"]
    feature =request.POST["feature"]
    socket_key = request.POST["socket_key"]
    
    session = share_session[socket_key]
    # session = request.session[socket_key]
    session[feature] ,data = session[feature].block_detail(click_block_id)
    return JsonResponse(data, safe=False)


# @csrf_exempt
# def download_block_detail(request):
#     feature =request.POST["feature"]

#     return JsonResponse(json.dumps(request.session[feature].intersection_detail.to_dict('records')), safe=False)
    

@csrf_exempt
def show_column_detail(request):
    global share_session
    column_name  = request.GET['column_name']
    feature  = request.GET['feature']
    socket_key  = request.GET['socket_key']

    session = share_session[socket_key]
    # session = request.session[socket_key]

    data = session[feature].column_detail(column_name, socket_key)
    return render(request, 'column_page.html',{'data':json.dumps(data)}) 


@csrf_exempt
def show_glossaries(request):
    return render(request, 'glossaries.html')  

@csrf_exempt
def show_glossaries_detail(request):
    page_name  = request.GET['query_page']
    print(page_name)
    # feature  = request.GET['feature']
    # socket_key  = request.GET['socket_key']

    # session = share_session[socket_key]
    # # session = request.session[socket_key]
    with open("./static/config/glossaries.json", 'r') as f:
        data = json.loads(f.read())

    return render(request, 'glossaries_detail.html', {'title':data[page_name]["title"]})  


@csrf_exempt
def show_row_detail(request):
    global share_session
    term = request.GET['term']
    feature =request.GET['feature']
    socket_key  = request.GET['socket_key']

    session = share_session[socket_key]
    # session = request.session[socket_key]
    data = session[feature].row_detail(term, socket_key)

    return render(request, 'row_page.html',{'data':json.dumps(data)})   

@csrf_exempt
def show_quant_data(request):
    global share_session
    input_index = request.POST.get("input_index")
    feature_index = request.POST["feature_index"]
    feature = request.POST["feature"]
    no_type = request.POST["no_type"]
    socket_key  = request.POST['socket_key']

    session = share_session[socket_key]
    # session = request.session[socket_key]
    data = session[feature].quant_data(input_index, feature_index, feature, no_type)
   
    return JsonResponse(data, safe=False)

@csrf_exempt
def show_custom_result(request):
    global share_session
    socket_key = request.POST.get("socket_key")
    feature_term = request.POST.get("feature_term").split(",")

    session = share_session[socket_key]
    # session = request.session[socket_key]

    dp = DataProcess("custom",session["df_input"],socket_key)
    dp = dp.custom_feature_preprocess(feature_term, 30, 30)
    dp = dp.enrichment_parallelize()
    dp, data = dp.result(0.01, "FDR", socket_key) 
    session['custom'] = dp
    return JsonResponse(json.dumps(data), safe=False)
 
@csrf_exempt
def leave_tool(request):
    global share_session
    socket_key = request.POST.get("socket_key")
    
    try:
        del share_session[socket_key]
    except:
        pass
    
    data = {}
    return JsonResponse(json.dumps(data), safe=False)