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
        '/js/peek_jobs.js',
        '/js/peek_range.js'
      ]
      css :application, '/css/application.css', [
        '/css/vendor/bootstrap.min.css', 
        '/css/app.css']
    end
    
    GUESS_PEEK_RANGE = 100 # Default number of elements to use in peek-range guesses
      
    get "/" do
      begin
        @tubes = beanstalk.tubes.all
        @stats = beanstalk.stats
        chart_data = get_chart_data_hash(@tubes)
        @total_jobs_data = chart_data["total_jobs_data"]
        @buried_jobs_data = chart_data["buried_jobs_data"] if chart_data["buried_jobs_data"]["items"].size > 0
        erb :index
      rescue Beaneater::NotConnected => @error
        erb :error
      end
    end
    
    post "/add_job" do
      begin
        response = nil
        tube = beanstalk.tubes[params[:tube]]
        response = tube.put params[:body], 
          :pri => params[:priority].to_i, :delay => params[:delay].to_i, :ttr => params[:ttr].to_i
        if response
          cookies[:beanstalkd_view_notice] = "Added job: #{response.inspect}"
          redirect url("/")
        else
          cookies[:beanstalkd_view_notice] = "Error adding job"
          redirect url("/")
        end
      rescue Beaneater::NotConnected => @error
        erb :error
      end
    end
    
    get "/tube/:tube" do
      begin
        @tube = beanstalk.tubes[params[:tube]]
        @stats = @tube.stats
        erb :tube_stats
      rescue Beaneater::NotConnected => @error
        erb :error
      end
    end
    
    get "/peek/:tube/:type" do
      content_type :json
      begin
        tube = beanstalk.tubes[params[:tube]]
        response = tube.peek(params[:type])
        if response
          job_to_hash(response).to_json
        else
          { :error => "No job was found, or an error occurred while trying to peek at the next job."}.to_json
        end
      rescue Beaneater::NotConnected => @error
        { :error => @error.to_s }.to_json
      end
    end
    
    get "/peek-range" do
      begin
        @min = params[:min].to_i
        @max = params[:max].to_i
        @min = params[:min].to_i
        tubes = beanstalk.tubes
        @tubes = tubes.all
        @tube = tubes[params[:tube]] if params[:tube] and params[:tube] != ''
        
        # Only guess with the specified tube (if passed in)
        guess_tubes = @tubes
        if @tube
          guess_tubes = []
          guess_tubes << @tube
        end
        # Guess ID Range if not specified
        min = guess_min_peek_range(guess_tubes) if @min == 0
        max = guess_max_peek_range(min) if @max == 0
        
        @jobs = []
        for i in min..max
          begin
            job = beanstalk.jobs.find(i)
            @jobs << job_to_hash(job) if job
          rescue Beaneater::NotFound => e
            # Since we're looping over potentially non-existant jobs, ignore
          end
        end
        erb :peek_range
      rescue Beaneater::NotConnected => @error
        erb :error
      end
    end

    get "/delete/:tube/:job_id" do
       begin
          response = nil
          job = beanstalk.jobs.find(params[:job_id].to_i)
          response = job.delete if job
          if response
            cookies[:beanstalkd_view_notice] = "Deleted Job #{params[:job_id]}"
            redirect url("/tube/#{params[:tube]}")
          else
            cookies[:beanstalkd_view_notice] = "Error deleting Job #{params[:job_id]}"
            redirect url("/tube/#{params[:tube]}")
          end
        rescue Beaneater::NotConnected => @error
          erb :error
        end
    end
    
    post "/pause" do
      begin
        tube = beanstalk.tubes[params[:tube]]
        response = tube.pause(params[:delay].to_i)
        if response
          cookies[:beanstalkd_view_notice] = "Paused #{params[:tube]}. No jobs will be reserved for #{params[:delay].to_i} seconds."
          redirect url("/tube/#{params[:tube]}")
        else
          cookies[:beanstalkd_view_notice] = "Error pausing #{params[:tube]}."
          redirect url("/tube/#{params[:tube]}")
        end
      rescue Beaneater::NotConnected => @error
        erb :error
      end
    end
    
    post "/kick" do
      begin
        response = nil
        tube = beanstalk.tubes[params[:tube]]
        response = tube.kick(params[:bound].to_i)
        if response
          cookies[:beanstalkd_view_notice] = "Kicked #{params[:tube]}: #{response}"
          redirect url("/tube/#{params[:tube]}")
        else
          cookies[:beanstalkd_view_notice] = "Error kicking #{params[:tube]}."
          redirect url("/tube/#{params[:tube]}")
        end
      rescue Beaneater::NotConnected => @error
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

    def job_to_hash(job)
      ret_value = {}
      job_stats = job.stats
      job_stats.keys.each { |key| ret_value[key] = job_stats[key] }
      ret_value['body'] = job.body.inspect
      ret_value
    end
        
    # Return the stats data in a format for the Bluff JS UI Charts
    def get_chart_data_hash(tubes)
      chart_data = {}
      chart_data["total_jobs_data"] = Hash.new
      chart_data["buried_jobs_data"] = Hash.new
      chart_data["total_jobs_data"]["items"] = Array.new
      chart_data["buried_jobs_data"]["items"] = Array.new 
      tubes.each do |tube|
        stats = tube.stats
        #total_jobs
        total_jobs = stats[:total_jobs]
          if total_jobs > 0
          total_datum = {}
          total_datum["label"] = tube.name
          total_datum["data"] = total_jobs
          chart_data["total_jobs_data"]["items"] << total_datum
        end
        #buried_jobs
        buried_jobs = stats[:current_jobs_buried]
        if buried_jobs > 0
          buried_datum = {}
          buried_datum["label"] = tube.name
          buried_datum["data"] = buried_jobs
          chart_data["buried_jobs_data"]["items"] << buried_datum
        end
      end
      chart_data
    end
    
    # Pick a Minimum Peek Range Based on calls to peek_ready
    def guess_min_peek_range(tubes)
      min = 0
      tubes.each do |tube|
        response = tube.peek('ready')
        if response
          if min == 0
            min = response.id.to_i
          else
            min = [min, response.id.to_i].min
          end
        end
      end
      # Add some jitter in the opposite direction of 1/4 range
      jitter_min = (min-(GUESS_PEEK_RANGE*0.25)).to_i
      [1, jitter_min].max
    end
    
    # Pick a Minimum Peek Range Based on the minimum
    def guess_max_peek_range(min)
      (min+GUESS_PEEK_RANGE)-1
    end

  end  
end