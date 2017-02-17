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
R("kt-filters-manager", ["kt-string",
                         "kt-regex",
                         "kt-array-search",
                         "kt-extend"], function (StringUtils,
                                                 RegexUtils,
                                                 ArrayUtils,
                                                 Extend) {
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
