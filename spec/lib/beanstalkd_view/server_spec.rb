require 'spec_helper'

describe BeanstalkdView::Server, :type => :request do
  
  before :all do
    ENV['BEANSTALK_URL'] = 'beanstalk://localhost/'
    Capybara.app = BeanstalkdView::Server.new
  end

  describe "with beanstalkd daemon running", :requires_beanstalkd => true do
    before :all do
      # Make sure beanstalkd is running
      if `pgrep beanstalkd` == ""
        raise "PRECONDITION NOT MET: beanstalkd not running"
      end
    end

    it "should show the overview at: /" do
      visit '/'
      body.should have_content "Beanstalkd View"
      body.should have_content "Statistics"
      body.should have_content "Tubes"
    end
  
    it "should show the default tube stats at: tube/default" do
      visit '/tube/default'
      body.should have_content "Beanstalkd View"
      body.should have_content "Statistics"
    end
    
    it "show be able to add a job on the overview page", :js => true do
      visit '/'
      form = find('#add_job_form')
      form.fill_in 'form_tube_name', :with => 'test.tube'
      form.fill_in 'form_job_body', :with => '{"id": 1, "name": "Bob"}'
      form.click_link('Add Job')
      body.should have_content "Add new job?"
      click_link "confirm_add_job_btn"
      body.should have_content "Added job "
    end
    
    it "show be able to click on the test.tube link (created by the last test)", :js => true do
      visit '/'
      click_link('test.tube')
      body.should have_content "test.tube"
    end
    
=begin
    # Current beanstalk-client lib doesn't support pause_tube action
    it "show be able to pause a tube", :js => true do
      visit '/tube/test.tube'
      fill_in 'delay', :with => 1
      click_button "Pause"
      body.should have_content "Paused test.tube"
    end
=end

    it "show be able to kick a tube", :js => true do
      visit '/tube/test.tube'
      fill_in 'bound', :with => 1
      click_button "Kick"
      body.should have_content "Kicked test.tube"
    end
    
    it "show be able to peek_ready a tube", :js => true do
      visit '/tube/test.tube'
      click_button "peek_ready_btn"
      body.should have_content "Job id:"
    end
   
  end
  
  describe "with out beanstalkd daemon running" do
    before :all do
      # Make sure beanstalkd is NOT running
      if `pgrep beanstalkd` != ""
        raise "PRECONDITION NOT MET: beanstalkd running"
      end
    end
    
    it "should show error at: /" do
      visit '/'
      page.should have_content "Beanstalk::NotConnected"
    end
  end
  
end