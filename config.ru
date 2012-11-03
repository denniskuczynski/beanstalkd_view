$LOAD_PATH.unshift File.expand_path(File.dirname(__FILE__) + '/../lib')

ENV['BEANSTALK_URL'] ||= 'beanstalk://localhost/'
#ENV['BEANSTALK_URL'] = 'beanstalk://localhost:12300,beanstalk://localhost:12400'

# config.ru
require 'beanstalkd_view'
run BeanstalkdView::Server