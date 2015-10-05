/*
 * I.js, simple helper to manage localized strings.
 * https://github.com/RobertoPrevato/jQuery-DataEntry
 *
 * Copyright 2015, Roberto Prevato
 * http://ugrose.com
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
var I = {

  //default locale
  locale: "en",

  current: function () {
    return this.regional[this.locale];
  },

  setLocale: function (locale) {
    this.locale = locale;
    //add to body
    for (var x in this.regional)
      $("body").removeClass(x.toLowerCase());
    $("body").addClass(locale.toLowerCase());
  },

  regional: {},

  //function to return localized strings
  t: function (key, options) {
    options = options || {};
    if (!this.regional[this.locale]) return ["Missing regional for: ", this.locale].join("");
    var w = "", o = this.regional[this.locale], parts = key.split(/\./g);
    while (w = parts.shift()) {
      if (!o) return ["Missing translation for: ", key].join("");
      o = o[w];
    }
    if (o) {
      if (typeof o == "object") return o;
      return o;
    }
    return ["Missing translation for: ", this.locale, ".", key].join("");
  },

  lookup: function (key) {
    //returns true if the
    if (!this.regional[this.locale]) return ["Missing regional for: ", this.locale].join("");
    var w = "", o = this.regional[this.locale], parts = key.split(/\./g);
    while (w = parts.shift()) {
      if (!o) return false;
      o = o[w];
    }
    return typeof o != "undefined";
  },

  tryGet: function (key) {
    return this.lookup(key) ? this.t(key) : null;
  }

};