require 'spec_helper'

describe BeanstalkdView::BeanstalkdUtils do

  it "can parse valid URLs" do
    utils = Object.new.extend BeanstalkdView::BeanstalkdUtils
    
    ENV['BEANSTALK_URL'] = "beanstalk://localhost:12300"
    utils.beanstalk_address.should eq("localhost:12300")
    
    ENV['BEANSTALK_URL'] = "beanstalk://localhost:12300/, beanstalk://localhost:12301/"
    utils.beanstalk_address.should eq("localhost:12300")
    
    ENV['BEANSTALK_URL'] = "beanstalk://localhost:12300   beanstalk://localhost:12301"
    utils.beanstalk_address.should eq("localhost:12300")
    
    expect {
      ENV['BEANSTALK_URL'] = "http://localhost:12301"
      utils.beanstalk_address
    }.should raise_error(BeanstalkdView::BeanstalkdUtils::BadURL)
  end

end