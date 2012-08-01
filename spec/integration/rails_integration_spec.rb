require 'spec_helper'

describe "RailsIntegration", :type => :request, :js => true do
  
  before(:all) do
    # Startup Rails app and configure Capybara for Rails
    require "rails_helper"
    require "capybara/rails"
  end
  
  it "should be mountable at /beanstalkd" do
    visit '/beanstalkd'
    page.should have_content "Beanstalk::NotConnected"
  end
end