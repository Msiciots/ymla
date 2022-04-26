function block_detail(data,name_map, quant_feature) {  // when pvalue is clicked
    $('#loading_bar_0').hide();
    $('#block_content').show();
    
    $('#modal_title').html('<b><i class="far fa-list-alt"></i> Enrichment Analysis Result</b>')
    $('#pvalue_block_title').html('<b>Analysis Result</b>')
    $("#block_term").html(`${data['term']} <spin id="term_des"></spin>`);
    $("#block_list").html(`${data['input_title']}`);
    $("#block_input_gene_no").html(data['input_no']);
    let str_corr = "No correction";
    if (data['corr'] == 'FDR')
      str_corr = "FDR correction"
    else if (data['corr'] == 'Bonferroni')
      str_corr = "Bonferroni correction"
    $("#block_corr").html(`
      ${str_corr}, -log<sub>10</sub>(Corrected p-value) cutoff = ${data['cut-off']}
    `);

    let title = "Enriched Term";
    let evidence_title;

    if (data['feature_type'] == "gene_group"){
      title = "Enriched Gene Group";
      evidence_title = `<spin style="color:red;">${data['evidence_no']}</spin> evidence of <spin style="color:red;">${data['intersection_number']}</spin> input genes that <spin style="color: red;">belong to the gene group</spin> [<spin style="color: blue">${data['term']}</spin>]`;
    }
    else if(data['feature_type'] in quant_feature){
      let term = data['term'];
      let term_name = term.substring(0,term.length-8)
      evidence_title = `<spin style="color:red;">${data['intersection_number']}</spin> input genes <spin style="color: red;">are associated with the term</spin> [<spin style="color: blue">${data['term']}</spin>]`;
      $('#term_des').html(`, a list containing genes whose <spin style="color:blue;">${term_name}</spin> belong to the <spin style="color:red;">${data['percent']}</spin> of the <spin style="color:blue;">${term_name}</spin> in the genome.`);
    }
    else if(data['feature_type'] == "complex"){
      evidence_title = `<spin style="color:red;">${data['intersection_number']}</spin> input genes <spin style="color: red;">belong to the protein complex</spin> [<spin style="color: blue">${data['term']}</spin>]`;
    }
    else if(data['feature_type'] == "phenotype"){
      evidence_title = `<spin style="color:red;">${data['evidence_no']}</spin>  evidence of <spin style="color:red;">${data['intersection_number']}</spin> input genes that <spin style="color: red;">have the mutant phenotype [<spin style="color: blue">${data['term']}</spin>]`;
    }
    else if(data['feature_type'] == "protein_domain"){
      evidence_title = `<spin style="color:red;">${data['evidence_no']}</spin>  evidence of <spin style="color:red;">${data['intersection_number']}</spin> input genes that <spin style="color: red;">have the protein domain [<spin style="color: blue">${data['term']}</spin>]`;
    }
    else if(data['feature_type'] == "physical_interaction"){
      evidence_title = `<spin style="color:red;">${data['evidence_no']}</spin>  evidence of <spin style="color:red;">${data['intersection_number']}</spin> input genes that <spin style="color: red;">have physical interaction with [<spin style="color: blue">${data['term']}</spin>]`;
    }
    else if(data['feature_type'] == "genetic_interaction"){
      evidence_title = `<spin style="color:red;">${data['evidence_no']}</spin>  evidence of <spin style="color:red;">${data['intersection_number']}</spin> input genes that <spin style="color: red;">have genetic interaction with [<spin style="color: blue">${data['term']}</spin>]`;
    }
    else if(data['feature_type'] == "regulator"){
      evidence_title = `<spin style="color:red;">${data['evidence_no']}</spin>  evidence of <spin style="color:red;">${data['intersection_number']}</spin> input genes that <spin style="color: red;">are targets of the transcriptional regulator [<spin style="color: blue">${data['term']}</spin>]`;
    }
    else{
      evidence_title = `<spin style="color:red;">${data['evidence_no']}</spin> evidence of the <spin style="color:red;">${data['intersection_number']}</spin> input genes that <spin style="color: red;">are associated with the ${name_map[data['feature_type']]} term</spin> [<spin style="color: blue">${data['term']}</spin>]`;
    }

    $('#evidence_data').html(`<b>${evidence_title}</b>`);

    $('#lipid_table_content')
        .html(
            '<table class=\'table table-bordered table-hover \'>' +
            '<thead>' +
            '<tr bgcolor=\'#EDEDED\'>' +
            //'<th>Domain Name</th>' +
            // '<th>'+data['feature_type']+'</th>' +
            '<th>'+title+'</th>' +
            '<th>Observed Ratio</th>' +
            '<th>Expected Ratio</th>' +
            '<th>-log<sub>10</sub>(Corrected p-value)</th>' +
            // content_col +
            '</tr>' +
            '</thead >' +
            '<tbody id=\'element_row\'>' +
            '</tbody>' +
            '</table>');
    // only do once, to pick "dict_click_data" data
    
    $('#element_row')
      .append(
        '<tr >' +
        //'<td style=\'text-align:left;\'>' + val['Domain'] + '</td>' +
        '<td>' + data['term'] + '</td>' +
        '<td>' + data['Observed_ratio'] + '</td>' +
        '<td>' + data['Expected_ratio'] + '</td>' +          
        '<td>' + data['P_value'] + '</td>' +
        // content_data +
        '</tr>');  // append
    
  
    // $('#block_2_title')
    //     .html(
    //         '<b><span style=\'color:blue;\'>' +
    //         data['input_title'] +
    //         '</span> has <span style=\'color:red;\'>' +
    //         data['intersection_number'] +
    //         '</span> Intersectional Gene(s) with <span style=\'color:blue;\'>'+data['term']+'</span></b>')
  
    // $('#intersected_genes')
    // .html(
    //     '<table class=\'table table-bordered table-hover responsive \' id=\'gene_content\'>' +
    //     '<thead>' +
    //     '<tr bgcolor=\'#EDEDED\'>' +
    //     '<th>Systematic Name</th>' +
    //     '<th>Standard Name</th>' +
    //     '<th>SGDID</th>' +
    //     '<th>Description</th>' +
    //     '</tr>' +
    //     '</thead >' +
    //     '<tbody id=\'intersected_gene_row\'>' +
    //     '</tbody>' +
    //     '</table>');
    // $.each(JSON.parse(data['intersection_gene']), function(key, val) {
    // $('#intersected_gene_row')
    //     .append(
    //       '<tr >' +
    //       '<td >' + val['Systematic Name'] + '</td>' +
    //       '<td >' + val['standard_name'] + '</td>' +
    //       '<td >' + val['sgdid'] + '</td>' +
    //       '<td >' + val['description'] + '</td>' +
    //         '</tr>');  // append
    // })
    // $('#gene_content').DataTable().destroy();
    // let table_gene =$('#gene_content').DataTable({
    //   'order': [],
    //   // "bSort":false,
    //   // "columnDefs": [
    //   //    	{ "orderable": false, "targets": [0,1,2]}
    //   //  	],
    //   'bDestroy': true,
    //   // dom: 'Bflrtip',
    //   dom: 'B<"clear">lfrtip',
      
    //   buttons: [
    //     // 'csvHtml5',
    //     {
        
    //     extend: 'csvHtml5',
    //     title: 'Intersected genes details',
    //     text: '<i class="fa fa-download"></i> Download',
    //     className:'btn btn-secondary',
    //   }],
    // })
    // $('#btn_d2').empty();
    // table_gene.buttons().container()
    //       .appendTo('#btn_d2');


    let table_col = ""
    data['raw_data_col'].forEach(element => table_col += '<th>'+element+'</th>')
    // table table-striped table-hover responsive table-bordered 
    
    $('#block_2_table')
        .html(
            '<table class=\'table table-bordered table-hover responsive\' id=\'block_2_content\'>' +
            '<thead>' +
            '<tr bgcolor=\'#EDEDED\'>' +
            table_col+
            '</tr>' +
            '</thead >' +
            '<tbody id=\'block_2_row\'>' +
            '</tbody>' +
            '</table>');
    $.each(JSON.parse(data['evidence_data']), function(key, val) {
      let row_content = ""
      for(let i =0 ;i<data['raw_data_col'].length;i++){
        let k = data['raw_data_col'][i];
        row_content += '<td>'+val[k]+'</td>'
      } 
      $('#block_2_row')
          .append(
              '<tr >' +
              row_content+ 
              '</tr>');  // append
    })
  
    $('#block_2_content').DataTable().destroy();
    let table_data =$('#block_2_content').DataTable({
      'order': [],
      // "bSort":false,
      // "columnDefs": [
      //    	{ "orderable": false, "targets": [0,1,2]}
      //  	],
      'bDestroy': true,
      dom: 'Bflrtip',
      // dom: 'B<"clear">lfrtip',
      buttons: [
        {
        extend: 'csvHtml5',
        title: evidence_title.replace(/<[^>]*>/g, ''),
        text: '<i class="fa fa-download"></i> Download (Evidence)',
        className:'btn btn-secondary float-right',
      }],
    })
    $('#btn_d').empty();
    
    table_data.buttons().container()
          .appendTo( '#btn_d' );

    // if(!(data['feature_type'] in quant_feature) && data['feature_type']!='gene_group'){
    //   $('#btn_gene_names_only').html("")
    //   $('#btn_gene_names_only').append('<button class="btn btn-secondary" id="download_genes"><i class="fa fa-download"></i> Download (Gene Names only)</button>')

    // }

    $('#card_data').show();
  

    $('#download_genes').click(function() {    
      // var json = JSON.parse(data['intersection_gene'])
      // let json_data = []
      // $.each(JSON.parse(data['intersection_genes_data']), function(key, val) {
      //   json_data.push(val);
      // })
      buildData(JSON.parse(data['intersection_genes_data'])).then(data => downloadCSV(data,evidence_title.replace(/<[^>]*>/g, '').substr(16)));
    });
  $('#card_pvalue').show();
  $('#card_gene').show();
  }  // end of pvalue_detial


// 網路上找的 json to csv download
const buildData = data => {
  return new Promise((resolve, reject) => {

    // 最後所有的資料會存在這
    let arrayData = [];

    // 取 data 的第一個 Object 的 key 當表頭
    let arrayTitle = Object.keys(data[0]);
    arrayData.push(arrayTitle);

    // 取出每一個 Object 裡的 value，push 進新的 Array 裡
    Array.prototype.forEach.call(data, d => {
      let items = [];
      Array.prototype.forEach.call(arrayTitle, title => {
        let item = d[title] || '';
        items.push(item);
      });
      arrayData.push(items)
    })
    resolve(arrayData);
  })

}
const downloadCSV = (data,fileName) => {
  let csvContent = '';
  Array.prototype.forEach.call(data, d => {
    let dataString = d.join(',') + '\n';
    csvContent += dataString;
  })

  // 下載的檔案名稱
  // let fileName = '下載資料_' + (new Date()).getTime() + '.csv';
  // let fileName = 'intersectional_genes.csv';

  // 建立一個 a，並點擊它
  let link = document.createElement('a');
  link.setAttribute('href', 'data:text/csv;charset=utf-8,%EF%BB%BF' + encodeURI(csvContent));
  link.setAttribute('download', fileName);
  link.click();
}
// 網路上找的 json to csv download