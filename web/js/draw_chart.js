(function() {

  $(document).ready(function() {
    function draw_pie_chart(div, data) {
      //Create pie charts
      var chart = new Bluff.Bar(div, 460);
        //Setup theme
        var colors = ['#6886B4', '#FDD84E', '#72AE6E', '#D1695E', '#8A6EAF', '#EFAA43', 'white'];
        chart.set_theme({
        colors: colors,
        marker_color: 'white',
        font_color: 'white',
        background_colors: ['#008000', '#008000']
      });
      chart.tooltips = true;
      chart.hide_line_markers = false;
      chart.minimum_value = 0;
      var max_value = 0;
      //Add each data item to chart
      for (var i in data.items) {
        var item = data.items[i];
        chart.data(item.label, item.data);
        if (item.data > max_value) {
        max_value = item.data;
        }
      }
      chart.maximum_value = max_value;
      //Finally draw the chart
      chart.draw();
    }

    if ($('#total_jobs_chart').length > 0) {
      var total_jobs_data = $('#total_jobs_chart').data('set');
      if (total_jobs_data !== null) {
        draw_pie_chart('total_jobs_chart', total_jobs_data);
        $("#total_jobs_container").css('visibility', 'visible');
      }
    }

    if ($('#buried_jobs_chart').length > 0) {
      var buried_jobs_data = $('#buried_jobs_chart').data('set');
      if (buried_jobs_data !== null) {
        draw_pie_chart('buried_jobs_chart', buried_jobs_data);
        $("#buried_jobs_container").css('visibility', 'visible');
      }
    }
  });

})();