function render_result(feature,key,val) {  // when pvalue is clicked
$(`#no_terms_${key}`).hide();
$(`#pills-tab_${key}`).show()
// let feature = key;
let input_list = JSON.parse(val['xAxis_categories']);

// Create table view 
let table_col = "";
$.each(input_list, function( index, value ) {
  table_col += '<th scope="col" >'+value+'</th>';
});
let terms = JSON.parse(val['yAxis_categories']);
let yids = JSON.parse(val['yAxis_id']).reverse();
let table_row = "";
let table_ids = [];
$.each(terms.reverse(), function( index, value ) {
  table_row += '<tr>';
  table_row += '<th style="text-align: left;">'+value+'</th>';
  let table_data = JSON.parse(val['table_data']);
  $.each(input_list, function( xid, value2 ) {
    let v = table_data[xid].reverse()[index];
    let id = String(xid+'_'+yids[index]);
    if (v >= val['cut_off']){
      // table_row += '<td><a onclick="return false;" href="#" id="table_'+key+"_"+id+'">'+v+'</a></td>';
      table_row += `<td ><a href="/YMLA/show_block_detail?click_block_id=${id}&feature=${key}&socket_key=${val['socket_key']}" target="_blank">${v}</a></td>`;
      table_ids.push(id);
    }
    else
      table_row += '<td>  </td>';
  });
  table_row += '</tr>';
});

let table_content = `
<table class="table table-hover table-bordered" id="table_content_${key}">
<thead>
  <tr class="table-secondary">
    <th scope="col">${feature}</th>
    ${table_col}
  </tr>
</thead>
<tbody>
  ${table_row}
</tbody>
</table>
`;
$('#table_'+key).html(table_content);
let datatable =$('#table_content_'+key).DataTable({
  // "order": [[ 1, "desc" ],[ 2, "desc" ]],
  'bDestroy': true,
  searching: false, 
  paging: false, 
  info: false,
  dom: 'Bflrtip',
  buttons: [
  ],
});
$('th[class^="sorting"]').on('click', 'a', function(event) {
  event.stopPropagation();
});
// $.each(table_ids, function( index, id ) {
//   $('#table_'+key+"_"+id).click(function() {
//     $('#modal_title').html("");
//     $('#loading_bar_0').show();
//     $('#card_pvalue').hide();
//     $('#card_gene').hide();
//     $('#card_data').hide();
//     $('#myModal').modal('show');
//     $.ajax({
//       url: '/show_block_detail',
//       type: 'POST',
//       dataType: 'json',
//       data: {
//         'click_block_id': id,
//         'feature':key,
//         'socket_key':socket_key,
//       },
//       success: function(data) {
//         block_detail(data)
//       },
//       error: function() {
//         alert('error')
//       }  // error function
//     })   // ajax
//   });
// });
// End of table view

// Create Heatmap view 
Highcharts.chart('container_'+key, {
  chart:
      {type: 'heatmap', marginBottom: 40, height: val['yAxis_count']*30+100},

  plotOptions: {
    series: {
      dataLabels: {
        formatter: function() {
          if (this.point.value >= val['cut_off'])
            return this.point.value;
        },
        style: {cursor: 'pointer'},
      },
      turboThreshold: 0,
      // block dynamic
      events: {
        click: function(event) {
          if (event.point.value != 0) {
            // $('#modal_title').html("");
            // $('#loading_bar_0').show();
            // $('#card_pvalue').hide();
            // $('#card_gene').hide();
            // $('#card_data').hide();
            // $('#myModal').modal('show');
            let w = window.open(`/YMLA/show_block_detail?click_block_id=${event.point.id}&feature=${key}&socket_key=${val['socket_key']}`, "_blank");
            w.focus();

            // $.ajax({
            //   url: '/show_block_detail',
            //   type: 'POST',
            //   dataType: 'json',
            //   data: {
            //     'click_block_id': String(event.point.id),
            //     'feature':key,
            //     'socket_key':socket_key,
            //   },
            //   success: function(data) {
            //     block_detail(data)
            //   },
            //   error: function() {
            //     alert('error')
            //   }  // error function
            // })   // ajax
          }      // if
        }
      }
    }
  },
  title: {text: ''},

  xAxis: [
    // {
    //   categories: JSON.parse(val['xAxis_categories']),
    //   labels: {
    //     style: {color: '#28004D', fontSize: '18px', cursor: 'pointer'},
    //   }
    // },
    {
      // linkedTo: 0,
      opposite: true,
      categories: JSON.parse(val['xAxis_categories']),
      labels: {
        style: {color: '#28004D', fontSize: '18px', cursor: 'pointer'},
      }
    }
  ],

  yAxis: {
    //floor: val['cut_off'],
    //min: val['cut_off'],
    //minColor: '#E8FFF5',
    //maxColor: '#006030',
    //ceiling: 100,
    categories: JSON.parse(val['yAxis_categories']),
    title: null,
    labels: {
      style: {color: '#006000', fontSize: '16px', cursor: 'pointer'},
    }
  },

  colorAxis: {
    //stops: [
      ////[0, '#E8FFF5'],
      //[0, '#FFFFFF'],
      //[(val['cut_off'] / val['max_pvalue']) - 0.000000000000001, '#FFFFFF'],
      ////[val['cut_off'] / val['max_pvalue'] - 0.0221, '#E8FFF5'],
      //[val['cut_off'] / val['max_pvalue'], '#E8FFF5'],
      //[1, '#006030']
    //],
    //min: 0,
    min: val['cut_off'],
    max: 30,
    //max: val['cut_off'],
    //max: val['max_pvalue'],
    startOnTick: false,
    //startOnTick: true,
    tickInterval: 1,
    //minColor: '#FFFFFF',
    minColor: '#E8FFF5',
    //maxColor: '#FF00FF',
    maxColor: '#006030',
    
  },

  legend: {
    align: 'right',
    layout: 'vertical',
    margin: 0,
    verticalAlign: 'top',
    // y: 25,
    // symbolHeight: 320
  },

  tooltip: {
    formatter: function() {
      return 'Input list of <b>' +
          this.series.xAxis.categories[this.point.x] + '</b><br>' +
          '-log<sub>10</sub> (Corrected P-value): <b>' + this.point.value + '</b><br>' +
          'Feature name: <b>' +
          this.series.yAxis.categories[this.point.y] + '</b>';
    }
  },

  series: [
    {
      borderWidth: 1,
      data: JSON.parse(val['heatmap_data']),
      //color: '#FFFFFF',
      //colorKey: 'x',
      dataLabels: {
        enabled: true,
    
        color: 'black',
        style: {textShadow: 'none', HcTextStroke: null, fontSize: '14px'}
      },
      states: {
        hover: {
          color: '#455a64',
        }
      },
    },
  ]

});  // highcharts
if(quant_feature[key] !== undefined|| key=="gene_group" || key=="custom"){
  let network = Highcharts.chart('network_'+key, {
    chart: {
      type: "networkgraph",
      height: '50%',
      // marginTop: 80
    },
  
    title: {
      text: ""
    }, 
    plotOptions: {
      networkgraph: {
        keys: ["from", "to","label","width"],
        layoutAlgorithm: {
          enableSimulation: false,
          integration: "verlet",
          // integration: 'euler',

          // linkLength: 250,
          friction: -0.05,

        }
      }
    },
    tooltip: {
      enabled: false,
    },
    series: [
      {
        // marker: {
        //   states: {
        //     inactive: {
        //       /**
        //        * Opacity of inactive markers.
        //        */
        //       linkOpacity: 0,
        //       opacity: 0.1
        //     }
        //   }
        // },

        states: {
          inactive: {
            enabled: true,
            linkOpacity: 0,
          },
        },

        dataLabels: {
          enabled: true,
          // inside: true,
          linkFormat: '<span style="color:green;">{point.label}</span>',
          // linkFormatter: function() {
          //   console.log(this.series.opacity)

          //   if (this.series.options.states.normal.animation == true)
          //     return '';
          //   else 
          //     return '<span style="color:green;">'+this.point.label+'</span>';
          // },
          // linkFormat: '{point.label}',
          allowOverlap: true,
          style: {
            textOutline: false
          },
          y: 10
        },
        data: JSON.parse(val['edges']),
        nodes: JSON.parse(val['nodes'])
        
      }
    ]
  });
}
}