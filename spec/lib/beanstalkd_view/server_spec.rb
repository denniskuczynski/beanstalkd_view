require 'spec_helper'

describe BeanstalkdView::Server do
  
  before :all do
    Capybara.app = BeanstalkdView::Server.new
  end

  describe "with beanstalkd daemon running", :requires_beanstalkd => true do
    before :all do
      # Make sure beanstalkd is running
      if `pgrep beanstalkd` == ""
        raise "PRECONDITION NOT MET: beanstalkd not running"
      end
    end

    it "should show the overview at: /", :type => :request do
      visit '/'
      page.should have_content "Beanstalkd View"
      page.should have_content "Statistics"
      page.should have_content "Tubes"
    end
  
    it "should show the default tube stats at: tube/default", :type => :request do
      visit '/tube/default'
      page.should have_content "Beanstalkd View"
      page.should have_content "Statistics"
    end
  end
  
  describe "with out beanstalkd daemon running" do
    before :all do
      # Make sure beanstalkd is NOT running
      if `pgrep beanstalkd` != ""
        raise "PRECONDITION NOT MET: beanstalkd running"
      end
    end
    
    it "should show error at: /", :type => :request do
      expect {
        visit '/'
      }.should raise_error(BeanstalkdView::BeanstalkdUtils::BadURL)
    end
  end
  
end