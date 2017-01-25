//
// string utilities
//
R("kt-string", [], function () {
  
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


