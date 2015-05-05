APP_FILE  = 'lib/beanstalkd_view.rb'
APP_CLASS = 'BeanstalkdView::Server'

require "bundler/gem_tasks"
require "rspec/core/rake_task"

RSpec::Core::RakeTask.new(:spec)

task :default  => :spec

require 'beaneater'
require 'json'

namespace :beanstalkd_view do
  
  TEST_QUEUES = ['tube_sock', 'test_tube', 'tube_top', 'inner_tube']

  # Randomly enqueue elements to test queues
  task :enqueue_test do
    host = "localhost"
    port = 11300
    beanstalk = Beaneater.new("#{host}:#{port}")

    # Loop flooding the queues with jobs
    while true
      tube_name = TEST_QUEUES.sample
      pri = 65536
      delay = 0
      ttr = 120
      tube = beanstalk.tubes[tube_name]
      tube.put '{}', :pri => pri, :delay => delay, :ttr => ttr
      puts "Enqueued Job to #{tube_name}"
    end
  end
  
  # Randomly pull elements from test queues
  task :pull_test do
    host = "localhost"
    port = 11300
    beanstalk = Beaneater.new("#{host}:#{port}")

    while true
      tube_name = TEST_QUEUES.sample
      begin
        beanstalk.tubes.watch!(tube_name)
        job = beanstalk.tubes.reserve(1)
        if job
          puts "Pulled Job #{job} from #{tube_name}"
          job.delete
        end
      rescue Exception => ex
        puts "Exception while pulling job from #{tube_name}: #{ex}"
      end
    end
  end
  
end