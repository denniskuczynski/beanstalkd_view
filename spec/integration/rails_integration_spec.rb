require 'spec_helper'

describe "RailsIntegration", :type => :request do
  
  before(:all) do
    # Configure Capybara for Rails
    require "capybara/rails"
  end
  
  it "should be mountable at /beanstalkd" do
    visit '/beanstalkd'
    page.should have_content "Beanstalk::NotConnected"
  end
end