//
// Function to build menus, given a schema
//
R("menu-builder", [], function () {

  function attr(obj) {
    if (!obj || !obj.attr) return "";
    var a = [], sep = "\"", attr = obj.attr;
    for (var x in attr)
      a.push([x, "=", sep, attr[x], sep].join(""));
    return a.join(" ");
  };

  //TODO: MAKE EASIER THE MENU MANAGEMENT
  var menuBuilder = function (menus) {
    if (!menus) throw "missing menus";
    if (_.isPlainObject(menus)) return menuBuilder([menus]);
    var push = "push";
    var a = [], caret = "<span class=\"oi\" data-glyph=\"caret-right\"></span>";
    _.each(menus, function (menu) {
      a[push]("<ul class=\"ui-menu\">");

      _.each(menu.items, function (item) {
        var hasSubmenu = item.menu,
          type = item.type,
          href = item.href,
          name = item.name;
        a[push]("<li" + (hasSubmenu ? " class=\"ui-submenu\">" : ">"));

        //TODO: SUPPORT FOR ICONS; AND SORTABLE LISTS!
        switch (type) {
          case "checkbox":
            var cid = _.uniqueId("mnck-");
            var checked = item.checked ? " checked=\"checked\"" : "";
            a[push]("<input id=\"" + cid + "\" type=\"checkbox\"" + attr(item) + checked +" />");
            a[push]("<label for=\"" + cid + "\">" + name + "</label>");
            break;
          case "radio":
            if (!item.value) throw "missing value for radio";
            var cid = _.uniqueId("mnrd-");
            a[push]("<input id=\"" + cid + "\" type=\"radio\" value=\"" + item.value + "\"" + attr(item) + " />");
            a[push]("<label for=\"" + cid + "\">" + name + "</label>");
            break;
          default:
            if (href) {
              a[push]("<a href=\"" + href + "\">" + name + (hasSubmenu ? caret : "") + "</a>");
            } else {
              a[push]("<span tabindex=\"0\">" + name + (hasSubmenu ? caret : "") + "</span>");
            }
            break;
        }

        if (hasSubmenu)
          a[push](menuBuilder([item.menu]));

        a[push]("</li>");
      });
      a[push]("</ul>");
    });

    return a.join("");
  };

  return menuBuilder;
});
