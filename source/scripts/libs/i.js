/*!
 * I.js, simple helper to manage localized strings.
 * https://github.com/RobertoPrevato/I.js
 *
 * Copyright 2017, Roberto Prevato
 * https://robertoprevato.github.io
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
;(function(factory) {
  if (typeof module !== "undefined" && module.exports) {
    // Node/CommonJS
    module.exports = factory(this);
  } else if (typeof define === "function" && define.amd) {
    // AMD
    var global=this;
    define("i", function(){ return factory(global);});
  } else {
    // Browser globals
    this.I = factory(this);
  }
}(function(global) {

  var I = {
    /**
     * Default locale
     */
    locale: "en",

    /**
     * Returns the current locale;
     * @returns {*}
     */
    current: function () {
      return this.regional[this.locale];
    },

    /**
     * Sets the current locale to the given key.
     * Adds the same key as a class, to the body element.
     * @param locale
     */
    setLocale: function (locale) {
      this.locale = locale;
      //add to body
      if (typeof document !== und) {
        var bodyclasses = document.body.classList;
        for (var x in this.regional) {
          bodyclasses.remove(lower(x));
        }
        bodyclasses.add(lower(locale));
      }
    },

    /**
     * Bag, where translations should be stored.
     * @examples
     * I.regional = {
     *   "en": {
     *      "voc": {
     *        "Hi": "Hi"
     *      }
     *   },
     *   "it": {
     *     "voc": {
     *       "Hi": "Ciao"
     *     }
     *   }
     * };
     *
     * I.locale = "en";
     * I.t("voc.Hi") --> "Hi"
     *
     * I.locale = "it";
     * I.t("voc.Hi") --> "Ciao"
     */
    regional: {},

    /**
     * Regular expression used to replace parameters.
     */
    rx: /\{\{(.+?)\}\}/g,

    /**
     * Function to return localized strings, from scoped properties
     * @param key a scoped property, to read from I.regional.current_locale object
     * @param options
     * @returns string
     * @examples
     * I.t("voc.Hi") --> "Ciao", if current locale is it and I.regional.it.voc.Hi == "Ciao";
     */
    t: function (key, options) {
      var locale = this.locale, regional = this.regional;
      if (!regional[locale]) return [missingRegional, locale].join(stringEmpty);
      var w = stringEmpty,
        o = regional[locale],
        parts = key.split(/\./g);
      while (w = parts.shift()) {
        if (!o) return [missingTranslation, key].join(stringEmpty);
        o = o[w];
      }
      if (o) {
        if (typeof o == "object") return o;
        //compile, if there are options
        if (options && typeof o == "string") {
          return o.replace(this.rx, function (s, a) {
            if (!options.hasOwnProperty(a))
              throw "Missing property " + a + ", for template: " + key;
            return options[a];
          });
        }
        return o;
      }
      return [missingTranslation, locale, ".", key].join(stringEmpty);
    },

    /**
     * Returns true if the given key is defined inside the I.regional.current_locale object; false otherwise
     * @param key
     * @returns boolean
     */
    lookup: function (key) {
      //returns true if the
      var locale = this.locale, regional = this.regional;
      if (!regional[locale]) return [missingRegional, locale].join(stringEmpty);
      var w = stringEmpty, o = regional[locale], parts = key.split(/\./g);
      while (w = parts.shift()) {
        if (!o) return false;
        o = o[w];
      }
      return typeof o != und;
    },

    /**
     * Tries to get a localized text, from a scoped key; returns null if not available.
     * @param key
     * @returns {string}
     */
    tryGet: function (key) {
      return this.lookup(key) ? this.t(key) : null;
    }
  };
  var lower = function (s) { return s.toLowerCase(); };
  var und = "undefined";
  var stringEmpty = "";
  var missingRegional = "Missing regional for: ";
  var missingTranslation = "Missing translation for: ";
  return I;
}));
