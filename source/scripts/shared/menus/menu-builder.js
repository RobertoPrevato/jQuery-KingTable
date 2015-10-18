//
// Function to build menus, given a schema
//
R("menu-builder", [], function () {

  var menuBuilder = function (menus) {
    if (!menus) throw "missing menus";
    if (_.isPlainObject(menus)) return menuBuilder([menus]);
    var push = "push";
    var a = [], caret = "<span class=\"oi\" data-glyph=\"caret-right\"></span>";
    _.each(menus, function (menu) {
      a[push]("<ul class=\"ui-menu\">");

      _.each(menu.items, function (item) {
        var hasSubmenu = item.menu,
            href = item.href,
            name = item.name;
        a[push]("<li" + (hasSubmenu ? " class=\"ui-submenu\">" : ">"));

        //TODO: SUPPORT FOR ICONS; AND CHECKBOX; AND SORTABLE LISTS!

        if (href) {
          a[push]("<a href=\"" + href + "\">" + name + (hasSubmenu ? caret : "") + "</a>");
        } else {
          a[push]("<span tabindex=\"0\">" + name + (hasSubmenu ? caret : "") + "</span>");
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
