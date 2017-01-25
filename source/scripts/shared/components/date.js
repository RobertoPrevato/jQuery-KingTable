//
// Date utilities
//
R("kt-date", [], function () {

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
   /**
    * Returns a value indicating whether the given date includes a time component or not.
    */
    hasTime: function (a) {
      if (!a) return false;
      return _.any([a.getMinutes(), a.getSeconds(), a.getHours()], function (o) { return o > 0; });
    },
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


