(function() {

  $(document).ready(function() {
    //Enable Tooltips
    $("[rel=tooltip]").tooltip();

    if ($('#form_tube_name').length > 0) {
      //Setup Typeahead For Tube Names on Add Job Form
      var tubeNames = $('#form_tube_name').data('tubes');
      $('#form_tube_name').typeahead({source: tubeNames});
    }

    //Update Underscore delimiters <% %> to Handlebar-style {{ }}
    _.templateSettings = {
      interpolate: /\{\{\=(.+?)\}\}/g,
      evaluate: /\{\{(.+?)\}\}/g
    };
  });

})();