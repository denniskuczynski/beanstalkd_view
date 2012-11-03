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

end