(function () {
// ==UserScript==
// @name           Soundcloud Downloader
// @namespace      http://blog.thrsh.net
// @author         cecekpawon (THRSH)
// @description    Download all soundcloud tracks
// @version        1.0
// @updateURL      https://github.com/cecekpawon/Soundcloud-Downloader/raw/master/releases/Soundcloud-Downloader.meta.js
// @downloadURL    https://github.com/cecekpawon/Soundcloud-Downloader/raw/master/releases/Soundcloud-Downloader.user.js
// @require        http://code.jquery.com/jquery-latest.js
// @grant          none
// @match          https://soundcloud.com/*
// @run-at         document-start
// ==/UserScript==


/*

  ---------------------------------
  Original userscript by Technowise
  ---------------------------------
  Pub Mod: THRSH - 9:17AM 1/14/2014
  ---------------------------------

  Improved:
    - Resolved URL on click for faster page render
    - WGET batch playlist downloader

  Requirement:
    - Firefox + Greasemonkey / Scriptish
    - Chrome > v27 / + Tampermonkey

*/

var _this, scdlr = function(){};

_this = scdlr.prototype = {
  $: {},
  clientId: atob("YjQ1YjFhYTEwZjFhYzI5NDE5MTBhN2YwZDEwZjhlMjg="),
  apiURL: "https://api.soundcloud.com",
  pipes: atob("aHR0cHM6Ly9waXBlcy55YWhvby5jb20vcGlwZXMvcGlwZS5ydW4/X2lkPWM0MjJmMzYwZDA1OGRmMDI3ODYxMGJjYTA5NjE1OWU5Jl9yZW5kZXI9anNvbiZ0cmFjaz0="),
  pipes_FF: atob("aHR0cHM6Ly9xdWVyeS55YWhvb2FwaXMuY29tL3YxL3B1YmxpYy95cWw/cT1zZWxlY3QlMjAqJTIwZnJvbSUyMGpzb24lMjB3aGVyZSUyMHVybCUzRCUyMg=="),
  plist_length: 0,
  chrome: navigator.userAgent.match(/webkit/i) ? true : false,
  wGet: "",
  prettyname_rgx: /[^a-z0-9\.,_\-\(\) ]/gi,
  str_bin: "#!/bin/bash\n\n",

  setValue: function(key, value) {
    localStorage.setItem(key, value);
    return false;
  },

  getValue: function(key) {
    var val = localStorage.getItem(key);
    return val;
  },

  init: function(JQ) {
    _this.$ = JQ;
 
    var _private = _this.$(".sc-label-private");

    _this.v_yod_bash = _this.getValue("yod_bash") !== "sh" ? "bat" : "sh";

    _this.$(".soundActions").not(".parsed").each(function () {
      var par = _this.$(this),
        sound = par.find(".sc-button-group:first");

      par.addClass("parsed");

      if (_private.length && !sound.length) {
        sound = _this.$("<div/>", {"class": "sc-button-group sc-button-group-medium", html: "<span></span>"}).appendTo(this);
      }

      if (sound.length && sound.html() && !sound.parents(".playlist").length) {
        _this.addDownloadButton(sound);
      }
    });

    _this.wget();
  },

  addDownloadButton: function(sound) {
    var downloadLink = this.$("<button/>").html("128"),
      par = sound.parents("[role=group], .soundBadgeList__item"),
      anchor = par.find(".soundTitle__title"),
      resolveUrl = null,
      buttonClass = "sc-button sc-button-download sc-button-responsive sc-button-",
      buttonClass_group = sound.attr("class");

    if (!par.length) {
      // Playlists
      if (sound.parents(".l-main").find(".isPlaylist").length) {
        anchor = sound.parents(".trackList__item").find(".trackItem__trackTitle");
      } else {
      // Single Track
        anchor = sound.parents(".l-main").find(".soundTitle .soundTitle__title");
      }
    }

    if (!anchor.length) return;

    if (buttonClass_group.match(/medium/i)) {
      resolveUrl = document.location.href;
      buttonClass += "medium";
    } else {
      resolveUrl = "https://soundcloud.com" + anchor.attr("href");
      buttonClass += "small";
    }

    var urlSplitArray = resolveUrl.split("/"),
      lastElement = urlSplitArray.pop(),
      secretToken = lastElement.match(/^s\-/i) ? lastElement : "";

    downloadLink.attr({
      title: "Download ",
      //target: "_blank",
      class: buttonClass,
      "data-token": secretToken,
      "data-url": resolveUrl
    }).click(function () {
      _this.$(this).prop("disabled", true);
      _this.download(this);
      return false;
    });

    if (sound.find("button").length)
      sound.append(downloadLink);
    else
      downloadLink.insertBefore(sound.children().last());
  },

  update_ta: function() {
    var ta = _this.$("#yod_textarea");
    if (ta_val = ta.val()) {
      ta_val = ta_val.replace(/^([^(wget)]+)/i, "");
      if (_this.v_yod_bash === "sh") {
        ta_val = _this.str_bin + ta_val;
      }

      ta.val(ta_val);

      _this.update_downloadBatch(ta);
    }
  },

  update_downloadBatch: function(ta) {
    if (fn = _this.$(".soundTitle__title").html()) {
      fn = fn.replace(_this.prettyname_rgx, "").trim();
      _this.downloadBatch(ta, fn);
    }
  },

  wget: function() {
    if (
      !_this.$(".l-main").find(".isPlaylist").length
      || _this.$("#yod_wget_wrap").length
    ) return;

    var wgetTarget = _this.$(".listenEngagement .sc-button-group");

    if (wgetTarget.length) {

      _this.v_yod_bash = _this.getValue("yod_bash") !== "sh" ? "bat" : "sh";

      var sel_ext = _this.$("<select/>", {id: "yod_sel_ext", style: "margin: 0 10px;"})
        .append(_this.$("<option/>", {value: "bat", html: ".bat"}))
        .append(_this.$("<option/>", {value: "sh", html: ".sh"}))
        .change(function(){
          _this.v_yod_bash = _this.$(this).val();
          _this.setValue("yod_bash", _this.v_yod_bash);
          _this.update_ta();
        });

      sel_ext.find("option[value=\""+ _this.v_yod_bash +"\"]").attr("selected", "selected");

      _this.$("<div/>", {
        id: "yod_wget_wrap",
          style: "width: 100%; margin: 20px 0; display: inline-block;"
      })
      .append(
        _this.$("<textarea/>", {
          id: "yod_textarea",
          style: "width: 100%; margin-bottom: 10px; height: 100px; resize: vertical;"
        }).hide()
      )
      .append(
        _this.$("<label/>", {id: "yod_sel_ext_label", "for": "yod_sel_ext", html: "#Download bash ext"})
          .append(sel_ext)
      )
      .append(
        _this.$("<button/>", {
          html: "WGET",
          id: "yod_wget",
          style: "text-indent: inherit;",
          "class": "sc-button sc-sc-button-medium sc-button-responsive"
        })
        .click(function () {
          var ta = _this.$("#yod_textarea"),
            plist = _this.$(this).parents(".l-main").find("[data-token]").not("[data-rtmp]"),
            remaining = _this.$("#yod_remaining"),
            btnWGET = _this.$(this);

          _this.wGet = "";

          btnWGET.prop("disabled", true);
          _this.$("#yod_dlbatch").remove();
          _this.plist_length = parseInt(plist.length) || 0;
          ta.val("").hide();
          remaining.html("working..");

          plist.each(function(){
            if (ta) _this.download(this, btnWGET, ta, remaining);
          });
        })
      )
      .append(
        _this.$("<span/>", {
          id: "yod_remaining",
          style: "margin-left: 10px"
        })
      )
      .appendTo(wgetTarget.parent());
    }
  },

  log: function(s) {
    console.log(s);
  },

  download: function(el, btnWGET, ta, remaining) {
    var btnDL = _this.$(el), secret_token = btnDL.attr("data-token");

    _this.$.getJSON(_this.apiURL + "/resolve.json", {
      url: btnDL.attr("data-url"),
      client_id: _this.clientId,
      secret_token: secret_token
    }, function (track) {
      var trackId = track.id.toString(),
        trackTitle = track.title.replace(_this.prettyname_rgx, "").trim() + ".mp3",
        trackTitle_enc = "&t=" + encodeURIComponent(trackTitle),
        uri = _this.pipes + trackId;

      if (secret_token) uri += "&secret_token=" + secret_token;
      if (!_this.chrome) uri = _this.pipes_FF + encodeURIComponent(uri) + "%22&format=json&callback=";

      _this.$.getJSON(uri, function (data) {
        if (_this.chrome) {
          data = _this.$.isArray(data.value.items) ? data.value.items[0] : {};
        } else {
          data = data.query.results.json.value.items ? data.query.results.json.value.items : {};
        }

        if (data.content) {
          if (data.content.match(/\.128\.mp3\?/i)) {
            data = {http_mp3_128_url: data.content};
          } else if (data.content.match(/rtmp.*\/mp3:.*\.128\?/i)) {
            data = {rtmp_mp3_128_url: data.content};
          }
        }

        if (ta) {
          _this.plist_length--;

          if (_this.plist_length <= 0) remaining.empty();
          else remaining.html(_this.plist_length + " remaining");

          if (data.http_mp3_128_url) {
            if (!_this.wGet && (_this.v_yod_bash === "sh")) _this.wGet += _this.str_bin;
            val = "wget -c -O \"" + trackTitle + "\" \"" + data.http_mp3_128_url.replace(/%/gi, "%%") + "\" --no-check-certificate\n\n";
            _this.wGet += val;
            ta.val(_this.wGet);
            if (_this.plist_length === 0) {
              btnWGET.prop("disabled", false);
              ta.show();
              _this.update_downloadBatch(ta);
            }
          } else {
            _this.log("RTMP detected, let IDM handle this :))");
            btnDL.html("RTMP").prop("disabled", true).attr("data-rtmp", true).off();
          }
        } else {
          if (data.http_mp3_128_url) {
            _this.download128(data.http_mp3_128_url, trackTitle);
            btnDL.prop("disabled", false);
          } else {
            _this.log("RTMP detected, let IDM handle this :))");
            btnDL.html("RTMP").attr("disabled", true).off();
          }
        }

        return false;
      });
    });
  },

  download128 : function(url, title) {
    var el = this.$("<a/>", {href: url, "download": title}),
      clickEvent  = document.createEvent('MouseEvents');

    clickEvent.initEvent('click', true, true);
    el.get(0).dispatchEvent(clickEvent);
  },

  downloadBatch: function(ta, fn) {
    window.URL = window.webkitURL || window.URL;

    var mime = _this.v_yod_bash !== "sh" ? "application/x-msdos-program" : "application/x-sh",
      bb = new Blob([ta.val()], {type: mime}),
      href = window.URL.createObjectURL(bb),
      ext = "." + _this.v_yod_bash;

    fn += ext;

    _this.$("#yod_dlbatch").remove();

    _this.$("<a/>", {
      id: "yod_dlbatch",
      href: href,
      html: "Download BATCH",
      "download": fn,
      "data-downloadurl": [mime, fn, href].join(":")
    }).appendTo(ta.parent());
  }
};

function GM_wait() {
  if (typeof $ == "undefined") {
    setTimeout(GM_wait, 200);
  } else {
    var yodSncld = new scdlr(),
      JQ = $.noConflict(true);

    document.addEventListener("DOMNodeInserted", function (event) {
      var cname, elmt = event.target;

      if (!(/(CANVAS|DIV|LI)/.test(elmt.tagName))) return;
      if (cname = elmt.className) {
        if (
          (/(g\-box\-full|soundList__item|trackList|soundBadgeList__item)/i.test(cname))
        ) {
          yodSncld.init(JQ);
        }
      }
    }, false);
  }
}

document.addEventListener("DOMContentLoaded", GM_wait, true);
})();
