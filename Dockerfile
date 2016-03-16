FROM ubuntu:14.04.3

RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install -y rubygems-integration ruby-dev make g++
RUN gem install beanstalkd_view --no-rdoc --no-ri
RUN gem install thin --no-rdoc --no-ri

EXPOSE 5678

CMD ["beanstalkd_view", "--foreground", "--no-launch"]
