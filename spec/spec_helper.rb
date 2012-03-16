require 'rubygems'
require 'bundler/setup'

require 'beanstalkd_view'
require 'rspec'
  
# Requires supporting ruby files with custom matchers and macros, etc,
# in spec/support/ and its subdirectories.
Dir[File.dirname(__FILE__)+"/support/**/*.rb"].each  do |f| 
  require f
end
  
RSpec.configure do |config|
  #
end
