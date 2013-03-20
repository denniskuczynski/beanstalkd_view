module BeanstalkdView
    
  module BeanstalkdUtils
    
    GUESS_PEEK_RANGE = 100 # Default number of elements to use in peek-range guesses

    class BadURL < RuntimeError; end
    
    def beanstalk
      @@beanstalk ||= Beaneater::Pool.new(beanstalk_addresses)
    end

    def beanstalk_url
      return @@url if defined?(@@url) and @@url
      ENV['BEANSTALK_URL'] || 'beanstalk://localhost/'
    end

    def beanstalk_addresses
      uris = beanstalk_url.split(/[\s,]+/)
      uris.map {|uri| beanstalk_host_and_port(uri)}
    end

    def beanstalk_host_and_port(uri_string)
      uri = URI.parse(uri_string)
      raise(BadURL, uri_string) if uri.scheme != 'beanstalk'
      "#{uri.host}:#{uri.port || 11300}"
    end

    # Convert Beaneater::Job to hash
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
        add_chart_data_to_hash(tube, stats[:total_jobs], chart_data["total_jobs_data"]["items"])
        add_chart_data_to_hash(tube, stats[:current_jobs_buried], chart_data["buried_jobs_data"]["items"])
      end
      chart_data
    end

    def add_chart_data_to_hash(tube, jobs, items)
      if jobs > 0
        datum = {}
        datum["label"] = tube.name
        datum["data"] = jobs
        items << datum
      end
    end
    
    # Pick a Minimum Peek Range Based on minumum ready jobs on all tubes
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