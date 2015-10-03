//common libraries setup
+function () {
    
    document.get = document.getElementById;
    
    //lodash template settings
  _.extend(_.templateSettings, {
        escape: /\{\{(.+?)\}\}/g,
        evaluate: /\{%(.+?)%\}/g,
        interpolate: /\{#(.+?)#\}/g
    });
    
}();
