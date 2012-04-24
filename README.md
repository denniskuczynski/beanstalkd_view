[![Build Status](https://secure.travis-ci.org/denniskuczynski/beanstalkd_view.png?branch=master)](http://travis-ci.org/denniskuczynski/beanstalkd_view)

Beanstalkd View
===============
A Sinatra app to view/manage beanstalkd queues that can be embedded in a Rails app similar to what's available in Resque.

Configuration
-------------

To use in a Rails app, include the gem in your Gemfile:

``` ruby
gem 'beanstalk-client', :git => 'https://github.com/kr/beanstalk-client-ruby.git' #Use the latest, if you need the pause-tube command
gem beanstalkd_view
```

Otherwise, gem install beanstalkd_view


Use the following environment variable to specify the location of the beanstalk server:

``` ruby
ENV['BEANSTALK_URL'] = 'beanstalk://localhost/'
```

(This can be a comma separated list.)

Embedding in a Rails app
------------------------

Add the following to your routes.rb file:

``` ruby
mount BeanstalkdView::Server, :at => "/beanstalkd"
```

(NOTE: You may mount the server at any path, not just /beanstalkd)

You can then browse to your application path to view information about your beanstalkd tubes, i.e.
http://127.0.0.1:3000/beanstalkd

Running from the command line
------------------------

Run the beanstalkd_view executable, e.g.

beanstalkd_view

or from a Rails app:

bundle exec beanstalkd_view


(This will use the vegas gem to launch the Sinatra app on an available port.)

Screenshot
------------------------
![Screenshot](http://s16.postimage.org/4mdum0x79/i_OS_Simulator_Screen_shot_Apr_24_2012_10_29_33.png)

License
------------------------

beanstalkd_view is released under the MIT license:

* http://www.opensource.org/licenses/MIT

It makes use of the following components also using the MIT license:

* Sinatra - http://www.sinatrarb.com/

* jQuery - http://jquery.org/

* Bluff JS Graphs - http://bluff.jcoglan.com/

And under the Apache license:

* Twitter Bootstrap - http://twitter.github.com/bootstrap/