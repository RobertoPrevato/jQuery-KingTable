/**
 * jQuery-KingTable.
 * https://github.com/RobertoPrevato/jQuery-KingTable
 *
 * Copyright 2017, Roberto Prevato
 * https://robertoprevato.github.io
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
R("kt-array-search", ["kt-string", "kt-reflection"], function (StringUtils, Reflection) {
  
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


