//
// An instantiable object to analyze objects and return useful information about them.
//
R("kt-object-analyzer", ["kt-reflection"], function (Reflection) {

  var Analyzer = function () {};
  
  _.extend(Analyzer.prototype, {

    getObjectStructure: function (o, options) {
      var schema = {};
      options = _.extend({
        clear: false,
        flat: false
      }, options || {});
      for (var x in o) {
        if (options.flat) {
          schema[x] = this.getType(o[x]);
        } else {
          schema[x] = {
            name: x,
            type: this.getType(o[x])
          };
        }
      }
      if (options.clear) return this.clearSchema(schema);
      return schema;
    },

    getCollectionStructure: function (a, options) {
      var schema = {};
      options = $.extend({
        clear: false,
        flat: false
      }, options || {});
      var l = _.isNumber(options.limit) ? options.limit : a.length;
      for (var i = 0; i < l; i++) {
        var o = this.getObjectStructure(a[i], options);
        for (var x in o) {
          if (schema.hasOwnProperty(x)) {
            //compare
            if (o[x].type != undefined && schema[x].type != o[x].type) {
              if (schema[x].type == undefined) {
                schema[x].type = o[x].type;
              } else {
                //force string type
                schema[x].type = 'string';
              }
            }
          } else {
            _.extend(schema, o);
          }
        }
      }
      if (options.clear) return this.clearSchema(schema);
      return schema;
    },

    //removes from schema object undefined properties
    clearSchema: function (schema) {
      for (var x in schema) {
        if (schema[x].type == undefined) {
          delete schema[x];
        }
      }
      return schema;
    },

    getType: function (o) {
      if (o == null || o == undefined) return;
      if (o instanceof Array) return "array";
      if (o instanceof Date) return "date";
      if (o instanceof RegExp) return "regex";
      return typeof o;
    },
    
    analyze: function (o) {
      // if (!name) throw 'missing name';
      // if (!window[name]) throw name + ' not in window';
      var a = [];
      for (var x in o) {
        a.push(x + " is: " + this.getType(o[x]));
        if (typeof o[x] == 'object' && !(o[x] instanceof Array)) {
          a = a.concat(this.analyze(o[x]));
        }
      }
      return a;
    },

    listProperties: function (o, prefix) {
      var a = [];
      if (!prefix) prefix = '';
      var parent = prefix ? Reflection.getPropertyValue(o, prefix) : o;
      for (var x in o) {
        a.push({
          name: prefix + x,
          type: this.getType(parent[x])
        });
        if (typeof o[x] == 'object') {
          if (o[x] instanceof Array) {
            //assumes that the array is composed of objects with the same structure
            //todo: support derived classes
            if (o[x].length) {
              var f = o[x][0];
              var b = this.listProperties(o[x][0], prefix + x + '.');
              a = a.concat(b);
            }
          } else {
            var b = this.listProperties(o[x], prefix + x + '.');
            a = a.concat(b);
          }
        }
      }
      return a;
    },

    guessSearchableProperties: function (o, prefix) {
      var a = [];
      if (!prefix) prefix = '';
      for (var x in o) {
        if (_.contains(['id', 'guid', 'rowcount', 'rownumber', 'rownum', 'thmguid'], x.toLowerCase())) continue;
        var type = this.getType(o[x]);
        if (_.contains(['string', 'number'], type)) {
          a.push(prefix + x);
        }
        if (typeof o[x] == 'object') {
          if (o[x] instanceof Array) {
            //assumes that the array is composed of objects with the same structure
            //todo: support derived classes
            if (o[x].length) {
              var b = this.guessSearchableProperties(o[x][0], prefix + x + '.');
              a = a.concat(b);
            }
          } else {
            var b = this.guessSearchableProperties(o[x], prefix + x + '.');
            a = a.concat(b);
          }
        }
      }
      return a;
    },

    guessFilterableProperties: function (o) {
      var a = [];
      for (var x in o) {
        if (/_formatted$/.test(x)) continue;
        if (_.contains(['id', 'guid', 'rowcount', 'rownumber', 'rownum', 'thmguid'], x.toLowerCase())) continue;
        var type = this.getType(o[x]);
        //skip sub objects and regexes
        if (_.contains(['object', 'regex', 'array'], type)) continue;
        a.push({
          name: x,
          displayName: I.lookup('words.' + x) ? I.t('words.' + x) : x,
          type: type,
          include: type == 'number' ? {
            number: ['equals', 'greaterThan', 'lessThan'],
            numberRange: ['between']
          } : null
        });
      }
      var r = {};
      for (var i = 0, l = a.length; i < l; i++) {
        r[a[i].name] = a[i];
      }
      return r;
    }
  });
  
  return Analyzer;
});
