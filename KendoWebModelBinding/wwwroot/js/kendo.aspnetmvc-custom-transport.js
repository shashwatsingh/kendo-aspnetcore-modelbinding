/**
* Taken and modified from kendo.data.aspnetcore.js
* 
* This file does two things: 
*   1) expose parameterMap function: 
*      sends querystring in 'read' dataSource operation that [DataSourceResult] can model-bind.
* 
*   2) add a new schema & transport "custom-webapi":
*      existing transports 'webapi' and 'aspnetmvc-ajax' don't support 
*      transport.(update|create..).url to be a function. This is needed because our APIs have
*      multiple parameters in the URL segment (eg. /orgs/{orgId}/companies/{companyId}/accounts)
*      and these can change depending on the row being edited.
* 
* Kendo doesn't suggest how to do this [see (1)], so are modifying their code for our needs.
* 
* (1): https://www.telerik.com/forums/cannot-bind-grid-to-webapi-having-multiple-url-segments-as-params
*/
(function (window, $, undefined) {
    var kendo = window.kendo,
        escapeQuoteRegExp = /'/ig,
        extend = $.extend,
        isArray = Array.isArray,
        isPlainObject = $.isPlainObject,
        POINT = ".";

    function parameterMap(options, operation, serializationOptions) {
        //console.log('parameterMap', arguments);

        var result = {};

        if (options.sort) {
            result[this.options.prefix + "sort"] = $.map(options.sort, function (sort) {
                return sort.field + "-" + sort.dir;
            }).join("~");

            delete options.sort;
        } else {
            result[this.options.prefix + "sort"] = "";
        }

        if (options.page) {
            result[this.options.prefix + "page"] = options.page;

            delete options.page;
        }

        if (options.pageSize) {
            result[this.options.prefix + "pageSize"] = options.pageSize;

            delete options.pageSize;
        }

        if (options.group) {
            result[this.options.prefix + "group"] = $.map(options.group, function (group) {
                return group.field + "-" + group.dir;
            }).join("~");

            delete options.group;
        } else {
            result[this.options.prefix + "group"] = "";
        }

        if (options.aggregate) {
            result[this.options.prefix + "aggregate"] = $.map(options.aggregate, function (aggregate) {
                return aggregate.field + "-" + aggregate.aggregate;
            }).join("~");

            delete options.aggregate;
        }

        if (options.filter) {
            result[this.options.prefix + "filter"] = serializeFilter(options.filter, serializationOptions.encode);
            if (serializationOptions.caseSensitiveFilter) {
                result["caseSensitiveFilter"] = true;
            }

            delete options.filter;
        } else {
            result[this.options.prefix + "filter"] = "";
            delete options.filter;
        }

        if (!options.groupPaging) {
            delete options.take;
            delete options.skip;
        }

        var serializer = new Serializer(serializationOptions);
        serializer.serialize(result, options, "");

        return result;
    }

    var Serializer = function (options) {
        options = options || {};
        this.culture = options.culture || kendo.culture();
        this.stringifyDates = options.stringifyDates;
        this.decimalSeparator = this.culture.numberFormat[POINT];
    };

    Serializer.prototype = Serializer.fn = {
        serialize: function (result, data, prefix) {
            var valuePrefix;
            for (var key in data) {
                valuePrefix = prefix ? prefix + "." + key : key;
                this.serializeField(result, data[key], data, key, valuePrefix);
            }
        },

        serializeField: function (result, value, data, key, prefix) {
            if (isArray(value)) {
                this.serializeArray(result, value, prefix);
            } else if (isPlainObject(value)) {
                this.serialize(result, value, prefix);
            } else {
                if (result[prefix] === undefined) {
                    result[prefix] = data[key] = this.serializeValue(value);
                }
            }
        },

        serializeArray: function (result, data, prefix) {
            var value, key, valuePrefix;
            for (var sourceIndex = 0, destinationIndex = 0; sourceIndex < data.length; sourceIndex++) {
                value = data[sourceIndex];
                key = "[" + destinationIndex + "]";
                valuePrefix = prefix + key;

                this.serializeField(result, value, data, key, valuePrefix);

                destinationIndex++;
            }
        },

        serializeValue: function (value) {
            if (value instanceof Date) {
                
                // the original kendo implementation checks this flag, like this:
                //    if (this.stringifyDates) {
                //        value = kendo.stringify(value).replace(/"/g, "");
                //    } else {
                //        value = kendo.toString(value, "G", this.culture.name);
                //    }

                // instead, we'll always send the date in iso format, in the local time (whatever the user entered)
                // because all user inputs on the date, when they need the time, will be relative to the customer company
                // they are editing.
                value = kendo.toString(value, "s", this.culture.name);
            } else if (typeof value === "number") {
                value = value.toString().replace(POINT, this.decimalSeparator);
            }
            return value;
        }
    };

    function serializeFilter(filter, encode) {
        if (filter.filters) {
            return $.map(filter.filters, function (f) {
                var hasChildren = f.filters && f.filters.length > 1,
                    result = serializeFilter(f, encode);

                if (result && hasChildren) {
                    result = "(" + result + ")";
                }

                return result;
            }).join("~" + filter.logic + "~");
        }

        if (filter.field) {
            return filter.field + "~" + filter.operator + "~" + encodeFilterValue(filter.value, encode);
        } else {
            return undefined;
        }
    }

    function encodeFilterValue(value, encode) {
        if (typeof value === "string") {
            if (value.indexOf('Date(') > -1) {
                value = new Date(parseInt(value.replace(/^\/Date\((.*?)\)\/$/, '$1'), 10));
            } else {
                value = value.replace(escapeQuoteRegExp, "''");

                if (encode) {
                    value = encodeURIComponent(value);
                }

                return "'" + value + "'";
            }
        }

        if (value && value.getTime) {
            return "datetime'" + kendo.format("{0:yyyy-MM-ddTHH-mm-ss}", value) + "'";
        }
        return value;
    }

    function valueOrDefault(value, defaultValue) {
        return typeof value !== "undefined" ? value : defaultValue;
    }

    function translateGroup(group) {
        var hasSubgroups = group.HasSubgroups || group.hasSubgroups || false;
        var items = group.Items || group.items;
        var itemCount = group.ItemCount || group.itemCount;
        var subgroupCount = group.SubgroupCount || group.subgroupCount;

        return {
            value: valueOrDefault(group.Key, valueOrDefault(group.key, group.value)),
            field: group.Member || group.member || group.field,
            hasSubgroups: hasSubgroups,
            aggregates: translateAggregate(group.Aggregates || group.aggregates),
            items: hasSubgroups ? $.map(items, translateGroup) : items,
            itemCount: itemCount,
            subgroupCount: subgroupCount,
            uid: kendo.guid()
        };
    }

    function translateAggregateResults(aggregate) {
        var obj = {};
        obj[(aggregate.AggregateMethodName || aggregate.aggregateMethodName).toLowerCase()] = valueOrDefault(aggregate.Value, aggregate.value);

        return obj;
    }

    function translateAggregate(aggregates) {
        var functionResult = {},
            key,
            functionName,
            aggregate;

        for (key in aggregates) {
            functionResult = {};
            aggregate = aggregates[key];

            for (functionName in aggregate) {
                functionResult[functionName.toLowerCase()] = aggregate[functionName];
            }

            aggregates[key] = functionResult;
        }

        return aggregates;
    }

    function convertAggregates(aggregates) {
        var idx, length, aggregate;
        var result = {};

        for (idx = 0, length = aggregates.length; idx < length; idx++) {
            aggregate = aggregates[idx];
            result[(aggregate.Member || aggregate.member)] = extend(true, result[(aggregate.Member || aggregate.member)], translateAggregateResults(aggregate));
        }

        return result;
    }

    kendo.data.parameterMap = parameterMap;

    extend(true, kendo.data, {
        schemas: {
            "custom-webapi": kendo.data.schemas["aspnetmvc-ajax"]
        },
        transports: {
            "custom-webapi": kendo.data.RemoteTransport.extend({
                init: function (options) {
                    options = options || {};

                    var that = this;
                    var stringifyDates = (options || {}).stringifyDates;
                    var culture = kendo.cultures[options.culture] || kendo.cultures["en-US"];

                    kendo.data.RemoteTransport.fn.init.call(this, extend(true,
                        {},
                        this.options,
                        options,
                        {
                            parameterMap: function (options, operation) {

                                // parameterMap also handles the dates, by keeping all dates in local time,
                                // instead of the default behaviour of converting it into UTC
                                //
                                // Reason:
                                // All dates/times in the application are customer-company specific.
                                //
                                // Eg:
                                //   - when editing valid value's from/to it is local to the company
                                //   - when editing issued/expiry of passports it is the issuance country
                                //   - when editing validFrom/To it is in the zone of the company

                                let result = parameterMap.call(that, options, operation, {
                                    encode: false,
                                    stringifyDates: true,
                                });

                                if (operation !== 'read') {
                                    // parameterMap returns an object, which helps build the querystring during GET.
                                    // for other operations, we want to send the JSON payload, so convert the object to string

                                    result = kendo.stringify(result);
                                }

                                //console.log('transport.parameterMap', arguments, result);
                                
                                return result;
                            }
                        })
                    );
                },
                options: {
                    read: {
                        type: "GET"
                    },
                    update: {
                        type: "PUT",
                        dataType: "json",
                        // to inform the server the the request body is JSON encoded
                        contentType: "application/json",
                    },
                    create: {
                        type: "POST",
                        dataType: "json",
                        contentType: "application/json",
                    },
                    destroy: {
                        type: "DELETE",
                        dataType: "json",
                    },
                    parameterMap: parameterMap,
                    prefix: ""
                }
            })
        }
    });

})(window, window.kendo.jQuery);