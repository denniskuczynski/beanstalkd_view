require 'spec_helper'

describe BeanstalkdView::BeanstalkdUtils do

  it "can parse valid URLs" do
    utils = Object.new.extend BeanstalkdView::BeanstalkdUtils
    
    ENV['BEANSTALK_URL'] = "beanstalk://localhost:12300"
    utils.beanstalk_addresses.should eq(["localhost:12300"])
    
    ENV['BEANSTALK_URL'] = "beanstalk://localhost:12300/, beanstalk://localhost:12301/"
    utils.beanstalk_addresses.should eq(["localhost:12300","localhost:12301"])
    
    ENV['BEANSTALK_URL'] = "beanstalk://localhost:12300   beanstalk://localhost:12301"
    utils.beanstalk_addresses.should eq(["localhost:12300","localhost:12301"])
    
    expect {
      ENV['BEANSTALK_URL'] = "beanstalk://localhost:12300, http://localhost:12301"
      utils.beanstalk_addresses 
    }.should raise_error(BeanstalkdView::BeanstalkdUtils::BadURL)
  end
  
  describe "with beanstalkd daemon running", :requires_beanstalkd => true do
    it "beanstalkd_client_ruby stats hash can be accessed with keys" do
      ENV['BEANSTALK_URL'] = 'beanstalk://localhost/'
      utils = Object.new.extend BeanstalkdView::BeanstalkdUtils
      @stats = utils.beanstalk.stats
      @stats.keys.should include('current-jobs-ready')
      @stats['current-jobs-ready'].should > 0
    end
  end

end