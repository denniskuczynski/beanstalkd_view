# Overiding the standard beanstalk-client Pool to ignore NotFoundErrors.
# In this application, those errors should only occur when using multiple beanstalkd instances,
#  when one instance does not have a tube, and others do.
module Beanstalk
  class Pool
    def call_wrap(c, *args, &block)
      self.last_conn = c
      c.send(*args, &block)
    rescue NotFoundError => ex
      puts "Ignoring NotFoundError: #{ex.class}: #{ex}"
      nil
    rescue UnexpectedResponse => ex
      raise ex
    rescue EOFError, Errno::ECONNRESET, Errno::EPIPE => ex
      self.remove(c)
      raise ex
    end
    
    def on_tube(tube, &block)
      response = nil
      connection_size = open_connections.size
      # Retry if the desired tube is not found
      # Randomly picking over double the connection size, should eventually find it...
      #  but a better algorithm would be nicer at some point...
      # Note, that with just 1 beanstalkd instance, this code should always return on the first send
      for i in 1..(connection_size*2)
        response = send_to_rand_conn(:on_tube, tube, &block)
        break if not response.nil?
      end
      response
    end
    
    # Overide the default behavior which uses send_to_all_conn, which returns Hash values for stats combining
    def peek_job(id)
      send_to_each_conn_first_res(:peek_job, id)
    end
    
  end
end