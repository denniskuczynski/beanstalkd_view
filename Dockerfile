FROM debian:wheezy

RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install -y rubygems
RUN gem install beanstalkd_view --no-rdoc --no-ri

EXPOSE 5678

CMD ["beanstalkd_view", "--foreground", "--no-launch"]
