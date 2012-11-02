module BeanstalkdView
    
  module BeanstalkdUtils
    
    class BadURL < RuntimeError; end
    
    def beanstalk
      @@beanstalk ||= Beaneater::Pool.new(beanstalk_addresses)
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
  end
end