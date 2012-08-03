require 'spec_helper'

describe "SinatraIntegration", :type => :request do
  
  before :all do
    ENV['BEANSTALK_URL'] = 'beanstalk://localhost/'
    Capybara.app = BeanstalkdView::Server.new
  end
  
  it_behaves_like "integration_test" do
    let(:site_root) { '/' }
  end
end