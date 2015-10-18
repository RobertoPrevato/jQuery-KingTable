//
// Proxy module for menus modules.
//
R("menu", ["menu-builder", "menu-functions"], function (MenuBuilder, MenuFunctions) {
  return {
    builder: MenuBuilder,
    functions: MenuFunctions
  };
});
