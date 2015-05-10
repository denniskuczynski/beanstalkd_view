(function() {

  $(document).ready(function() {
    //Enable Tooltips
    $("[rel=tooltip]").tooltip();

    //Update Underscore delimiters <% %> to Handlebar-style {{ }}
    _.templateSettings = {
      interpolate: /\{\{\=(.+?)\}\}/g,
      evaluate: /\{\{(.+?)\}\}/g
    };
  });

})();
