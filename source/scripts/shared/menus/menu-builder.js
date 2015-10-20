//
// Function to build menus, given a schema
//
R("menu-builder", [], function () {

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
    var push = "push";
    var a = [], caret = "<span class=\"oi\" data-glyph=\"caret-right\"></span>";
    _.each(menus, function (menu) {
      var id = menu.id;
      a[push]("<ul" + (id ? " id=\"" + id + "\"": "")+ " class=\"ui-menu\">");

      _.each(menu.items, function (item) {
        var hasSubmenu = item.menu,
          type = item.type,
          href = item.href,
          name = item.name;
        a[push]("<li" + (hasSubmenu ? " class=\"ui-submenu\">" : ">"));
        //a[push]("<div>"); // mod
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
              a[push]("<a href=\"" + href + "\"" + attr(item) + ">" + name + (hasSubmenu ? caret : "") + "</a>");
            } else {
              a[push]("<span tabindex=\"0\"" + attr(item) + ">" + name + (hasSubmenu ? caret : "") + "</span>");
            }
            break;
        }

        if (hasSubmenu)
          a[push](menuBuilder([item.menu]));

        //a[push]("</div>"); // mod
        a[push]("</li>");
      });
      a[push]("</ul>");
    });

    return a.join("");
  };

  return menuBuilder;
});
