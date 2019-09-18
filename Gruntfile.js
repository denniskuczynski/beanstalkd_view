module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      css: {
        src: ['bower_components/bootstrap/dist/css/bootstrap-reboot.css',
              'bower_components/bootstrap/dist/css/bootstrap.css',
              'bower_components/bootstrap/dist/css/bootstrap-grid.css',
              'web/css/*.css'],
        dest: 'lib/beanstalkd_view/resources/css/<%= pkg.name %>.css'
      },
      js: {
        src: ['bower_components/json2/json2.js',
              'bower_components/jquery/dist/jquery.js',
              'bower_components/bootstrap/dist/js/bootstrap.bundle.js',
              'bower_components/underscore/underscore.js',
              'bower_components/bootstrap3-typeahead/bootstrap3-typeahead.js',
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
    },
    cssmin: {
      compress: {
        files: {
          'lib/beanstalkd_view/resources/css/<%= pkg.name %>.min.css': ['lib/beanstalkd_view/resources/css/<%= pkg.name %>.css']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'cssmin']);

};
