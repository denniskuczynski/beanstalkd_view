BeanstalkdView::RailsApp.routes.draw do
  mount BeanstalkdView::Server, :at => "/beanstalkd"
end