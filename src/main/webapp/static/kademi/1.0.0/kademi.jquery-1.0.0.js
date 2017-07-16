(function ($) {
    $.cachedScript = function (url, callback, options) {
        options = $.extend(options || {}, {
            dataType: 'script',
            cache: true,
            url: url,
            success: function (script, textStatus, jqXHR) {
                if (callback) {
                    callback.call(this, url, script, textStatus, jqXHR);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                flog('Error when loading script: ' + url, jqXHR, textStatus, errorThrown);
            }
        });
        
        // Use $.ajax() since it is more flexible than $.getScript
        // Return the jqXHR object so we can chain callbacks
        return $.ajax(options);
    };
    
    $.getScriptOnce = function (url, callback) {
        var scriptMeta = $.getScriptOnce.loaded[url];
        if (scriptMeta === null || scriptMeta === undefined) {
            scriptMeta = {
                url: url,
                loaded: false,
                callbacks: []
            };
            $.getScriptOnce.loaded[url] = scriptMeta;
            if (callback === undefined) {
                return $.cachedScript(url);
            } else {
                return $.ajax({
                    dataType: 'script',
                    cache: true,
                    url: url,
                    success: function (script, textStatus, jqXHR) {
                        scriptMeta.loaded = true;
                        
                        callback.call(this, url, script, textStatus, jqXHR);
                        
                        for (var i = 0; i < scriptMeta.callbacks.length; i++) {
                            scriptMeta.callbacks[i].call(this, url, script, textStatus, jqXHR);
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        flog('Error when loading script: ' + url, jqXHR, textStatus, errorThrown);
                    }
                });
            }
        } else {
            if (callback === undefined) {
                // do nothing
            } else {
                if (!scriptMeta.loaded) {
                    scriptMeta.callbacks.push(callback);
                } else {
                    callback.call(this, url)
                }
            }
            return false;
        }
    };
    
    $.getScriptOnce.loaded = {};
    
    $(function () {
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var scr = scripts[i];
            var url = $(scr).attr('src') || '';
            
            if (url.trim() !== '') {
                $.getScriptOnce.loaded[url] = {
                    url: url,
                    loaded: true,
                    callbacks: []
                };
            }
        }
    });
    
}(jQuery));

(function ($) {
    $.getStyleOnce = function (url) {
        if (!$('link[href="' + url + '"]').length) {
            flog('Load "' + url + '"');
            $('<link href="' + url + '" rel="stylesheet" type="text/css" />').appendTo('head');
        } else {
            flog('"' + url + '" is already loaded');
        }
    };
    
    // just a nice little function to get classes
    $.fn.classes = function (f) {
        var c = [];
        $.each(this, function (i, v) {
            var _ = v.className.split(/\s+/);
            for (var j in _)
                '' === _[j] || c.push(_[j]);
        });
        c = $.unique(c);
        if ("function" === typeof f)
            for (var j in c)
                f(c[j]);
        return c;
    };
    
    $.fn.fshow = function () {
        return $(this).each(function () {
            $(this).animate({
                height: 'show',
                opacity: 1
            }, 200);
        });
    };
    
    $.fn.fhide = function () {
        return $(this).each(function () {
            $(this).animate({
                height: 'hide',
                opacity: 0
            }, 200);
        });
    };

// Function check/uncheck for checkbox
    $.fn.check = function (is_check) {
        return $(this).attr('checked', is_check);
    };

// Function disable/enable for form control
    $.fn.disable = function (is_disable) {
        return $(this).attr('disabled', is_disable);
    };
    
    /**
     * Check the available/existing of a object, if object is existing, the callback will be run
     * @method exist
     * @param {Function} whenExist The callback is called when object is existed
     * @param {Function} whenNoExist The callback is called when object is not existed
     * @return {jQuery}
     */
    $.fn.exist = function (whenExist, whenNoExist) {
        if (this.length > 0) {
            if (typeof whenExist === 'function') {
                whenExist.call(this);
            }
        } else {
            if (typeof whenNoExist === 'function') {
                whenNoExist.call(this);
            }
        }
        return this;
    };
    
    $.extend({
        URLEncode: function (c) {
            var o = '';
            var x = 0;
            c = c.toString();
            var r = /(^[a-zA-Z0-9_.]*)/;
            while (x < c.length) {
                var m = r.exec(c.substr(x));
                if (m != null && m.length > 1 && m[1] != '') {
                    o += m[1];
                    x += m[1].length;
                } else {
                    var d = c.charCodeAt(x);
                    var h = d.toString(16);
                    o += '%' + (h.length < 2 ? '0' : '') + h.toUpperCase();
                    
                    //                if(c[x]==' ')o+='+';
                    //                else{
                    //                    var d=c.charCodeAt(x);
                    //                    var h=d.toString(16);
                    //                    o+='%'+(h.length<2?'0':'')+h.toUpperCase();
                    //                }
                    x++;
                }
            }
            return o;
        },
        URLDecode: function (s) {
            var o = s;
            var binVal, t;
            var r = /(%[^%]{2})/;
            while ((m = r.exec(o)) != null && m.length > 1 && m[1] != '') {
                b = parseInt(m[1].substr(1), 16);
                t = String.fromCharCode(b);
                o = o.replace(m[1], t);
            }
            return o;
        }
    });
    
}(jQuery));
