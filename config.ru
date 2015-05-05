$LOAD_PATH.unshift File.expand_path(File.dirname(__FILE__) + '/lib')

ENV['BEANSTALK_URL'] ||= 'beanstalk://localhost/'

ENV['BEANSTALKD_VIEW_PATH'] ||= '/'

# config.ru
require 'beanstalkd_view'
run Rack::URLMap.new(
  ENV['BEANSTALKD_VIEW_PATH'] => BeanstalkdView::Server
)
