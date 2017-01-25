//
// Instantiable object to sanitize string values inside objects, to avoid JavaScript injection
//
R("kt-sanitizer", [], function () {

  var Sanitizer = function () { };

  _.extend(Sanitizer.prototype, {

    sanitize: function (o) {
      for (var x in o) {
        if (typeof o[x] == 'string') {
          o[x] = this.escape(o[x]);
        } else if (typeof o[x] == 'object') {
          if (o[x] instanceof Array) {
            for (var i = 0, l = o[x].length; i < l; i++) {
              o[x][i] = this.sanitize(o[x][i]);
            }
          } else {
            o[x] = this.sanitize(o[x]);
          }
        }
      }
      return o;
    },

    escape: function (s) {
      return s.replace(/</g, '(').replace(/>/g, ')');
    }
  });

  return Sanitizer;
});
