
module BeanstalkdView

  class Server < Sinatra::Base
    
    def beanstalk
      @@beanstalk ||= Beanstalk::Pool.new(beanstalk_addresses)
    end

    def beanstalk_url
      return @@url if defined?(@@url) and @@url
      ENV['BEANSTALK_URL'] || 'beanstalk://localhost/'
    end

    class BadURL < RuntimeError; end

    def beanstalk_addresses
      uris = beanstalk_url.split(/[\s,]+/)
      uris.map {|uri| beanstalk_host_and_port(uri)}
    end

    def beanstalk_host_and_port(uri_string)
      uri = URI.parse(uri_string)
      raise(BadURL, uri_string) if uri.scheme != 'beanstalk'
      "#{uri.host}:#{uri.port || 11300}"
    end
      
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