module BeanstalkdView

  class Server < Sinatra::Base
    include BeanstalkdView::BeanstalkdUtils
      
    get "/" do
      begin
        @tubes = beanstalk.list_tubes
        @stats = beanstalk.stats
        erb :index
      rescue Beanstalk::NotConnected => @error
        erb :error
      end
    end
    
    get "/tube/:tube" do
      begin
        @stats = beanstalk.stats_tube(params[:tube])
        erb :tube_stats
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