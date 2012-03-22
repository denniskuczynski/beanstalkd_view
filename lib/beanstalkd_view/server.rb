module BeanstalkdView

  class Server < Sinatra::Base
    include BeanstalkdView::BeanstalkdUtils
    enable :sessions
      
    get "/" do
      begin
        @tubes = beanstalk.list_tubes
        @stats = beanstalk.stats
        @message = session[:message]
        session[:message] = nil
        erb :index
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
    
    post "/kick" do
      begin
        response = nil
        beanstalk.on_tube(params[:tube]) do |conn|
          response = conn.kick(params[:bound].to_i)
        end
        if response
          session[:message] = "Kicked #{params[:tube]} for #{response} jobs"
          redirect "/beanstalkd/tube/#{params[:tube]}"
        else
          session[:message] = "Error kicking #{params[:tube]}"
          redirect "/beanstalkd/tube/#{params[:tube]}"
        end
      rescue Beanstalk::NotConnected => @error
        erb :error
      end
    end
    
    get "/resources/*" do |path|
      file = File.expand_path(File.join('resources', path), File.dirname(__FILE__))
      send_file file
    end
  
  end  
end