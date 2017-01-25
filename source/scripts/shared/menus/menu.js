//
// Proxy module for menus modules.
//
R("kt-menu", ["kt-menu-builder", "kt-menu-functions"], function (MenuBuilder, MenuFunctions) {
  return {
    builder: MenuBuilder,
    functions: MenuFunctions
  };
});
