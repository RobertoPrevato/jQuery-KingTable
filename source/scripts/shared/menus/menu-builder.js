//
// Function to build menus, given a schema
//
R("kt-menu-builder", [], function () {

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
            a += "<span tabindex=\"0\"" + attr(item) + ">"
            a += "<input id=\"" + cid + "\" type=\"checkbox\"" + attr(item) + checked + " />";
            a += "<label for=\"" + cid + "\">" + name + "</label>";
            a += "</span>"
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
