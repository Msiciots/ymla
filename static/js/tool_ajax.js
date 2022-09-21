var name_map, quant_feature, gene_group_feature;
$(document).ready(function(){
  $.getJSON("/YMLA/static/config/feature_name_map.json", function(data){
      name_map = data;
  }).fail(function(){
      console.log("Get feature_name_map.json fail!");
  });
  $.getJSON("/YMLA/static/config/quant_feature.json", function(data){
    quant_feature = data;
  }).fail(function(){
      console.log("Get quant_feature.json fail!");
  });
  $.getJSON("/YMLA/static/config/gene_group_feature.json", function(data){
    gene_group_feature = data['gene_group'];
  }).fail(function(){
      console.log("Get gene_group_feature.json fail!");
  });
});

function input_warning(data) {
  $('#myModal_4').modal('show');
  $('#block_4_1_table').empty()
  $('#block_4_1_table')
      .html(
          '<table class=\'table table-bordered \' id=\'block_4_1_content\'>' +
          '<thead>' +
          '<tr bgcolor=\'#EDEDED\'>' +
          '<th ">List name</th>' +
          '<th ">Item</th>' +
          '<th ">Corresponding IDs</th>' +
          '</tr>' +
          '</thead >' +
          '<tbody id=\'block_4_1_row\'>' +
          '</tbody>' +
          '</table>');  

  $.each(data, function(key, val) {
    if (key === 'isError') {
      return;
    }
    if (val.length > 0) {
      for (let i = 0; i < val.length; i++) {
        let list_name = ''
        if (i === 0)
        list_name =
            '<td style="vertical-align : middle;text-align:center;" rowspan="' +
            val.length + '">' + key + '</td>'
        $('#block_4_1_row')
            .append(
                '<tr >' + list_name + '<td >' + val[i][0] + '</td>' +
                '<td >' + val[i][1] + '</td>' +
                '</tr>');  // append
      }
    }
  })  // for each row
}  // input warning

$(window).on('unload', function() {
  let sdf = new FormData();
  sdf.append('socket_key', socket_key);
	$.ajax({
    url: '/YMLA/leave_tool',
    type: 'POST',
    data: sdf,
    processData: false,
    contentType: false,
    success: function(data) {

    }          // ajax sucess
  })              // ajax of /show_custom_result
});

$('#run_analysis').click(function() {
  var upload_excel = $('#upload_file').get(0).files[0];
  if(!upload_excel && jQuery.isEmptyObject(gene_lists)){  // Check input exist
    alert("Please input gene list(s) !");
    return true;
  }
  let features = $('input[name^=\'features_\']:checked')
  .map(function() {
    return $(this).val();
  }).get();
  
  if (features.length === 0){   // Check selected features exist
    alert("Please select biological feature(s) !");
    return true;
  }


  $('#space').show();
  $("html, body").animate({ scrollTop: $(document).height() });
  $('#search_result').hide();
  $('#run_analysis').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>  Running...')
  $('#run_analysis').attr('disabled', true);
                      
  var sdf = new FormData();
  // upset_gene_list = gene_lists;
  sdf.append('upload_excel', upload_excel);
  sdf.append('gene_lists', JSON.stringify(gene_lists));
  sdf.append('select_features', features);
  // sdf.append('socket_key', socket_key);


  // $('#bar').attr('style','width: 0%');
  // $('#bar').attr('aria-valuenow','0');  
  // progress_value = 0;
  $("#run_msg").show();
  time_count = 1;
  $("#log").html("");
  var time_counter = setInterval(counter, 1000);



  $.ajax({
    url: '/YMLA/run_analysis',
    type: 'POST',
    data: sdf,
    processData: false,
    contentType: false,
    success: function(data) {
      let tmp = JSON.parse(data)
      // console.log(tmp['upset'])
      console.log(tmp);
      render_upset_plot(tmp['upset'])

      // delete key value pair upset


      if (tmp['Error_log']['isError'])
        input_warning(tmp['Error_log']);
      
      $('#search_result').show();
      $([document.documentElement, document.body]).animate({
        scrollTop: $("#search_result").offset().top
      });
      socket_key = tmp['socket_key'];
      $('#input_gene_list').empty();
      $('#input_gene_list').append('<td style="background-color:#E9ECEF;"> <b>Name of each input list</b></td>') 
      $.each(JSON.parse(tmp['input_list']), function(key, val) {
          $('#input_gene_list').append('<td>'+val+'</td>') 
      })
      $('#input_gene_no').empty(); // colspan="1" 
      $('#input_gene_no').append('<td style="background-color:#E9ECEF;"> <b># of genes in each input list</b></td>') 
      $.each(JSON.parse(tmp['input_list_no']), function(key, val) {
        $('#input_gene_no').append('<td>'+val+'</td>') 
      })

      $('#container').empty()
  
      let select = "true";
      let act = "active";
      let fade = "show active";
      let tc = "text-white";
      let bg = "";

      let common_feature_exist = false;
      let gene_group_feature_exist = false;
      let quant_feature_exist = false;
      let customized_feature = [];
      $('#myTabContent').empty();
      $('#pills-tab_fc').empty();
      $('#tr_fc').hide()
      $('#pills-tab_fgp').empty();
      $('#tr_fgp').hide()
      $('#pills-tab_fnv').empty();
      $('#tr_fnv').hide()
      $('#pills-tab_fht').empty();
      $('#tr_fht').hide()
      $('#pills-tab_fcust').empty();
      $('#tr_fcust').hide()

      $.each(JSON.parse(data), function(key, val) {
        if (key == 'upset' || key == 'input_list' || key == 'input_list_no' || key == 'socket_key' || key=='Error_log')
          return;

        if (act == "active")
          $('#result_title').html('<i class="fa fa-check"></i> Results of the analyzed feature: <b>'+name_map[key]+'</b>')  
        
        if(quant_feature["gene_property"].includes(key)){
          $('#tr_fnv').show()
          $('#pills-tab_fnv').append('<li class="nav-item" role="presentation" style="padding:.2rem .5rem;"><button style="'+bg+'" name="'+key+'" class="nav-link '+act+' border border-dark '+tc+'" id="pills-'+key+'-tab" data-bs-toggle="pill" data-bs-target="#pills-'+key+'" type="button" role="tab" aria-controls="pills-'+key+'" aria-selected="'+select+'">'+name_map[key]+'</button></li>')
          quant_feature_exist = true;
          customized_feature.push(key);
        }
        else if(quant_feature["high_throughput"].includes(key)){
          $('#tr_fht').show()
          $('#pills-tab_fht').append('<li class="nav-item" role="presentation" style="padding:.2rem .5rem;"><button style="'+bg+'" name="'+key+'" class="nav-link '+act+' border border-dark '+tc+'" id="pills-'+key+'-tab" data-bs-toggle="pill" data-bs-target="#pills-'+key+'" type="button" role="tab" aria-controls="pills-'+key+'" aria-selected="'+select+'">'+name_map[key]+'</button></li>')
          quant_feature_exist = true;
          customized_feature.push(key);
        }
        else if (key == "gene_group"){
          $('#tr_fgp').show()
          $('#pills-tab_fgp').append('<li class="nav-item " role="presentation" style="padding:.2rem .5rem;"><button style="'+bg+'" name="'+key+'" class="nav-link '+act+' border border-dark '+tc+'" id="pills-'+key+'-tab" data-bs-toggle="pill" data-bs-target="#pills-'+key+'" type="button" role="tab" aria-controls="pills-'+key+'" aria-selected="'+select+'">'+name_map[key]+'</button></li>')
          gene_group_feature_exist = true;
          customized_feature.push(key);
        }
        else {
          $('#tr_fc').show()
          $('#pills-tab_fc').append('<li class="nav-item " role="presentation" style="padding:.2rem .5rem;"><button style="'+bg+'" name="'+key+'" class="nav-link '+act+' border border-dark '+tc+'" id="pills-'+key+'-tab" data-bs-toggle="pill" data-bs-target="#pills-'+key+'" type="button" role="tab" aria-controls="pills-'+key+'" aria-selected="'+select+'">'+name_map[key]+'</button></li>')
          common_feature_exist = true;
        }
        
        let tab_content;
        let settings;
        if (common_feature_exist){
        settings = `
        <div class="card">
          <div class="card-header">
            <h6><i class="fas fa-cog"></i> Specify the correction method and p-value cutoff for multiple hypotheses testing</h6>
          </div>
          <div class="card-body p-3">
            <div class="container">
              <div class="row">
                <div class="col-sm" >
                  <div class="form-group ">
                    <label for="inputState"><b>Correction method:</b></label>
                    <select style="width:150px" name="errorCorrection" id="errorCorrection_${key}" class="form-select" aria-label="Default select example">
                      <option value="FDR" selected>FDR</option>    
                      <option value="Bonferroni" >Bonferroni</option>
                      <option value="pvalue" >None</option>
                    </select>
                  </div>
                </div>
                <div class="col-sm">
                  <div class="form-group ">
                    <label for="inputState"><b>Corrected p-value cutoff:</b></label>
                    <select  style="width:150px" name="pValue" id="cut_off_${key}" class="form-select" aria-label="Default select example">
                    <option value="0.000001">0.000001</option>
                      <option value="0.001">0.001</option>
                      <option value="0.01" selected>0.01</option>    
                      <option value="0.05">0.05</option>
                    </select>
                  </div>          
                </div>
  
                <div class="col-sm ">
                  <div class="form-group">
                    <p></p>
                    <label ><b> </b></label>
                    <button id = "refresh_${key}" class="btn btn-info border border-dark"><i class="fas fa-redo-alt"></i> Refresh</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        `;
        tab_content = `
        <div class="tab-pane fade ${fade}" id="pills-${key}" role="tabpanel" aria-labelledby="pills-${key}-tab">
            <div class="tab-content" >
              ${settings}
              <div class="row">
                <ul class="nav nav-pills mb-3 justify-content-center target2" id="pills-tab_${key}" role="tablist" style="margin-top:4%;">
                  <li class="nav-item list-group-item-dark" role="presentation">
                    <button class="nav-link active border border-dark " name="${key}" id="pills-table-tab_${key}" data-bs-toggle="pill" data-bs-target="#pills-table_${key}" type="button" role="tab" aria-controls="pills-table_${key}" aria-selected="true">
                    &emsp;<i class="fas fa-clipboard"></i> Table&emsp;
                    </button>
                  </li>
                  &emsp;
                  <li class="nav-item list-group-item-dark" role="presentation">
                    <button class="nav-link border border-dark text-dark" name="${key}" id="pills-heatmap-tab_${key}" data-bs-toggle="pill" data-bs-target="#pills-heatmap_${key}" type="button" role="tab" aria-controls="pills-heatmap_${key}" aria-selected="false">
                    <i class="fas fa-th"></i> Heatmap
                    </button>
                  </li> 
                </ul>
                <spin style="color:red;display:none;" id="no_terms_${key}">No enriched terms are found!</spin>
              </div>
              <div class="tab-pane fade show active" id="pills-table_${key}" role="tabpanel" aria-labelledby="pills-table-tab_${key}">
                <div class="row">
                  <div class="col-sm" style="float: left; display: inline-block; margin-left: 1%;margin-top:2%">
                    
                  </div> 
    
                <div style="margin-top:5%;" id="table_${key}"></div>
                </div>
              </div>

              <div class="tab-pane fade" id="pills-heatmap_${key}" role="tabpanel" aria-labelledby="pills-heatmap-tab_${key}">
                <div class="row">
                  <div class="col-sm" style="float: left; display: inline-block; margin-left: 1%;margin-top:2%">
                    <ul>
                        <li>The column names represent the names of the input lists.</li>
                        <li>Please <spin style="color:red"><b>click</b></spin> the column names for the detailed results.</li>
                        <li>The row names represent the enriched terms of the analyzed feature.</li>
                        <li>Please <spin style="color:red"><b>click</b></spin> the row names for the detailed results.</li>
                        <li>Only the <b>corrected p-value</b> less than the user-chosen cutoff will be shown.</li>
                    </ul>
                  </div> 
    
                <div style="margin-top:5%;" id="container_${key}"></div>
                </div>
              </div>
            </div>
        </div>
        `;
        }
        else if(key=="gene_group"){
        settings = `
        <div class="card">
          <div class="card-header">
            <h6><i class="fas fa-cog"></i> Specify the correction method and p-value cutoff for multiple hypotheses testing</h6>
          </div>
          <div class="card-body p-3">
            <div class="container">
              <div class="row">
                <div class="col-sm" >
                  <div class="form-group ">
                    <label for="inputState"><b>Correction method:</b></label>
                    <select style="width:150px" name="errorCorrection" id="errorCorrection_${key}" class="form-select" aria-label="Default select example">
                      <option value="FDR" selected>FDR</option>    
                      <option value="Bonferroni" >Bonferroni</option>
                      <option value="pvalue" >None</option>
                    </select>
                  </div>
                </div>
                <div class="col-sm">
                  <div class="form-group ">
                    <label for="inputState"><b>Corrected p-value cutoff:</b></label>
                    <select  style="width:150px" name="pValue" id="cut_off_${key}" class="form-select" aria-label="Default select example">
                      <option value="0.000001">0.000001</option>   
                      <option value="0.001" >0.001</option>
                      <option value="0.01" selected>0.01</option>    
                      <option value="0.05">0.05</option>
                    </select>
                  </div>          
                </div>
                <div class="col-sm ">
                  <div class="form-group">
                    <p></p>
                    <label ><b> </b></label>
                    <button id = "refresh_${key}" class="btn btn-info border border-dark"><i class="fas fa-redo-alt"></i> Refresh</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        `;
        tab_content = `
        <div class="tab-pane fade ${fade}" id="pills-${key}" role="tabpanel" aria-labelledby="pills-${key}-tab">
            <div class="tab-content">
              ${settings}
              <div class="row">
                <ul class="nav nav-pills mb-3 justify-content-center target2" id="pills-tab_${key}" role="tablist" style="margin-top:4%;">
                    <li class="nav-item list-group-item-dark" role="presentation">
                      <button class="nav-link active border border-dark" name="${key}" id="pills-table-tab_${key}" data-bs-toggle="pill" data-bs-target="#pills-table_${key}" type="button" role="tab" aria-controls="pills-table_${key}" aria-selected="true">
                      &emsp;<i class="fas fa-clipboard"></i> Table&emsp;
                      </button>
                    </li>
                    &emsp;
                    <li class="nav-item list-group-item-dark" role="presentation">
                        <button class="nav-link border border-dark text-dark" name="${key}" id="pills-heatmap-tab_${key}" data-bs-toggle="pill" data-bs-target="#pills-heatmap_${key}" type="button" role="tab" aria-controls="pills-heatmap_${key}" aria-selected="true">
                        <i class="fas fa-th"></i> Heatmap
                        </button>
                    </li>
                    &emsp;
                    <li class="nav-item list-group-item-dark" role="presentation">
                        <button class="nav-link border border-dark text-dark" name="${key}" id="pills-network-tab_${key}" data-bs-toggle="pill" data-bs-target="#pills-network_${key}" type="button" role="tab" aria-controls="pills-network_${key}" aria-selected="false"><i class="fas fa-project-diagram"></i> Network</button>
                    </li>
                </ul>
                <spin style="color:red;display:none;" id="no_terms_${key}">No enriched terms are found!</spin>
              </div>
              
              <div class="tab-pane fade show active" id="pills-table_${key}" role="tabpanel" aria-labelledby="pills-table-tab_${key}">
                <div class="row">
                  <div class="col-sm" style="float: left; display: inline-block; margin-left: 1%;margin-top:2%">
                    
                  </div> 
    
                <div style="margin-top:5%;" id="table_${key}"></div>
                </div>
              </div>

              <div class="tab-pane fade" id="pills-heatmap_${key}" role="tabpanel" aria-labelledby="pills-heatmap-tab_${key}">
                <div class="row">
                  <div class="col-sm" style="float: left; display: inline-block; margin-left: 1%;margin-top:2%">
                    <ul>
                        <li>The column names represent the names of the input lists.</li>
                        <li>Please <spin style="color:red"><b>click</b></spin> the column names for the detailed results.</li>
                        <li>The row names represent the enriched terms of the analyzed feature.</li>
                        <li>Please <spin style="color:red"><b>click</b></spin> the row names for the detailed results.</li>
                        <li>Only the <b>corrected p-value</b> less than the user-chosen cutoff will be shown.</li>
                    </ul>
                  </div> 
                <div style="margin-top:5%;" id="container_${key}"></div>
                </div>
              </div>
              <div class="tab-pane fade" id="pills-network_${key}" role="tabpanel" aria-labelledby="pills-network-tab_${key}">
                <div class="row">
                  <div class="col-sm" style="float: left; display: inline-block; margin-left: 1%;margin-top:2%">
                    <ul>
                        <li>The <span style="background-color:#FFDEDE;">pink</span> circles represent the names of the input lists.</li>
                        <li>The <span style="background-color:#FFE69A;">yellow</span> rectangles represent the enriched terms of the analyzed feature.</li>
                        <li>A line (between a term and a list) means that the term is enriched in that list.</li>
                        <li>The number -log<sub>10</sub>(corrected p-value) and the thickness of the line represent the statistical significance.</li>
                    </ul>
                  </div> 
     
                  <div id="network_${key}"></div>
                </div>
              </div>
            </div>
        </div>
        `;
        }
        else{     // quant feature
          let quant_feature_list = "";
          $.each( quant_feature[key], function( index, value ){
            value = "<spin style='color:blue;'>"+value+"</spin>";
            if (index == 0)
              quant_feature_list += value
            else
              quant_feature_list += ", "+value
          });
        settings = `
          <div class="card" >
            <div class="card-body">
              <div class="row border border-light">
                  <div class="col-3 mx-auto">
                    <div class="card">
                      <div class="card-header">
                        <h6><i class="fas fa-cog"></i> Specify the correction method and p-value cutoff for multiple hypotheses testing</h6>
                      </div>
                      <div class="card-body">
                        <div class="row">
                          <div class="col-sm">
                            <div class="form-group ">
                              <label for="inputState"><b>Correction method:</b></label>
                              <select style="width:150px;" name="errorCorrection" id="errorCorrection_${key}" class="form-select" aria-label="Default select example">
                                <option value="FDR" selected>FDR</option>    
                                <option value="Bonferroni" >Bonferroni</option>
                                <option value="pvalue" >None</option>
                              </select>
                            </div>
                          </div>
                          <div class="col-sm">
                            <div class="form-group ">
                              <label for="inputState"><b>Corrected p-value cutoff:</b></label>
                              <select  style="width:150px;" name="pValue" id="cut_off_${key}" class="form-select" aria-label="Default select example">
                                <option value="0.000001">0.000001</option>   
                                <option value="0.001" >0.001</option>
                                <option value="0.01" selected>0.01</option>    
                                <option value="0.05">0.05</option>
                              </select>
                            </div>     
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              
                <div class="col-8 mx-auto">
                  <div class="card">
                    <div class="card-header">
                      <h6><i class="fas fa-cog"></i> Define terms of the feature</h6>
                    </div>
                    <div class="card-body">
                    <b><i>Feature Name</i></b> : ${quant_feature_list}
                    <br>
                    <b><i>Feature Name</i> (B)</b>: A list containing genes whose feature values belong to the <spin class="text-danger">BOTTOM <input class="text-danger" type="number" value="30" id="number1_${key}" min="0" max="100" step="1" /> %</spin> in the genome.
                    <br>
                      <b><i>Feature Name</i> (T)</b>: A list containing genes whose feature values belong to the <spin class="text-danger">TOP <input  class="text-danger" type="number" value="30" id="number2_${key}" min="0" max="100" step="1" /> %</spin> in the genome.
                    </div>
                  </div>
                </div>
                <div class="col-1 mx-auto">
                  <div class="form-group">
                    <p></p>
                    <label ><b> </b></label>
                    <button id = "refresh_${key}" class="btn btn-info border border-dark" style="margin:0px 0px 0px -10px;"><i class="fas fa-redo-alt"></i> Refresh</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
       
        `;
        tab_content = `
        <div class="tab-pane fade ${fade}" id="pills-${key}" role="tabpanel" aria-labelledby="pills-${key}-tab">
            <div class="tab-content">
              ${settings}
              <div class="row">
                <ul class="nav nav-pills mb-3 justify-content-center target2" id="pills-tab_${key}" role="tablist" style="margin-top:4%;">
                    <li class="nav-item list-group-item-dark" role="presentation">
                      <button class="nav-link active border border-dark" name="${key}" id="pills-table-tab_${key}" data-bs-toggle="pill" data-bs-target="#pills-table_${key}" type="button" role="tab" aria-controls="pills-table_${key}" aria-selected="true">
                      &emsp;<i class="fas fa-clipboard"></i> Table&emsp;
                      </button>
                    </li>
                    &emsp;
                    <li class="nav-item list-group-item-dark" role="presentation">
                        <button class="nav-link border border-dark text-dark" name="${key}" id="pills-heatmap-tab_${key}" data-bs-toggle="pill" data-bs-target="#pills-heatmap_${key}" type="button" role="tab" aria-controls="pills-heatmap_${key}" aria-selected="false">
                        <i class="fas fa-th"></i> Heatmap
                        </button>
                    </li>
                    &emsp;
                    <li class="nav-item list-group-item-dark" role="presentation">
                        <button class="nav-link border border-dark text-dark" name="${key}" id="pills-network-tab_${key}" data-bs-toggle="pill" data-bs-target="#pills-network_${key}" type="button" role="tab" aria-controls="pills-network_${key}" aria-selected="false"><i class="fas fa-project-diagram"></i> Network</button>
                    </li>
                </ul>
                <spin style="color:red;display:none;" id="no_terms_${key}">No enriched terms are found!</spin>
              </div>
              
              <div class="tab-pane fade show active" id="pills-table_${key}" role="tabpanel" aria-labelledby="pills-table-tab_${key}">
                <div class="row">
                  <div class="col-sm" style="float: left; display: inline-block; margin-left: 1%;margin-top:2%">
                    <ul>
                        <li>The column names represent the names of the input lists.</li>
                        <li>Please <spin style="color:red"><b>click</b></spin> the column names for the detailed results.</li>
                        <li>The row names represent the enriched terms of the analyzed feature.</li>
                        <li>Please <spin style="color:red"><b>click</b></spin> the row names for the detailed results.</li>
                        <li>Only the <b>corrected p-value</b> less than the user-chosen cutoff will be shown.</li>
                    </ul>
                  </div> 
    
                <div style="margin-top:5%;" id="table_${key}"></div>
                </div>
              </div>

              <div class="tab-pane fade" id="pills-heatmap_${key}" role="tabpanel" aria-labelledby="pills-heatmap-tab_${key}">
                <div class="row">
                  <div class="col-sm" style="float: left; display: inline-block; margin-left: 1%;margin-top:2%">
                    <ul>
                        <li>The column names represent the names of the input lists.</li>
                        <li>Please <spin style="color:red"><b>click</b></spin> the column names for the detailed results.</li>
                        <li>The row names represent the enriched terms of the analyzed feature.</li>
                        <li>Please <spin style="color:red"><b>click</b></spin> the row names for the detailed results.</li>
                        <li>Only the <b>corrected p-value</b> less than the user-chosen cutoff will be shown.</li>
                    </ul>
                  </div> 

                <div style="margin-top:5%;" id="container_${key}"></div>
                </div>
              </div>
              <div class="tab-pane fade" id="pills-network_${key}" role="tabpanel" aria-labelledby="pills-network-tab_${key}">
                <div class="row">
                  <div class="col-sm" style="float: left; display: inline-block; margin-left: 1%;margin-top:2%">
                    <ul>
                        <li>The <span style="background-color:#FFDEDE;">pink</span> circles represent the names of the input lists.</li>
                        <li>The <span style="background-color:#FFE69A;">yellow</span> rectangles represent the enriched terms of the analyzed feature.</li>
                        <li>A line (between a term and a list) means that the term is enriched in that list.</li>
                        <li>The number -log<sub>10</sub>(corrected p-value) and the thickness of the line represent the statistical significance.</li>
                    </ul>
                  </div> 
                  <div id="network_${key}"></div>
                </div>
              </div>
            </div>
        </div>
        `;
        }
      
        $('#myTabContent').append(tab_content);
        select = "false";
        act = "";
        fade = "";
        tc = "text-dark";
        bg = "background-color:#C6C8CA;"
        quant_percent = "";
        quent_description = "";
        common_feature_exist = false;
      })

      $('#custom_accordion_gene_group').hide();
      $('#custom_accordion_quant').hide();
      // Customized feature
      if (quant_feature_exist || gene_group_feature_exist){
        $('#tr_fcust').show()
        $('#customized_term').html("")
        $('#customized_term_gene_group').html("");
        $('#customized_term_quant').html("");
        $('#customized_term_high_throughput').html("");
        customized_feature.forEach(function(f) {
          if (f =="gene_group"){
            $('#custom_accordion_gene_group').show()
            gene_group_feature.forEach(function(g) {
              $('#customized_term_gene_group').append(`<label><input type='checkbox' name='customized_term' value="${g}">${" "+g}</label><br>`);
            });
          }
          else if(quant_feature["gene_property"].includes(f)){
            $('#custom_accordion_quant').show()
            $('#customized_term_quant').append(`<label><b>${name_map[f]}</b>&nbsp;&nbsp;<a onclick="return false;" href="#"><span class="badge bg-secondary" id="selectAll_${f}">Select All</span></a>&nbsp;&nbsp;<a onclick="return false;" href="#"><span class="badge bg-secondary" id="selectNone_${f}">Select None</span></a></label><p>`);          
            quant_feature[f].forEach(function(term) {
              $('#customized_term_quant').append(`<label style="padding-left:20px;"><input type='checkbox' name='customized_term_${f}' value="${term+" (B)"}">${" "+term+" (B)"}</label> `);
              $('#customized_term_quant').append(`<label style="padding-left:20px;"><input type='checkbox' name='customized_term_${f}' value="${term+" (T)"}">${" "+term+" (T)"}</label> `);
            });
            $("#selectAll_"+f).click(function() {
              $(`input[name='customized_term_${f}']`).each(function() {
                  $(this).prop("checked", true);
              });
            });
            $("#selectNone_"+f).click(function() {
              $(`input[name='customized_term_${f}']`).each(function() {
                $(this).prop("checked", false);
              }); 
            });
            $('#customized_term_quant').append(`<p></p>`);
          }
          else if(quant_feature["high_throughput"].includes(f)){
            $('#custom_accordion_high_throughput').show()
            $('#customized_term_high_throughput').append(`<label><b>${name_map[f]}</b>&nbsp;&nbsp;<a onclick="return false;" href="#"><span class="badge bg-secondary" id="selectAll_${f}">Select All</span></a>&nbsp;&nbsp;<a onclick="return false;" href="#"><span class="badge bg-secondary" id="selectNone_${f}">Select None</span></a></label><p>`);          
            quant_feature[f].forEach(function(term) {
              $('#customized_term_high_throughput').append(`<label style="padding-left:20px;"><input type='checkbox' name='customized_term_${f}' value="${term+" (B)"}">${" "+term+" (B)"}</label> `);
              $('#customized_term_high_throughput').append(`<label style="padding-left:20px;"><input type='checkbox' name='customized_term_${f}' value="${term+" (T)"}">${" "+term+" (T)"}</label> `);
            });
            $("#selectAll_"+f).click(function() {
              $(`input[name='customized_term_${f}']`).each(function() {
                  $(this).prop("checked", true);
              });
            });
            $("#selectNone_"+f).click(function() {
              $(`input[name='customized_term_${f}']`).each(function() {
                $(this).prop("checked", false);
              }); 
            });
            $('#customized_term_high_throughput').append(`<p></p>`);
          }
  
        });
        $('#pills-tab_fcust').html('<li class="nav-item" role="presentation" style="padding:.2rem .5rem;"><button style="background-color:#C6C8CA;" name="custom" class="nav-link border border-dark text-dark" id="pills-custom-tab" data-bs-toggle="pill" data-bs-target="#pills-custom" type="button" role="tab" aria-controls="pills-custom" aria-selected="false"><i class="fas fa-hammer"></i> Generate Custom Summary</button></li>')

        quant_setting = `
          <div class="col-8 mx-auto">
            <div class="card">
              <div class="card-header">
                <h6><i class="fas fa-cog"></i> Define terms of the feature</h6>
              </div>
              <div class="card-body">
              <b><i>Feature Name</i> (B)</b>: A list containing genes whose feature values belong to the <spin class="text-danger">BOTTOM <input class="text-danger" type="number" value="30" id="number1_custom" min="0" max="100" step="1" /> %</spin> in the genome.
                <p>
                <b><i>Feature Name</i> (T)</b>: A list containing genes whose feature values belong to the <spin class="text-danger">TOP <input  class="text-danger" type="number" value="30" id="number2_custom" min="0" max="100" step="1" /> %</spin> in the genome.
              </div>
            </div>
          </div>
        `;
        
        settings = `
        <div class="card">
          <div class="card-body">
            <div class="row border border-light">
                <div class="col-3 mx-auto">
                  <div class="card">
                    <div class="card-header">
                      <h6><i class="fas fa-cog"></i> Specify the correction method and p-value cutoff for multiple hypotheses testing</h6>
                    </div>
                    <div class="card-body">
                      <div class="row">
                        <div class="col-sm">
                          <div class="form-group ">
                            <label for="inputState"><b>Correction method:</b></label>
                            <select style="width:150px;" name="errorCorrection" id="errorCorrection_custom" class="form-select" aria-label="Default select example">
                              <option value="FDR" selected>FDR</option>    
                              <option value="Bonferroni" >Bonferroni</option>
                              <option value="pvalue" >None</option>
                            </select>
                          </div>
                        </div>
                        <div class="col-sm">
                          <div class="form-group ">
                            <label for="inputState"><b>Corrected p-value cutoff:</b></label>
                            <select  style="width:150px;" name="pValue" id="cut_off_custom" class="form-select" aria-label="Default select example">
                            <option value="0.000001">0.000001</option>    
                              <option value="0.001" >0.001</option>
                              <option value="0.01" selected>0.01</option>    
                              <option value="0.05">0.05</option>
                            </select>
                          </div>     
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            
              ${quant_setting}
              <div class="col-1 mx-auto">
                <div class="form-group">
                  <p></p>
                  <label ><b> </b></label>
                  <button id = "refresh_custom" class="btn btn-info border border-dark" style="margin:0px 0px 0px -10px;"><i class="fas fa-redo-alt"></i> Refresh</button>
                </div>
              </div>
            </div>
          </div>
        </div>
    
      `;
      tab_content = `
      <div class="tab-pane fade" id="pills-custom" role="tabpanel" aria-labelledby="pills-custom-tab">
          <div class="tab-content">
            ${settings}
            <div class="row">
              <ul class="nav nav-pills mb-3 justify-content-center target2" id="pills-tab_custom" role="tablist" style="margin-top:4%;">
                <li class="nav-item list-group-item-dark" role="presentation">
                  <button class="nav-link active border border-dark" name="custom" id="pills-table-tab_custom" data-bs-toggle="pill" data-bs-target="#pills-table_custom" type="button" role="tab" aria-controls="pills-table_custom" aria-selected="true">
                  &emsp;<i class="fas fa-clipboard"></i> Table&emsp;
                  </button>
                </li>
                &emsp;
                <li class="nav-item list-group-item-dark" role="presentation">
                    <button class="nav-link border border-dark text-dark" name="custom" id="pills-heatmap-tab_custom" data-bs-toggle="pill" data-bs-target="#pills-heatmap_custom" type="button" role="tab" aria-controls="pills-heatmap_custom" aria-selected="false">
                    <i class="fas fa-th"></i> Heatmap
                    </button>
                </li>
                &emsp;
                <li class="nav-item list-group-item-dark" role="presentation">
                    <button class="nav-link border border-dark text-dark" name="custom" id="pills-network-tab_custom" data-bs-toggle="pill" data-bs-target="#pills-network_custom" type="button" role="tab" aria-controls="pills-network_custom" aria-selected="false"><i class="fas fa-project-diagram"></i> Network</button>
                </li>
              </ul>
            </div>

            <div class="tab-pane fade show active" id="pills-table_custom" role="tabpanel" aria-labelledby="pills-table-tab_custom">
                <div class="row">
                  <div class="col-sm" style="float: left; display: inline-block; margin-left: 1%;margin-top:2%">
                    <ul>
                        <li>The column names represent the names of the input lists.</li>
                        <li>Please <spin style="color:red"><b>click</b></spin> the column names for the detailed results.</li>
                        <li>The row names represent the enriched terms of the analyzed feature.</li>
                        <li>Please <spin style="color:red"><b>click</b></spin> the row names for the detailed results.</li>
                        <li>Only the <b>corrected p-value</b> less than the user-chosen cutoff will be shown.</li>
                        <li name="custom_term_list"></li>
                    </ul>
                  </div> 
    
                <div style="margin-top:5%;" id="table_custom"></div>
                </div>
              </div>

              <div class="tab-pane fade" id="pills-heatmap_custom" role="tabpanel" aria-labelledby="pills-heatmap-tab_custom">
                <div class="row">
                  <div class="col-sm" style="float: left; display: inline-block; margin-left: 1%;margin-top:2%">
                    <ul>
                        <li>The column names represent the names of the input lists.</li>
                        <li>Please <spin style="color:red"><b>click</b></spin> the column names for the detailed results.</li>
                        <li>The row names represent the enriched terms of the analyzed feature.</li>
                        <li>Please <spin style="color:red"><b>click</b></spin> the row names for the detailed results.</li>
                        <li>Only the <b>corrected p-value</b> less than the user-chosen cutoff will be shown.</li>
                        <li name="custom_term_list"></li>
                    </ul>
                  </div> 
                <div style="margin-top:5%;" id="container_custom"></div>
                </div>
              </div>
              <div class="tab-pane fade" id="pills-network_custom" role="tabpanel" aria-labelledby="pills-network-tab_custom">
                <div class="row">
                  <div class="col-sm" style="float: left; display: inline-block; margin-left: 1%;margin-top:2%">
                    <ul>
                        <li>The <span style="background-color:#FFDEDE;">pink</span> circles represent the names of the input lists.</li>
                        <li>The <span style="background-color:#FFE69A;">yellow</span> rectangles represent the enriched terms of the analyzed feature.</li>
                        <li>A line (between a term and a list) means that the term is enriched in that list.</li>
                        <li>The number -log<sub>10</sub>(corrected p-value) and the thickness of the line represent the statistical significance.</li>
                        <li name="custom_term_list"></li>
                    </ul>
                  </div> 
                  <div id="network_custom"></div>
                </div>
              </div>
          </div>
      </div>
      `;

      $('#myTabContent').append(tab_content);

        
        $('#pills-custom-tab').click(function() {
          
          let customized_term = $('input[name^=\'customized_term\']:checked')
          .map(function() {
            return $(this).val();
          }).get();

          let formdata = new FormData();
          formdata.append('socket_key', socket_key);
          formdata.append('feature_term', customized_term);

          $('[name="custom_term_list"]').html(`<b>Select feature terms: <spin style="color:blue;">${customized_term.join(", ")} </spin></b>`);
          $.ajax({
            url: '/YMLA/show_custom_result',
            type: 'POST',
            data: formdata,
            processData: false,
            contentType: false,
            success: function(data) {
              let val = JSON.parse(data)
              if (val['yAxis_count'] != 0){
                render_result("Customized Feature","custom",val);
                $('#number1_custom').val(30);
                $('#number2_custom').val(30);
              }
              else{
                $(`#pills-tab_custom`).hide();
                $(`#no_terms_custom`).show();
              }
              $([document.documentElement, document.body]).animate({
                scrollTop: $("#result_title").offset().top
              });
            }          // ajax sucess
          })              // ajax of /show_custom_result
        })
        var customized_term = $('input[name^=\'customized_term\']:checked')
        .map(function() {
          return $(this).val();
        }).get();

        $('#refresh_custom').click(function() {
          var correction = document.getElementById('errorCorrection_custom').value
          var cut_off = document.getElementById('cut_off_custom').value
          // var correction = $('input[name=R_'+key+']:checked').val()
          // var cut_off = $('input[name=R2_'+key+']:checked').val()
          let customized_term_new = $('input[name^=\'customized_term\']:checked')
          .map(function() {
            return $(this).val();
          }).get();
          if (customized_term_new == customized_term)
            return true;
            
          customized_term = customized_term_new
          var formdata = new FormData();
          formdata.append('feature_term', customized_term_new);

          formdata.append('correction', String(correction));
          formdata.append('cut_off', String(cut_off));
          formdata.append('socket_key', socket_key);
          formdata.append('feature', "custom");
          
          let number1 = document.getElementById('number1_custom').value;
          let number2 = document.getElementById('number2_custom').value;
          if ( number1 < 0 || number1 > 100 || number2 < 0 || number2 > 100){
            alert("Illegal quantile value");
            $('#number1_custom').val(30);
            $('#number2_custom').val(30);
            number1 = 30;
            number2 = 30;
          }
          
          formdata.append('number1', number1);
          formdata.append('number2', number2);
          
          $('#container_custom').empty()
          $('#network_custom').empty()
          
          $.ajax({
            url: '/YMLA/refresh_result',
            type: 'POST',
            data: formdata,
            processData: false,
            contentType: false,
            success: function(data) {
              // let feature = key;
              let val = JSON.parse(data)
              if (val['yAxis_count'] != 0)
                render_result("Customized Feature","custom",val);
              else{
                $(`#pills-tab_custom`).hide();
                $(`#no_terms_custom`).show();
              }
            }             // ajax sucess
          })              // ajax of /refresh heatmap
        })                //#refresh_heatmap click
      }
      // for feature button
      $('.target li button').click(function (e) {
        //get selected href
        let id = $(this).attr('id');  
        let feature_name = $(this).attr('name');      
        $('#result_title').html('<i class="fa fa-check"></i> Analyzed feature: <b>'+name_map[feature_name]+'</b>')  
        //set all nav tabs to inactive
        $('.target li button').removeClass('active');     
        $('.target li button').removeClass('text-white'); 
        $('.target li button').addClass('text-dark');   
        $('.target li button').attr('style','background-color:#C6C8CA;');  
        //get all nav tabs matching the href and set to active
        $(this).attr('style',''); 
        $('.target li button[id="'+id+'"]').addClass('active');
        $('.target li button[id="'+id+'"]').removeClass('text-dark');
        $('.target li button[id="'+id+'"]').addClass('text-white');

        if (id != "pills-custom-tab")
          $([document.documentElement, document.body]).animate({
            scrollTop: $("#result_title").offset().top
          });
      })
      // For graphic view button
      $('.target2 li button').click(function (e) {
        //get selected href
        let id = $(this).attr('id');  
        let feature_name = $(this).attr('name');      

        $('.target2 li button[name="'+feature_name+'"]').removeClass('text-white');
        $('.target2 li button[name="'+feature_name+'"]').addClass('text-dark');
        $(this).removeClass('text-dark');
        $(this).addClass('text-white');
      })

      $.each(JSON.parse(data), function(key, val) {
        $('#refresh_'+key).click(function() {
          var correction = document.getElementById('errorCorrection_'+key).value
          var cut_off = document.getElementById('cut_off_'+key).value
          // var correction = $('input[name=R_'+key+']:checked').val()
          // var cut_off = $('input[name=R2_'+key+']:checked').val()

          var formdata = new FormData();
          formdata.append('correction', String(correction));
          formdata.append('cut_off', String(cut_off));
          formdata.append('socket_key', socket_key);
          formdata.append('feature', key);
          if (quant_feature[key] !== undefined){
            let number1 = document.getElementById('number1_'+key).value;
            let number2 = document.getElementById('number2_'+key).value;
            if ( number1 < 0 || number1 > 100 || number2 < 0 || number2 > 100){
              alert("Illegal quantile value");
              $('#number1_'+key).val(30);
              $('#number2_'+key).val(30);
              number1 = 30;
              number2 = 30;
            }
            
            formdata.append('number1', number1);
            formdata.append('number2', number2);

          }
          //var select_feature = $("body").find("[aria-selected='true']").text();
          $('#container_'+key).empty()
          $('#network_'+key).empty()
          //$('#loading_bar_0').show()
          //$('#counter_0').show()
          
          $.ajax({
            url: '/YMLA/refresh_result',
            type: 'POST',
            data: formdata,
            processData: false,
            contentType: false,
            success: function(data) {
              // let feature = key;
              let val = JSON.parse(data)
              if (val['yAxis_count'] != 0)
                render_result(name_map[key],key,val);
              else{
                $(`#pills-tab_${key}`).hide();
                $(`#no_terms_${key}`).show();
              }

            }             // ajax sucess
          })              // ajax of /refresh heatmap
        })                //#refresh_heatmap click
      })
      $.each(JSON.parse(data), function(key, val) {
        if (key == 'upset' || key == 'input_list' || key == 'input_list_no' || key == 'socket_key' || key =='Error_log')
          return;
        if (val['yAxis_count'] != 0)
          render_result(name_map[key],key,val);     
        else{
          $(`#pills-tab_${key}`).hide()
          $(`#no_terms_${key}`).show();
        }
      })
      
      //$('#run_analysis').show()
      $('#run_analysis').html('<i class="fa fa-paper-plane" aria-hidden="true"></i> Run Enrichment Analysis')
      $('#run_analysis').attr('disabled', false);
      // $('#log').html('');
      $("#run_msg").hide();
      clearInterval(time_counter);
      // $("#footer").hide();
    }  // File_upload success
  })   // File_upload ajax_
})     // run_analysis click function


function render_upset_plot(upset_data){
  console.log(upset_data)
  let data = [];
  for (const key in upset_data){
    data.push({ name: key, elems: upset_data[key]});
  }
  const sets = UpSetJS.asSets(data);
  
  const props = {
    sets: sets,
    width: 600,
    height: 400,
    combinations: {
      type: 'intersection',
      min: 1,
      limit: 100,
      order: 'cardinality',
    },
    selection: null,
    setName: 'Custom Set Name',
    combinationName: 'Custom Intersection Name'
  }
  props.onHover = (set) => {
    props.selection = set;
    UpSetJS.render(document.querySelector("#container-upset"), props);
  };
  UpSetJS.render(document.querySelector("#container-upset"), props);
}