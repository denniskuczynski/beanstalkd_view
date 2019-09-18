(function() {

  $(document).ready(function() {
    // Enable Peek Button Handlers
    if ($("#peek_ready_btn").length > 0) {
      $("#peek_ready_btn").click(function(event) {
        event.preventDefault();
        peek('ready');
      });
    }
    if ($("#peek_delayed_btn").length > 0) {
      $("#peek_delayed_btn").click(function(event) {
        event.preventDefault();
        peek('delayed');
      });
    }
    if ($("#peek_buried_btn").length > 0) {
      $("#peek_buried_btn").click(function(event) {
        event.preventDefault();
        peek('buried');
      });
    }
    if ($("#add_job_btn").length > 0) {
      $("#add_job_btn").click(function(event) {
        event.preventDefault();
        add_job();
      });
    }

    function peek(queue) {
      var tube = document.getElementById("form_tube_name").value;
      var url_base = document.getElementById("form_url_base").value;
      var jqxhr = $.getJSON(url_base+"peek/"+encodeURIComponent(tube)+"/"+queue, function(data) {
        if (data.hasOwnProperty("error")) {
          alert(data.error);
        } else {
          var parsed = data.body;

          // Double JSON encoding can occur.
          //
          try {
            parsed = JSON.parse(parsed);
            parsed = JSON.parse(parsed);
          } catch(e) {}

          data.body = JSON.stringify(parsed, null, "  ");

          $("#job_info_popup_title").html(create_job_info_title(data));
          $("#job_info_popup_body").html(create_job_info_table(data));
          $("#job_info_popup_footer").html(create_job_info_buttons(tube, data, url_base));
          $("[rel=tooltip]").tooltip();  //refresh tooltips
          $("#job_info_popup").modal({});
        }
      }).fail(function() { alert("An error occurred while trying to peek at the next job."); });
    }

    function add_job() {
      var tube = document.getElementById("form_tube_name").value;
      var priority = document.getElementById("form_job_priority").value;
      var delay = document.getElementById("form_job_delay").value;
      var ttr = document.getElementById("form_job_ttr").value;
      var body = document.getElementById("form_job_body").value;
      // Use defaults if empty
      if (tube === "") {
        tube = "default";
        document.getElementById("form_tube_name").value = tube;
      }
      if (priority === "") {
        priority = "65536";
        document.getElementById("form_job_priority").value = priority;
      }
      if (delay === "") {
        delay = "0";
        document.getElementById("form_job_delay").value = delay;
      }
      if (ttr === "") {
        ttr = "120";
        document.getElementById("form_job_ttr").value = ttr;
      }
      if (body === "") {
        body = "{}";
        document.getElementById("form_job_body").value = body;
      }
      //Ensure valid body JSON
      var parsed_body_json = null;
      var body_parse_error = null;
      try {
        parsed_body_json = JSON.parse(body);
        if (parsed_body_json.constructor == Array) {
          throw "Job Body JSON must be a Hash";
        }
      } catch(e) {
        body_parse_error = e;
      }
      if (body_parse_error !== null) {
        alert("Job Body JSON parse error: "+body_parse_error);
      } else {
        // Build the confirmation popup
        data = {};
        data.tube = tube;
        data.pri = priority;
        data.delay = delay;
        data.ttr = ttr;
        data.body = JSON.stringify(parsed_body_json);
        $("#job_info_popup_title").html(create_new_job_title());
        $("#job_info_popup_body").html(create_job_info_table(data));
        $("#job_info_popup_footer").html(create_new_job_buttons());
        $("#confirm_add_job_btn").click(function() {
          $("#add_job_form").submit();
        });
        $("[rel=tooltip]").tooltip();  //refresh tooltips
        $("#job_info_popup").modal({});
      }
    }

    function create_new_job_buttons() {
      var job_info_buttons = "";
      job_info_buttons += "<a id=\"confirm_add_job_btn\" href=\"#\" class=\"btn btn-secondary\">Add Job</a>";
      return job_info_buttons;
    }

    function create_job_info_buttons(tube, data, url_base) {
      var job_id = data.id;
      var priority = data.pri;
      var job_info_buttons = "";
      job_info_buttons +=
        "<a href=\""+url_base+"kick/"+encodeURIComponent(tube)+"/"+job_id+"\" class=\"btn btn-success\">Kick Job</a>" +
        "<a href=\""+url_base+"delete/"+encodeURIComponent(tube)+"/"+job_id+"\" class=\"btn btn-danger mr-0\">Delete Job</a>";
      return job_info_buttons;
    }

    function create_new_job_title() {
      return "<h3>Add new job?</h3>";
    }

    function create_job_info_title(data) {
      var id = data.id;
      var state = data.state;
      return "<h3>Job id: "+id+" ("+state+")</h3>";
    }

    function create_job_info_table(data) {
      var compiled = _.template($('#job_modal_template').text());
      return compiled({data: data});
    }
  });

})();