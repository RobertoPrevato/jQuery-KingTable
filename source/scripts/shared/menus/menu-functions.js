//
// Menu functions
//
R("menu-functions", [], function () {

  var toggle = ".ui-menu,.ui-submenu";
  
  var menufunctions = {

    closeMenus: function (e) {
      var self = this;
      if (e && e.which === 3) return
      $(toggle).each(function () {
        var el = $(this)
        var parent = self.getParent(el);
  
        if (!parent.hasClass("open")) return;
  
        if (e && e.type == "click" && /input|textarea/i.test(e.target.tagName) && $.contains(parent[0], e.target)) return;
  
        if (e.isDefaultPrevented()) return;
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
      var self = this,
        open = "open",
        el = $(e.currentTarget),
          submenu = el.children(".ui-menu");
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

  function globalKeydown(e) {
    var anyMenuOpen = !!$(".ui-menu:visible:first").length;
    var keycode = e.which;
    var focused = $(":focus");
    if (anyMenuOpen && /37|38|39|40/.test(keycode)) {
      //avoid scrolling
      e.preventDefault();
      var el = focused.length && focused.closest(".ui-menu").length
              ? focused
              : $(".ui-menu:visible:first").find("li:first a"),
          parent = el.parent();
      if (keycode == 38) {
        //up
        var prev = focused.prev(),
          prevIsMenu = prev.hasClass("ui-menu");
        if (prevIsMenu) {
          prev.children(":first").children("a").trigger("focus");
        } else {
          parent.prev().children("a").trigger("focus");
        }
      }
      if (keycode == 40) {
        //down
        var next = focused.next(),
          nextIsMenu = next.hasClass("ui-menu");
        if (nextIsMenu && !parent.hasClass("ui-submenu")) {
          next.children(":first").children("a").trigger("focus");
        } else {
          parent.next().children("a").trigger("focus");
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
              parentSub.children("a:first").trigger("focus");
            });
          }
        }
      }
      if (keycode == 39) {
        //right
        if (parent.hasClass("ui-submenu")) {
          parent.trigger("click");
          _.defer(function () {
            parent.find("li:first a").trigger("focus");
          });
        }
      }
    }
  };

  var bind = "bind";
  $(document)
    .on("click.menus", menufunctions.closeMenus[bind](menufunctions))
    .on("click.menus", toggle, menufunctions.expandMenu[bind](menufunctions))
    .on("keydown.menus", globalKeydown);

  return menufunctions;
});