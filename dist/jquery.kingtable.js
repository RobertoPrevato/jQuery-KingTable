/*!
 * jQuery-KingTable.
 * https://github.com/RobertoPrevato/jQuery-KingTable
 *
 * Copyright 2016, Roberto Prevato
 * http://ugrose.com
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

//
// The super useful extend function, borrowed from the Backbone library.
//
R("extend", [], function () {

  return function (protoProps, staticProps) {
    var parent = this;
    var child;
    
    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function () { return parent.apply(this, arguments); };
    }
    
    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);
    
    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function () { this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;
    
    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);
    
    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;
    
    return child;
  };
  
});



//
// The super useful events borrowed from the Backbone library.
//
R("events", [], function () {

  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;
  
  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  
  var Events = {
    
    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function (name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({ callback: callback, context: context, ctx: context || this });
      return this;
    },
    
    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function (name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function () {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },
    
    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function (name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }
      
      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
              (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }
      
      return this;
    },
    
    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function (name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },
    
    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function (obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }
    
  };
  
  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;
  
  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function (obj, action, name, rest) {
    if (!name) return true;
    
    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }
    
    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }
    
    return true;
  };
  
  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function (events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };
  
  var listenMethods = { listenTo: 'on', listenToOnce: 'once' };
  
  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function (implementation, method) {
    Events[method] = function (obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });
  
  return Events;
});



//
// string utilities
//
R("string", [], function () {
  
  return {
    format: function (s) {
      var args = Array.prototype.slice.call(arguments, 1);
      return s.replace(/{(\d+)}/g, function (match, i) {
        return typeof args[i] != 'undefined' ? args[i] : match;
      });
    },
    /**
     * A string compare function that supports sorting of special characters.
     * @param a the first string to compare
     * @param b the second string to compare
     * @param order ascending or descending
     * @param options (caseSensitive; characters option)
     * @returns {*}
     */
    compare: function (a, b, order, options) {
      order = _.isNumber(order) ? order : (/^asc/i.test(order) ? 1 : -1);
      if (a && !b) return order;
      if (!a && b) return -order;
      if (!a && !b) return 0;
      if (a == b) return 0;

      var def = {
          characters: "AÁÀÂÄÃĀĂĄÃÅÆBCĆÇDEÈÉÊËĘFGHIÌÍÎÏJKLŁMNÑŃOÒÓÔÕÖØPQRSŚŠTUÙÚÛÜVWYÝŸZŹŻŽąàáâãäåæbcçćdeęèéêëfghiìíîïjklłmnñńoòóôõöøpqrsśštuùúûüvwyýÿzźżž",
          caseSensitive: false
        },
        o = $.extend(def, options || {}),
        characters = o.characters,
        ci = o.caseSensitive,
        c = ci ? a : a.toLowerCase(),
        d =  ci ? b : b.toLowerCase(),
        pos = 0,
        min = Math.min(a.length, b.length);

      if (c == d) return 0;

      while (c.charAt(pos) === d.charAt(pos) && pos < min) { pos++; }
      var cPos = characters.indexOf(c.charAt(pos)),
        dPos = characters.indexOf(d.charAt(pos));

      if (cPos > -1 && dPos > -1)
        return cPos > dPos ? order : -order;

      //normal compare
      return c < d ? -order : order;
    },
    //converts strings to nerdCaps removing hiphens
    //example: hello-world to helloWorld
    removeHiphens: function (s) {
      return s.replace(/-(.)/g, function (a, b) { return b.toUpperCase(); });
    },
    hyphenize: function (s) {
      if (!s) return "";
      return s.replace(/([a-z])([A-Z])/g, function (a, b, c) { return b + "-" + c.toLowerCase(); });
    },
    repeat: function (string, num) {
      return new Array(parseInt(num) + 1).join(string);
    },
    getString: function (val) {
      if (typeof val == 'string') return val;
      if (val.toString) return val.toString();
      return '';
    },
    trimLeft: function (s) {
      return s.replace(/^[\s]+/g, '');
    },
    trimRight: function (s) {
      return s.replace(/[\s]+$/g, '');
    },
    trim: function (s) {
      return s.replace(/^[\s]+|[\s]+$/g, '');
    },
    removeSpaces: function (s) {
      return s.replace(/\s/g, '');
    },
    removeMultipleSpaces: function (s) {
      return s.replace(/\s{2,}/g, ' ');
    },
    toTitleCase: function (s) {
      return s.toLowerCase().replace(/^(.)|\s+(.)/g, function (l) { return l.toUpperCase(); });
    },
    sanitizeSpaces: function (s) {
      return this.removeLeadingSpaces(this.removeMultipleSpaces(s));
    }
  };
  
});



//
// regex utilities
//
R("regex", [], function () {
  
  //use this object to extend prototypes of objects that should offers
  //functions for Regular Expressions
  
  return {
    // prepares a string to use it to declare a regular expression
    escapeCharsForRegex: function (s) {
      if (typeof s != 'string') {
        s += '';
      }
      //characters to escape in regular expressions
      return s.replace(/([\^\$\.\(\)\[\]\?\!\*\+\{\}\|\/\\])/g, '\\$1').replace(/\s/g, '\\s');
    },
    
    // gets a regular expression for a search pattern,
    // returns undefined if the regular expression is not valid
    getSearchPattern: function (s, options) {
      if (!s) return /.+/mgi;
      options = _.extend({ searchMode: 'fullstring' }, options || {});
      switch (options.searchMode.toLowerCase()) {
        case 'fullstring':
          //escape characters
          s = this.escapeCharsForRegex(s);
          try {
            return new RegExp('(' + s + ')', 'mgi');
          } catch (ex) {
            //this should not happen
            return;
          }
        break;
        default:
          throw 'invalid searchMode';
      }
    },
    
    //gets a regular expression for a search match pattern
    getMatchPattern: function (s) {
      if (!s) { return /.+/mg; }
      s = this.escapeCharsForRegex(s);
      try {
        return new RegExp(s, 'i');
      } catch (ex) {
        throw ex;
      }
    },
    
    // Returns true if the string has matches with a RegExp
    safeTest: function (rx, s) {
      if (!s) { return false; }
      return !!s.match(rx);
    }
  };
  
});



//
// Date utilities
//
R("date", [], function () {

  function zeroFill(s, l) {
    if ("string" != typeof s) s = s.toString();
    while (s.length < l)
      s = "0" + s;
    return s;
  };

  //https://msdn.microsoft.com/en-us/library/8kb3ddd4%28v=vs.110%29.aspx
  var parts = {
    year: {
      rx: /Y{1,4}/,
      fn: function (date, format) {
        var re = date.getFullYear().toString();
        while (re.length > format.length)
          re = re.substr(1, re.length);
        return re;
      }
    },
    month: {
      rx: /M{1,4}/,
      fn: function (date, format, fullFormat, regional) {
        var re = (date.getMonth() + 1).toString();
        switch (format.length) {
          case 1:
            return re;
          case 2:
            return zeroFill(re, 2);
          case 3:
            //short name
            return regional.monthShort[re];
          case 4:
            //long name
            return regional.month[re];
        }
      }
    },
    day: {
      rx: /D{1,4}/,
      fn: function (date, format, fullFormat, regional) {
        var re = date.getDate().toString();
        switch (format.length) {
          case 1:
            return re;
          case 2:
            return zeroFill(re, 2);
          case 3:
            //short name
            return regional.dayShort[re];
          case 4:
            //long name
            return regional.day[re];
        }
      }
    },
    hour: {
      rx: /h{1,2}/i,
      fn: function (date, format, fullformat) {
        var re = date.getHours(), ampm = /t{1,2}/.test(fullformat);
        if (ampm && re > 12)
          re = re % 12;
        re = re.toString();
        while (re.length < format.length)
          re = "0" + re;
        return re;
      }
    },
    minute: {
      rx: /m{1,2}/,
      fn: function (date, format) {
        var re = date.getMinutes().toString();
        while (re.length < format.length)
          re = "0" + re;
        return re;
      }
    },
    second: {
      rx: /s{1,2}/,
      fn: function (date, format) {
        var re = date.getSeconds().toString();
        while (re.length < format.length)
          re = "0" + re;
        return re;
      }
    },
    millisecond: {
      rx: /f{1,4}/,
      fn: function (date, format) {
        var re = date.getMilliseconds().toString();
        while (re.length < format.length)
          re = "0" + re;
        return re;
      }
    },
    hoursoffset: {
      rx: /z{1,3}/i,
      fn: function (date, format, fullformat) {
        var re = -(date.getTimezoneOffset() / 60), sign = re > 0 ? "+" : "";
        switch (format.length) {
          case 1:
            return sign + re;
          case 2:
            return sign + zeroFill(re, 2);
          case 3:
            //with minutes
            return sign + zeroFill(re, 2) + ":00";
        }
      }
    },
    ampm: {
      rx: /t{1,2}/i,
      fn: function (date, format) {
        var h = date.getHours(), capitals = /T{1,2}/.test(format), re;
        switch (format.length) {
          case 1:
            re = h > 12 ? "p" : "a";
            break;
          case 2:
            re = h > 12 ? "pm" : "am";
            break;
        }
        return capitals ? re.toUpperCase() : re;
      }
    },
    weekday: {
      rx: /w{1,2}/i,
      fn: function (date, format, fullFormat, regional) {
        var weekDay = date.getDay();
        var key = format.length > 1 ? "week" : "weekShort",
          reg = regional[key];
        if (reg && reg[weekDay] !== undefined)
          return reg[weekDay];
        return weekDay;
      }
    }
  };

  return {
    format: function (date, format, regional) {
      var re = format;
      for (var x in parts) {
        var part = parts[x],
          m = format.match(part.rx);
        if (!m) continue;
        re = re.replace(part.rx, part.fn(date, m[0], format, regional));
      }
      return re;
    }
  };
});



R("reflection", [], function () {
  
  //static
  
  return {
    // gets value or values of a given object, from a name or namespace (example: 'dog.name')
    getPropertyValue: function (o, name) {
      var a = name.split('.'), x = o, p;
      while (p = a.shift()) {
        if (x.hasOwnProperty(p)) {
          x = x[p];
        }
        if (x instanceof Array) {
          break;
        }
      }
      if (x instanceof Array) {
        if (!a.length) {
          return x;
        }
        return this.getCollectionPropertiesValue(x, a.join('.'));
      }
      return x;
    },

    // gets properties values from a given collection
    getCollectionPropertiesValue: function (collection, name, includeEmptyValues) {
      if (!name) {
        return collection;
      }
      if (typeof includeEmptyValues != 'boolean') {
        includeEmptyValues = false;
      }
      var a = name.split('.'), values = [];
      for (var i = 0, l = collection.length; i < l; i++) {
        var o = collection[i];

        if (!o.hasOwnProperty(a[0])) {
          if (includeEmptyValues) {
            values.push(null);
          }
          continue;
        }
        if (o instanceof Array) {
          var foundColl = this.getCollectionPropertiesValue(o, name);
          if (includeEmptyValues || foundColl.length) {
            values.push(foundColl);
          }
        } else if (typeof o == 'object') {
          var foundVal = this.getPropertyValue(o, name);
          if (includeEmptyValues || this.validateValue(foundVal)) {
            values.push(foundVal);
          }
        } else {
          if (includeEmptyValues || this.validateValue(o)) {
            values.push(o);
          }
        }
      }
      return values;
    },
    
    // returns true if the object has a significant value, false otherwise
    validateValue: function (o) {
      if (!o) return false;
      
      if (o instanceof Array) {
        return !!o.length;
      }
      
      return true;
    }
  };
});



/**
 * jQuery-KingTable.
 * https://github.com/RobertoPrevato/jQuery-KingTable
 *
 * Copyright 2016, Roberto Prevato
 * http://ugrose.com
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
R("array-search", ["string", "reflection"], function (StringUtils, Reflection) {
  
  //use this object to extend prototypes of objects that should offer
  //functions to search inside arrays
  return {
  
    sortByProperty: function (arr, property, order) {
      order = _.isNumber(order) ? order : (/^asc/i.test(order) ? 1 : -1);
      var und = undefined;
      arr.sort(function (a, b) {
        var c = a[property], d = b[property];
        if (c !== und && d === und) return -order;
        if (c === und && d !== und) return order;
        if (c && !d) return order;
        if (!c && d) return -order;
        if (typeof a[property] == 'string' && typeof b[property] == 'string')
          //sort, supporting special characters
          return StringUtils.compare(c, d, order);
        if (c < d) return -order;
        if (c > d) return order;
        return 0;
      });
      return arr;
    },

    // Searches inside a collection of items by a string property, using the given pattern,
    // sorting the results by number of matches, first index and number of recourrences
    searchByStringProperty: function (options) {
      //this.utils.requireParams(options, ['pattern', 'collection', 'properties']);
      return this.searchByStringProperties(_.extend(options, {
        properties: [options.property]
      }));
    },
    
    // Searches inside a collection of items by certains string properties, using the given pattern,
    // sorting the results by number of matches, first index and number of recourrences
    searchByStringProperties: function (options) {
      var defaults = {
        order: 'asc',
        limit: null,
        keepSearchDetails: false,
        getResults: function (a) {
          if (this.keepSearchDetails) {
            return a;
          }
          var b = [];
          for (var i = 0, l = a.length; i < l; i++) {
            b.push(a[i].obj);
          }
          return b;
        }
      };
      
      var o = $.extend({}, defaults, options);
      if (!o.order || !o.order.match(/asc|ascending|desc|descending/i)) o.order = 'asc';
      var matches = [], rx = o.pattern;
      if (!rx instanceof RegExp) throw new Error("the pattern must be a regular expression");
      var properties = o.properties, len = "length";

      for (var i = 0, l = o.collection[len]; i < l; i++) {
        var obj = o.collection[i], objmatches = [], totalMatches = 0;
        
        for (var k = 0, t = properties[len]; k < t; k++) {
          var prop = properties[k], 
              val = Reflection.getPropertyValue(obj, prop);
          
          if (!val) continue;
          if (!val.match) val = val.toString();
          if (val instanceof Array) {
            if (!val[len]) {
              continue;
            }
            val = _.flatten(val);
            var mm = [], firstIndex;
            for (var a = 0, l = val[len]; a < l; a++) {
              var match = val[a].match(rx);
              if (match) {
                if (typeof firstIndex != 'number') {
                  firstIndex = a;
                }
                mm.push(match);
              }
            }
            if (mm[len]) {
              objmatches[k] = {
                matchedProperty: prop,
                indexes: [firstIndex],
                recourrences: _.flatten(mm)[len]
              };
            }
            continue;
          }
          
          var match = val.match(rx);
          if (match) {
            totalMatches += match[len];
            objmatches[k] = {
              matchedProperty: prop,
              indexes: _.map(val.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ').split(/\s/), function (s) {
                var n = s.search(rx);
                return n == -1 ? Infinity : n;
              }),
              recourrences: match[len]
            };
          }
        }
        
        if (objmatches[len]) {
          matches.push({
            obj: obj,
            matches: objmatches,
            totalMatches: totalMatches
          });
        }
      }
      var order = o.order.match(/asc|ascending/i) ? 1 : -1,
          lower = "toLowerCase",
          str   = "toString",
          mat   = "matches",
          matp  = "matchedProperty",
          iof   = "indexOf",
          hasp  = "hasOwnProperty",
          rec   = "recourrences",
          obj   = "obj",
          ixs   = "indexes";
      //sort the entire collection of matches
      matches.sort(function (a, b) {
        for (var k = 0, l = properties[len]; k < l; k++) {
          var am = a[mat][k], bm = b[mat][k];
          // if both objects lack matches in this property, continue
          if (!am && !bm) continue;
          
          // properties are in order of importance,
          // so if one object has matches in this property and the other does not,
          // it comes first by definition
          if (am && !bm) return -order;
          if (!am && bm) return order;
          
          // sort by indexes, applies the following rules only if one word started with the search
          var minA = _.min(am[ixs]), minB = _.min(bm[ixs]);
          if (!minA || !minB) {
            if (minA < minB) return -order;
            if (minA > minB) return order;
            if (am[ixs][iof](minA) < bm[ixs][iof](minB)) return -order;
            if (am[ixs][iof](minA) > bm[ixs][iof](minB)) return order;
          }
          
          var ao = a[obj], bo = b[obj];
          //check if objects have matched property because we are supporting search inside arrays and objects subproperties
          if (ao[hasp](am[matp]) && bo[hasp](bm[matp])) {
            //sort by alphabetical order
            if (ao[am[matp]][str]()[lower]() < bo[bm[matp]][str]()[lower]()) return -order;
            if (ao[am[matp]][str]()[lower]() > bo[bm[matp]][str]()[lower]()) return order;
          }
          
          //order by the number of recourrences
          if (am[rec] > bm[rec]) return -order;
          if (am[rec] < bm[rec]) return order;
        }
        return 0;
      });
      var limit = o.limit;
      if (limit)
        matches = matches.slice(0, _.min(limit, matches[len]));
      return o.getResults(matches);
    }
  };
});



//
// An instantiable object to analyze objects and return useful information about them.
//
R("object-analyzer", ["reflection"], function (Reflection) {

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

//
// Instantiable object to sanitize string values inside objects, to avoid JavaScript injection
//
R("sanitizer", [], function () {

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

//
// Utilities to work with the query string (location.search)
//
R("query", [], function () {
  
  return {
    
    get: function (name) {
      return this.getAll()[name];
    },
    
    getAll: function () {
      var o = {}, i, l, x, splitter = /\?|\&/,
      s = location.search.split(splitter),
      m = location.hash.match(/(\?.+)$/);
      //support query string inside hash (normally it is ignored)
      if (m)
        s = s.concat(m[1].split(splitter));
      for (i = 0, l = s.length; i < l; i++) {
        x = s[i];
        if (!x) continue;
        x = x.split(/=/);
        o[x[0]] = decodeURIComponent(x[1]);
      }
      return o;
    },
    
    set: function (key, val) {
      //support call with object
      var invalidParam = 'invalid parameter';
      if (typeof key == "object") {
        if (key instanceof Array) throw invalidParam;
        for (var x in key)
          this.set(x, key[x]);
        return this;
      }
      if (!key) throw invalidParam;
      var hash = location.hash;
      if (!hash)
        return location.hash = "#/?" + key + "=" + val;

      var q = this.getAll();
      if (val === null || val === "")
        delete q[key]
      else
        q[key] = val;
      location.hash = this.getHashForParams(q);
    },

    getHashForParams: function (params) {
      var hash = location.hash, query = [], x;
      for (x in params)
        query.push(x + "=" + encodeURIComponent(params[x]));

      query = query.length ? "?" + query.join("&") : "";
      if (!hash)
        return "#/" + query;
      var ixq = hash.indexOf("?");
      if (ixq > -1)
        return hash.substring(0, ixq) + query;
      return hash + query;
    }
  };
  
});



//
// Files utilities
//
R("file", [], function () {

  return {

    /**
     * Returns a value indicating whether the client side export is supported
     * by the client, or not.
     * @returns {*}
     */
    supportsCsExport: function () {
      return navigator.msSaveBlob || (function () {
        var link = document.createElement("a");
        return link.download !== undefined;
      })();
    },

   /**
     * Exports a csv file; prompting the user for download.
     * @param filename
     * @param lines
     */
    exportfile: function (filename, text, type) {
      var setAttribute = "setAttribute", msSaveBlob = "msSaveBlob";
      var blob = new Blob([text], { type: type });
      if (navigator[msSaveBlob]) { // IE 10+
        navigator[msSaveBlob](blob, filename);
      } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
          // Browsers that support HTML5 download attribute
          var url = URL.createObjectURL(blob);
          link[setAttribute]("href", url);
          link[setAttribute]("download", filename);
          var style = {
            visibility: "hidden",
            position: "absolute",
            left: "-9999px"
          };
          for (var x in style)
            link.style[x] = style[x];
          //inject
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    }
  };

});

//
// Csv utilities
//
R("csv", [], function () {

  var setAttribute = "setAttribute";

  var TypeHandling = {
    allStrings: 1,
    keepType: 2
  };

  return {

    typeHandling: TypeHandling,

    //null value handling option
    defaults: {
      /**
       * Separator to use
       */
      separator: ",",
      /**
       * Whether to add a separator line at the beginning of the file, or not.
       * (May be useful for excel)
       */
      addSeparatorLine: false,
      /**
       * How the types should be handled: allStrings to manage all properties as strings (all will be quoted)
       */
      typeHandling: TypeHandling.allStrings
    },

    /**
     * Serializes the given collection in csv format.
     * Assumes that the collection is optimized (the first row contains properties, the other only values)
     * @param data collection
     * @param options
     */
    serialize: function (data, options) {
      options = _.extend({}, this.defaults, options);
      var re = [],
        push = "push",
        toString = "toString",
        len = "length",
        rep = "replace",
        test = "test",
        sep = options.separator,
        dobquote = "\"";
      if (options.addSeparatorLine) {
        //for excel
        re[push]("sep=" + sep);
      }
      for (var i = 0, l = data[len]; i < l; i++) {
        var a = [], row = data[i];
        //assume that the first row contains the columns
        for (var k = 0, j = row[len]; k < j; k++) {
          var v = row[k];
          if (v instanceof Date) {
            v = v.toLocaleString();
          } else {
            if (typeof v != "string")
              v = v[toString] ? v[toString]() : "";
          }
          v = v[rep](/"/g, '""');
          //escape quotes - RFC-4180, paragraph "If double-quotes are used to enclose fields, then a double-quote
          //appearing inside a field must be escaped by preceding it with another double quote."
          if (/"/[test](v))
            v = v[rep](/"/g, "\"\"");
          //https://en.wikipedia.org/wiki/Comma-separated_values
          //Fields with embedded commas or double-quote characters must be quoted. (by standard, so even if CsvTypeHandling is different than "AllStrings")
          //1997, Ford, E350, "Super, ""luxurious"" truck"
          //1997, Ford, E350, "Super, luxurious truck"
          if (options.typeHandling == TypeHandling.allStrings || /"|\n/[test](v) || v.indexOf(sep) > -1)
            v = dobquote + v + dobquote;
          a[push](v);
        }
        re[push](a.join(sep));
      }
      return re.join("\n");
    }
  };
});

//
// Xml utilities
//
R("xml", [], function () {

  return {

    normal: function (xml) {
      return "<?xml version=\"1.0\"?>" + xml.replace(/\sxmlns="http:\/\/www\.w3\.org\/\d+\/xhtml"/, "");
    },

    pretty: function (xml, indentation) {
      xml = this.normal(xml);
      if (typeof indentation != "number")
        indentation = 2;
      var reg = /(>)(<)(\/*)/g, a = [];
      xml = xml.replace(reg, "$1\r\n$2$3");
      var pad = 0, parts = xml.split('\r\n'), l = parts.length;

      for (var i = 0; i < l; i++) {
        var node = parts[i];
        var indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
          indent = 0;
        } else if (node.match(/^<\/\w/)) {
          if (pad != 0) {
            pad -= 1;
          }
        } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
          indent = 1;
        } else {
          indent = 0;
        }
        var padding = new Array(pad * indentation).join(" ");
        a.push(padding + node + "\r\n");
        pad += indent;
      }
      return a.join("");
    }
  };
});

//
// Returns a common interface for internazionalization, supporting scoped translations.
//
R("i18n", [], function () {
  //if I.js is defined; return it.
  //https://github.com/RobertoPrevato/I.js
  if (window["I"]) return window.I;

  //if i18n is defined; return it.
  //https://github.com/fnando/i18n-js
  if (window["I18n"]) return window.I18n;

  //throw exception
  throw "Missing implementation of i18n. Please refer to https://github.com/RobertoPrevato/jQuery-KingTable/wiki/Implementing-localization";
});

//
// Function to build menus, given a schema
//
R("menu-builder", [], function () {

  var map = {
    "css": "class"
  };

  function attr(obj) {
    if (!obj || !obj.attr) return "";
    var a = [], sep = "\"", attr = obj.attr;
    for (var x in attr)
      a.push([map[x] ? map[x] : x, "=", sep, attr[x], sep].join(""));
    return a.join(" ");
  };

  var menuBuilder = function (menus) {
    if (!menus) throw "missing menus";
    if (_.isPlainObject(menus)) return menuBuilder([menus]);
    if (!menus instanceof Array || !menus.length) throw "missing menus";
    //normalize schema, if needed
    var first = menus[0];
    if (!first.items && first.menu) {
      menus = [{ items: menus }];
    }
    var a = "", caret = "<span class=\"oi\" data-glyph=\"caret-right\"></span>";
    _.each(menus, function (menu) {
      var id = menu.id;
      a += "<ul" + (id ? " id=\"" + id + "\"": "")+ " class=\"ug-menu\">";

      _.each(menu.items, function (item) {
        if (item === null) return;
        var hasSubmenu = item.menu,
          type = item.type,
          href = item.href,
          name = item.name;
        a += "<li" + (hasSubmenu ? " class=\"ug-submenu\">" : ">");

        switch (type) {
          case "checkbox":
            var cid = _.uniqueId("mnck-");
            var checked = item.checked ? " checked=\"checked\"" : "";
            a += "<input id=\"" + cid + "\" type=\"checkbox\"" + attr(item) + checked + " />";
            a += "<label for=\"" + cid + "\">" + name + "</label>";
            break;
          case "radio":
            if (!item.value) throw "missing value for radio";
            var cid = _.uniqueId("mnrd-");
            var checked = item.checked ? " checked=\"checked\"" : "";
            a += "<input id=\"" + cid + "\" type=\"radio\" value=\"" + item.value + "\"" + attr(item) + checked + " />";
            a += "<label for=\"" + cid + "\">" + name + "</label>";
            break;
          default:
            if (href) {
              a += "<a href=\"" + href + "\"" + attr(item) + ">" + name + (hasSubmenu ? caret : "") + "</a>";
            } else {
              a += "<span tabindex=\"0\"" + attr(item) + ">" + name + (hasSubmenu ? caret : "") + "</span>";
            }
            break;
        }

        if (hasSubmenu)
          a += menuBuilder([item.menu]);

        a += "</li>";
      });
      a += "</ul>";
    });

    return a;
  };

  return menuBuilder;
});

//
// Menu functions
//
R("menu-functions", [], function () {

  var toggle = ".ug-menu,.ug-submenu";
  function protected(e) {
    return /input|select|textarea|label|^a$/i.test(e.target.tagName);
  }
  var menufunctions = {

    closeMenus: function (e) {
      if (e && protected(e)) return true;
      var self = this;
      if (e && e.which === 3) return;
      $(toggle).each(function () {
        if ($.contains(this, e.target)) return;
        var el = $(this);
        var parent = self.getParent(el);
        if (!parent.hasClass("open")) return;

        if (e && e.type == "click" && /input|textarea/i.test(e.target.tagName) && $.contains(parent[0], e.target)) return;

        if (e && e.isDefaultPrevented()) return;
        el.attr("aria-expanded", "false");
        parent.removeClass("open");
      });
    },

    getParent: function (el) {
      var selector = el.attr("data-target");
      if (!selector) {
        selector = el.attr("href");
        selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, "");
      }
      var $parent = selector && $(selector);
      return $parent && $parent.length ? $parent : el.parent();
    },

    expandMenu: function (e) {
      if (protected(e)) return true;
      var self = this,
        el = $(e.currentTarget);
      if (el.is(".disabled, :disabled")) return;
      var target  = /li/i.test(e.currentTarget.tagName) ? el : self.getParent(el);
      var isActive = target.hasClass("open");
      self.closeMenus(e);
      if (!isActive) {
        if (e.isDefaultPrevented()) return;
        el.trigger("focus").attr("aria-expanded", "true");
        target.toggleClass("open");
      }
      return false;
    },

    expandSubMenu: function (e) {
      if (protected(e)) return true;
      var open = "open",
        el = $(e.currentTarget);
      //close siblings submenus
      el.siblings().removeClass(open).find("." + open).removeClass(open);
      el.addClass(open);
      return false;
    }

  };

  function prevent(e) {
    e.preventDefault();
  }

  function firstitem(el) {
    var len = "length",
      find = "find",
      first = ":first-of-type",
      a = el[find]("a" + first);
    if (a[len]) return a;
    a = el[find]("span[tabindex]" + first);
    if (a[len]) return a;
    a = el[find]("label" + first);
    return a;
  }

  function globalKeydown(e) {
    if (protected(e) && !$(e.target).closest(".ug-menu").length) return true;
    var keycode = e.which;
    if (keycode === 9) return true;
    var anyMenuOpen = !!$(".ug-menu:visible").length;
    var focused = $(":focus"), focus = "focus";

    if (anyMenuOpen && /27|37|38|39|40/.test(keycode)) {
      prevent(e);
      if (keycode == 27)
        return menufunctions.closeMenus(), true;
      var el = focused.length && focused.closest(".ug-menu").length
          ? focused
          : firstitem($($(".ug-menu:visible")[0]).find("li:first")),
        parent = el.parent();
      if (focused.hasClass("ug-expander")) {
        firstitem(parent).trigger(focus);
        return true;
      }
      if (keycode == 38) {
        //up
        var prev = focused.prev(),
          prevIsMenu = prev.hasClass("ug-menu");
        if (prevIsMenu) {
          firstitem(prev.children(":first")).trigger(focus);
        } else {
          firstitem(parent.prev()).trigger(focus);
        }
      }
      if (keycode == 40) {
        //down
        var next = focused.next(),
          nextIsMenu = next.hasClass("ug-menu");
        if (nextIsMenu && !parent.hasClass("ug-submenu")) {
          firstitem(next.children(":first")).trigger(focus);
        } else {
          var isExpander = focused.hasClass("ug-expander");
          firstitem(isExpander ? parent : parent.next()).trigger(focus);
        }
      }
      if (keycode == 37) {
        //left
        var parentSub = parent.closest(".ug-submenu");
        if (parentSub.length) {
          if (parentSub.get(0) === parent.get(0)) {
            parentSub = parentSub.parent().closest(".ug-submenu");
          }
          if (parentSub.length) {
            parentSub.removeClass("open");
            _.defer(function () {
              firstitem(parentSub).trigger(focus);
            });
          }
        }
      }
      if (keycode == 39) {
        //right
        if (parent.hasClass("ug-submenu")) {
          parent.trigger("click");
          _.defer(function () {
            firstitem(parent.find("li:first-of-type")).trigger(focus);
          });
        }
      }
      return true;
    }
  }

  var bind = "bind",
    click = "click.menus",
    keydown = "keydown.menus";
  $(document)
    .off(click)
    .off(keydown)
    .on(click, menufunctions.closeMenus[bind](menufunctions))
    .on(click, ".ug-expander", menufunctions.expandMenu[bind](menufunctions))
    .on(click, toggle, menufunctions.expandMenu[bind](menufunctions))
    .on(keydown, globalKeydown);

  return menufunctions;
});
//
// Proxy module for menus modules.
//
R("menu", ["menu-builder", "menu-functions"], function (MenuBuilder, MenuFunctions) {
  return {
    builder: MenuBuilder,
    functions: MenuFunctions
  };
});

/**
 * jQuery-KingTable.
 * https://github.com/RobertoPrevato/jQuery-KingTable
 *
 * Copyright 2016, Roberto Prevato
 * http://ugrose.com
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
R("filters-manager", ["string", "regex", "array-search", "extend"], function (StringUtils, RegexUtils, ArrayUtils, Extend) {
  //
  // Instantiable object, providing business logic to manage filters.
  //
  var FiltersManager = function (options) {
    this._configure(options || {});
    this.rules = [];
    this.initialize.apply(this, arguments);
  };

  FiltersManager.extend = Extend;

  $.extend(FiltersManager.prototype, {
    string: StringUtils,
    regex: RegexUtils,
    array: ArrayUtils,
    options: {
      baseProperties: ["rules", "onRulesChange"]
    }
  });

  _.extend(FiltersManager.prototype, {

    initialize: function () {

    },

    set: function (filter, options) {
      options = $.extend({
        silent: false
      }, options || {});
      if (!filter) return this;
      if (filter.id && !filter.key) filter.key = filter.id;
      if (filter.key) {
        this.rules = _.reject(this.rules, function (r) { return r.key == filter.key; });
      }
      if (filter.fromLiveFilters) return this.setLiveFilter(filter);
      this.rules.push(filter);
      if (!options.silent) {
        this.onRulesChange(filter);
      }
      return this;
    },

    onRulesChange: function () {},

    setLiveFilter: function (filter) {
      return this;
    },

    removeRuleByKey: function (key, options) {
      options = $.extend({
        silent: false
      }, options || {});
      var found = !!_.find(this.rules, function (r) { return r.key == key; });
      if (found) {
        this.ruleToRemove = _.find(this.rules, function (r) { return r.key == key; });
        this.rules = _.reject(this.rules, function (r) { return r.key == key; });
        if (!options.silent && this.ruleToRemove) {
          this.onRulesChange();
        }
      }
      return this;
    },

    getRuleByKey: function (key) {
      return _.find(this.rules, function (rule) { return rule.key == key; });
    },

    getRulesByType: function (type) {
      return _.filter(this.rules, function (rule) { return rule.type == type; });
    },

    //skims an array applying all the filters
    skim: function (arr) {
      if (!this.rules.length) return arr;
      var a = arr;
      for (var i = 0, l = this.rules.length; i < l; i++) {
        var filter = this.rules[i];
        if (filter.disabled) continue;
        a = this.applyFilter(a, filter)
      }
      return a;
    },

    search: function (collection, s, options) {
      if (!s || !collection || this.searchDisabled) return collection;
      var rx = s instanceof RegExp ? s : this.regex.getSearchPattern(this.string.getString(s), options);
      if (!rx) return false;
      if (!options.searchProperties) throw 'missing search properties';
      return this.array.searchByStringProperties({
        pattern: rx,
        properties: options.searchProperties,
        collection: collection,
        keepSearchDetails: false
      });
    },

    applyFilter: function (arr, filter) {
      switch (filter.type) {
        case 'search':
          return this.search(arr, filter.value, filter);
        case 'fn':
        case 'function':
          return _.filter(arr, _.partial(filter.fn.bind(filter.context || this), filter));
      }
      return arr;
    },

    //gets an array of string expressions for the current filters rules
    getExpressions: function () {
      var a = [];
      for (var i = 0, l = this.rules.length; i < l; i++) {
        var filter = this.rules[i];
        if (filter.disabled) continue;
        switch (filter.type) {
          case 'search':
            if (filter.searchProperties) {
              a.push({
                type: filter.type,
                expression: this.string.format("{0} like '{1}'", filter.searchProperties.join(' or '), filter.value)
              });
            }
            break;
          case 'function':
            var fn = filter.fn.toString(),
              rx = /function\s*\(.*\)\s*{(.+)}/,
              m = fn.match(rx);
            a.push({ type: filter.type, expression: m ? $.trim(m[1]) : fn });
        }
      }
      return a;
    },

    reset: function () {
      var rule;
      while (rule = this.rules.shift()) {
        if (rule.onReset) {
          rule.onReset.call(this);
        }
      }
      return this;
    },

    _configure: function (options) {
      if (this.options) options = _.extend({}, _.result(this, 'options'), options);
      _.extend(this, _.pick(options, this.options.baseProperties));
      this.options = options;
    }

  });

  return FiltersManager;
});

/**
 * jQuery-KingTable, core logic.
 * https://github.com/RobertoPrevato/jQuery-KingTable
 *
 * Copyright 2016, Roberto Prevato
 * http://ugrose.com
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
R("kingtable-core", ["extend", "events", "string", "regex", "array-search", "query", "object-analyzer", "sanitizer",
  "filters-manager", "csv", "xml", "file"], function (Extend, Events, StringUtils, RegexUtils, ArraySearch, Query, Analyzer,
                                               Sanitizer, FiltersManager, Csv, Xml, FileUtil) {
  //
  // Defines the core business logic of the jQuery-KingTable plugin.
  // The core is abstracted from jQuery itself;
  //
  var KingTable = function (options, staticProperties) {
    var self = this;
    if (staticProperties)
      _.extend(self, staticProperties);
    self.mergeOptions(options).coreInit().initialize();
  };

  KingTable.extend = Extend;

  KingTable.Utils = {};
  KingTable.Utils.String = StringUtils;
  KingTable.Utils.Regex = RegexUtils;
  KingTable.Utils.Array = ArraySearch;
  KingTable.Utils.Analyzer = Analyzer;
  KingTable.Utils.Sanitizer = Sanitizer;
  KingTable.Utils.FiltersManager = FiltersManager;

  // global object containing defaults by type and name: these objects are designed to be extended during library setup
  KingTable.Schemas = {

    /**
     * Default columns properties, by field value type.
     * This object is meant to be extended by implementers; following their personal preferences.
     */
    DefaultByType: {
      number: function (columnSchema, objSchema) {
        return {
          format: function (value) {
            return value + '';
          }
        };
      },
      date: function (columnSchema, objSchema) {
        return {
          format: function (value) {
            return this.date.format(value, "dd/MM/yyyy hh:mm");
          }
        };
      }
    },

    /**
     * Default columns properties, by field name.
     * This object is meant to be extended by implementers; following their personal preferences.
     */
    DefaultByName: {
      id: {
        name: "id",
        type: "id",
        hidden: true,
        secret: true
      },
      guid: {
        name: "guid",
        type: "guid",
        hidden: true,
        secret: true
      }
    }
  };

  _.extend(KingTable.prototype, Events, {

    /**
     * Override this function to implement custom initialization logic.
     */
    initialize: function () {},

    /**
     * Base properties that can be overridden upon instantiation.
     * @examples
     * var sm = new $.KingTable.KingTable({
     *   initialize: function () { this function overrides the prototype initialize },
     *   someCustomProperty: 2 //this property will instead be cached inside the instance.options property
     * });
     */
    baseProperties: ["initialize", "$el", "data", "fixed", "formatData"],

    /**
     * Upon instantiation; this function is called to merge the options inside the instance of KingTable.
     * @param options
     * @returns {$.KingTable.KingTable}
     */
    mergeOptions: function (options) {
      var self = this;
      for (var i = 0, l = self.baseProperties.length; i < l; i++) {
        var name = self.baseProperties[i];
        if (options.hasOwnProperty(name)) {
          self[name] = options[name];
          delete options[name];
        }
      }
      self.options = _.defaults({}, options || {}, _.result(self, 'defaults'));
      return self;
    },

    /**
     * Sets a property, or a set of properties into this KingTable.
     * @param name
     * @param value
     * @returns {$.KingTable.KingTable}
     */
    set: function (name, value) {
      var self = this;
      if (typeof name == 'object') {
        _.each(name, function (v, k) {
          self.set(k, v);
        });
        return self;
      }
      self[name] = value;
      return self;
    },

    /**
     * Whether to support multiple tables per page; or not.
     * The only difference is that the query strings become weirder.
     * Please notice that this value is shared by the prototype of any kingtable.
     */
    multitable: true,

    /**
     * Default options of the KingTable.
     */
    defaults: {

      /**
       * Whether to display the row count or not.
       */
      rowCount: true,

      /**
       * Default schema for each table column.
       */
      columnDefault: {
        name: "",
        type: "text",
        groupable: true,
        sortable: true,
        resizable: true,
        allowSearch: true,
        template: "##Name##",
        hidden: false
      },

      /**
       * Whether to allow search, or not.
       */
      allowSearch: true,

      /**
       * Minimum number of characters inside the search field to trigger a search.
       */
      minSearchChars: 3,

      /**
       * Delay to start a search after the user stops typing into the search field.
       * by design and intentionally, the search is lazy (it starts few milliseconds after the user stops typing into the search field)
       */
      searchDelay: 50,

      /**
       * Whether to write and read filters inside the query string, or not
       * for usability, it is better to keep this option active.
       */
      useQueryString: false,

      /**
       * Whether to write and read some settings using the local storage.
       */
      useLocalStorage: true,

      /**
       * The query string to use, when storing the search inside the query string.
      * */
      searchQueryString: "search",

      /**
       * The query string to use, when storing the results per page number in the query string.
       */
      resultsPerPageQueryString: "size",

      /**
       * The local storage key, to use when storing the results per page settings.
       */
      resultsPerPageStorageKey: "kt-results-per-page",
      
      /**
       * The local storage key, to use when storing the columns order.
       */
      columnsOrderStorageKey: "kt-columns-order",

      /**
       * The query string to use, when storing the page inside the query string.
       */
      pageQueryString: "page",

      /**
       * Default first page.
       */
      page: 1,

      /**
       * Default page size
       */
      resultsPerPage: 30,

      // Permits to specify the options of the results per page select
      resultsPerPageSelect: [10, 30, 50, 100],

      // Permits to specify extra tools for this table
      tools: null,

      // Permits to turn on or off pagination for this table
      paginationEnabled: true,

      //limit of objects to analyze for collection
      analyzeLimit: 1,

      //when one or more search filters are active, auto highlight them
      autoHighlightSearchProperties: true,

      //suffix to use for formatted properties
      formattedSuffix: '_formatted',

      //permits to specify whether the collection is fixed or not
      //default changes if the table is instantiated passing a collection
      fixed: false,

      //permits to specify an initial search when generating the table for the first time
      search: '',

      //permits to specify the search mode to use during live search
      //FullString, SplitWords or SplitSentences
      searchMode: "FullString",

      /**
       * Default function to get the name of the id property of displayed objects.
       */
      getIdProperty: function () {
        var columns = this.columns;
        if (!columns || !columns.length) return "id";
        for (var i = 0, l = columns.length; i < l; i++) {
          var name = columns[i].name;
          if (/^_?id$|^_?guid$/i.test(name))
            return name;
        }
        throw new Error("jQuery-KingTable: cannot guess which property should be used as id. Please specify the getIdProperty function; to return the id property.");
      },
      
      /**
       * Whether the table should automatically refresh itself, when a filter changes; or not.
       */
      autorefresh: true,

      /**
       * Default export formats.
       */
      exportFormats: [
        {
          name: "Csv",
          format: "csv",
          type: "text/csv"
        },
        {
          name: "Json",
          format: "json",
          type: "application/json"
        },
        {
          name: "Xml",
          format: "xml",
          type: "text/xml"
        }
      ],

      /**
       * Whether to prettify xml when exporting, or not.
       */
      prettyXml: true,

      /**
       * Allows to specify csv serialization options
       */
      csvOptions: {},

      /**
       * Whether to include hidden properties in the export; or not.
       */
      exportHiddenProperties: false,

      /**
       * Whether to go to the first page upon an hard refresh, or not
       */
      firstPageOnRefresh: true
    },

    string: StringUtils,

    query: Query,

    json: function (o) {
      return JSON.stringify(o);
    },
    
    raiseError: function (message) {
      throw new Error("KingTable: " + message + ". Please refer to official documentation at https://github.com/RobertoPrevato/jQuery-KingTable");
    },

    coreInit: function () {
      var self = this, options = self.options;
      self.cid = _.uniqueId('c');
      self.cache = {};
      //if the table is instantiated with data; then consider it fixed (no need to fetch data using ajax)
      if (self.data) {
        self.fixed = true;
        self.data = self.normalizeCollection(self.data);
      }
      //create an instance of object analyzer
      self.objAnalyzer = new Analyzer();
      self.filters = new FiltersManager();
      self.sanitizer = new Sanitizer();
      if (!self.fixed) {
        //if the table collection is not fixed;
        //then there is no need to perform search operations on the client side
        self.filters.searchDisabled = true;
      }

      if (!window.localStorage) options.useLocalStorage = false;
      if (options.allowSearch) {
        self.searchCore = self.getSearchHandler();
      }
      if (self.multitable) {
        //the table supports coexisting at the same time with other tables.
        //the query strings must be unique for the instance of table
        if (options.useQueryString) {
          _.each(["pageQueryString", "searchQueryString", "resultsPerPageQueryString"], function (name) {
            options[name] = options[name] + self.cid;
          });
        }
      }
      //support custom filters
      self.customFilters = {};
      self.loadSettings().checkHash();
      //set basic pagination data
      self.setPagination();
      var connectorInit = "connectorInit";
      if (self[connectorInit])
        self[connectorInit]();
      return self;
    },

    loadSettings: function () {
      var self = this, options = self.options;
      //loads the settings from the query string and the local storage
      if (options.useQueryString) {
        //load the query string
        var s = self.query.get(options.searchQueryString);
        if (s) {
          //set the search inside the options
          options.search = s;
          self.setSearchFilter(s);
        }
        s = self.query.get(options.pageQueryString);
        if (s) {
          //set the page inside the options
          options.page = parseInt(s);
        } else {
          Query.set(options.pageQueryString, options.page);
        }
        s = self.query.get(options.resultsPerPageQueryString);
        if (s) {
          //set the results per page inside the options
          options.resultsPerPage = parseInt(s);
        }
        
        var reservedKeys = [options.searchQueryString, options.pageQueryString, options.resultsPerPageQueryString],
          otherFilters = self.query.getAll(), x;
          for (x in otherFilters) {
            if (_.contains(reservedKeys, x))
              delete otherFilters[x];
          }
        _.extend(self.customFilters, otherFilters);
      }
      //load from local storage
      if (options.useLocalStorage) {
        s = window.localStorage.getItem(options.resultsPerPageStorageKey);
        if (s) {
          //set the results per page inside the options
          options.resultsPerPage = parseInt(s);
          if (options.useQueryString) {
            Query.set(options.resultsPerPageQueryString, s);
          }
        }
      }
      return self;
    },

    /**
     * Sets an event handler to check for hashchange.
     * @returns {KingTable}
     */
    checkHash: function () {
      if (!this.options.useQueryString) return this;
      //this is the only piece of code that actually refers to jQuery inside this file.
      $(window).on("hashchange.kingtable" + this.cid, _.bind(function() {
        var self = this,
          o = self.options,
          p = self.pagination,
          page = p.page,
          size = p.resultsPerPage,
          search = p.search,
          qsPage = Query.get(o.pageQueryString),
          qsSize = Query.get(o.resultsPerPageQueryString),
          qsSearch = Query.get(o.searchQueryString) || "";
        //validate page number
        if (qsPage) {
          qsPage = parseInt(qsPage);
          if (isNaN(qsPage) || qsPage < 1 || qsPage > p.totalPageCount) {
            //invalid query string: revert
            Query.set(o.pageQueryString, page);
          } else {
            //query string has a new page:
            if (page !== qsPage) {
              p.page = qsPage;
              self.onPageChange();
            }
          }
        } else {
          //no page query string: it must be one
          if (page !== 1) {
            p.page = 1;
            self.onPageChange();
          }
        }
        if (qsSize) {
          qsSize = parseInt(qsSize);
          if (isNaN(qsSize) || !_.contains(o.resultsPerPageSelect, qsSize)) {
            //invalid query string: revert
            Query.set(o.resultsPerPageQueryString, size);
          } else {
            //query string has a new page size:
            if (size !== qsSize) {
              p.resultsPerPage = qsSize;
              self.onResultsPerPageChange();
              self.onPageChange();
            }
          }
        } else {
          //no size query string: it must be one
          if (size !== o.resultsPerPage) {
            p.resultsPerPage = o.resultsPerPage;
            self.onResultsPerPageChange();
            self.onPageChange();
          }
        }
        if (qsSearch !== search) {
          p.search = qsSearch || "";
          if (!qsSearch)
            self.onSearchEmpty();
          self.trigger("search-qs-change");
        }
      }, this));
      return this;
    },

    render: function () {
      var def = new $.Deferred(), self = this;

      //self.data && self.hasData()
      if (self.fixed && self.hasData()) {
        //resolve automatically
        def.resolveWith(self, [self.data, true]);
      } else {
        //it is necessary to load data
        var timestamp = self.lastFetchTimestamp = new Date().getTime();
        self.loadData(null, timestamp).done(function (data, isSynchronous) {
          if (!data || !data.length && !self.columnsInitialized) {
            //there is no data: this may happen when the page is loaded
            //with a wrong page setting and the server is returning a catalog object
            self.pendingRender = def;
            //display anyway the pagination
            self.trigger("missing-data");
            return;
          }
          def.resolveWith(self, [data, isSynchronous]);
        });
      }

      def.done(function (data, isSynchronous) {
        if (self.beforeRender)
          self.beforeRender();
        //initialize columns
        self.initializeColumns()
          .formatData(data)
          .sortColumns()
          .setTools();

        self.build(isSynchronous);
        if (self.afterRender)
          self.afterRender();
      });
      return def.promise();
    },

    hasData: function () {
      var data = this.data;
      return data && data.length;
    },

    //prepares post data to send to the server for ajax calls that fetch collection
    mixinAjaxPostData: function (options) {
      var self = this;
      return _.extend(self.getFilters(), self.options.postData || {});
    },

    getFilters: function () {
      var self = this,
          pagination = self.pagination;
      return _.extend({
        fixed: self.fixed || false,//whether the table requires server side pagination or not
        page: pagination.page,//page number
        size: pagination.resultsPerPage,//page size; i.e. results per page
        orderBy: pagination.orderBy || "",
        sortOrder: pagination.sortOrder || "",
        search: pagination.search,
        timestamp: self.anchorTimestamp//the timestamp of the first time the table was rendered
      }, self.customFilters);
    },

    //function that obtains the current timestamp from the server side:
    //this represents the timestamp from the server point of view: useful to display properly fast-growing collections
    getAnchorTimestamp: function (data, xhr) {
      if (!_.isArray(data)) {
        //try to obtain the timestamp from the returned object
        var props = ["date", "timestamp", "time"];
        for (i = 0, l = props.length; i < l; i++) {
          var prop = props[i];
          var value = data[prop];
          if (value) {
            return value;
          }
        }
      }
      //try to obtain the timestamp from headers
      var headers = ["X-Timestamp", "Timestamp", "Date"], i, l;
      for (i = 0, l = headers.length; i < l; i++) {
        var header = headers[i];
        var value = xhr.getResponseHeader(header);
        if (value) {
          return value;
        }
      }
      return null;
    },

    //function that loads data, eventually performing ajax calls
    loadData: function (options, timestamp) {
      options = options || {};
      var def = new $.Deferred(), self = this;

      //if the table is a fixed table, then resolve automatically the promise
      if (options.nofetch || self.fixed && self.hasData()) {
        def.resolveWith(self, [self.data, true]);
      } else {
        //an ajax call is required
        var url = self.options.url;
        if (!url) self.raiseError("Missing data, or url option to fetch data");

        //obtain ajax options
        var postData = self.mixinAjaxPostData(options, timestamp);

        self.trigger("fetch:start").getFetchPromise({
          url: url,
          data: postData
        }).always(function () {
          self.trigger("fetch:end");
        }).done(function (catalog, status, xhr) {
          //check if there is a newer call to function
          if (timestamp < self.lastFetchTimestamp) {
            //do nothing because there is a newer call to loadData
            return;
          }
          self.trigger("fetch:done").onFetchDone();
          //check if the anchor timestamp is set
          if (!self.anchorTimestamp) {
            //try to obtain the anchor timestamp from the response objects
            self.anchorTimestamp = self.getAnchorTimestamp(catalog, xhr);
          }

          //check if returned data is an array or a catalog
          if (_.isArray(catalog)) {
            //
            //The server returned an array, so take for good that this collection
            //is complete and doesn't require server side pagination. This is by design.
            //
            catalog = self.normalizeCollection(catalog);
            self.fixed = true;
            self.filters.searchDisabled = false;
            if (self.columnsInitialized)
              self.formatData(catalog);
            self.data = catalog;
            self.updatePagination(catalog.length);
            def.resolveWith(self, [catalog, false]);
          } else {
            //
            //The server returned an object, so take for good that this collection requires
            //server side pagination; expect the returned data to include information like:
            //total number of results (possibly), so a client side pagination can be built;
            //
            //expect catalog structure (page count, page number, etc.)
            if (!catalog.subset) self.raiseError("The returned object is not a catalog");
            var subset = self.normalizeCollection(catalog.subset);
            if (self.columnsInitialized) self.formatData(subset);
            if (catalog.search) {
              //set last fetch filter to avoid useless ajax calls
              self.cache.lastFetchFilter = self.filters.regex.getMatchPattern(catalog.search);
            }
            self.data = subset;

            if (typeof catalog.total !== "number")
              self.raiseError("Missing total items count in response object. Please provide the total rows count inside the catalog page response object");
            self.updatePagination(catalog.total);
            def.resolveWith(self, [subset, false]);
          }
          self.checkPendingRender();
        }).fail(function () {
          //check if there is a newer call to function
          if (timestamp < self.lastFetchTimestamp) {
            //do nothing because there is a newer call to loadData
            return;
          }
          self.trigger("fetch:error");
          self.onFetchError();
          self.trigger("error", "ajax");
        });
      }
      return def.promise();
    },

    checkPendingRender: function () {
      var self = this, pending = self.pendingRender;
      if (pending && self.hasData()) {
        pending.resolveWith([self]);
        self.pendingRender = null;
      }
      return self;
    },

    /**
     * Returns a promise object related to the process of fetching data;
     * @param params
     * @returns {*}
     */
    getFetchPromise: function (params) {
      var self = this;
      //set ajax callbacks context
      params.context = self;
      self.onFetchStart();
      return self.postJson(params).always(function () {
        self.onFetchEnd();
      });
    },

    /**
     * Override this function to implement "onLoad" logic.
     */
    onFetchStart: function () {},

    /**
     * Override this function to implement "onFetchEnd" logic.
     */
    onFetchEnd: function () {},

    /**
     * Override this function to implement "onFetchError" logic.
     */
    onFetchError: function () {},

    /**
     * Override this function to implement "onFetchDone" logic.
     */
    onFetchDone: function () {},

    /**
     * Default function to post json data to the server, to fetch a collection.
     * Commonly, posted data includes filters like page number; number of items per page; etc.
     * @param params, default input parameters.
     * @returns {*}
     */
    postJson: function (params) {
      _.extend(params, {
        type: "POST",
        dataType: "json",
        contentType: "application/json"
      });
      if (!_.isString(params.data)) {
        params.data = this.json(params.data);
      }
      return $.ajax(params);
    },

    //pagination functions
    goToFirst: function () {
      this.pagination.page = 1;
      return this.onPageChange();
    },

    goToLast: function () {
      this.pagination.page = this.pagination.totalPageCount;
      return this.onPageChange();
    },

    goToNext: function () {
      var self = this,
        next = self.pagination.page + 1;
      if (self.validPage(next)) {
        self.pagination.page = next;
        self.onPageChange();
      }
      return self;
    },

    goToPrev: function () {
      var self = this,
        prev = self.pagination.page - 1;
      if (self.validPage(prev)) {
        self.pagination.page = prev;
        self.onPageChange();
      }
      return self;
    },

    onPageChange: function () {
      return this.storePage();
    },

    onResultsPerPageChange: function () {
      //store in the query string and in the localStorage
      var self = this,
        options = self.options,
        resultsPerPage = self.pagination.resultsPerPage;
      if (options.useLocalStorage && window.localStorage) {
        window.localStorage.setItem(options.resultsPerPageStorageKey, resultsPerPage);
      }
      if (options.useQueryString) {
        self.query.set(options.resultsPerPageQueryString, resultsPerPage);
      }
      return self;
    },

    storePage: function () {
      var self = this,
        page = self.pagination.page;
      if (self.options.useQueryString) {
        self.query.set(self.options.pageQueryString, page);
      }
      return self;
    },

    validPage: function (val) {
      var p = this.pagination;
      return !(isNaN(val) || val < 1 || val > p.totalPageCount || val === p.page);
    },

    getObjectSchema: function () {
      var self = this, limit = self.options.analyzeLimit;
      //analyze whole collection
      return self.objAnalyzer.getCollectionStructure(self.data, { clear: false, limit: limit });
    },

    getMemory: function (key) {
      var self = this,
        k = self.getKey(self.options[key]);
      return localStorage.getItem(k);
    },

    setMemory: function (key, val) {
      var self = this,
        k = self.getKey(self.options[key]);
      return localStorage.setItem(k, val);
    },

    getColumnsPositionData: function () {
      var self = this, 
        val = self.getMemory("columnsOrderStorageKey");
      try {
        if (val) {
          return JSON.parse(val);
        }
      } catch (ex) {}
      return null;
    },

    initializeColumns: function () {
      var n = "columnsInitialized",
        self = this;
      if (self[n] || !self.hasData()) return this;
      self[n] = true;
      var columns = [];
      var posData = self.getColumnsPositionData();

      //gets the first object of the table as example
      var objSchema = self.getObjectSchema();
      var optionsColumns = self.options.columns;

      if (optionsColumns) {
        var i = 0;
        //support defining only the columns by their display name (to save programmers's time)
        for (var x in optionsColumns) {
          var col = optionsColumns[x];
          if (_.isString(col))
            //normalize
            optionsColumns[x] = { displayName: col };
          if (_.isString(col.name)) {
            //if a name property is defined, replace it with the word `displayName`
            //since the KingTable requires the name to be equal to the property name.
            col.displayName = col.name;
            delete col.name;
          }
          optionsColumns[x].position = i;
          i++;
        }
      }

      for (var x in objSchema) {
        var base = { name: x },
          schema = objSchema[x],
          type = schema.type;
        if (!type) schema.type = type = "string";
        //extend with table column default options
        var col = _.extend({}, self.options.columnDefault, base, schema);
        // assign a unique id to this column object:
        col.cid = _.uniqueId("col");
        type = type.toLowerCase();
        //set default properties by field type
        var a = $.KingTable.Schemas.DefaultByType;
        if (a.hasOwnProperty(type)) {
          //default schema by type
          _.extend(base, a[type].call(self, schema, objSchema));
        }
        //set default properties by name
        a = $.KingTable.Schemas.DefaultByName;
        if (a.hasOwnProperty(x)) {
          //default schema by name
          _.extend(base, a[x]);
        }

        _.extend(col, base);

        if (optionsColumns) {
          //the user esplicitly defined some column options
          //columns are defined in the options, so take their defaults, supporting both arrays or plain objects
          var definedSchema = _.isArray(optionsColumns)
            ? _.find(optionsColumns, function (o) { return o.name == x; })
            : optionsColumns[x];
          if (definedSchema) {
            //some options are explicitly defined for a field: extend existing schema with column defaults
            _.extend(col, definedSchema);
          }
        }

        //replace the column template name placeholder with the actual field name
        col.template = col.template.replace(/##\s*Name\s*##/, '{{' + x + '}}');

        if (posData) {
          col.position = _.indexOf(posData, x);
        }

        if (!_.isString(col.displayName))
          col.displayName = col.name;
        columns.push(col);
      }

      //if the user defined the columns inside the options;
      //automatically set their position on the basis of their index
      if (optionsColumns) {
        var i = 0, p = "position";
        for (var x in optionsColumns) {
          var col = _.find(columns, function (o) {
            return o.name == x;
          });
          if (col && !col.hasOwnProperty(p))
            col[p] = i;
          i++;
        }
      }

      //this.columns = new this.columnsCollection(columns);
      self.setColumns(columns);
      //will contain names of formatted properties
      self.columns.formatted = [];
      return self;
    },

    normalizeCollection: function (collection) {
      var len = "length";
      if (!collection[len]) return collection;
      var first = collection[0];
      if (first instanceof Array) {
        // assumes that the server is returning an optimized collection:
        // the first array contains the column names; while the others the values.
        var a = [];
        for (var i = 1, l = collection[len]; i < l; i++) {
          var o = {};
          for (var k = 0, j = first[len]; k < j; k++) {
            o[first[k]] = collection[i][k];
          }
          a.push(o);
        }
        return a;
      }
      // the collection is not optimized
      return collection;
    },

    formatData: function (data) {
      return this;
    },

    sortColumns: function () {
      //default function to sort columns: they are sorted
      //by position first, then display name
      var isNumber = _.isNumber, columns = this.columns;
      columns.sort(function (a, b) {
        var p = "position";
        if (isNumber(a[p]) && !isNumber(b[p])) return -1;
        if (!isNumber(a[p]) && isNumber(b[p])) return 1;
        if (a[p] > b[p]) return 1;
        if (a[p] < b[p]) return -1;
        //compare display name
        p = "displayName";
        return StringUtils.compare(a[p], b[p], 1);
      });
      for (var i = 0, l = columns.length; i < l; i++)
        columns[i].position = i;
      return this;
    },

    setTools: function () {
      var self = this,
        additionaltools = self.options.tools,
        tools = [
          // columns menu
          {
            name: I.t("voc.Columns"),
            menu: {
              id: "columns-menu",
              items: _(self.columns).reject(function (o) {
                return o.secret === true;
              }).map(function (o) {
                return {
                  name: o.displayName,
                  checked: !o.hidden,
                  type: "checkbox",
                  attr: {
                    "name": o.name,
                    "class": "visibility-check"
                  }
                };
              }).value()
            }
          }, self.getViewTools(), self.getExportTools()
        ];
      if (additionaltools) {
        //the user defined some tools
        tools = tools.concat(additionaltools.call(self));
      }

      self.tools = tools;
      return self;
    },

    getExportTools: function () {
      var exportFormats = this.options.exportFormats;
      if (!exportFormats) return null;
      //normalize
      _.each(exportFormats, function (o) {
        _.extend(o, {
          attr: {
            css: "export-btn",
            "data-format": o.format
          }
        });
      });
      return FileUtil.supportsCsExport() ? {
        name: I.t("voc.Export"),
        menu: {
          items: exportFormats
        }
      } : null;
    },

    setColumns: function (columns) {
      this.columns = columns;
      return this;
    },

    /**
     * First function that sets the pagination data inside the instance of KingTable; by options.
     * @returns {KingTable}
     */
    setPagination: function () {
      var data = this.data,
        options = this.options,
        page = options.page,
        resultsPerPage = +options.resultsPerPage,
        totalRowsCount = +options.totalRowsCount || (data ? data.length : 0),
        firstObjectNumber = (page * resultsPerPage) - resultsPerPage + 1,
        lastObjectNumber = page * resultsPerPage,
        search = self.pagination ? self.pagination.search : "";
      this.pagination = {
        page: options.page,
        firstPage: 1,
        resultsPerPage: resultsPerPage,
        totalRowsCount: totalRowsCount,
        totalPageCount: this.getPageCount(totalRowsCount, resultsPerPage),
        resultsPerPageSelect: options.resultsPerPageSelect,
        allowSearch: options.allowSearch,
        filtersWizard: options.filtersWizard,
        filterProperties: options.filterProperties,
        search: search || options.search,
        firstObjectNumber: firstObjectNumber,
        lastObjectNumber: lastObjectNumber,
        orderBy: options.orderBy,
        sortOrder: options.sortOrder
      };
      return this;
    },

    // gets the total page count to display n objects, given the number of objects per page
    getPageCount: function (objectsCount, objectsPerPage) {
      if (objectsCount > objectsPerPage) {
        if (objectsCount % objectsPerPage == 0) {
          return objectsCount / objectsPerPage;
        }
        return Math.ceil(objectsCount / objectsPerPage);
      }
      return 1;
    },

    setItemCount: function (arr) {
      var self = this,
          pag = self.pagination,
          offset = self.fixed ? 0 : ((pag.page - 1) * pag.resultsPerPage);
      if (!arr) arr = self.data;
      if (!self.columnsInitialized) self.initializeColumns();
      for (var i = 0, l = arr.length; i < l; i++) {
        arr[i].rowCount = i + 1 + offset;
      }
      return arr;
    },

    getItemsToDisplay: function (options) {
      options = options || {};
      var def = new $.Deferred(), self = this;
      var timestamp = self.lastFetchTimestamp = new Date().getTime();

      self.loadData(options, timestamp).done(function (a) {
        //make sure that the search filter is updated
        self.ensureSearchFilter();
        //apply filters here because we care about looking inside string representations of values
        a = self.filters.skim(a);
        //update pagination, but only if the table is fixed;
        if (self.fixed) {
          self.updatePagination(a.length);
          self.sortClientSide(a);
        }
        //set row count inside the array:
        self.setItemCount(a);
        def.resolveWith(self, [self.data.length > self.pagination.resultsPerPage && self.options.paginationEnabled ? self.getSubSet(a) : a]);
      });
      return def.promise();
    },

    sortClientSide: function (a) {
      var self = this,
          pag = self.pagination,
          sortBy = pag.orderBy,
          sortOrder = pag.sortOrder;
      if (!sortBy) return a;
      //the collection can be sorted client side
      $.KingTable.Utils.Array.sortByProperty(a, sortBy, sortOrder);
      return a;
    },

    /**
     * Updates the pagination data of this KingTable;
     * on the basis of the total items count.
     * @param totalRowsCount
     * @returns {$.KingTable.KingTable}
     */
    updatePagination: function (totalRowsCount) {
      var self = this;
      if (!self.pagination) self.setPagination();
      if (!_.isNumber(totalRowsCount)) throw "invalid type";
      var pagination = self.pagination;
      if (pagination.totalRowsCount !== totalRowsCount) {
        pagination.totalRowsCount = totalRowsCount;
        var totalPages = self.getPageCount(totalRowsCount, pagination.resultsPerPage);
        pagination.totalPageCount = totalPages;

        //if the current page is greater than the total pages count; then automatically set the page to 1
        if (totalPages < pagination.page)
          pagination.page = 1, self.onPageChange();
      }
      pagination.firstObjectNumber = (pagination.page * pagination.resultsPerPage) - pagination.resultsPerPage + 1;
      pagination.lastObjectNumber = pagination.page * pagination.resultsPerPage;
      //results count change
      if (self.onResultsCountChange)
        self.onResultsCountChange();
      return self;
    },

    // NB: this code is optimized this way: the server may return bigger supsets, in order to reduce the amount of ajax calls (for example, "pages" with arrays of 500 objects),
    // then the client may display them just 30 at a time, to avoid problems related to DOM manipulation slowness.
    // gets a new array with a subset of elements of a given array, based on the page and on the results per page numbers.
    getSubSet: function (array) {
      var pagination = this.pagination;
      var from = (pagination.page - 1) * pagination.resultsPerPage, to = pagination.resultsPerPage + from;
      return array.slice(from, to);
    },

    validateForSeach: function (val) {
      //returns true if a string value should trigger a search, false otherwise.
      var minSearchChars = this.options.minSearchChars;
      if (val.match(/^[\s]+$/g) || (_.isNumber(minSearchChars) && val.length < minSearchChars)) {
        return false;
      }
      return true;
    },

    getSearchProperties: function () {
      var self = this;
      if (self.options.searchProperties)
      //the user explicitly specified the search properties
        return self.options.searchProperties;
      //if data is not initialized yet, return false; search properties will be set later
      if (!self.data)
        return false;
      //guess search properties by objects
      var f = self.data[0];
      var arr = self.options.searchProperties = self.objAnalyzer.guessSearchableProperties(f);
      return _.reject(arr, function (name) {
        //
        //reject those columns that, by configuration, do not allow search
        //
        var col = _.find(self.columns, function (a) {
          return a.name == name;
        });
        if (col && col.allowSearch == false) return true;
        return false;
      });
    },

    dispose: function () {
      var self = this;
      delete self.columns;
      $(window).off("hashchange.kingtable" + self.cid);
      //trigger dispose event
      self.trigger("dispose");
      return self;
    },

    ensureSearchFilter: function () {
      var s = this.pagination.search;
      if (s && !this.filters.getRuleByKey("search"))
        this.setSearchFilter(s);
      return this;
    },

    setSearchFilter: function (val) {
      var self = this;
      if (!self.pagination) self.pagination = {};
      self.pagination.search = val;
      var searchProperties = self.getSearchProperties();
      if (searchProperties && searchProperties.length) {
        self.filters.set({
          type: "search",
          key: "search",
          value: val,
          searchProperties: searchProperties,
          searchMode: self.options.searchMode
        });
      }
      return self;
    },

    onSearchStart: function (search) {
      if (this.options.useQueryString) {
        //remove the search from the query string
        this.query.set(this.options.searchQueryString, search);
      }
      return this;
    },

    onSearchEmpty: function () {
      //remove rule from the filters manager
      var self = this;
      self.filters.removeRuleByKey("search");
      if (self.options.useQueryString) {
        //remove the search from the query string
        self.query.set(self.options.searchQueryString, "");
      }
      self.pagination.search = "";
      return self;
    },

    /**
     * Sorts the table by a column property
     * @param column object
     */
    sortBy: function (col) {
      //if the table is fixed; we can sort client side
      var self = this,
          pag = self.pagination,
          currentOrderBy = pag.orderBy,
          currentSort = pag.sortOrder,
          sortOrder = (currentOrderBy == col.name && currentSort == "asc") ? "desc" : "asc";
      //set sort oder
      pag.orderBy = col.name;
      pag.sortOrder = sortOrder;
      self.refresh();
      return this;
    },
    
    getKey: function (key) {
      if (typeof location != "undefined")
        return location.pathname + key;
      return key;
    },
    
    saveColumnsOrder: function () {
      var self = this,
        order = _.map(self.columns, function (o) {
          return o.name;
        });
      self.setMemory("columnsOrderStorageKey", self.json(order));
      return self;
    },

    getExportFileName: function (format) {
      return _.result(this.options, "collectionName", "data") + "." + format;
    },

    getColumnsForExport: function () {
      var columns = this.columns;
      return this.options.exportHiddenProperties
        ? columns
        : _.reject(columns, function (o) {
          return o.hidden || o.secret;
        });
    },

    /**
     * Optimizes a collection; making its structure smaller by removing the property names.
     * @param data
     */
    optimizeCollection: function (data) {
      var columns = this.getColumnsForExport(),
        a = [_.map(columns, function (o) {
        return o.displayName;
      })], len = "length", push = "push";
      for (var i = 0, l = data[len]; i < l; i++) {
        var b = [];
        for (var k = 0, j = columns[len]; k < j; k++) {
          var colname = columns[k].name;
          if (data[i].hasOwnProperty(colname))
            b[push](data[i][colname]);
        }
        a[push](b);
      }
      return a;
    },

    /**
     * Exports the current collection to the given format.
     * @param format
     */
    exportTo: function (format) {
      if (!format) throw "missing format";
      var self = this, options = self.options;
      var filename = self.getExportFileName(format),
        exportFormat = _.find(self.options.exportFormats, function (o) {
          return o.format === format;
        }),
        columns = self.getColumnsForExport();
      if (!exportFormat || !exportFormat.type) throw "missing format information";
      self.getItemsToDisplay().done(function (itemsToDisplay) {
        itemsToDisplay = _.map(itemsToDisplay, function (o) {
          return _.pick(o, _.map(columns, function (c) { return c.name; }));
        });
        var contents = "";
        if (exportFormat.handler) {
          //user defined handler
          contents = exportFormat.handler.call(self, itemsToDisplay);
        } else {
          //use default export handlers
          switch (format) {
            case "csv":
              var data = self.optimizeCollection(itemsToDisplay);
              contents = Csv.serialize(data, options.csvOptions);
              break;
            case "json":
              contents = JSON.stringify(itemsToDisplay, 2, 2);
              break;
            case "xml":
              contents = self.dataToXml(itemsToDisplay);
              break;
            default:
              throw "export format " + format + "not implemented";
          }
        }
        if (contents)
          FileUtil.exportfile(filename, contents, exportFormat.type);
      });
    },

    /**
     * Basic function to convert the given data into an xml structure.
     */
    dataToXml: function (data) {
      var self = this,
        columns = self.getColumnsForExport(),
        options = self.options,
        len = "length",
        d = document,
        s = new XMLSerializer(),
        createElement = "createElement",
        appendChild = "appendChild",
        root = d[createElement](options.collectionName || "collection");
      for (var i = 0, l = data[len]; i < l; i++) {
        var item = d[createElement](options.entityName || "item");
        for (var k = 0, j = columns[len]; k < j; k++) {
          var col = columns[k], name = col.name, value = data[i][name];
          if (options.entityUseProperties) {
            //use properties
            item.setAttribute(name, value);
          } else {
            //use elements
            var subitem = d[createElement](name);
            subitem.innerText = value;
            item[appendChild](subitem);
          }
        }
        root[appendChild](item);
      }
      var xml = s.serializeToString(root);
      return options.prettyXml ? Xml.pretty(xml) : Xml.normal(xml);
    }
  });

  return KingTable;
});
/**
 * jQuery-KingTable, a jQuery plugin for administrative tables that are able to build themselves,
 * on the basis of their input data.
 * https://github.com/RobertoPrevato/jQuery-KingTable
 *
 * Copyright 2016, Roberto Prevato
 * http://ugrose.com
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
R("jquery-kingtable", ["kingtable-core"], function (KingTable) {
  //
  // The core business logic is abstracted from jQuery:
  // this file acts as a connector between the core object and jQuery library.
  //
  $.KingTable = KingTable;

  //jQuery methods
  var methods = {
    init: function (data) {
      if (!data)
        throw new Error("missing options to set up a king table");

      var table = new KingTable(_.extend({
        $el: $(this)
      }, data));
      this.data("kingtable", table);
      table.render();
      return this;
    },
    collection: function () {
      var kt = this.data("kingtable");
      if (kt) kt.data;
      return []
    },
    dispose: function () {
      var kt = this.data("kingtable");
      if (kt) kt.dispose();
      return this
    }
  };

  $.fn.kingtable = function (method) {
    if (!this.length)
      return this;
    if (methods[method])
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    else if (typeof method === "object" || !method)
      return methods.init.apply(this, arguments);
    else
      $.error("Method \"" + method + "\" does not exist on jQuery-KingTable.");
  };
});
/**
 * jQuery-KingTable Lodash connector.
 * https://github.com/RobertoPrevato/jQuery-KingTable
 *
 * Copyright 2016, Roberto Prevato
 * http://ugrose.com
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
R("kingtable-lodash", ["kingtable-core", "menu", "i18n"], function (KingTable, Menu, I) {
  //
  //  Extends jQuery KingTable prototype with functions to use it with jQuery and Lodash.
  //  These functions are separated from the business logic, and contain DOM manipulation code.
  //  It is possible to define different "connector" that, following the same interface used by the business logic,
  //  use different approach to build the interface.
  //
  var baseevents = {
    "click .pagination-bar-first-page": "goToFirst",
    "click .pagination-bar-last-page": "goToLast",
    "click .pagination-bar-prev-page": "goToPrev",
    "click .pagination-bar-next-page": "goToNext",
    "click .pagination-bar-refresh": "hardRefresh",
    "change .pagination-bar-page-number": "changePage",
    "change .pagination-bar-results-select": "changeResultsNumber",
    "click .btn-advanced-filters": "toggleAdvancedFilters",
    "click .btn-clear-filters": "clearFilters",
    "click .king-table-head th": "sort",
    "click .resize-handler": "toggleColumnResize",
    "keyup .search-field": "onSearchKeyUp",
    "paste .search-field, cut .search-field": "onSearchChange",
    "click .btn-filters-wizard": "openFiltersDialog",
    "keyup .filters-region input[type='text']": "viewToModel",
    "keyup .filters-region textarea": "viewToModel",
    "change .filters-region input[type='checkbox']": "viewToModel",
    "change .filters-region input[type='radio']": "viewToModel",
    "change .filters-region select": "viewToModel",
    "keydown span[tabindex]": "checkEnter",
    "change .visibility-check": "onColumnVisibilityChange",
    "click .export-btn": "onExportClick",
    "change [name='view-type']": "onViewChange"
  };

  //extend the table default options
  _.extend(KingTable.prototype.defaults, {
    /**
     * TagName of the row element
     */
    rowTagName: "tr",
    /**
     * TagName of the head cells
     */
    headCellTagName: "th",
    /**
     * Whether to keep consistent the width of cells; once they have been rendered for the first time; or not.
     * Really useful to nicely keep the cell size when changing page; saving the time to specify the width in the css.
     */
    keepCellsWidth: true,
    /**
     * Permits to specify whether checkboxes inside the KingTable should be editable or not (TODO)
     */
    editableCheckboxes: false,
    /**
     * Allows to define additional template helpers to use with Lodash template engine
     */
    templateHelpers: null,
    /**
     * Allows to define additional event handlers
     */
    events: null,
    /**
     * Allows to define a view for advanced filters
     */
    filtersView: null,
    /**
     * Allows to define whether the advanced filters view should be
     * expandable; or always visible.
     */
    filtersViewExpandable: true,
    /**
     * Allows to specify that the filters view should be automatically displayed, upon table render.
     */
    filtersViewOpen: false,
    /**
     * Allows to define how the filters view should appear: slide | fade | none (immediate)
     */
    filtersViewAppearance: "slide",

    /**
     * View types.
     */
    views: [
      {
        name: I.t("voc.Table"),
        value: "table"
      },
      {
        name: I.t("voc.Gallery"),
        value: "gallery"
      }
    ],

    /**
     * Allows to disable any view other than table.
     */
    tableOnly: false
  });

  // modifies the default schemas
  _.extend(KingTable.Schemas.DefaultByType, {
    boolean: function (columnSchema) {
      var editable = this.editableCheckboxes;
      return {
        sortable: true,
        template: '<input class="ajax-checkbox" name="' + columnSchema.name + '" type="checkbox"{% if(' + columnSchema.name + ') {%} checked="checked"{% } %}' + (editable ? '' : ' disabled="disabled" readonly="readonly"') + ' />',
        position: 990
      };
    }
  });

  //NB: in newer versions of lodash, the template function returns a compiler function;
  //in older versions it returns directly a string
  var templateMode = typeof _.template("_", {}) == "string" ? 0 : 1;

  _.extend(KingTable.prototype, Menu.functions, {

    connectorInit: function () {
      //load the view
      var self = this,
        options = self.options,
        extraViews = options.extraViews,
        defaultView = "table",
        view = options.tableOnly ? defaultView : self.getMemory("view");
      self.view = view || defaultView;
      if (extraViews)
        options.views = options.views.concat(extraViews);

      if (!self.getViewSchema()) self.view = defaultView;
      //register a missing data event handler
      return self.on("missing-data", function () {
        //data is missing; and the table doesn't have columns info
        //this may happen when the user refreshes the page when nothing is displayed
        this.buildSkeleton().buildPagination().showEmptyView().focusSearchField();
      });
    },

    template: function (templateName, context) {
      var data = $.KingTable.Templates[templateName],
          settings = this.templateHelpers(),
          scope = _.extend({}, context, settings);
      switch (templateMode) {
        case 0:
          //legacy mode: _.template returns a string
          return _.template(data, scope);
        case 1:
          //newer mode: _.template returns a compiler function
          //is the template already compiled?
          if (_.isFunction(data))
            return data(scope);

          //compile and store template cache
          var compiler = $.KingTable.Templates[templateName] = _.template(data, settings);
          return compiler(scope);
      }
    },

    templateSafe: function (template, context) {
      var data = _.extend(context, this.templateHelpers());
      switch (templateMode) {
        case 0:
          //legacy mode: _.template returns a string
          return _.template(template, data);
        case 1:
          //newer mode: _.template returns a compiler function
          var compiler = _.template(template, data);
          return compiler(context);
      }
    },

    hardRefresh: function () {
      var self = this;
      //unset the anchor timestamp
      delete self.anchorTimestamp;
      if (self.options.firstPageOnRefresh)
        //go to first page
        self.pagination.page = 1;
      return self.storePage().refresh();
    },

    refresh: function () {
      //refresh only the pagination buttons and the table body
      return this.buildPaginationControls().buildBody();
    },

    build: function (isSynchronous) {
      var self = this;
      self.buildSkeleton()
        .buildHead()
        .buildPagination()
        .buildTools()
        .buildHead()
        .buildBody({
          nofetch: !isSynchronous
        }).focusSearchField();
      self.on("search-qs-change", function () {
        self.buildPagination().buildBody().focusSearchField();
      });
    },

    buildSkeleton: function () {
      var self = this, initialized = "skeletonInitialized";
      if (self[initialized]) return self;
      self[initialized] = true;
      var template = self.getTemplate("king-table-base");
      var html = $(template);

      if (!self.$el || !self.$el.length)
        throw new Error("KingTable: the table is not bound to any element; it must be bound to a container element.");

      var id = self.options.id;
      if (id)
        html.attr("id", id);

      var view = self.view, innertemplate = self.getTemplate("king-table-" + view, true);
      html.find(".king-table-container").html(innertemplate);

      self.$el.html(html);
      self.bindUiElements();
      return self;
    },

    focusSearchField: function () {
      var self = this;
      _.delay(function () {
        var sfield = $(".search-field").trigger("focus"),
          search = self.pagination.search;
        if (search) {
          sfield.get(0).selectionStart = search.length;
        }
      }, 50);
      return self;
    },

    buildHead: function () {
      var self = this,
        view = self.view,
        fn = "build" + view.replace(/^(.)/, function (a) {
          return a.toUpperCase();
        }) + "Head";
      if (self[fn])
        self[fn]();
      return self;
    },

    getViewSchema: function () {
      var view = this.view;
      return _.find(this.options.views, function (o) {
        return o.value === view;
      });
    },

    buildTableHead: function () {
      var self = this,
        options = self.options,
        pag = self.pagination,
        rowTagName = options.rowTagName || "tr",
        headCellTagName = options.headCellTagName || "th",
        html = "<" + rowTagName + ">",
        columns = self.columns;
      //add empty cells
      html += "<" + headCellTagName + " class=\"row-number\"></" + headCellTagName + ">";//for first row number
      if (options.detailRoute)
        html += "<" + headCellTagName + " class=\"detail-link\"></" + headCellTagName + ">";//for the go to details link
      _.each(columns, function (col) {
        if (col.hidden || col.secret) return;
        html += self.template("king-table-head-cell", _.extend(col, {
          sort: pag.orderBy == col.name ? pag.sortOrder : ""
        }));
      });
      html += "</" + rowTagName + ">";
      //set html inside the head
      self.$el.find(".king-table-head").html(html);
      if (options.keepCellsWidth) {
        //delay is intentional
        _.delay(function () {
          self.$el.find(".king-table-head th").each(function () {
            var $t = $(this), w = "width";
            if ($t.hasClass("row-number")) return;
            $t[w]($t[w]());
          });
        }, 20);
      }
      return self;
    },

    buildPagination: function () {
      var self = this;
      if (!self.options.paginationEnabled) return self;
      self.$el.find(".pagination-bar").html(self.template("pagination-bar-layout"));
      return self.buildPaginationControls().buildFiltersControls();
    },

    buildTools: function () {
      var self = this;
      var html = Menu.builder(self.tools);
      self.$el.find(".tools-region").append(html);
      return self.onToolsBuilt();
    },
    
    onToolsBuilt: function () {
      //set event handlers for the common tools:
      var self = this;
      
      //allow to sort the columns; but only if jQuery.sortable has been loaded
      if ($.fn.sortable) {
        //NB: jQuery automatically removes event handlers attached using its functions, when removing elements from the DOM.
        $("#columns-menu").sortable({
          update: function (e, ui) {
            var columns = self.columns,
              items = $(e.target).find("[name]").map(function (a, o) { return o.name; }),
              indexOf = _.indexOf,
              name = "name";
            columns.sort(function (a, b) {
              if (indexOf(items, a[name]) > indexOf(items, b[name])) return 1;
              if (indexOf(items, a[name]) < indexOf(items, b[name])) return -1;
              return 0;
            });
            
            self.saveColumnsOrder().buildHead().buildBody({
              nofetch: true
            });
          }
        });
      }
      return self;
    },

    keepFocus: function (el) {
      var focused = el.find(":focus");
      if (focused.length)
        _.defer(function () {
          el.find("[class='" + focused.attr("class") + "']").trigger("focus");
        });
      return this;
    },

    rebuild: function (el, template, context) {
      this.keepFocus(el);
      el.html(this.template(template, context));
      return this;
    },

    buildPaginationControls: function () {
      return this.rebuild(this.$el.find(".pagination-bar-buttons"), "pagination-bar-buttons", this.pagination);
    },

    buildFiltersControls: function () {
      var self = this,
          options = self.options,
          filtersView = options.filtersView,
          context = _.extend({}, self.pagination, {
            advancedFiltersButton: filtersView && options.filtersViewExpandable
          });
      //rebuild the pagination filters
      var paginationBar = self.$el.find(".pagination-bar-filters"),
          filtersRegion = self.$el.find(".filters-region");
      self.rebuild(paginationBar, "pagination-bar-filters", context);
      //check if the user defined advanced filters view
      if (filtersView) {
        var template = self.getTemplate(filtersView);
        //compile the template
        var customFilters = self.customFilters;
        var compiled = self.templateSafe(template, customFilters);
        //convert in jQuery object and assign the values
        var view = self.modelToView(customFilters, compiled);
        //allow to edit the custom filters view externally:
        if (options.onCustomFiltersRender)
          options.onCustomFiltersRender.call(self, view);
        if (!options.filtersViewExpandable || options.filtersViewOpen) {
          filtersRegion.show();
          self.customFiltersVisible = true;
        }
        self.trigger("on-filters-render", view);
        filtersRegion.html(view);
      }
      return self;
    },

    getTemplate: function (option, def) {
      var element = document.getElementById(option);
      if (element != null) {
        return element.innerText;
      }
      if ($.KingTable.Templates.hasOwnProperty(option))
        return $.KingTable.Templates[option];
      if (def) return "<div class=\"king-table-body\"></div>";
      this.raiseError("cannot obtain the template: " + option);
    },

    buildBody: function (options) {
      var self = this,
        view = self.getViewSchema();

      self.getItemsToDisplay(options).done(function (items) {
        if (!items.length)
          return self.showEmptyView();
        self.removeEmptyView();

        //if the view has a resolver function; call it directly
        if (view.resolver)
          return view.resolver.call(self, items);

        var html = "", rowTemplate = self.getItemTemplate();
        _.each(items, function (item) {
          html += self.templateSafe(rowTemplate, item);
        });
        //inject all html at once inside the table body.
        self.$el.find(".king-table-body").html(html);
      });
      return self;
    },

    removeEmptyView: function () {
      var self = this;
      var $empty = "$empty";
      if (self[$empty]) {
        self[$empty].remove();
        delete self[$empty];
      }
      return self;
    },

    showEmptyView: function () {
      var self = this, $empty = "$empty";
      if (self[$empty]) return self;
      var html = self[$empty] = $(self.templateSafe($.KingTable.Templates["king-table-empty-view"], {}));
      self.$el.find(".king-table-body").empty();
      self.$el.find(".king-table-container").append(html);
      return this;
    },

    bindUiElements: function () {
      return this
          .delegateEvents()
          .bindWindowEvents();
    },

    anyMenuIsOpen: function () {
      return !!$(".ug-menu:visible").length;
    },

    anyInputFocused: function () {
      var a = document.activeElement;
      return a && /input|select|textarea/i.test(a.tagName);
    },

    bindWindowEvents: function () {
      var self = this;
      //support moving changing page using the keyboard
      $("body").on("keydown.king-table", function (e) {
        //if any menu is open, or any input is focused, do nothing
        if (self.anyInputFocused() || self.anyMenuIsOpen()) return true;
        var kc = e.keyCode;
        //if the user clicked the left arrow, or A, go to previous page
        if (_.contains([37, 65], kc)) {
          //prev page
          self.goToPrev();
        }
        //if the user clicked the right arrow, or D, go to next page
        if (_.contains([39, 68], kc)) {
          //next page
          self.goToNext();
        }
      });
      //when the table is disposed, remove the event handler:
      self.on("dispose", function () {
        $("body").off("keydown.king-table");
      });
      //TODO: support swipe events; using HammerJs library
      return self;
    },

    /**
     * Returns a table cell with a link to a detail link.
     */
    getGoToDetailsLink: function () {
      var self = this, cellTagName = "td", options = self.options;
      var idProperty = options.getIdProperty();
      var detailRoute = options.detailRoute;
      return self.string.format("<{0} class=\"{1}\"><a href=\"{2}{{" + idProperty + "}}\"><span class=\"oi\" data-glyph=\"document\" title=\"{{I.t('voc.GoToDetailsLink')}}\" aria-hidden=\"true\"></span></a></{0}>", cellTagName, "detail-link", detailRoute);
    },

    /**
     * Gets a template to display an item; depending on the current view.
     * @returns string
     */
    getItemTemplate: function () {
      var self = this, view = self.view;
      switch (view) {
        case "table":
          return self.getTableRowTemplate();
        case "gallery":
          return self.getGalleryItemTemplate();
        default:
          var viewSchema = _.find(self.options.views, function (o) {
            return o.value == view;
          });
          if (!viewSchema) self.raiseError("The view \"" + view + "\" is not defined.");
          var getTemplate = viewSchema.getItemTemplate;
          if (!getTemplate) self.raiseError("The view \"" + view + "\" has no getItemTemplate function.");
          return getTemplate.call(self);
      }
    },

    /** 
     * Returns a built template of a table row, with cells in the proper order
     * Assumes that Columns are already ordered by Position.
     */
    getTableRowTemplate: function () {
      var sb = "",
        self = this,
        options = self.options,
        wrapperTagName = "tr",
        cellTagName = "td";

      if (!self.columnsInitialized)
        self.initializeColumns();

      sb += "<" + wrapperTagName + ">";
      if (options.rowCount) {
        sb += self.string.format("<{0} class=\"row-number\">{{rowCount}}</{0}>", cellTagName);
      }
      
      if (options.detailRoute) {
        sb += self.getGoToDetailsLink();
      }

      var searchRule = self.filters.getRuleByKey("search");
      for (var i = 0, l = self.columns.length; i < l; i++) {
        //skip hidden columns
        var column = self.columns[i];
        if (column.hidden || !column.template) continue;

        //super smart table
        if (column.allowSearch) {
          var looksOkForSearch = self.doesTemplateLookSearchable(column);
          if (!looksOkForSearch) column.allowSearch = false;
        }

        var propertyToUse = _.contains(self.columns.formatted, column.name) ? (column.name + self.options.formattedSuffix) : column.name;
        sb += "<" + cellTagName + ">";

        //automatic highlight of searched properties: if the column template contains the $highlight function;
        //the programmer is specifying the template, so don't interfere!
        if (searchRule && options.autoHighlightSearchProperties && column.allowSearch && !/\$highlight/.test(column.template)) {
          //automatically highlight the searched property, if it contains any match
          sb += '{%print($highlight(' + propertyToUse + '))%}';
        } else {
          //use the column template
          sb += column.template;
        }
        sb += "</" + cellTagName + ">";
      }

      sb += "</" + wrapperTagName + ">";

      var template = sb;
      return template;
    },

    /**
     * Returns a built template of a table item.
     * Assumes that Columns are already ordered by Position.
     */
    getGalleryItemTemplate: function () {
      var sb = "",
        self = this,
        options = self.options,
        wrapperTagName = "li",
        cellTagName = "span";
      if (!self.columnsInitialized)
        self.initializeColumns();

      sb += self.string.format("<{0}>", wrapperTagName);
      if (options.rowCount) {
        sb += self.string.format("<{0} class=\"item-number\">{{rowCount}}</{0}>", cellTagName);
      }

      var searchRule = self.filters.getRuleByKey("search");
      for (var i = 0, l = self.columns.length; i < l; i++) {
        //skip hidden columns
        var column = self.columns[i];
        if (column.hidden || !column.template) continue;

        //super smart table
        if (column.allowSearch) {
          var looksOkForSearch = self.doesTemplateLookSearchable(column);
          if (!looksOkForSearch) column.allowSearch = false;
        }

        var propertyToUse = _.contains(self.columns.formatted, column.name) ? (column.name + self.options.formattedSuffix) : column.name;

        sb += "<" + cellTagName + " title=\""  + self.sanitizer.escape(column.displayName) + "\">";
        //automatic highlight of searched properties: if the column template contains the $highlight function;
        //the programmer is specifying the template, so don't interfere!
        if (searchRule && options.autoHighlightSearchProperties && column.allowSearch && !/\$highlight/.test(column.template)) {
          //automatically highlight the searched property, if it contains any match
          sb += '{%print($highlight(' + propertyToUse + '))%}';
        } else {
          //use the column template
          sb += column.template;
        }
        sb += "</" + cellTagName + ">";
      }
      sb += "</" + wrapperTagName + ">";
      return sb;
    },

    /**
     * Returns true if the column template looks like as if it allow
     * to highlight the property value, false otherwise.
     * The table is smart and doesn't break the template of those columns like pictures or anchor tags.
     * @param column
     * @returns {boolean}
     */
    doesTemplateLookSearchable: function (column) {
      //if the template contains the $highlight function;
      //the programmer is specifying the template, so don't interfere
      if (/\$highlight/.test(column.template)) return true;
      var property = column.name;
      var rx = new RegExp("(src|href)=['\"].*{{" + property + "}}.*['\"]");
      return column.template.search(rx) == -1;
    },

    //
    //generates a dynamic definition of events to bind to elements
    //if passing events option when defining the dataentry, there is a base automatically added
    getEvents: function () {
      var events = this.events || {};
      if (_.isFunction(events)) events = events.call(this);
      //extends events object with validation events
      return _.extend({}, baseevents, events, this.options.events);
    },

    // delegate events
    delegateEvents: function () {
      var self = this,
        events = self.getEvents(),
        delegateEventSplitter = /^(\S+)\s*(.*)$/;
      self.undelegateEvents();
      for (var key in events) {
        var val = events[key],
          method = val;
        if (!_.isFunction(method)) method = self[method];
        if (!method && self.options.hasOwnProperty(val))
          // try to read from options
          method = self.options[val];
        
        if (!method) throw new Error("method not defined inside the model: " + events[key]);
        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, self);
        eventName += '.delegate';
        if (selector === '') {
          self.$el.on(eventName, method);
        } else {
          self.$el.on(eventName, selector, method);
        }
      }
      return self;
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`
    undelegateEvents: function () {
      this.$el.off('.delegate');
      return this;
    },

    changePage: function (e) {
      var val = parseInt(e.currentTarget.value),
        self = this,
        currentPage = self.pagination.page;
      if (!self.validPage(val)) {
        //revert to previous value
        e.currentTarget.value = currentPage;
      } else {
        self.pagination.page = val;
        self.onPageChange();
      }
    },

    changeResultsNumber: function (e) {
      var val = parseInt(e.currentTarget.value),
        pagination = this.pagination;
      pagination.resultsPerPage = val;
      //set total page number
      pagination.totalPageCount = this.getPageCount(pagination.totalRowsCount, val);
      this.onResultsPerPageChange();
      this.buildPaginationControls().buildBody();
    },

    onPageChange: function () {
      this.storePage().buildPaginationControls().buildBody();
    },

    sort: function (e) {
      var el = $(e.currentTarget),
          ic = el.find(".oi"),
          colid = el.data("id"),
          col = _.find(this.columns, function (o) {
            return o.cid == colid;
          });
      if (!col || !col.sortable)
        return true;//do nothing

      //remove sort icon from other columns
      el.siblings().find(".oi").attr("data-glyph", "");
      var sortOrder = ic.attr("data-glyph") == "sort-ascending" ? "desc" : "asc";
      ic.attr("data-glyph", "sort-" + sortOrder + "ending");
      //sort collection by
      this.sortBy(col);
    },

    onFetchStart: function () {
      //displays a preloader into the table; but only if the requests last more than 300 ms
      this.showPreloader();
    },

    onFetchEnd: function () {
      this.hidePreloader();
    },

    onFetchDone: function () {
      //fetch success
      var self = this, $error = "$error";
      if (self[$error]) {
        self[$error].remove();
        delete self[$error];
      }
    },

    onFetchError: function () {
      var self = this, $error = "$error";
      if (self[$error]) return self;
      var html = self[$error] = $(self.templateSafe($.KingTable.Templates["king-table-error-view"], {
        message: I.t("voc.ErrorLoadingContents")
      }));
      self.$el.find(".king-table-body").empty();
      self.$el.find(".king-table-container").append(html);
    },

    toggleColumnResize: function (e) {
      var self = this, $el = $(e.currentTarget).closest("th");
      if (self.mode == "col-resize") {
        self.unsetMode();
        return false;
      }
      self.mode = "col-resize";
      self.unsetMode = self.stopResize;
      //track mouse move
      var pos = $el.position();
      self.$el
        .css({
          cursor: "col-resize"
        }).on("mousemove.resize", function (e) {
          if (e.clientX - 10 < pos.left) return;
          var newWidth = e.clientX - pos.left;
          if (newWidth < 0) newWidth = 0;
          $el.width(newWidth);
          //TODO: save width as a preference inside the local storage (low priority)
        });

      _.delay(function () {
        //bind one time event handler for document mouseup
        $(document).one("mouseup.resize", function () {
          self.stopResize();
          return false;
        });
      }, 50);
      return false;
    },

    stopResize: function () {
      this.mode = "";
      this.$el.css({ cursor: "default" }).off("mousemove.resize");
      $(document).off("mouseup.resize");
      return this;
    },

    getSearchHandler: function () {
      //gets a search handler to start a search
      //by design and intentionally, the search is lazy (it starts few milliseconds after the user stops typing into the search field)
      return _.debounce(function searchCore(field) {
        if (!field) return;
        var val = _.isString(field) ? field : field.val();
        var self = this;
        if (self.validateForSeach(val)) {
          //add filters inside the filters manager
          if (val.length === 0) {
            //remove filter
            self.onSearchEmpty();
            self.filters.removeRuleByKey("search");
          } else {
            self.onSearchStart(val);
            self.setSearchFilter(val);
          }
          //set page to first
          self.pagination.page = 1;
          self.refresh();
        } else {
          //value is not valid for search: remove the rule by key
          self.onSearchEmpty();
          self.filters.removeRuleByKey("search");
          self.refresh();
        }
      }, this.options.searchDelay);
    },

    validateSearchEventKey: function (e) {
      //returns true if the event keycode is meaningful to trigger a search, false otherwise
      var c = e.keyCode ? e.keyCode : e.charCode;
      var codesToIgnore = [
        9,  //tab
        13, //enter
        16, //shift
        17, //ctrl
        18, //alt
        20, //caps lock
        27, //esc
        33, //pageUp
        34, //pageDown
        35, //end
        36, //beginning
        37, //left
        38, //top
        39, //right
        40, //down
        91  //windows
      ];
      //ignore certains keys
      for (var i = 0, l = codesToIgnore.length; i < l; i++) {
        if (c == codesToIgnore[i]) return false;
      }
      return true;
    },

    onSearchKeyUp: function (e) {
      var el = $(e.currentTarget),
        self = this;

      if (el.hasClass("ui-disabled")) return true;
      //does the field has a value?
      if (!el.val()) {
        self.onSearchEmpty();
      }
      //should the key event trigger a search?
      if (self.validateSearchEventKey(e)) {
        //event character is valid, go on
        self.searchCore(el);
      }
      return true;
    },

    onResultsCountChange: function () {
      return this.buildPaginationControls();
    },

    onSearchChange: function (e) {
      var el = $(e.currentTarget), self = this;
      _.delay(function () {
        self.searchCore(el);
      }, 50);
    },

    showPreloader: function (delay) {
      if (!_.isNumber(delay)) delay = 300;
      var self = this;
      self.unsetDelayedPreloader();
      self.cache.delayedpreloader = window.setTimeout(function () {
        if (!self.cache.delayedpreloader)
          return;
        var n = "king-table-preloader",
            preloader = $($.KingTable.Templates[n]).addClass(n);
        self.$el.find(".king-table-container").append(preloader);
      }, delay);
    },

    hidePreloader: function () {
      var self = this;
      self.unsetDelayedPreloader();
      self.$el.find(".king-table-container .king-table-preloader").remove();
    },

    unsetDelayedPreloader: function () {
      var cache = this.cache, prop = "delayedpreloader";
      if (cache[prop]) {
        window.clearTimeout(cache[prop]);
        delete cache[prop];
      }
      return this;
    },

    //template helpers to build html with UnderscoreJs template function
    templateHelpers: function () {
      //use the following template settings; without overriding local settings
      var templateSettings = {
        escape: /\{\{(.+?)\}\}/g,
        evaluate: /\{%(.+?)%\}/g,
        interpolate: /\{#(.+?)#\}/g
      };
      var self = this,
          searchRule = self.filters.getRuleByKey("search"),
          pattern = searchRule ? new RegExp("(" + $.KingTable.Utils.Regex.escapeCharsForRegex(searchRule.value) + ")", "gi") : null;
      return _.extend({
        $i: function (key) { return I.t(key); },
        $highlight: function (s) {
          if (!s) return "";
          if (!pattern) return s;
          if (typeof s != "string") s = s + "";
          return s.replace(pattern, "<span class=\"ui-search-highlight\">$1</span>");
        },
        $hyphenize: function (s) {
          if (!s) return "";
          return self.string.hyphenize(s);
        },
        $relwidth: function (origWidth, origHeight, relHeight) {
          var ratio = relHeight / origHeight;
          return Math.ceil(ratio * origWidth);
        },
        $relheight: function (origWidth, origHeight, relWidth) {
          var ratio = relWidth / origWidth;
          return Math.ceil(ratio * origHeight);
        },
        $attr: function (item) {
          var stringempty = "";
          if (!item) return stringempty;
          var attr = item.attr;
          if (!attr) return stringempty;
          var f = "", sep = "\"";
          for (var x in attr) {
            f += x + "=" + sep + attr[x] + sep;
          }
          return f;
        }
      }, self.options.templateHelpers, templateSettings);
    },

    openFiltersDialog: function () {
      //TODO
    },

    unsetValues: function (element) {
      element.find("input[type='text'],textarea,select").val("");
      element.find("input[type='checkbox'],input[type='radio']").each(function () {
        this.checked = false;
      });
      return this;
    },

    setValueInElement: function (input, val) {
      if (!input) return this;
      if (!input instanceof $) input = $(input);
      
      input.each(function () {
        var element = this, 
          field = $(element),
          type = element.type;
        
        switch (element.tagName.toLowerCase()) {
          case "input":
            if (type == "checkbox") {
              element.checked = val ? true : false;
            } else if (type == "radio") {
              element.checked = val == element.value;
            } else {
              field.val(val);
            }
          break;
          default:
            //textarea; select
            field.val(val);
          break;
        }
        
      });
      return this;
    },
    
    //provides automatic binding from a context to a view
    modelToView: function (context, view) {
      if (_.isString(view)) view = $("<div>" + view + "</div>");
      var x, self = this, schema = self.schema;
      for (x in context) {
        var fields = view.find("[name=\"" + x + "\"]");
        if (fields.length) {
          self.setValueInElement(fields, context[x]);
        }
      }
      return view;
    },
    
    // provides automatic binding from form inputs to the model for filters
    viewToModel: function (e) {
      var self = this,
        element = e.currentTarget,
        type = element.type,
        field = $(element),
        value,
        name = field.attr("name");
      if (!name || field.hasClass("search-field")) return;
      if (type == "checkbox") {
        value = element.checked;
      } else {
        value = field.val();
      }
      //set the value inside the pagination filters
      var a = "customFilters";
      if (!self[a]) self[a] = {};
      self[a][name] = value;
      
      if (self.fixed) {
        //filtering must be done client side.
        self.tryApplyClientSideFilter(name, value);
      }
      if (self.options.useQueryString) {
        //set the filter inside the query string
        self.query.set(name, value);
      }
      
      if (self.options.autorefresh) {
        self.refresh();
      }
    },

    tryApplyClientSideFilter: function (name, value) {
      if (_.isUndefined(value) || _.isNull(value)) {
        return this.filters.removeRuleByKey(name);
      }
      var self = this,
        filters = self.options.filters;
      if (!filters) 
        throw "KingTable: missing filtering functions for a fixed table.";
      var filter = filters[name];
      if (!filter) 
        throw "KingTable: missing filter definition for: " + name;
      if (_.isFunction(filter)) {
        self.filters.set({
          type: "fn",
          key: name,
          value: value,
          fn: filter
        });
      } else if (_.isPlainObject(filter)) {
        self.filters.set(_.extend({
          key: name,
          value: value
        }, filter));
      } else {
        throw "KingTable: invalid filter definition for: " + name;
      }
      return self;
    },
    
    toggleAdvancedFilters: function () {
      var self = this, el = self.$el.find(".filters-region");
      if (self.customFiltersVisible) {
        self.customFiltersVisible = false;
        //hide
        el.hide();
      } else {
        self.customFiltersVisible = true;
        //show
        el.show();
      }
    },

    /**
     * Default function to clear the filters view.
     */
    clearFilters: function () {
      var self = this,
          el = self.$el.find(".filters-region");
      var possibleValues = el.find("input[name]").map(function (i, o) { return o.name; });
      _.each(possibleValues, function (o) {
        self.query.set(o, "");
        self.filters.removeRuleByKey(o);
      });
      self.unsetValues(el);
      self.refresh();
    },

    checkEnter: function (e) {
      var l = $(e.currentTarget);
      if (!l.is(":visible")) return;
      if (e.which == 13) {
        l.click(); //trigger click on the element
      }
    },
    
    /**
     * Column visibility checkbox, change event handler
     */
    onColumnVisibilityChange: function (e) {
      var self = this,
        element = e.currentTarget,
        name = element.name,
        col = _.find(self.columns, function (o) {
          return o.name === name;
        });
      if (col) {
        col.hidden = !element.checked;
      }
      return self.buildHead().buildBody({
        nofetch: true
      });
    },

    onExportClick: function (e) {
      var el = $(e.currentTarget),
        format = el.data("format");
      if (!format) throw "missing [data-format]";
      this.exportTo(format);
    },

    /**
     * Returns the tools for the supported views.
     * @returns {*}
     */
    getViewTools: function () {
      var self = this,
        views = self.options.views,
        currentView = self.view;
      if (!views || views.length < 2 || self.options.tableOnly) return null;
      //normalize
      _.each(views, function (o) {
        if (!o.value) self.raiseError("view missing [value]");
        _.extend(o, {
          attr: {
            name: "view-type"
          },
          checked: o.value == currentView,
          type: "radio"
        });
      });
      return {
        name: I.t("voc.View"),
        menu: {
          items: views
        }
      }
    },

    onViewChange: function (e) {
      this.setView(e.currentTarget.value);
    },

    setView: function (view) {
      var self = this;
      self.view = view;
      //change the body container
      var template = self.getTemplate("king-table-" + view, true);
      //remember the choice
      self.setMemory("view", view);
      //replace the body element
      self.$el.find(".king-table-container").html(template);
      if (!self.$el.find(".king-table-body").length)
        self.raiseError("The custom view " + view + " doesn't include an element with class 'king-table-body'");
      return self.trigger("view:change", view)
        .buildHead()
        .buildBody({ nofetch: true });
    }

  });
});
//
//Knight generated templates file.
// * 
// * Templates for the jQuery-KingTable Lodash connector
// * 
//
if (!$.KingTable.Templates) $.KingTable.Templates = {};
(function (templates) {
  var o = {
    'king-table-preloader': '<div class="preloader-mask"> <div class="preloader-icon"></div> </div>',
    'king-table-gallery': '<div class="king-table-gallery"> <ul class="king-table-body"></ul> <br class="break" /> </div>',
    'king-table-table': '<table class="king-table"> <thead class="king-table-head"></thead> <tbody class="king-table-body"></tbody> </table>',
    'king-table-empty-view': '<div class="king-table-empty"> <span>{{$i("voc.NoResults")}}</span> </div>',
    'king-table-head-cell': '<th data-id="{{cid}}" class="{{$hyphenize(name)}}{% if (obj.sortable) { %} sortable{%}%}"> {% if (name) { %} <div> <span>{{displayName}}</span> <span class="oi" data-glyph="{% if (obj.sort) { %}sort-{{obj.sort}}ending{%}%}" aria-hidden="true"></span> {% if (obj.resizable) { %} <span class="resize-handler"></span> {% } %} </div> {% } %} </th>',
    'king-table-empty-cell': '<th></th>',
    'king-table-base': '<div class="king-table-region"> <div class="pagination-bar"></div> <div class="filters-region"></div> <div class="king-table-container"></div> </div>',
    'king-table-error-view': '<div class="king-table-error"> <span class="message"> <span>{{message}}</span> <span class="oi" data-glyph="warning" aria-hidden="true"></span> </span> </div>',
    'pagination-bar-buttons': '{% if (page > firstPage) { %} <span tabindex="0" class="pagination-button pagination-bar-first-page oi" data-glyph="media-step-backward" title="{{$i(\'voc.FirstPage\')}}"></span> <span tabindex="0" class="pagination-button pagination-bar-prev-page oi" data-glyph="caret-left" title="{{$i(\'voc.PrevPage\')}}"></span> {% } else { %} <span class="pagination-button-disabled pagination-bar-first-page-disabled oi" data-glyph="media-step-backward"></span> <span class="pagination-button-disabled pagination-bar-prev-page-disabled oi" data-glyph="caret-left"></span> {% } %} <span class="separator"></span> <span class="valigned">{{$i(\'voc.Page\')}} </span> {% if (totalPageCount > 1) { %} <input name="page-number" text="text" class="w30 must-integer pagination-bar-page-number" value="{{page}}" /> {% } else { %} <span class="valigned pagination-bar-page-number-disabled">{{page}}</span> {% } %} <span class="valigned total-page-count"> {{$i(\'voc.of\')}} {{totalPageCount}}</span> <span class="separator"></span> <span tabindex="0" class="pagination-button pagination-bar-refresh oi" data-glyph="reload" title="{{$i(\'voc.Refresh\')}}"></span> <span class="separator"></span> {% if (page < totalPageCount) { %} <span tabindex="0" class="pagination-button pagination-bar-next-page oi" data-glyph="caret-right" aria-expanded="true" title="{{$i(\'voc.NextPage\')}}"></span> <span tabindex="0" class="pagination-button pagination-bar-last-page oi" data-glyph="media-step-forward" title="{{$i(\'voc.LastPage\')}}"></span> {% } else { %} <span class="pagination-button-disabled pagination-bar-next-page-disabled oi" data-glyph="caret-right"></span> <span class="pagination-button-disabled pagination-bar-last-page-disabled oi" data-glyph="media-step-forward"></span> {% } %} <span class="separator"></span> <span class="valigned">{{$i(\'voc.ResultsPerPage\')}}</span> {% if (totalRowsCount) { %} <select name="pageresults" class="pagination-bar-results-select valigned"{% if (totalRowsCount <= 10) { %} disabled="disabled"{% } %}> {% _.each(resultsPerPageSelect, function (val) { %} <option value="{{val}}"{% if (val == resultsPerPage) { %} selected="selected"{%}%}>{{val}}</option> {% }) %} </select> {% } else { %} <select name="pageresults" class="pagination-bar-results-select valigned" disabled="disabled" readonly="readonly"></select> {% } %} <span class="separator"></span> <span class="valigned m0"> {% if (totalRowsCount) { %} {{$i(\'voc.Results\')}} {{firstObjectNumber}} - {{Math.min(lastObjectNumber, totalRowsCount)}} {{$i(\'voc.of\')}} {{totalRowsCount}} {% } else { %} 0 Results {% } %} </span> <span class="separator"></span>',
    'pagination-bar-filters': '{% if (allowSearch) { %} <input type="text" class="search-field" value="{{search}}" /> {% } %} {% if (advancedFiltersButton) { %} <button class="btn camo-btn btn-advanced-filters">{{$i("voc.AdvancedFilters")}}</button> {% } %} {% if (filtersWizard) { %} <button class="btn btn-filters-wizard">{{$i("voc.Filters")}}</button> {% } %}',
    'pagination-bar-layout': '<div class="tools-region"> <span tabindex="0" class="oi ug-expander" data-glyph="cog"></span> </div> <span class="pagination-bar-buttons"></span> <span class="pagination-bar-filters"></span>'
  };
  var x;
  for (x in o) {
    templates[x] = o[x];
  }
})($.KingTable.Templates);