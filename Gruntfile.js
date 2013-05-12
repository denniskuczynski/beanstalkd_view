module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      css: {
        src: ['components/bootstrap/docs/assets/css/bootstrap.css',
              'web/css/*.css'],
        dest: 'lib/beanstalkd_view/resources/css/<%= pkg.name %>.css'
      },
      js: {
        src: ['components/json2/json2.js',
              'components/jquery/jquery.js',
              'components/bootstrap/docs/assets/js/bootstrap.js',
              'components/underscore/underscore.js',
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
