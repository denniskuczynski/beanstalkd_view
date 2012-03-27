<!-- Enable Peek Job Button Handlers
$(document).ready(function() {
	if ($("#peek_ready_btn").length > 0) {
		$("#peek_ready_btn").click(function() {
      peek('ready');
    });
	}
	if ($("#peek_delayed_btn").length > 0) {
		$("#peek_delayed_btn").click(function() {
      peek('delayed');
    });
	}
	if ($("#peek_buried_btn").length > 0) {
		$("#peek_buried_btn").click(function() {
      peek('buried');
    });
	}
	
	function peek(queue) {
    var tube = document.getElementById("form_tube_name").value;
    var url_base = document.getElementById("form_url_base").value;
    var jqxhr = $.getJSON(url_base+"peek/"+tube+"/"+queue, function(data) {
      if (data.hasOwnProperty("error")) {
        alert(data["error"]);
      } else {
        $("#job_info_popup_title").html(create_job_info_title(data));      
        $("#job_info_popup_body").html(create_job_info_table(data));
        $("#job_info_popup_footer").html(create_job_info_buttons(tube, data, url_base));
        $("[rel=tooltip]").tooltip();  //refresh tooltips
        $("#job_info_popup").modal({});
      }
    })
    .error(function() { alert("An error occurred while trying to peek at the next job."); })
  }
  
  function create_job_info_buttons(tube, data, url_base) {
    var job_id = data["id"];
    var priority = data["pri"];
    var job_info_buttons = "";
    job_info_buttons += "<a href=\""+url_base+"delete/"+tube+"/"+job_id+"\" class=\"btn\">Delete Job</a>";
    return job_info_buttons;
  }

  function create_job_info_title(data) {
    var id = data["id"];
    var state = data["state"];
    return "<h3>Job id: "+id+" ("+state+")</h3>";
  }

  function create_job_info_table(data) {
    var job_info_table = "<table class=\"table\">";
    job_info_table += "<tbody>";
    job_info_table += create_job_info_row("pri", data["pri"], "The priority value set by the put, release, or bury commands.");      
    job_info_table += create_job_info_row("age", data["age"], "The time in seconds since the put command that created this job.");      
    job_info_table += create_job_info_row("delay", data["delay"], "The delay value in seconds");      
    job_info_table += create_job_info_row("ttr", data["ttr"], "The number of seconds to allow a worker to run this job. This time is counted from the moment a worker reserves this job. If the worker does not delete, release, or bury the job within ttr seconds, the job will time out and the server will release the job.");      
    job_info_table += create_job_info_row("time-left", data["time-left"], "The number of seconds left until the server puts this job into the ready queue. This number is only meaningful if the job is reserved or delayed. If the job is reserved and this amount of time elapses before its state changes, it is considered to have timed out.");      
    job_info_table += create_job_info_row("reserves", data["reserves"], "The number of times this job has been reserved");      
    job_info_table += create_job_info_row("timeouts", data["timeouts"], "The number of times this job has timed out during a reservation.");      
    job_info_table += create_job_info_row("releases", data["releases"], "The number of times a client has released this job from a reservation.");      
    job_info_table += create_job_info_row("buries", data["buries"], " The number of times this job has been buried.");      
    job_info_table += create_job_info_row("kicks", data["kicks"], "The number of times this job has been kicked.");      
    job_info_table += create_job_info_row("body", data["body"], "The jobs body content.");      
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