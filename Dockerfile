FROM ruby:2.1-slim

# thin requires some dev toll from build-essential
RUN apt-get update && apt-get install -y build-essential \
  && rm -rf /var/lib/apt/lists/*
RUN gem install beanstalkd_view thin --no-rdoc --no-ri

EXPOSE 5678

CMD ["beanstalkd_view", "--foreground", "--no-launch"]
