APP_FILE  = 'lib/beanstalkd_view.rb'
APP_CLASS = 'BeanstalkdView::Server'

require 'sinatra/assetpack/rake'

require "bundler/gem_tasks"
require "rspec/core/rake_task"

RSpec::Core::RakeTask.new(:spec)

task :default  => :spec

require 'beanstalk-client'
require 'json'

namespace :beanstalkd_view do
  
  TEST_QUEUES = ['tube_sock', 'test_tube', 'tube_top', 'inner_tube']

  # Randomly enqueue elements to test queues
  task :enqueue_test do
    host = "localhost"
    port = 11300
    beanstalk = Beanstalk::Pool.new([ "#{host}:#{port}" ])

    # Loop flooding the queues with jobs
    while true
      tube = TEST_QUEUES.sample
      pri = 65536
      delay = 0
      ttr = 120
      beanstalk.use tube
      beanstalk.put [ tube, {} ].to_json, pri, delay, ttr
      puts "Enqueued Job to #{tube}"
    end
  end
  
  # Randomly pull elements from test queues
  task :pull_test do
    host = "localhost"
    port = 11300
    beanstalk = Beanstalk::Pool.new([ "#{host}:#{port}" ])

    while true
      tube = TEST_QUEUES.sample
      beanstalk.watch(tube)
      job = beanstalk.reserve
      puts "Pulled Job #{job} from #{tube}"
      job.delete
    end
  end
  
end