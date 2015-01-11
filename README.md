[![Build Status](https://secure.travis-ci.org/denniskuczynski/beanstalkd_view.png?branch=master)](http://travis-ci.org/denniskuczynski/beanstalkd_view)
[![Code Climate](https://codeclimate.com/badge.png)](https://codeclimate.com/github/denniskuczynski/beanstalkd_view)

Beanstalkd View
===============
A Sinatra app to view/manage beanstalkd queues that can be embedded in a Rails app similar to what's available in Resque.

Configuration
-------------

To use in a Rails app, include the gem in your Gemfile:

``` ruby
gem 'beanstalkd_view'
```

Otherwise, gem install beanstalkd_view


Use the following environment variable to specify the location of the beanstalk server:

``` ruby
ENV['BEANSTALK_URL'] = 'beanstalk://localhost/'
```

This environment variable can be specified per Rails environment. So for instance, the above code could be put into environments/development.rb

This can be a comma separated list, e.g. 'beanstalk://localhost:11300,beanstalk://localhost:11400'

Embedding in a Rails app
------------------------

Add the following to your routes.rb file:

``` ruby
mount BeanstalkdView::Server, :at => "/beanstalkd"
```

(NOTE: You may mount the server at any path, not just /beanstalkd)

You can then browse to your application path to view information about your beanstalkd tubes, i.e.
http://127.0.0.1:3000/beanstalkd

If you wish to authenticate the mounted app with Devise, it would look something like:

``` ruby
devise_for :admin_users, ActiveAdmin::Devise.config

match('/beanstalkd/admin/login' => redirect('/admin/login'))
authenticate :admin_user do
  mount BeanstalkdView::Server, at: "/beanstalkd"
end
```

Troubleshooting
------------------------
1. CSS/JS assets not being served in Rails when running behind Apache or Nginx

See http://stackoverflow.com/questions/16167317/sinatra-static-assets-empty/16317727

Running from the command line
------------------------

Run the beanstalkd_view executable, e.g.

beanstalkd_view

or from a Rails app:

bundle exec beanstalkd_view

(This will use the vegas gem to launch the Sinatra app on an available port.)

Alternatively, a Rackup file is provided.  To use: cd into the beanstalkd_view directory and execute:

rackup

Running with Docker
------------------------

You can have a look at beanstalkd_view by running it in a [Docker][1] container:

    docker build -t beanstalkd_view git://github.com/denniskuczynski/beanstalkd_view.git

    docker run -t -i -p 5678:5678 -e BEANSTALK_URL=beanstalk://172.17.0.2 beanstalkd_view

Most likely you have to adjust BEANSTALK_URL for your setup. You can then access beanstalkd_view on http://localhost:5678

[1]: https://www.docker.io/

Screenshot
------------------------
![Screenshot](http://s16.postimage.org/4mdum0x79/i_OS_Simulator_Screen_shot_Apr_24_2012_10_29_33.png)

Building the front-end Javascript
------------------------

This project uses Grunt (http://gruntjs.com/) to manage javascript/css linting, concatenation, and minification, and Bower (https://github.com/bower/bower) to manage Javascript dependencies.

For development, install Grunt and Bower as specified on their websites.  Then execute

```ruby
bower install
grunt
```

from the command line after modifying any javascript or css files.  The output files will be placed in the lib/beanstalkd_view/resources directory.

Running the tests
------------------------
There are 3 variants of RSpec tests.
* Without beanstalkd running, just execute: rspec spec
* With 1 instance of beanstalkd running (default port), execute: rspec spec --tag requires_beanstalkd
* With 2 instances of beanstalkd running (ports 11300 and 11400), execute: rspec spec --tag requires_two_beanstalkd

Customization
------------------------
beanstalk_view provides a way to customize your views.
Set environment variable with desired views path:
```ruby
ENV['BEANSTALKD_VIEW_TEMPLATES'] = File.join("my", "app", "views", "beanstalkd")
```
The just copy lib/beanstalkd_view/views/*.erb and customize them as you want.

*Note: the environment variable should be set before gem loads.*

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

