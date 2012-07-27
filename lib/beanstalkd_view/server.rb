module BeanstalkdView

  class Server < Sinatra::Base
    include BeanstalkdView::BeanstalkdUtils
    helpers Sinatra::Cookies
    
    root = File.dirname(File.expand_path(__FILE__))
    set :root, root
    set :views,  "#{root}/views"
    if respond_to? :public_folder
          set :public_folder, "#{root}/resources"
        else
          set :public, "#{root}/resources"
        end
    set :static, true

    register Sinatra::AssetPack
    assets do
      js :application, '/js/application.js', [
        '/js/vendor/json2.js', 
        '/js/vendor/jquery-1.7.1.min.js',
        '/js/vendor/bootstrap.min.js', 
        '/js/vendor/bluff-0.3.6.2/js-class.js', 
        '/js/vendor/bluff-0.3.6.2/bluff-min.js', 
        '/js/app.js',
        '/js/peek_jobs.js'
      ]
      css :application, '/css/application.css', [
        '/css/vendor/bootstrap.min.css', 
        '/css/app.css']
    end
      
    get "/" do
      begin
        @tubes = beanstalk.list_tubes
        @stats = beanstalk.stats
        @tube_set = tube_set(@tubes)
        chart_data = get_chart_data_hash(@tube_set)
        @total_jobs_data = chart_data["total_jobs_data"]
        @buried_jobs_data = chart_data["buried_jobs_data"] if chart_data["buried_jobs_data"]["items"].size > 0
        erb :index
      rescue Beanstalk::NotConnected => @error
        erb :error
      end
    end
    
    post "/add_job" do
      begin
        response = nil
        body = JSON.parse(params[:body])
        beanstalk.on_tube(params[:tube]) do |conn|
          response = conn.put([ params[:tube], body ].to_json, params[:priority].to_i, params[:delay].to_i, params[:ttr].to_i)
        end
        if response
          cookies[:beanstalkd_view_notice] = "Added job #{response.inspect}"
          redirect url("/")
        else
          cookies[:beanstalkd_view_notice] = "Error adding job"
          redirect url("/")
        end
      rescue Beanstalk::NotConnected => @error
        erb :error
      end
    end
    
    get "/tube/:tube" do
      begin
        @tube = params[:tube]
        @stats = beanstalk.stats_tube(@tube)
        erb :tube_stats
      rescue Beanstalk::NotConnected => @error
        erb :error
      end
    end
    
    get "/peek/:tube/:type" do
      content_type :json
      begin
        response = nil
        beanstalk.on_tube(params[:tube]) do |conn|
          if (params[:type]) == "ready"
            response = conn.peek_ready()
          elsif (params[:type]) == "delayed"
            response = conn.peek_delayed()
          else
            response = conn.peek_buried()
          end
        end
        if response
          ret_value = response.stats
          ret_value["body"] = response.body
          ret_value.to_json
        else
          { :error => "No job was found, or an error occurred while trying to peek at the next job."}.to_json
        end
      rescue Beanstalk::NotConnected => @error
        { :error => @error.to_s }.to_json
      end
    end

    get "/delete/:tube/:job_id" do
       begin
          response = nil
          beanstalk.on_tube(params[:tube]) do |conn|
            response = conn.delete(params[:job_id].to_i)
          end
          if response
            cookies[:beanstalkd_view_notice] = "Deleted Job #{params[:job_id]}"
            redirect url("/tube/#{params[:tube]}")
          else
            cookies[:beanstalkd_view_notice] = "Error deleting Job #{params[:job_id]}"
            redirect url("/tube/#{params[:tube]}")
          end
        rescue Beanstalk::NotConnected => @error
          erb :error
        end
    end
    
    post "/pause" do
      begin
        response = beanstalk.pause_tube(params[:tube], params[:delay].to_i)
        if response
          cookies[:beanstalkd_view_notice] = "Paused #{params[:tube]}. No jobs will be reserved for #{params[:delay].to_i} seconds."
          redirect url("/tube/#{params[:tube]}")
        else
          cookies[:beanstalkd_view_notice] = "Error pausing #{params[:tube]}."
          redirect url("/tube/#{params[:tube]}")
        end
      rescue NameError => @error
        cookies[:beanstalkd_view_notice] = "The pause_tube method is currently not implemented by this version of beanstalk-client."
        redirect url("/tube/#{params[:tube]}")
      rescue Beanstalk::NotConnected => @error
        erb :error
      end
    end
    
    post "/kick" do
      begin
        response = nil
        beanstalk.on_tube(params[:tube]) do |conn|
          response = conn.kick(params[:bound].to_i)
        end
        if response
          cookies[:beanstalkd_view_notice] = "Kicked #{params[:tube]} for #{response} jobs."
          redirect url("/tube/#{params[:tube]}")
        else
          cookies[:beanstalkd_view_notice] = "Error kicking #{params[:tube]}."
          redirect url("/tube/#{params[:tube]}")
        end
      rescue Beanstalk::NotConnected => @error
        erb :error
      end
    end
    
    def url_path(*path_parts)
      [ path_prefix, path_parts ].join("/").squeeze('/')
    end
    alias_method :u, :url_path

    def path_prefix
      request.env['SCRIPT_NAME']
    end

    def notice_message
      message = cookies[:beanstalkd_view_notice]
      cookies[:beanstalkd_view_notice] = ''
      message
    end

    private
        
    # Return the stats data in a format for the Bluff JS UI Charts
    def get_chart_data_hash(tube_set)
      chart_data = Hash.new
      chart_data["total_jobs_data"] = Hash.new
      chart_data["buried_jobs_data"] = Hash.new
      chart_data["total_jobs_data"]["items"] = Array.new
      chart_data["buried_jobs_data"]["items"] = Array.new 
      tube_set.each do |tube|
        begin
          stats = beanstalk.stats_tube(tube)
          #total_jobs
          total_jobs = stats['total-jobs']
            if total_jobs > 0
            total_datum = Hash.new
            total_datum["label"] = tube
            total_datum["data"] = total_jobs
            chart_data["total_jobs_data"]["items"] << total_datum
          end
          #buried_jobs
          buried_jobs = stats['current-jobs-buried']
          if buried_jobs > 0
            buried_datum = Hash.new
            buried_datum["label"] = tube
            buried_datum["data"] = buried_jobs
            chart_data["buried_jobs_data"]["items"] << buried_datum
          end
        rescue Beanstalk::NotFoundError
          puts "Ignoring Beanstalk::NotFoundError for #{tube}"
        end
      end
      chart_data
    end
    
    # Return a Set of tube names
    def tube_set(tubes)
      tube_set = Set.new
      tubes.keys.each do |key|
        tubes[key].each do |tube|
          tube_set.add(tube)
        end
      end
      tube_set
    end

  end  
end