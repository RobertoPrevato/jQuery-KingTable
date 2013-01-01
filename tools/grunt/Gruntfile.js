var path = require("path");

module.exports = function (grunt) {
  var rel = "../../source";
  var js = [
    "../../source/scripts/libs/kingtable/signature.js",
    "../../source/scripts/shared/components/extend.js",
    "../../source/scripts/shared/components/events.js",
    "../../source/scripts/shared/components/string.js",
    "../../source/scripts/shared/components/regex.js",
    "../../source/scripts/shared/components/date.js",
    "../../source/scripts/shared/components/reflection.js",
    "../../source/scripts/shared/components/array-search.js",
    "../../source/scripts/shared/data/object-analyzer.js",
    "../../source/scripts/shared/data/sanitizer.js",
    "../../source/scripts/shared/data/query.js",
    "../../source/scripts/shared/data/file.js",
    "../../source/scripts/shared/data/csv.js",
    "../../source/scripts/shared/data/xml.js",
    "../../source/scripts/shared/data/i18n.js",
    "../../source/scripts/shared/menus/menu-builder.js",
    "../../source/scripts/shared/menus/menu-functions.js",
    "../../source/scripts/shared/menus/menu.js",
    "../../source/scripts/shared/filters/filters-manager.js",
    "../../source/scripts/libs/kingtable/kingtable-core.js",
    "../../source/scripts/libs/kingtable/jquery.kingtable.js",
    "../../source/scripts/libs/kingtable/lodash/jquery.kingtable-lodash.js",
    "../../source/scripts/libs/kingtable/lodash/templates.js"
  ];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    less: {
      kingtable: {
        options: {
          cleancss: true
        },
        files: {
          "../../source/styles/examples.css": "../../source/styles/examples.less",
          "../../source/styles/kingtable/kingtable.css": "../../source/styles/kingtable/kingtable.less",
          "../../dist/styles/kingtable.css": "../../source/styles/kingtable/kingtable.less",
          "../../dist/styles/kingtable.core.css": "../../source/styles/kingtable/kingtable-core.less",
          "../../dist/styles/kingtable.clear.css": "../../source/styles/kingtable/themes/clear/clear.less",
          "../../dist/styles/kingtable.dark.css": "../../source/styles/kingtable/themes/dark/dark.less",
        //"../../dist/styles/kingtable.flatwhite.css": "../../source/styles/kingtable/themes/flatwhite/flatwhite.less",
          "../../dist/styles/kingtable.flatblack.css": "../../source/styles/kingtable/themes/flatblack/flatblack.less",
          "../../dist/styles/kingtable.midnight.css": "../../source/styles/kingtable/themes/midnight/midnight.less",
          "../../dist/styles/kingtable.bronze.css": "../../source/styles/kingtable/themes/bronze/bronze.less",
          "../../dist/styles/kingtable.ultramarine.css": "../../source/styles/kingtable/themes/ultramarine/ultramarine.less",
          "../../dist/styles/kingtable.olive.css": "../../source/styles/kingtable/themes/olive/olive.less"
        }
      }
    },

    concat: {
      dist: {
        src: js,
        dest: "../../dist/jquery.kingtable.js"
      }
    },

    uglify: {
      options: {
        screwIE8: true,
         preserveComments: "some"
      },
      dist: {
        files: {
          "../../dist/jquery.kingtable.min.js": ["../../dist/jquery.kingtable.js"]
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-less");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.registerTask("default", ["less", "concat", "uglify"]);
};
