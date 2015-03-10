$LOAD_PATH.unshift File.expand_path(File.dirname(__FILE__) + '/lib')

ENV['BEANSTALK_URL'] ||= 'beanstalk://localhost/'
#ENV['BEANSTALK_URL'] ||= 'beanstalk://localhost:11300,beanstalk://localhost:11400'

ENV['BEANSTALKD_VIEW_PATH'] ||= '/'

# config.ru
require 'beanstalkd_view'
run Rack::URLMap.new(
  ENV['BEANSTALKD_VIEW_PATH'] => BeanstalkdView::Server
)
