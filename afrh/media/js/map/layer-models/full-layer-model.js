define([
    'jquery',
    'openlayers',
    'underscore',
    'arches',
    'map/layer-models/base-layer-model',
    'utils'
], function($, ol, _, arches, LayerModel, utils) {
    return function(config, featureCallback) {
        config = _.extend({
            entitytypeid: 'all',
            vectorColor: '#808080'
        }, config);

        if (config.showPolygons == true) {
            var layer = function () {
                var fillrgb = utils.hexToRgb(config.fillColor);
                var strokergb = utils.hexToRgb(config.strokeColor);
                var zIndex = 0;
                var styleCache = {};

                var polyStyle = function(feature, resolution) {
                    var mouseOver = feature.get('mouseover');
                    var text = '1 ' + mouseOver;

                    if (!feature.get('arches_marker')) {
                        feature.set('arches_marker', true);
                    }

                    if (styleCache[text]) {
                        return styleCache[text];
                    }
                    
                    var iconSize = mouseOver ? 38 : 32;

                    var styles = [new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'rgba(' + strokergb.r + ',' + strokergb.g + ',' + strokergb.b + ',0.9)',
                            width: 2
                        }),
                        fill: new ol.style.Fill({
                            color: 'rgba(' + fillrgb.r + ',' + fillrgb.g + ',' + fillrgb.b + ',0.45)'
                        }),
                        zIndex: mouseOver ? zIndex*1000000000: zIndex
                    })];
                    
                    zIndex += 2;

                    styleCache[text] = styles;
                    return styles;
                };

                var layerConfig = {
                    projection: 'EPSG:3857'
                };
                
                if (config.entitytypeid !== null) {
                    layerConfig.url = arches.urls.polygon_layers + config.entitytypeid;
                }

                json_source = new ol.source.GeoJSON(layerConfig)
                
                $('.map-loading').show();
                var loadListener = json_source.on('change', function(e) {
                    if (json_source.getState() == 'ready') {
                        if(typeof(featureCallback) === 'function'){
                            featureCallback(json_source.getFeatures());
                        }
                        ol.Observable.unByKey(loadListener);
                        $('.map-loading').hide();
                    }
                });
                
                output_layer = new ol.layer.Vector({
                    source: json_source,
                    style: polyStyle
                });
                
                return output_layer
            };
            
        } else {     
        
            var layer = function () {
                var rgb = utils.hexToRgb(config.vectorColor);
                var zIndex = 0;
                var styleCache = {};

                var style = function(feature, resolution) {
                    var mouseOver = feature.get('mouseover');
                    var text = '1 ' + mouseOver;

                    if (!feature.get('arches_marker')) {
                        feature.set('arches_marker', true);
                    }

                    if (styleCache[text]) {
                        return styleCache[text];
                    }
                    
                    var iconSize = mouseOver ? 38 : 32;

                    var styles = [new ol.style.Style({
                        text: new ol.style.Text({
                            text: arches.resourceMarker.icon,
                            font: 'normal ' + iconSize + 'px ' + arches.resourceMarker.font,
                            offsetX: 5,
                            offsetY: ((iconSize/2)*-1)-5,
                            fill: new ol.style.Fill({
                                color: 'rgba(126,126,126,0.3)',
                            })
                        }),
                        zIndex: mouseOver ? zIndex*1000000000: zIndex
                    }), new ol.style.Style({
                        text: new ol.style.Text({
                            text: arches.resourceMarker.icon,
                            font: 'normal ' + iconSize + 'px ' + arches.resourceMarker.font,
                            offsetY: (iconSize/2)*-1,
                            stroke: new ol.style.Stroke({
                                color: 'white',
                                width: 3
                            }),
                            fill: new ol.style.Fill({
                                color: 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.9)',
                            })
                        }),
                        zIndex: mouseOver ? zIndex*2000000000 : zIndex+1
                    })];

                    zIndex += 2;

                    styleCache[text] = styles;
                    return styles;
                };

                var layerConfig = {
                    projection: 'EPSG:3857'
                };
                
                if (config.entitytypeid !== null) {
                    layerConfig.url = arches.urls.map_markers + config.entitytypeid;
                    console.log(layerConfig.url);
                }

                var source = new ol.source.GeoJSON(layerConfig);

                $('.new-map-loading').show();
                var loadListener = source.on('change', function(e) {
                    if (source.getState() == 'ready') {
                        if(typeof(featureCallback) === 'function'){
                            featureCallback(source.getFeatures());
                        }
                        ol.Observable.unByKey(loadListener);
                        $('.new-map-loading').hide();
                    }
                });

                var clusterSource = new ol.source.Cluster({
                    distance: 5,
                    source: source
                });

                var clusterStyle = function(feature, resolution) {
                    var size = feature.get('features').length;
                    var mouseOver = feature.get('mouseover');
                    var text = size + ' ' + mouseOver;

                    if (!feature.get('arches_cluster')) {
                        feature.set('arches_cluster', true);
                    }

                    if (styleCache[text]) {
                        return styleCache[text];
                    }

                    var radius = mouseOver ? 12 : 10;

                    if (size === 1) {
                        return style(feature, resolution);
                    }

                    if (size > 200) {
                        radius = mouseOver ? 20 : 18;
                    } else if (size > 150) {
                        radius = mouseOver ? 18 : 16;
                    } else if (size > 100) {
                        radius = mouseOver ? 16 : 14;
                    } else if (size > 50) {
                        radius = mouseOver ? 14 : 12;
                    }

                    var stStyle = [
                        new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: 3,
                                fill: new ol.style.Fill({
                                  color: '#000000',
                                  opacity: 0.6
                                }),
                                stroke: new ol.style.Stroke({
                                  color: '#ffffff',
                                  opacity: 0.4
                                })
                           })
                        })
                    ];
                    styleCache[text] = stStyle;
                    return stStyle;
                };

                var clusterLayer = new ol.layer.Vector({
                    source: clusterSource,
                    style: clusterStyle,
                    is_arches_layer: true,
                });

                clusterLayer.vectorSource = source;
                clusterLayer.set('is_arches_layer', true);
                clusterLayer.set('name', config.entitytypeid);

                return clusterLayer;
            };
        }
        
        return new LayerModel(_.extend({
                layer: layer,
                onMap: true,
                isArchesLayer: true
            }, config)
        );
    };
});