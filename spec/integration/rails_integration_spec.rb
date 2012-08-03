require 'spec_helper'

describe "RailsIntegration", :type => :request do
  
  before(:all) do
    # Configure Capybara for Rails
    require "capybara/rails"
  end
  
  it_behaves_like "integration_test" do
    let(:site_root) { '/beanstalkd/' }
  end
end