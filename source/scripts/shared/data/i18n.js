//
// Returns a common interface for internazionalization, supporting scoped translations.
//
R("kt-i18n", [], function () {
  //if I.js is defined; return it.
  //https://github.com/RobertoPrevato/I.js
  if (window["I"]) return window.I;

  //if i18n is defined; return it.
  //https://github.com/fnando/i18n-js
  if (window["I18n"]) return window.I18n;

  //throw exception
  throw "Missing implementation of i18n. Please refer to https://github.com/RobertoPrevato/jQuery-KingTable/wiki/Implementing-localization";
});
