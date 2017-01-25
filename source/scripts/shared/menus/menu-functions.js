//
// Menu functions
//
R("kt-menu-functions", [], function () {

  var toggle = ".ug-menu,.ug-submenu";
  function protected(e) {
    return /input|select|textarea|label|^a$/i.test(e.target.tagName);
  }
  var menufunctions = {

    closeMenus: function (e) {
      if (e && protected(e)) return true;
      var self = this;
      if (e && e.which === 3) return;
      $(toggle).each(function () {
        if ($.contains(this, e.target)) return;
        var el = $(this);
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
      var target  = /li/i.test(e.currentTarget.tagName) ? el : self.getParent(el);
      var isActive = target.hasClass("open");
      self.closeMenus(e);
      if (!isActive) {
        if (e.isDefaultPrevented()) return;
        el.trigger("focus").attr("aria-expanded", "true");
        target.toggleClass("open");
      }
      return false;
    },

    expandSubMenu: function (e) {
      if (protected(e)) return true;
      var open = "open",
        el = $(e.currentTarget);
      //close siblings submenus
      el.siblings().removeClass(open).find("." + open).removeClass(open);
      el.addClass(open);
      return false;
    }

  };

  function prevent(e) {
    e.preventDefault();
  }

  function firstitem(el) {
    var len = "length",
      find = "find",
      first = ":first-of-type",
      a = el[find]("a" + first);
    if (a[len]) return a;
    a = el[find]("span[tabindex]" + first);
    if (a[len]) return a;
    a = el[find]("label" + first);
    return a;
  }

  function globalKeydown(e) {
    if (protected(e) && !$(e.target).closest(".ug-menu").length) return true;
    var keycode = e.which;
    if (keycode === 9) return true;
    var anyMenuOpen = !!$(".ug-menu:visible").length;
    var focused = $(":focus"), focus = "focus";

    if (anyMenuOpen && /27|37|38|39|40/.test(keycode)) {
      prevent(e);
      if (keycode == 27)
        return menufunctions.closeMenus(), true;
      var el = focused.length && focused.closest(".ug-menu").length
          ? focused
          : firstitem($($(".ug-menu:visible")[0]).find("li:first")),
        parent = el.parent();
      if (focused.hasClass("ug-expander")) {
        firstitem(parent).trigger(focus);
        return true;
      }
      if (keycode == 38) {
        //up
        var prev = focused.prev(),
          prevIsMenu = prev.hasClass("ug-menu");
        if (prevIsMenu) {
          firstitem(prev.children(":first")).trigger(focus);
        } else {
          firstitem(parent.prev()).trigger(focus);
        }
      }
      if (keycode == 40) {
        //down
        var next = focused.next(),
          nextIsMenu = next.hasClass("ug-menu");
        if (nextIsMenu && !parent.hasClass("ug-submenu")) {
          firstitem(next.children(":first")).trigger(focus);
        } else {
          var isExpander = focused.hasClass("ug-expander");
          firstitem(isExpander ? parent : parent.next()).trigger(focus);
        }
      }
      if (keycode == 37) {
        //left
        var parentSub = parent.closest(".ug-submenu");
        if (parentSub.length) {
          if (parentSub.get(0) === parent.get(0)) {
            parentSub = parentSub.parent().closest(".ug-submenu");
          }
          if (parentSub.length) {
            parentSub.removeClass("open");
            _.defer(function () {
              firstitem(parentSub).trigger(focus);
            });
          }
        }
      }
      if (keycode == 39) {
        //right
        if (parent.hasClass("ug-submenu")) {
          parent.trigger("click");
          _.defer(function () {
            firstitem(parent.find("li:first-of-type")).trigger(focus);
          });
        }
      }
      return true;
    }
  }

  var bind = "bind",
    click = "click.menus",
    keydown = "keydown.menus";
  $(document)
    .off(click)
    .off(keydown)
    .on(click, menufunctions.closeMenus[bind](menufunctions))
    .on(click, ".ug-expander", menufunctions.expandMenu[bind](menufunctions))
    .on(click, toggle, menufunctions.expandMenu[bind](menufunctions))
    .on(keydown, globalKeydown);

  return menufunctions;
});