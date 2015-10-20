//
// Menu functions
//
R("menu-functions", [], function () {

  var toggle = ".ui-menu,.ui-submenu";
  function protected(e) {
    return /input|select|textarea|label/i.test(e.target.tagName);
  }
  var menufunctions = {

    closeMenus: function (e) {
      if (e && protected(e)) return true;
      var self = this;
      if (e && e.which === 3) return
      $(toggle).each(function () {
        var el = $(this)
        var parent = self.getParent(el);
  
        if (!parent.hasClass("open")) return;
  
        if (e && e.type == "click" && /input|textarea/i.test(e.target.tagName) && $.contains(parent[0], e.target)) return;
  
        if (e && e.isDefaultPrevented()) return;
        el.attr("aria-expanded", "false");
        parent.removeClass("open");
      });
    },

    getParent: function (el) {
      var selector = el.attr("data-target");
      if (!selector) {
        selector = el.attr("href");
        selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, "");
      }
      var $parent = selector && $(selector);
      return $parent && $parent.length ? $parent : el.parent();
    },

    expandMenu: function (e) {
      if (protected(e)) return true;
      var self = this,
          el = $(e.currentTarget);
      if (el.is(".disabled, :disabled")) return;
      var parent  = self.getParent(el);
      var isActive = parent.hasClass("open");

      self.closeMenus(e);

      if (!isActive) {
        if ("ontouchstart" in document.documentElement && !parent.closest(".navbar-nav").length) {
          // if mobile we use a backdrop because click events don't delegate
          $(document.createElement("div"))
            .addClass("dropdown-backdrop")
            .insertAfter($(this))
            .on("click", closeMenus);
        }
        if (e.isDefaultPrevented()) return;
        el.trigger("focus").attr("aria-expanded", "true");
        parent.toggleClass("open");
      }
      return false;
    },

    expandSubMenu: function (e) {
      if (protected(e)) return true;
      var self = this,
        open = "open",
        el = $(e.currentTarget),
          submenu = el.find(".ui-menu:first");
      //close siblings submenus
      el.siblings().removeClass(open).find("." + open).removeClass(open);
      //position submenu
      self.positionSubMenu(el, submenu);
      el.addClass(open);
      return false;
    },

    positionSubMenu: function (parent, submenu) {
      var pos = "positioned";
      if (submenu.data(pos)) return this;
      submenu.css({
        left:  "+=" + parent.width()
      });
      submenu.data(pos, true);
      return this;
    }

  };

  function prevent(e) {
    e.preventDefault();
  }

  function globalKeydown(e) {
    if (protected(e) && !$(e.target).closest(".ui-menu").length) return true;
    prevent(e);
    var anyMenuOpen = !!$(".ui-menu:visible:first").length;
    var keycode = e.which;
    var focused = $(":focus");

    if (anyMenuOpen && /27|37|38|39|40/.test(keycode)) {
      if (keycode == 27)
        return menufunctions.closeMenus(), true;
      var el = focused.length && focused.closest(".ui-menu").length
              ? focused
              : $(".ui-menu:visible:first").find("li:first a"),
          parent = el.parent();
      if (keycode == 38) {
        //up
        var prev = focused.prev(),
          prevIsMenu = prev.hasClass("ui-menu");
        if (prevIsMenu) {
          prev.children(":first").find("a:first,span[tabindex]:first,label:first").trigger("focus");
        } else {
          parent.prev().find("a:first,span[tabindex]:first,label:first").trigger("focus");
        }
      }
      if (keycode == 40) {
        //down
        var next = focused.next(),
          nextIsMenu = next.hasClass("ui-menu");
        if (nextIsMenu && !parent.hasClass("ui-submenu")) {
          next.children(":first").find("a:first,span[tabindex]:first,label:first").trigger("focus");
        } else {
          parent.next().find("a:first,span[tabindex]:first,label:first").trigger("focus");
        }
      }
      if (keycode == 37) {
        //left
        var parentSub = parent.closest(".ui-submenu");
        if (parentSub.length) {
          if (parentSub.get(0) === parent.get(0)) {
            parentSub = parentSub.parent().closest(".ui-submenu");
          }
          if (parentSub.length) {
            parentSub.removeClass("open");
            _.defer(function () {
              parentSub.find("a:first,span[tabindex]:first,label:first").trigger("focus");
            });
          }
        }
      }
      if (keycode == 39) {
        //right
        if (parent.hasClass("ui-submenu")) {
          parent.trigger("click");
          _.defer(function () {
            parent.find("li:first > a,li:first > span[tabindex],li:first > label").trigger("focus");
          });
        }
      }
      return true;
    }
  };

  var bind = "bind";
  $(document)
    .on("click.menus", menufunctions.closeMenus[bind](menufunctions))
    .on("click.menus", toggle, menufunctions.expandMenu[bind](menufunctions))
    .on("keydown.menus", globalKeydown);

  return menufunctions;
});