Gem::Specification.new do |s|
  s.name        = 'beanstalkd_view'
  s.version     = '0.1.0'
  s.date        = '2012-03-12'
  s.summary     = "Hola!"
  s.description = "A Sinatra app to view/manage beanstalkd queues that can be embedded in a Rails app similar to what's available in Resque"
  s.authors     = ["Dennis Kuczynski"]
  s.email       = 'dennis.kuczynski@gmail.com'
  s.files       = Dir.glob("{lib}/**/*") + %w(README)
  s.homepage    =
    'https://github.com/denniskuczynski/beanstalkd_view'

  s.add_dependency "sinatra",         ">= 0.9.2"
  s.add_dependency "beanstalk-client",         ">= 1.1.1"

end