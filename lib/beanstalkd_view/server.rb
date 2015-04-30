module BeanstalkdView

  class Server < Sinatra::Base
    include BeanstalkdView::BeanstalkdUtils
    helpers Sinatra::Cookies

    root = File.dirname(File.expand_path(__FILE__))
    set :root, root
    set :views, (ENV['BEANSTALKD_VIEW_TEMPLATES'] || "#{root}/views")
    if respond_to? :public_folder
      set :public_folder, "#{root}/resources"
    else
      set :public, "#{root}/resources"
    end
    set :static, true

    get "/" do
      begin
        @connection = beanstalk.connection
        @tubes = beanstalk.tubes.all
        @tubes = @tubes.sort_by{|obj| obj.name }
        @stats = beanstalk.stats
        chart_data = get_chart_data_hash(@tubes)
        @total_jobs_data = chart_data["total_jobs_data"]
        @buried_jobs_data = chart_data["buried_jobs_data"] if chart_data["buried_jobs_data"]["items"].size > 0
        erb :index
      rescue Beaneater::NotFoundError => @error
        erb :error
      rescue Beaneater::NotConnected => @error
        close_connection
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
      rescue Beaneater::NotFoundError => @error
        erb :error
      rescue Beaneater::NotConnected => @error
        close_connection
        erb :error
      end
    end

    get "/tube/*" do
      begin
        @tube = beanstalk.tubes[params[:splat].first]
        @stats = @tube.stats
        erb :tube_stats
      rescue Beaneater::NotFoundError => @error
        erb :error
      rescue Beaneater::NotConnected => @error
        close_connection
        erb :error
      end
    end

    get "/peek/*" do
      content_type :json
      parts = params[:splat].first.split('/')
      tube = parts[0...-1].join('/')
      type = parts.last
      begin
        tube = beanstalk.tubes[tube]
        response = tube.peek(type)
        if response
          job_to_hash(response).to_json
        else
          { :error => "No job was found, or an error occurred while trying to peek at the next job."}.to_json
        end
      rescue Beaneater::NotFoundError => @error
        { :error => @error.to_s }.to_json
      rescue Beaneater::NotConnected => @error
        close_connection
        { :error => @error.to_s }.to_json
      end
    end

    get "/peek-range" do

      begin
        @min = params[:min].to_i
        @max = params[:max].to_i
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
        min = @min == 0 ? guess_min_peek_range(guess_tubes) : @min
        max = @max == 0 ? guess_max_peek_range(min) : @max

        @jobs = []
        for i in min..max
          job = beanstalk.jobs.find(i)
          @jobs << job_to_hash(job) if job
        end
        erb :peek_range
      rescue Beaneater::NotFoundError => @error
        erb :error
      rescue Beaneater::NotConnected => @error
        close_connection
        erb :error
      end
    end

    get "/delete/*" do
      parts = params[:splat].first.split('/')
      tube = parts[0...-1].join('/')
      job_id = parts.last
      begin
          response = nil
          job = beanstalk.jobs.find(job_id.to_i)
          raise Beaneater::NotFoundError.new("Job not found with specified id", 'find') if job.nil?
          response = job.delete
          if response
            cookies[:beanstalkd_view_notice] = "Deleted Job #{job_id}"
            redirect url("/tube/#{escaped_tube_param(tube)}")
          else
            cookies[:beanstalkd_view_notice] = "Error deleting Job #{job_id}"
            redirect url("/tube/#{escaped_tube_param(tube)}")
          end
      rescue Beaneater::NotFoundError => @error
        erb :error
      rescue Beaneater::NotConnected => @error
        close_connection
        erb :error
      end
    end

    post "/pause" do
      begin
        tube = beanstalk.tubes[params[:tube]]
        response = tube.pause(params[:delay].to_i)
        if response
          cookies[:beanstalkd_view_notice] = "Paused #{params[:tube]}. No jobs will be reserved for #{params[:delay].to_i} seconds."
          redirect url("/tube/#{escaped_tube_param}")
        else
          cookies[:beanstalkd_view_notice] = "Error pausing #{params[:tube]}."
          redirect url("/tube/#{escaped_tube_param}")
        end
      rescue Beaneater::NotFoundError => @error
        erb :error
      rescue Beaneater::NotConnected => @error
        close_connection
        erb :error
      end
    end

    post "/clear" do
      begin
        allowed_states = %w(delayed buried ready)
        if allowed_states.include?(params[:state])
          tube = beanstalk.tubes[params[:tube]]
          while job = tube.peek(params[:state].to_sym)
            job.delete
          end
          cookies[:beanstalkd_view_notice] = "Cleared all #{params[:state]} jobs from #{params[:tube]}."
        else
          cookies[:beanstalkd_view_notice] = "State isn't included in #{allowed_states.join(', ')}."
        end
        redirect url("/tube/#{escaped_tube_param}")
      rescue Beaneater::NotFoundError => @error
        erb :error
      rescue Beaneater::NotConnected => @error
        close_connection
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
          redirect url("/tube/#{escaped_tube_param}")
        else
          cookies[:beanstalkd_view_notice] = "Error kicking #{params[:tube]}."
          redirect url("/tube/#{escaped_tube_param}")
        end
      rescue Beaneater::NotFoundError => @error
        erb :error
      rescue Beaneater::NotConnected => @error
        close_connection
        erb :error
      end
    end

    def url_path(*path_parts)
      [ path_prefix, path_parts ].join("/").squeeze('/')
    end
    alias_method :u, :url_path

    private

    def escaped_tube_param(tube = nil)
      CGI::escape(tube || params[:tube])
    end

    def path_prefix
      request.env['SCRIPT_NAME']
    end

    def notice_message
      message = cookies[:beanstalkd_view_notice]
      cookies[:beanstalkd_view_notice] = ''
      message
    end

  end
end