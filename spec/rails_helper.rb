require 'selenium/webdriver'
require 'capybara'

Capybara.register_driver :chrome do |app|
  Capybara::Selenium::Driver.new(app, browser: :chrome)
end

Capybara.register_driver :headless_chrome do |app|
  options = Selenium::WebDriver::Chrome::Options.new(args: %w[no-sandbox headless disable-gpu disable-dev-shm-usage])
  Capybara::Selenium::Driver.new(app, browser: :chrome, options: options)
end

Capybara.javascript_driver = :headless_chrome

ENV["RAILS_ENV"] = "test"

%w(
  action_controller
  sprockets/rails
).each do |framework|
  begin
    require "#{framework}/railtie"
  rescue LoadError
  end
end

module BeanstalkdView
  class RailsApp < ::Rails::Application
    config.root = File.dirname(__FILE__) + "/rails_app"
    config.active_support.deprecation = :log
    config.secret_token = 'Under a shiny rock in the backyard the color of slate'
  end
end

BeanstalkdView::RailsApp.initialize!