$(document).ready(function() {
  
  function filter_table_by_tube() {
    var tube = $("#peek_range_tube_select").val();
    if (tube === '') {
      $('tr.datum[data-tube]').show();
    } else {
      $('tr.datum[data-tube!="'+tube+'"]').hide();
      $('tr.datum[data-tube="'+tube+'"]').show();
    }
  }

  if ($('#peek_range_table').length > 0) {
    $("#peek_range_tube_select").change(function(event) {
		  filter_table_by_tube();
    });
    
    //Run Immediately on Page Load
    filter_table_by_tube();
  }  
});
