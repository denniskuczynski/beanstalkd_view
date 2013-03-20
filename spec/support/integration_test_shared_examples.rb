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

  describe "with two beanstalkd daemons running", :requires_two_beanstalkd => true do
    before :all do
      # Make sure beanstalkd is running
      if `pgrep beanstalkd` == ""
        raise "PRECONDITION NOT MET: beanstalkd not running"
      end
    end

    it "should show the overview at: /", :requires_two_beanstalkd => true do
      visit site_root
      page.should have_content "Beanstalkd View"
      page.should have_content "Statistics"
      page.should have_content "Tubes"
    end

    it_behaves_like "queue_browser", :requires_two_beanstalkd => true do
      let(:tube_name) { 'test.two' }
    end

  end

end