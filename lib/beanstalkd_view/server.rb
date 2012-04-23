module BeanstalkdView

  class Server < Sinatra::Base
    include BeanstalkdView::BeanstalkdUtils
    enable :sessions
    
    helpers do
      include Rack::Utils
      alias_method :h, :escape_html
    end
    
    get "/" do
      begin
        @tubes = beanstalk.list_tubes
        @stats = beanstalk.stats
        chart_data = get_chart_data_hash(@tubes)
        @total_jobs_data = chart_data["total_jobs_data"]
        @buried_jobs_data = chart_data["buried_jobs_data"] if chart_data["buried_jobs_data"]["items"].size > 0
        @message = session[:message]
        session[:message] = nil
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
          session[:message] = "Added job #{response.inspect}"
          redirect url("/")
        else
          session[:message] = "Error adding job"
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
        @message = session[:message]
        session[:message] = nil
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
          puts "On Tube #{conn.inspect} #{params[:type]}"
          if (params[:type]) == "ready"
            puts "Peaking Ready"
            response = conn.peek_ready()
          elsif (params[:type]) == "delayed"
            puts "Peaking Delayed"
            response = conn.peek_delayed()
          else
            puts "Peeking Buried"
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
            session[:message] = "Deleted Job #{params[:job_id]}"
            redirect url("/tube/#{params[:tube]}")
          else
            session[:message] = "Error deleting Job #{params[:job_id]}"
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
          session[:message] = "Paused #{params[:tube]}. No jobs will be reserved for #{params[:delay].to_i} seconds."
          redirect url("/tube/#{params[:tube]}")
        else
          session[:message] = "Error pausing #{params[:tube]}."
          redirect url("/tube/#{params[:tube]}")
        end
      rescue NameError => @error
        session[:message] = "The pause_tube method is currently not implemented by this version of beanstalk-client."
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
          session[:message] = "Kicked #{params[:tube]} for #{response} jobs."
          redirect url("/tube/#{params[:tube]}")
        else
          session[:message] = "Error kicking #{params[:tube]}."
          redirect url("/tube/#{params[:tube]}")
        end
      rescue Beanstalk::NotConnected => @error
        erb :error
      end
    end
    
    get "/resources/*" do |path|
      file = File.expand_path(File.join('resources', path), File.dirname(__FILE__))
      send_file file
    end
    
    private
    
    def get_chart_data_hash(tubes)
      chart_data = Hash.new
      chart_data["total_jobs_data"] = Hash.new
      chart_data["buried_jobs_data"] = Hash.new
      chart_data["total_jobs_data"]["items"] = Array.new
      chart_data["buried_jobs_data"]["items"] = Array.new 
      tube_list(tubes).each do |tube|
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
    
    def tube_list(tubes)
      tube_list = Set.new
      tubes.keys.each do |key|
        tubes[key].each do |tube|
          tube_list.add(tube)
        end
      end
      tube_list
    end
  
  end  
end