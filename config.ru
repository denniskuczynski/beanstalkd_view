$LOAD_PATH.unshift File.expand_path(File.dirname(__FILE__) + '/../lib')

ENV['BEANSTALK_URL'] ||= 'beanstalk://localhost/'

# config.ru
require 'beanstalkd_view'
run BeanstalkdView::Server