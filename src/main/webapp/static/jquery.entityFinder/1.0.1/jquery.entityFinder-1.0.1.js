(function ($) {
    var KEYMAP = {
        ENTER: 13,
        ESC: 27,
        UP: 38,
        DOWN: 40
    };
    
    $.getStyleOnce('/static/jquery.entityFinder/1.0.1/jquery.entityFinder-1.0.1.css');
    
    var EntityFinder = function (element, options) {
        flog('[EntityFinder]', element, options);
        
        this.element = $(element)
        this.options = $.extend({}, EntityFinder.DEFAULTS, options);
        this.init();
    };
    
    EntityFinder.version = '1.0.0';
    
    EntityFinder.DEFAULTS = {
        url: '/manageUsers',
        maxResults: 5,
        useActualId: false,
        type: '',
        renderSuggestions: function (data) {
            var suggestionsHtml = '';
            
            for (var i = 0; i < data.length; i++) {
                var item = data[i];
                
                if (item.fields.userId) {
                    var userName = item.fields.userName[0];
                    var userId = item.fields.userId[0];
                    var email;
                    if (item.fields.email) {
                        email = item.fields.email[0];
                    } else {
                        email = "";
                    }
                    var firstName = item.fields.firstName ? item.fields.firstName[0] : '';
                    var surName = item.fields.surName ? item.fields.surName[0] : '';
                    var displayText = (firstName || surName) ? firstName + ' ' + surName : '';
                    displayText = displayText.trim();
                    
                    suggestionsHtml += '<li class="search-suggestion" data-id="' + userName + '" data-actual-id="' + userId + '" data-type="user" data-text="' + (displayText || userName) + '">';
                    suggestionsHtml += '    <a href="javascript:void(0);">';
                    suggestionsHtml += '        <span>' + userName + '</span> &ndash; <span class="text-info">' + email + '</span>';
                    if (displayText) {
                        suggestionsHtml += '    <br /><small class="text-muted">' + displayText + '</small>';
                    }
                    suggestionsHtml += '    </a>';
                    suggestionsHtml += '</li>';
                } else if (item.fields.entityId) {
                    var id = item.fields.entityId[0];
                    var orgId = item.fields.orgId[0];
                    var orgTitle = item.fields.title[0] ? item.fields.title[0] : orgId;
                    
                    suggestionsHtml += '<li class="search-suggestion" data-id="' + orgId + '" data-actual-id="' + id + '" data-type="org" data-text="' + orgTitle + '">';
                    suggestionsHtml += '    <a href="javascript:void(0);">';
                    suggestionsHtml += '        <span>' + orgTitle + '</span>';
                    suggestionsHtml += '        <br /><small class="text-muted">OrgID: ' + orgId + '</small>';
                    suggestionsHtml += '    </a>';
                    suggestionsHtml += '</li>';
                }
            }
            
            return suggestionsHtml;
        },
        renderNoSuggestion: function () {
            return '<li class="no-result text-muted">No result</li>';
        },
        onSelectSuggestion: function (suggestion) {
            flog(this, suggestion);
        }
    };
    
    EntityFinder.prototype.init = function () {
        flog('[EntityFinder] Initializing...');
        
        var self = this;
        var currentValue = $(this.element).val();
        
        this.element.wrap('<div class="search-wrapper"></div>');
        this.wrapper = this.element.parent();

        self.fakeInput = $('<input data-current-value="' + currentValue + '" type="text" autocomplete="off" class="form-control search-input" value="' + (this.element.attr('data-text') || '') + '" placeholder="' + (this.element.attr('placeholder') || '') + '" />');

        this.element.before(self.fakeInput);
        this.element.after(
            '<ul class="dropdown-menu search-suggestions" style="display: none;" tabindex="-1"></ul>'
        );
        this.element.attr('tabindex', '-1').addClass('search-hidden-input');
        
        this.input = this.element.siblings('.search-input');
        this.suggestionsList = this.element.siblings('.search-suggestions');
        
        var timer;
        this.input.on({
            input: function () {
                clearTimeout(timer);
                timer = setTimeout(function () {
                    self.search(self.input.val());
                }, 250);
            },
            keydown: function (e) {
                switch (e.keyCode) {
                    case KEYMAP.ESC:
                        var currentData = self.fakeInput.data("current-value");
                        self.fakeInput.val(currentData);
                        self.suggestionsList.css('display', 'none');
                        break;
                    
                    case KEYMAP.UP:
                    case KEYMAP.DOWN:
                        e.preventDefault();
                        
                        var suggestions = self.suggestionsList.find('.search-suggestion');
                        var suggestionsLength = suggestions.length;
                        var actived = suggestions.filter('.active');
                        var index;
                        
                        if (actived.length === 0) {
                            index = e.keyCode === KEYMAP.UP ? suggestionsLength - 1 : 0;
                        } else {
                            var activeIndex = actived.index();
                            if (e.keyCode === KEYMAP.UP) {
                                index = activeIndex === 0 ? suggestionsLength - 1 : activeIndex - 1;
                            } else {
                                index = activeIndex === suggestionsLength - 1 ? 0 : activeIndex + 1;
                            }
                        }
                        actived.removeClass('active');
                        suggestions.eq(index).addClass('active');
                        
                        break;
                    
                    case KEYMAP.ENTER:
                        e.preventDefault();
                        
                        if (self.suggestionsList.is(':visible')) {
                            self.suggestionsList.find('.search-suggestion.active').trigger('click');
                        } else {
                            self.search(self.input.val());
                        }
                        
                        break;
                    
                    default:
                    // Do nothing
                }
            },
            focus: function () {
                self.wrapper.addClass('search-wrapper-focused');
            },
            blur: function () {
                self.wrapper.removeClass('search-wrapper-focused');
                var result = self.element.val();
                if(result === "") {
                    self.fakeInput.val(result);
                }

                setTimeout(function () {
                    self.suggestionsList.css('display', 'none');
                }, 250);
            }
        });
        
        this.suggestionsList.on({
            mouseenter: function () {
                self.suggestionsList.find('.search-suggestion.active').removeClass('active');
                $(this).addClass('active');
            },
            mouseleave: function () {
                $(this).removeClass('active');
            },
            click: function (e) {
                e.preventDefault();
                
                var suggestion = $(this);
                var type = suggestion.attr('data-type');
                var id = suggestion.attr('data-id');
                var actualId = suggestion.attr('data-actual-id');
                var text = suggestion.attr('data-text');
                
                self.element.val(self.options.useActualId ? actualId : id);
                self.input.val(text);
                
                if (typeof self.options.onSelectSuggestion === 'function') {
                    self.options.onSelectSuggestion.call(self.element, suggestion, id, actualId, type);
                }
                
                self.suggestionsList.css('display', 'none');
            }
        }, '.search-suggestion');
        
        flog('[EntityFinder] Initialized');
    };
    
    EntityFinder.prototype.search = function (query) {
        flog('[EntityFinder] Search: ' + query);
        
        var self = this;

        var showNoResult = function(){
            // var currentValue = self.fakeInput.data('current-value');
            self.element.val("");
            self.suggestionsList.html(self.options.renderNoSuggestion());
        };
        
        $.ajax({
            type: 'get',
            dataType: 'json',
            url: self.options.url,
            data: {
                asJson: true,
                type: self.options.type,
                omni: query
            },
            success: function (resp) {
                flog('[EntityFinder] Get response from server', resp);
                
                if (resp && resp.hits && resp.hits.total > 0) {
                    var data = [];
                    for (var i = 0; i < resp.hits.hits.length; i++) {
                        var hit = resp.hits.hits[i];
                        var isCorrectType = false;
                        if (self.options.type) {
                            isCorrectType = hit['_type'] === self.options.type;
                        } else {
                            isCorrectType = hit['_type'] === 'profile' || hit['_type'] === 'organisation';
                        }
                        
                        if (hit && hit.fields && isCorrectType && data.length < self.options.maxResults) {
                            data.push(hit);
                        }
                    }
                    
                    if (data.length > 0) {
                        self.suggestionsList.html(self.options.renderSuggestions(data));
                    } else {
                        showNoResult();
                    }
                } else {
                    showNoResult();
                }
                
                self.suggestionsList.css('display', 'block');
            },


            error: function (jqXhr, status, error) {
                flog('[EntityFinder] Get error response from server', jqXhr, status, error);
                self.suggestionsList.html(self.options.renderNoSuggestion());
                self.suggestionsList.css('display', 'block');
            }
        });
    };
    
    $.fn.entityFinder = function (options) {
        return this.each(function () {
            var element = $(this)
            var data = element.data('entityFinder');
            
            if (!data) {
                element.data('entityFinder', (data = new EntityFinder(this, options)));
            }
            
            if (typeof options == 'string') {
                data[options].apply(element, Array.prototype.slice.call(arguments, 1));
            }
        })
    };
    
    $.fn.entityFinder.constructor = EntityFinder;
    
})(jQuery);