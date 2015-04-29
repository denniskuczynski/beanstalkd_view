shared_examples 'integration_test' do

  describe "without beanstalkd daemon running" do
    before :all do
      # Make sure beanstalkd is NOT running
      if `pgrep beanstalkd` != ""
        raise "PRECONDITION NOT MET: beanstalkd running"
      end
    end

    it "should should error at site root" do
      visit site_root
      page.should have_content "Could not connect"
    end
  end

  describe "with beanstalkd daemon running", :requires_beanstalkd => true do
    before :all do
      # Make sure beanstalkd is running
      if `pgrep beanstalkd` == ""
        raise "PRECONDITION NOT MET: beanstalkd not running"
      end
    end

    it_behaves_like "queue_browser" do
      let(:tube_name) { 'test.tube' }
    end

    it_behaves_like "queue_browser" do
      let(:tube_name) { 'test/tube' }
    end

  end

end