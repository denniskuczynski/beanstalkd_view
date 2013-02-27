shared_examples 'queue_browser' do

  it "should show the overview at: /" do
    visit site_root
    body.should have_content "Beanstalkd View"
    body.should have_content "Statistics"
    body.should have_content "Tubes"
  end

  it "should show the default tube stats at: tube/default" do
    visit "#{site_root}tube/default"
    body.should have_content "Beanstalkd View"
    body.should have_content "Statistics"
  end

  it "should be able to add a job on the overview page", :js => true do
    visit site_root
    form = find('#add_job_form')
    form.fill_in 'form_tube_name', :with => tube_name
    form.fill_in 'form_job_body', :with => '{"id": 1, "name": "Bob"}'
    form.click_link('Add Job')
    body.should have_content "Add new job?"
    click_link "confirm_add_job_btn"
    body.should have_content "Added job:"
  end

  it "should be able to click on the tube_name link (created by the last test)", :js => true do
    visit site_root
    click_link('test.tube')
    body.should have_content "test.tube"
  end

  it "should be able to peek_range and see job (created by the last test)", :js => true do
    visit site_root
    form = find('#peek_range_form')
    form.fill_in 'min', :with => '0'
    form.fill_in 'max', :with => '0'
    click_button 'Peek'
    body.should have_content "Peek Range"
  end

  it "should be able to pause a tube", :js => true do
    visit "#{site_root}/tube/#{CGI::escape(tube_name)}"
    form = find('#pause_form')
    form.fill_in 'delay', :with => 1
    click_button "Pause"
    body.should have_content "Paused #{tube_name}"
  end

  it "should be able to kick a tube", :js => true do
    visit "#{site_root}tube/#{CGI::escape(tube_name)}"
    form = find('#kick_form')
    form.fill_in 'bound', :with => 1
    click_button "Kick"
    body.should have_content "Kicked #{tube_name}"
  end

  it "should be able to peek_ready a tube", :js => true do
    visit "#{site_root}tube/#{CGI::escape(tube_name)}"
    click_link('peek_ready_btn')
    body.should have_content "Job id:"
  end

  it "should be able to clear a tube", :js => true do
    visit "#{site_root}/tube/#{CGI::escape(tube_name)}"
    form = find('#clear_form')
    form.select 'Buried', :from => 'state'
    click_button "Clear"
    body.should have_content "Cleared all buried jobs from #{tube_name}"
  end

end