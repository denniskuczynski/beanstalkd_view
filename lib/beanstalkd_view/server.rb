module BeanstalkdView

  class Server < Sinatra::Base
    include BeanstalkdView::BeanstalkdUtils
      
    get "/" do
      @tubes = beanstalk.list_tubes
      @stats = beanstalk.stats
      erb :index
    end
    
    get "/tube/:tube" do
      @stats = beanstalk.stats_tube(params[:tube])
      erb :tube_stats
    end
    
    get "/resources/*" do |path|
      file = File.expand_path(File.join('resources', path), File.dirname(__FILE__))
      send_file file
    end
    
  end
    
end