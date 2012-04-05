module BeanstalkdView

  class Server < Sinatra::Base
    include BeanstalkdView::BeanstalkdUtils
    enable :sessions
      
    get "/" do
      begin
        @tubes = beanstalk.list_tubes
        @stats = beanstalk.stats
        @total_jobs_data = get_total_jobs_data(@tubes)
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
        @stats = beanstalk.stats_tube(params[:tube])
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
    
    def get_total_jobs_data(tubes)
      total_jobs_data = Hash.new
      items = Array.new
      tubes.keys.each do |key|
        tubes[key].each do |tube|
          stats = beanstalk.stats_tube(tube)
          total_jobs = stats['total-jobs']
          datum = Hash.new
          datum["label"] = "#{tube} - #{total_jobs}"
          datum["data"] = total_jobs
          items << datum
        end
      end
      total_jobs_data["items"] = items
      total_jobs_data
    end
  
  end  
end