//----------------------------------------------------------------------------
//  Copyright (C) 2011  The IPython Development Team
//
//  Distributed under the terms of the BSD License.  The full license is in
//  the file COPYING, distributed as part of this software.
//----------------------------------------------------------------------------

//============================================================================
// NotebookList
//============================================================================

var IPython = (function (IPython) {
    "use strict";
    
    var utils = IPython.utils;

    var ClusterList = function (selector, options) {
        this.selector = selector;
        if (this.selector !== undefined) {
            this.element = $(selector);
            this.style();
            this.bind_events();
        }
        options = options || {};
        this.options = options;
        this.base_url = options.base_url || utils.get_data("baseUrl");
        this.notebook_path = options.notebook_path || utils.get_data("notebookPath");
    };

    ClusterList.prototype.style = function () {
        $('#cluster_list').addClass('list_container');
        $('#cluster_toolbar').addClass('list_toolbar');
        $('#cluster_list_info').addClass('toolbar_info');
        $('#cluster_buttons').addClass('toolbar_buttons');
    };


    ClusterList.prototype.bind_events = function () {
        var that = this;
        $('#refresh_cluster_list').click(function () {
            that.load_list();
        });
    };


    ClusterList.prototype.load_list = function () {
        var settings = {
            processData : false,
            cache : false,
            type : "GET",
            dataType : "json",
            success : $.proxy(this.load_list_success, this)
        };
        var url = utils.url_join_encode(this.base_url, 'clusters');
        $.ajax(url, settings);
    };


    ClusterList.prototype.clear_list = function () {
        this.element.children('.list_item').remove();
    };

    ClusterList.prototype.load_list_success = function (data, status, xhr) {
        this.clear_list();
        var len = data.length;
        for (var i=0; i<len; i++) {
            var element = $('<div/>');
            var item = new ClusterItem(element, this.options);
            item.update_state(data[i]);
            element.data('item', item);
            this.element.append(element);
        }
    };


    var ClusterItem = function (element, options) {
        this.element = $(element);
        this.base_url = options.base_url || utils.get_data("baseUrl");
        this.notebook_path = options.notebook_path || utils.get_data("notebookPath");
        this.data = null;
        this.style();
    };

    ClusterItem.prototype.style = function () {
        this.element.addClass('list_item').addClass("row-fluid");
    };

    ClusterItem.prototype.update_state = function (data) {
        this.data = data;
        if (data.status === 'running') {
            this.state_running();
        } else if (data.status === 'stopped') {
            this.state_stopped();
        }
    };


    ClusterItem.prototype.state_stopped = function () {
        var that = this;
        var profile_col = $('<div/>').addClass('profile_col span4').text(this.data.profile);
        var status_col = $('<div/>').addClass('status_col span3').text('stopped');
        var engines_col = $('<div/>').addClass('engine_col span3');
        var input = $('<input/>').attr('type','number')
                .attr('min',1)
                .attr('size',3)
                .addClass('engine_num_input');
        engines_col.append(input);
        var start_button = $('<button/>').addClass("btn btn-mini").text("Start");
        var action_col = $('<div/>').addClass('action_col span2').append(
            $("<span/>").addClass("item_buttons btn-group").append(
                start_button
            )
        );
        this.element.empty()
            .append(profile_col)
            .append(status_col)
            .append(engines_col)
            .append(action_col);
        start_button.click(function (e) {
            var n = that.element.find('.engine_num_input').val();
            if (!/^\d+$/.test(n) && n.length>0) {
                status_col.text('invalid engine #');
            } else {
                var settings = {
                    cache : false,
                    data : {n:n},
                    type : "POST",
                    dataType : "json",
                    success : function (data, status, xhr) {
                        that.update_state(data);
                    },
                    error : function (data, status, xhr) {
                        status_col.text("error starting cluster");
                    }
                };
                status_col.text('starting');
                var url = utils.url_join_encode(
                    that.base_url,
                    'clusters',
                    that.data.profile,
                    'start'
                );
                $.ajax(url, settings);
            }
        });
    };


    ClusterItem.prototype.state_running = function () {
        var that = this;
        var profile_col = $('<div/>').addClass('profile_col span4').text(this.data.profile);
        var status_col = $('<div/>').addClass('status_col span3').text('running');
        var engines_col = $('<div/>').addClass('engines_col span3').text(this.data.n);
        var stop_button = $('<button/>').addClass("btn btn-mini").text("Stop");
        var action_col = $('<div/>').addClass('action_col span2').append(
            $("<span/>").addClass("item_buttons btn-group").append(
                stop_button
            )
        );
        this.element.empty()
            .append(profile_col)
            .append(status_col)
            .append(engines_col)
            .append(action_col);
        stop_button.click(function (e) {
            var settings = {
                cache : false,
                type : "POST",
                dataType : "json",
                success : function (data, status, xhr) {
                    that.update_state(data);
                },
                error : function (data, status, xhr) {
                    console.log('error',data);
                    status_col.text("error stopping cluster");
                }
            };
            status_col.text('stopping');
            var url = utils.url_join_encode(
                that.base_url,
                'clusters',
                that.data.profile,
                'stop'
            );
            $.ajax(url, settings);
        });
    };


    IPython.ClusterList = ClusterList;
    IPython.ClusterItem = ClusterItem;

    return IPython;

}(IPython));

