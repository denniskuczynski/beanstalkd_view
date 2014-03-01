# -*- encoding: utf-8 -*-
$:.push File.expand_path("../lib", __FILE__)
require "beanstalkd_view/version"

Gem::Specification.new do |s|
  s.name        = 'beanstalkd_view'
  s.version     = BeanstalkdView::VERSION
  s.date        = '2014-02-28'
  s.summary     = "A Sinatra app to view/manage beanstalkd queues that can be embedded in a Rails app similar to what's available in Resque"
  s.description = "A Sinatra app to view/manage beanstalkd queues that can be embedded in a Rails app similar to what's available in Resque"
  s.authors     = ["Dennis Kuczynski"]
  s.email       = 'dennis.kuczynski@gmail.com'
  s.homepage    = 'https://github.com/denniskuczynski/beanstalkd_view'
  s.license = 'MIT'

  s.files             = %w( README.md CHANGELOG.md Gemfile Rakefile package.json Gruntfile.js Dockerfile MIT-LICENSE.txt )
  s.files            += Dir.glob("lib/**/*")
  s.files            += Dir.glob("web/**/*")
  s.files            += Dir.glob("bin/**/*")
  s.executables       = [ "beanstalkd_view" ]
  s.test_files    = Dir.glob("spec/**/*")
  s.require_paths = ["lib"]

  s.add_dependency "sinatra",         ">= 1.3.0"
  s.add_dependency "sinatra-contrib", ">= 1.3.0"
  s.add_dependency "beaneater",         "~> 0.3.0"
  s.add_dependency "vegas",           "~> 0.1.2"
  s.add_dependency "json"

  s.add_development_dependency "rake"
  s.add_development_dependency "rack-test"
  s.add_development_dependency "rspec"
  s.add_development_dependency "capybara"
  
  # For Rails integration testing
  s.add_development_dependency "rails"
end
