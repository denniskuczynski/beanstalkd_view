$(document).ready(function() {
	// Enable Peek Job Button Handlers
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
        $("#job_info_popup_title").html(create_job_info_title(data));      
        $("#job_info_popup_body").html(create_job_info_table(data));
        $("#job_info_popup_footer").html(create_job_info_buttons(tube, data, url_base));
        $("[rel=tooltip]").tooltip();  //refresh tooltips
        $("#job_info_popup").modal({});
      }
    }).error(function() { alert("An error occurred while trying to peek at the next job."); });
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
    job_info_buttons += "<a id=\"confirm_add_job_btn\" href=\"#\" class=\"btn\">Add Job</a>";
    return job_info_buttons;
  }
  
  function create_job_info_buttons(tube, data, url_base) {
    var job_id = data.id;
    var priority = data.pri;
    var job_info_buttons = "";
    job_info_buttons += "<a href=\""+url_base+"delete/"+encodeURIComponent(tube)+"/"+job_id+"\" class=\"btn\">Delete Job</a>";
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
    var job_info_table = "<table class=\"table\">";
    job_info_table += "<tbody>";
    job_info_table += create_job_info_row("tube", data.tube, "The tube to which the job will be added.");      
    job_info_table += create_job_info_row("pri", data.pri, "The priority value set by the put, release, or bury commands.");      
    if ("age" in data) {
      job_info_table += create_job_info_row("age", data.age, "The time in seconds since the put command that created this job.");
    }
    job_info_table += create_job_info_row("delay", data.delay, "The delay value in seconds");      
    job_info_table += create_job_info_row("ttr", data.ttr, "The number of seconds to allow a worker to run this job. This time is counted from the moment a worker reserves this job. If the worker does not delete, release, or bury the job within ttr seconds, the job will time out and the server will release the job.");      
    if ("time-left" in data) {
      job_info_table += create_job_info_row("time-left", data["time-left"], "The number of seconds left until the server puts this job into the ready queue. This number is only meaningful if the job is reserved or delayed. If the job is reserved and this amount of time elapses before its state changes, it is considered to have timed out.");      
    }
    if ("reserves" in data) {
      job_info_table += create_job_info_row("reserves", data.reserves, "The number of times this job has been reserved");
    }
    if ("timeouts" in data) {
      job_info_table += create_job_info_row("timeouts", data.timeouts, "The number of times this job has timed out during a reservation.");
    }
    if ("releases" in data) {
      job_info_table += create_job_info_row("releases", data.releases, "The number of times a client has released this job from a reservation.");
    }
    if ("buries" in data) {
      job_info_table += create_job_info_row("buries", data.buries, " The number of times this job has been buried.");
    }
    if ("kicks" in data) {
      job_info_table += create_job_info_row("kicks", data.kicks, "The number of times this job has been kicked.");
    }
    job_info_table += create_job_info_row("body", data.body, "The jobs body content.");      
    job_info_table += "</tbody>";
    job_info_table += "</table>";
    return job_info_table;
  }

  function create_job_info_row(key, value, title) {
    var job_info_row = "<tr rel=\"tooltip\" title=\""+title+"\">";
    job_info_row += "<td>"+key+"</td>";
    job_info_row += "<td>"+value+"</td>";
    job_info_row += "</tr>";
    return job_info_row;
  }
});