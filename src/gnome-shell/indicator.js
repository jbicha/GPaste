/*
 * This file is part of GPaste.
 *
 * Copyright (c) 2010-2017, Marc-Antoine Perennou <Marc-Antoine@Perennou.com>
 */
/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

const Gettext = imports.gettext;
const Lang = imports.lang;

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Clutter = imports.gi.Clutter;

const GPaste = imports.gi.GPaste;

const _ = Gettext.domain('GPaste').gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const AboutItem = Me.imports.aboutItem;
const DummyHistoryItem = Me.imports.dummyHistoryItem;
const EmptyHistoryItem = Me.imports.emptyHistoryItem;
const Item = Me.imports.item;
const PageSwitcher = Me.imports.pageSwitcher;
const SearchItem = Me.imports.searchItem;
const StateSwitch = Me.imports.stateSwitch;
const StatusIcon = Me.imports.statusIcon;
const UiItem = Me.imports.uiItem;

const GPasteIndicator = new Lang.Class({
    Name: 'GPasteIndicator',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(0.0, "GPaste");

        this._statusIcon = new StatusIcon.GPasteStatusIcon();
        this.actor.add_child(this._statusIcon.actor);

        this._settings = new GPaste.Settings();

        this._headerSize = 0;
        this._postHeaderSize = 0;
        this._history = [];
        this._preFooterSize = 0;
        this._footerSize = 0;

        this._searchResults = [];

        this._dummyHistoryItem = new DummyHistoryItem.GPasteDummyHistoryItem();

        this._searchItem = new SearchItem.GPasteSearchItem();
        this._searchItem.connect('text-changed', Lang.bind(this, this._onNewSearch));

        this._settingsSizeChangedId = this._settings.connect('changed::element-size', Lang.bind(this, this._resetElementSize));
        this._resetElementSize();
        this.menu.connect('open-state-changed', Lang.bind(this, this._onOpenStateChanged));
        this.menu.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));

        this._pageSwitcher = new PageSwitcher.GPastePageSwitcher();
        this._pageSwitcher.connect('switch', Lang.bind(this, function(sw, page) {
            this._updatePage(page);
        }));

        this._actions = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false
        });

        this._addToPostHeader(this._dummyHistoryItem);
        this._addToPreFooter(new PopupMenu.PopupSeparatorMenuItem());
        this._addToFooter(this._actions);

        GPaste.Client.new(Lang.bind(this, function (obj, result) {
            this._client = GPaste.Client.new_finish(result);

            this._uiItem = new UiItem.GPasteUiItem(this.menu);
            this._emptyHistoryItem = new EmptyHistoryItem.GPasteEmptyHistoryItem(this._client);
            this._aboutItem = new AboutItem.GPasteAboutItem(this._client, this.menu);
            this._switch = new StateSwitch.GPasteStateSwitch(this._client);

            this._addToHeader(this._switch);
            this._addToHeader(this._searchItem);
            this._addToHeader(this._pageSwitcher);

            this._actions.actor.add(this._uiItem.actor, { expand: true, x_fill: false });
            this._actions.actor.add(this._emptyHistoryItem.actor, { expand: true, x_fill: false });
            this._actions.actor.add(this._aboutItem.actor, { expand: true, x_fill: false });

            this._settingsMaxSizeChangedId = this._settings.connect('changed::max-displayed-history-size', Lang.bind(this, this._resetMaxDisplayedSize));
            this._resetMaxDisplayedSize();

            this._clientUpdateId = this._client.connect('update', Lang.bind(this, this._update));
            this._clientShowId = this._client.connect('show-history', Lang.bind(this, this._popup));
            this._clientTrackingId = this._client.connect('tracking', Lang.bind(this, this._toggle));

            this._onStateChanged (true);

            this.menu.actor.connect('key-press-event', Lang.bind(this, this._onKeyPressEvent));
            this.menu.actor.connect('key-release-event', Lang.bind(this, this._onKeyReleaseEvent));

            this._destroyed = false;
            this.actor.connect('destroy', Lang.bind(this, this._onDestroy));
        }));
    },

    shutdown: function() {
        this._onStateChanged (false);
        this._onDestroy();
        this.destroy();
    },

    _onKeyPressEvent: function(actor, event) {
        if (event.has_control_modifier()) {
            const nb = parseInt(event.get_key_unicode());
            if (!isNaN(nb) && nb >= 0 && nb <= 9 && nb < this._history.length) {
                this._history[nb].activate();
            }
        } else {
            this._maybeUpdateIndexVisibility(event, true);
        }
    },

    _onKeyReleaseEvent: function(actor, event) {
        this._maybeUpdateIndexVisibility(event, false);
    },

    _maybeUpdateIndexVisibility: function(event, state) {
        const key = event.get_key_symbol();
        if (key == Clutter.KEY_Control_L || key == Clutter.KEY_Control_R) {
            this._updateIndexVisibility(state);
        }
    },

    _updateIndexVisibility: function(state) {
        this._history.slice(0, 10).forEach(function(i) {
            i.showIndex(state);
        });
    },

    _hasSearch: function() {
        return this._searchItem.text.length > 0;
    },

    _onSearch: function(page) {
        if (this._hasSearch()) {
            const search = this._searchItem.text.toLowerCase();

            this._client.search(search, Lang.bind(this, function(client, result) {
                this._searchResults = client.search_finish(result);
                let results = this._searchResults.length;
                const maxSize = this._history.length;

                if (!this._pageSwitcher.updateForSize(results)) {
                    return;
                }

                this._pageSwitcher.setActive(page);
                const offset = this._pageSwitcher.getPageOffset();

                if (results > (maxSize + offset)) {
                    results = (maxSize + offset);
                }

                this._history.slice(0, results - offset).forEach(Lang.bind(this, function(i, index) {
                    i.setIndex(this._searchResults[offset + index]);
                }));

                /* If we had no result, updateForSize would have returned false */
                this._dummyHistoryItem.actor.hide();

                this._history.slice(results - offset, maxSize).forEach(function(i) {
                    i.setIndex(-1);
                });
            }));
        } else {
            this._searchResults = [];
            this._refresh(0);
        }
    },

    _onNewSearch: function() {
        this._onSearch(1);
    },

    _resetElementSize: function() {
        const size = this._settings.get_element_size();
        this._searchItem.resetSize(size/2 + 3);
        this._history.forEach(function(i) {
            i.setTextSize(size);
        });
    },

    _updatePage: function(page) {
        this._pageSwitcher.setActive(page);
        this._refresh(0);
    },

    _resetMaxDisplayedSize: function() {
        const oldSize = this._history.length;
        const newSize = this._settings.get_max_displayed_history_size();
        const elementSize = this._settings.get_element_size();

        this._pageSwitcher.setMaxDisplayedSize(newSize);

        const offset = this._pageSwitcher.getPageOffset();

        if (newSize > oldSize) {
            for (let index = oldSize; index < newSize; ++index) {
                let item = new Item.GPasteItem(this._client, elementSize, index + offset);
                this.menu.addMenuItem(item, this._headerSize + this._postHeaderSize + index);
                this._history[index] = item;
            }
        } else {
            for (let i = newSize; i < oldSize; ++i) {
                this._history.pop().destroy();
            }
        }

        if (offset === 0 || oldSize === 0) {
            this._updatePage(1);
        } else {
            this._updatePage((offset / oldSize) + 1);
        }
    },

    _update: function(client, action, target, position) {
        switch (target) {
        case GPaste.UpdateTarget.ALL:
            this._refresh(0);
            break;
        case GPaste.UpdateTarget.POSITION:
            const offset = this._pageSwitcher.getPageOffset();
            const displayPos = position - offset;
            switch (action) {
            case GPaste.UpdateAction.REPLACE:
                this._history[displayPos].refresh();
                break;
            case GPaste.UpdateAction.REMOVE:
                this._refresh(displayPos);
                break;
            }
            break;
        }
    },

    _refresh: function(resetTextFrom) {
        if (this._searchResults.length > 0) {
            this._onSearch(this._pageSwitcher.getPage());
        } else if (this._hasSearch()) {
            this._history.forEach(function(i, index) {
                i.setIndex(-1);
            });
            this._updateVisibility(true);
        } else {
            this._client.get_history_name(Lang.bind(this, function(client, result) {
                const name = client.get_history_name_finish(result);

                this._client.get_history_size(name, Lang.bind(this, function(client, result) {
                    const realSize = client.get_history_size_finish(result);

                    if (!this._pageSwitcher.updateForSize(realSize)) {
                        return;
                    }

                    const maxSize = this._history.length;
                    const offset = this._pageSwitcher.getPageOffset();
                    const size = Math.min(realSize - offset, maxSize);

                    this._history.slice(resetTextFrom, size).forEach(function(i, index) {
                        i.setIndex(offset + index);
                    });
                    this._history.slice(size, maxSize).forEach(function(i, index) {
                        i.setIndex(-1);
                    });

                    this._updateVisibility(size == 0);
                }));
            }));
        }
    },

    _updateVisibility: function(empty, search) {
        if (!empty) {
            this._dummyHistoryItem.actor.hide();
            this._emptyHistoryItem.actor.show();
            this._searchItem.actor.show();
        } else if (this._hasSearch()) {
            this._dummyHistoryItem.showNoResult();
            this._emptyHistoryItem.actor.hide();
            this._searchItem.actor.show();
        } else {
            this._dummyHistoryItem.showEmpty();
            this._emptyHistoryItem.actor.hide();
            this._searchItem.actor.hide();
        }
    },

    _popup: function() {
        this.menu.open(true);
        this._selectSearch();
    },

    _toggle: function(c, state) {
        this._switch.toggle(state);
    },

    _selectSearch: function() {
        if (this._history.length > 0) {
            this._searchItem.grabFocus();
        }
    },

    _addToHeader: function(item) {
        this.menu.addMenuItem(item, this._headerSize++);
    },

    _addToPostHeader: function(item) {
        this.menu.addMenuItem(item, this._headerSize + this._postHeaderSize++);
    },

    _addToPreFooter: function(item) {
        this.menu.addMenuItem(item, this._headerSize + this._postHeaderSize + this._history.length + this._preFooterSize++);
    },

    _addToFooter: function(item) {
        this.menu.addMenuItem(item, this._headerSize + this._postHeaderSize + this._history.length + this._preFooterSize + this._footerSize++);
    },

    _onStateChanged: function(state) {
        this._client.on_extension_state_changed(state, null);
    },

    _onOpenStateChanged: function(menu, state) {
        if (state) {
            this._searchItem.reset();
            this._updatePage(1);
        } else {
            this._updateIndexVisibility(false);
        }
    },

    _onMenuKeyPress: function(actor, event) {
        const symbol = event.get_key_symbol();
        if (symbol == Clutter.KEY_Left) {
            return this._pageSwitcher.previous();
        }
        if (symbol == Clutter.KEY_Right) {
            return this._pageSwitcher.next();
        }
        return Clutter.EVENT_PROPAGATE;
    },

    _onDestroy: function() {
        if (this._destroyed) {
            return;
        }
        this._destroyed = true;
        this._client.disconnect(this._clientUpdateId);
        this._client.disconnect(this._clientShowId);
        this._client.disconnect(this._clientTrackingId);
        this._settings.disconnect(this._settingsMaxSizeChangedId);
        this._settings.disconnect(this._settingsSizeChangedId);
    }
});

