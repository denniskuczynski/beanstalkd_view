module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      css: {
        src: ['web/css/vendor/bootstrap.min.css',
              'web/css/*.css'],
        dest: 'lib/beanstalkd_view/resources/css/<%= pkg.name %>.css'
      },
      js: {
        src: ['web/js/vendor/jquery-1.7.1.min.js',
              'web/js/vendor/underscore-min.js',
              'web/js/vendor/bootstrap.min.js',
              'web/js/vendor/json-2.js',
              'web/js/vendor/bluff-0.3.6.2/js-class.js',
              'web/js/vendor/bluff-0.3.6.2/bluff-min.js',
              'web/js/*.js'],
        dest: 'lib/beanstalkd_view/resources/js/<%= pkg.name %>.js'
      }
    },
    jshint: {
      beforeconcat: ['web/js/*.js']
    },
    uglify: {
      build: {
        src: 'lib/beanstalkd_view/resources/js/<%= pkg.name %>.js',
        dest: 'lib/beanstalkd_view/resources/js/<%= pkg.name %>.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);

};
