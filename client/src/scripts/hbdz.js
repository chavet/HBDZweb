var map, sld;
var format = new LMWebGIS.Format.SLD();
var vectorLayers = [];
var curSelFeature = null;
var gPopup = null;

//  -----------------------------------   向地图添加点  -------------------------------  //
/*
* Layer style
*/
// we want opaque external graphics and non-opaque internal graphics
LMWebGIS.Feature.Vector.style['default']['strokeWidth'] = '2';
var layer_style = LMWebGIS.Util.extend({}, LMWebGIS.Feature.Vector.style['default']);
layer_style.fillOpacity = 0.2;
layer_style.graphicOpacity = 1;
// allow testing of specific renderers via "?renderer=Canvas", etc
var renderer = LMWebGIS.Util.getParameters(window.location.href).renderer;
renderer = (renderer) ? [renderer] : LMWebGIS.Layer.Vector.prototype.renderers;


// style the sketch fancy
var sketchSymbolizers = {
    "Point": {
        pointRadius: 4,
        graphicName: "square",
        fillColor: "white",
        fillOpacity: 1,
        strokeWidth: 1,
        strokeOpacity: 1,
        strokeColor: "#333333"
    },
    "Line": {
        strokeWidth: 3,
        strokeOpacity: 1,
        strokeColor: "#666666",
        strokeDashstyle: "dash"
    },
    "Polygon": {
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeColor: "#666666",
        fillColor: "white",
        fillOpacity: 0.3
    }
};

var style = new LMWebGIS.Style();
style.addRules([
                new LMWebGIS.Rule({ symbolizer: sketchSymbolizers })
            ]);
var styleMap = new LMWebGIS.StyleMap({ "default": style });

var searchVectorLayer = new LMWebGIS.Layer.Vector("查询绘图", {
    //style: layer_style,
    renderers: renderer
});

var vectorLayer2 = new LMWebGIS.Layer.Vector("统计绘图", {
    //style: layer_style,
    renderers: renderer
});

var mapControls = {
    //绘制单个点
    singleDrawPoint: new LMWebGIS.Control.DrawFeature(
        searchVectorLayer, LMWebGIS.Handler.Point,
        {
            featureAdded: function (event) {//点击查询
                //只保留一个点
                if (searchVectorLayer.features.length > 1) {
                    searchVectorLayer.removeFeatures([searchVectorLayer.features[0]]);
                }
                var centerX = event.geometry.x;
                var centerY = event.geometry.y;
                var left = map.getLonLatFromPixel(new LMWebGIS.Pixel(0, 0));
                var right;
                if (clickSearchRange) {
                    right = map.getLonLatFromPixel(new LMWebGIS.Pixel(clickSearchRange, 0));
                }
                else {
                    right = map.getLonLatFromPixel(new LMWebGIS.Pixel(5, 0));
                }
                var radius = right.lon - left.lon;
                currentSinglePoint.x = centerX;
                currentSinglePoint.y = centerY;
                currentSinglePoint.radius = radius;
                var url = currentResutlPageURL + currentParams;
                url += "&searchType=" + currentSearchType + "&centerX=" + centerX + "&centerY=" + centerY + "&radius=" + radius + "&GridCodes=0&lev=1&sType=SelectByHitting&op=SelectByHittingAndAtt";
                //发送请求，搜索附近的要素ID
                Ext.Ajax.request({
                    url: url,
                    success: function (resp, opts) {
                        var TubeAnalysisFid;
                        try {
                            TubeAnalysisFid = eval(resp.responseText);
                        } catch (ex) {
                            //alert("请重新选择");
                            return;
                        }
                        if (!TubeAnalysisFid) {
                            return;
                        }
                        var TubeAnalysisStore = Ext.getCmp('TubeAnalysisGrid_id').getStore();
                        var Model = Ext.getCmp('TubeAnalysisGrid_id').getSelectionModel()
                        TubeAnalysisStore.loadData(TubeAnalysisFid, false);
                        Model.selectRange(0, 0, true);
                    },
                    failure: function (resp, opts) {
                    }
                });
            }
        }
    ),

    //绘制两点
    doubleDrawPoint: new LMWebGIS.Control.DrawFeature(
        searchVectorLayer, LMWebGIS.Handler.Point,
        {
            featureAdded: function (event) {
                //只保留两个点
                var isRightToLeft = false;
                if (searchVectorLayer.features.length > 2) {
                    searchVectorLayer.removeFeatures([searchVectorLayer.features[0]]);

                    isRightToLeft = true;
                }
                //
                var centerX = event.geometry.x;
                var centerY = event.geometry.y;
                var left = map.getLonLatFromPixel(new LMWebGIS.Pixel(0, 0));
                var right;
                if (clickSearchRange) {
                    right = map.getLonLatFromPixel(new LMWebGIS.Pixel(clickSearchRange, 0));
                }
                else {
                    right = map.getLonLatFromPixel(new LMWebGIS.Pixel(5, 0));
                }
                var radius = right.lon - left.lon;

                var url = currentResutlPageURL + currentParams;
                url += "&searchType=" + currentSearchType + "&centerX=" + centerX + "&centerY=" + centerY + "&radius=" + radius + "&GridCodes=0&lev=1&sType=SelectByHitting&op=SelectByHittingAndAtt";
                //发送请求，搜索附近的要素ID
                Ext.Ajax.request({
                    url: url,
                    success: function (resp, opts) {
                        var AnalysisFid;
                        try {
                            AnalysisFid = eval(resp.responseText);
                        }
                        catch (ex) {
                            return;
                        }
                        if (!AnalysisFid) {
                            return;
                        }
                        var AnalysisStore = Ext.getCmp('AnalysisGrid_id').getStore();
                        var AnalysisStore2 = Ext.getCmp('AnalysisGrid_id2').getStore();
                        var Model = Ext.getCmp('AnalysisGrid_id').getSelectionModel()
                        var Model2 = Ext.getCmp('AnalysisGrid_id2').getSelectionModel()
                        if (searchVectorLayer.features.length == 1) {//添加到左侧列表
                            AnalysisStore.loadData(AnalysisFid, false);
                            Model.selectRange(0, 0, true);
                        }
                        else {
                            if (isRightToLeft) {//右侧移到左侧，添加到右侧列表
                                var RightData = [];
                                for (var i = 0; i < AnalysisStore2.data.items.length; i++) {
                                    ID = AnalysisStore2.data.items[i].data.ID;
                                    RightData[i] = [ID];
                                }
                                //alert(RightData);
                                AnalysisStore.loadData(RightData, false);

                                AnalysisStore2.loadData(AnalysisFid, false);
                                Model.selectRange(0, 0, true);
                                Model2.selectRange(0, 0, true);

                            }
                            else {//添加到右侧列表
                                AnalysisStore2.loadData(AnalysisFid, false);
                                Model2.selectRange(0, 0, true);
                            }
                        }
                        //alert(resp.responseText);
                        //加到要素列表
                    },
                    failure: function (resp, opts) {
                        //var respText = Ext.util.JSON.decode(resp.responseText);   
                        //Ext.Msg.alert('错误', respText.error);
                        //Ext.MessageBox.hide();
                        //alert("failure" + resp);
                    }
                });
            }
        }
    ),
    printDrawBox: new LMWebGIS.Control.DrawFeature(searchVectorLayer,
                        LMWebGIS.Handler.RegularPolygon, {
                            handlerOptions: {
                                sides: 4,
                                irregular: true
                            },
                            featureAdded: function (event) {//画矩形框查询
                                var bounds = event.geometry.getBounds();
                                var coord = Ext.getCmp('printRangeCoordinate');
                                if (coord) {
                                    coord.setValue(bounds.left + "," + bounds.bottom + "," + bounds.right + "," + bounds.top);
                                }
                            }

                        }
                    ),
    searchDrawPoint: new LMWebGIS.Control.DrawFeature(
        searchVectorLayer, LMWebGIS.Handler.Point,
        {
            featureAdded: function (event) {//点击查询
                var centerX = event.geometry.x;
                var centerY = event.geometry.y;
                var left = map.getLonLatFromPixel(new LMWebGIS.Pixel(0, 0));
                var right;
                if (clickSearchRange) {
                    right = map.getLonLatFromPixel(new LMWebGIS.Pixel(clickSearchRange, 0));
                }
                else {
                    right = map.getLonLatFromPixel(new LMWebGIS.Pixel(5, 0));
                }
                var radius = right.lon - left.lon;
                //var url = "MapGIS/MapGISSearchOL.ashx?" + currentParams; //currentResutlPageURL;
                var url = currentResutlPageURL + currentParams;
                url += "&searchType=" + currentSearchType + "&centerX=" + centerX + "&centerY=" + centerY + "&radius=" + radius + "&GridCodes=0&lev=1&sType=SelectByHitting&op=SelectByHittingAndAtt";
                searchAndShow(url, currentSearchType);

                toggleMapControl("", false);

                searchVectorLayer.removeAllFeatures();
            }
        }
    ),
    searchDrawLine: new LMWebGIS.Control.DrawFeature(
        searchVectorLayer, LMWebGIS.Handler.Path,
        {
            featureAdded: function (event) {//画线查询
                var nodes = event.geometry.getVertices();
                if (nodes.length == 0) {
                    return;
                }
                var XArray = "";
                var YArray = "";

                for (i in nodes) {
                    XArray += nodes[i].x + ",";
                    YArray += nodes[i].y + ",";
                }
                XArray = XArray.substr(0, XArray.length - 1);
                YArray = YArray.substr(0, YArray.length - 1);
                //var url = "MapGIS/MapGISSearchOL.ashx?" + currentParams; //currentResutlPageURL;
                var url = currentResutlPageURL + currentParams;
                url += "&searchType=" + currentSearchType + "&XArray=" + XArray + "&YArray=" +
                     YArray + "&GridCodes=0,2&lev=1&sType=SelectByLine&op=SelectByPolygonAndAtt";
                searchAndShow(url, currentSearchType);

                toggleMapControl("", false);

                searchVectorLayer.removeAllFeatures();
            }
        }
    ),
    searchDrawPolygon: new LMWebGIS.Control.DrawFeature(
        searchVectorLayer, LMWebGIS.Handler.Polygon,
        {
            featureAdded: function (event) {//画多边形查询
                var nodes = event.geometry.getVertices();

                if (nodes.length == 0) {
                    return;
                }
                var XArray = "";
                var YArray = "";

                for (i in nodes) {
                    XArray += nodes[i].x + ",";
                    YArray += nodes[i].y + ",";
                }
                XArray = XArray.substr(0, XArray.length - 1);
                YArray = YArray.substr(0, YArray.length - 1);
                //var url = "MapGIS/MapGISSearchOL.ashx?"+ currentParams; //currentResutlPageURL;
                var url = currentResutlPageURL + currentParams;
                url += "&searchType=" + currentSearchType + "&XArray=" + XArray + "&YArray=" + YArray +
                    "&GridCodes=0,2&lev=1&sType=SelectByPolygon&op=SelectByPolygonAndAtt";
                searchAndShow(url, currentSearchType);

                toggleMapControl("", false);

                searchVectorLayer.removeAllFeatures();
            }
        }
    ),
    searchDrawBox: new LMWebGIS.Control.DrawFeature(searchVectorLayer,
                        LMWebGIS.Handler.RegularPolygon, {
                            handlerOptions: {
                                sides: 4,
                                irregular: true
                            },
                            featureAdded: function (event) {//画矩形框查询
                                var bounds = event.geometry.getBounds();

                                var startX = bounds.left;
                                var startY = bounds.bottom;
                                var endX = bounds.right;
                                var endY = bounds.top;
                                //var url = "MapGIS/MapGISSearchOL.ashx?" + currentParams; //currentResutlPageURL;
                                var url = currentResutlPageURL + currentParams;
                                url += "&searchType=" + currentSearchType + "&startX=" + startX + "&startY=" +
                                        startY + "&endX=" + endX + "&endY=" + endY + "&GridCodes=0,2&lev=1&sType=SelectByRect&op=SelectByRectAndAtt";
                                searchAndShow(url, currentSearchType);

                                toggleMapControl("", false);

                                searchVectorLayer.removeAllFeatures();
                            }

                        }
                    ),
    searchDrawCircle: new LMWebGIS.Control.DrawFeature(searchVectorLayer,
                         LMWebGIS.Handler.RegularPolygon, {
                             handlerOptions: {
                                 sides: 40,
                                 irregular: false
                             },
                             featureAdded: function (event) {//画圆查询
                                 var bounds = event.geometry.getBounds();
                                 var centerX = bounds.getCenterLonLat().lon;
                                 var centerY = bounds.getCenterLonLat().lat;
                                 var radius = bounds.getWidth() / 2;

                                 //var url = "MapGIS/MapGISSearchOL.ashx?" + currentParams; //currentResutlPageURL;
                                 var url = currentResutlPageURL + currentParams;
                                 url += "&searchType=" + currentSearchType + "&centerX=" + centerX + "&centerY=" + centerY +
                                        "&radius=" + radius + "&GridCodes=0,2&lev=1&sType=SelectByCircle&op=SelectByCircleAndAtt";
                                 searchAndShow(url, currentSearchType);

                                 toggleMapControl("", false);

                                 searchVectorLayer.removeAllFeatures();
                             }
                         }),
    select: new LMWebGIS.Control.SelectFeature(
        searchVectorLayer,
        {
            clickout: false,
            toggle: true,
            multiple: false,
            hover: true,
            toggleKey: "ctrlKey", // ctrl key removes from selection
            multipleKey: "shiftKey", // shift key adds to selection
            box: true
        }
    ),
    selecthover: new LMWebGIS.Control.SelectFeature(
        searchVectorLayer,
        {
            multiple: false, hover: true,
            toggleKey: "ctrlKey", // ctrl key removes from selection
            multipleKey: "shiftKey" // shift key adds to selection
        }
    ),
    //clickSearch: new LMWebGIS.Control.Click(),
    measureLine: new LMWebGIS.Control.Measure(
                    LMWebGIS.Handler.Path, {
                        persist: true,
                        handlerOptions: {
                            layerOptions: {
                                renderers: renderer,
                                styleMap: styleMap
                            }
                        }
                    }
                ),
    measurePolygon: new LMWebGIS.Control.Measure(
                    LMWebGIS.Handler.Polygon, {
                        persist: true,
                        handlerOptions: {
                            layerOptions: {
                                renderers: renderer,
                                styleMap: styleMap
                            }
                        }
                    }
                )
};

mapControls['measureLine'].events.on({
    "measure": handleMeasurements,
    "measurepartial": handleMeasurements
});
mapControls['measurePolygon'].events.on({
    "measure": handleMeasurements,
    "measurepartial": handleMeasurements
});
function handleMeasurements(eve) {
    var geometry = eve.geometry;
    var units = eve.units;
    var order = eve.order;
    var measure = eve.measure;
    var element = document.getElementById('toolTips');
    var out = "";
    if (order == 1) {
        //<b style='color:#f00;'>这是段落。</b>
        out += "<b style='color:#f00;'>长度: " + measure.toFixed(3) + " " + units + "</b>";
    } else {
        out += "<b style='color:#f00;'>面积: " + measure.toFixed(3) + " " + units + "<sup>2</" + "sup>" + "</b>";
    }
    element.innerHTML = out;
    //alert(out);
}



function toggleMapControl(value, checked) { // value -- select  / checked - true

    var toolTipEle = document.getElementById('toolTips');
    if (value == 'measureLine' || value == 'measurePolygon') {
        toolTipEle.style.display = 'block';
    }
    else {
        toolTipEle.style.display = 'none';
    }

    for (key in mapControls) {
        var control = mapControls[key];
        if (value == key && checked) {
            control.activate();
        } else {
            control.deactivate();
        }
    }
}

//图层的名称必须与样式档（sld文）中相应的NamedLayer的名称（name）保持一致
var layerData = [
	{
		name: "地震前兆台站",
		gml: "Data/station_gml.gml"
	}
];
//var arrTreeData = new Array();
function log(msg) {
    if (!log.timer) {
        result.innerHTML = "";
        log.timer = window.setTimeout(function () { delete log.timer; }, 100);
    }
    result.innerHTML += msg + "<br>";
}

var HighlightDatas = {
    "13109":["13109-1-4112", "13109-1-4312", "13109-1-9130", "13109-3-9110", "13109-3-9130", "13109-3-9140"],
    "13103":["13103-1-4112", "13103-1-4312", "13103-1-9130"],
    "13104":["13104-1-4112", "13104-2-4312", "13104-3-9110", "13104-3-9130", "13104-3-9140"],
    "13105":["13105-1-4112", "13105-1-4312", "13105-1-9130"],
    "13106":["13106-1-4112", "13106-2-4312", "13106-3-9110", "13106-3-9130", "13106-3-9140"],
    "13148":["13148-1-4112", "13148-1-4312", "13148-1-9130"],
    "13024":["13024-1-3127", "13024-1-3124", "13024-1-3125"],
    "13146":["13146-1-3127", "13146-1-3124", "13146-1-3125"]
};

//===============================================================================
//选择要素
function onFeatureSelect(e) {
    if (curSelFeature) {
        if (curSelFeature.popup) {
            onPopupClose();
        }
    }
    curSelFeature = e.feature;
    //curSelFeature.renderIntent = "select";
    //curSelFeature.layer.drawFeature(curSelFeature);
    var iColor = 0;
    var innerHtml = "<table  style = 'border:0px solid black;opacity:0.8;filter:alpha(opacity=80);width:300px;'>  <tr bgcolor='#7D9EC0'>  <th style = 'width:70px;'>属性</th>  <th>数值</th> </tr> "
    for (var p in curSelFeature.attributes) {
        var name = p; //属性名称   
        var value = curSelFeature.attributes[p]; //属性对应的值
		if(name == "id"){
			//var ary = HighlightDatas[value];
			window.highlight(HighlightDatas[value]);
		}
        if (iColor % 2 == 0) {
            innerHtml += "<tr align=center style='background-color:#ffffff;'>  <td>" + name + "：</td>  <td>" + value + "</td> </tr>";
        }
        if (iColor % 2 == 1) {
            innerHtml += "<tr align=center style='background-color:#ADD8E6;'>  <td>" + name + "：</td>  <td>" + value + "</td> </tr>";
        }
        iColor++;
    }
    var lonlat = curSelFeature.geometry.getBounds().getCenterLonLat();
    gPopup = new LMWebGIS.Popup.FramedCloud("chicken",
	                         lonlat,
	                         null,
	                         innerHtml,
	                         null, true, onPopupClose);
    curSelFeature.popup = gPopup;
    map.addPopup(gPopup);
}
//关闭tooltip框
function onPopupClose() {
    map.removePopup(curSelFeature.popup);
    curSelFeature.popup.destroy();
    curSelFeature.popup = null;
	window.resetHighlight();
}




//=====================================================================================================
function initMap() {
    //创建地图
    map = new LMWebGIS.Map('map', {
        allOverlays: true,
		maxExtent: new LMWebGIS.Bounds(73.447,6.31864,135.086,53.5579),
		units:'dd',
		scales: [10000000, 7000000, 5000000, 3000000, 2000000, 1500000, 1000000]
        , eventListeners: {
            featureclick: onFeatureSelect//,
            //featureout: onFeatureUnselect
            //PopupClose: onFeatureUnselect
            ////        //featureover: onOverFeature,
            ////        //nofeatureclick: hideToolTips
        }
    });

    //QGIS Server 华东区域图层
    var BaseMapLayer = new LMWebGIS.Layer.WMS(
        "河北底图",
        "http://120.25.157.19:8095/lavimap/qgis_mapserv.fcgi.exe",
        {
            layers: ['guojie','shengjie','hebeidijishi','hebeixianji'],
            map: 'D:/HBDZ/QGIS-Server/BaseMap/HeBeiBaseMap.qgs',
            format: 'png',
            transparent:true
        },
        {
            reproject: false,
            gutter: 5,
            buffer: 0,
            isBaseLayer: false,
            visibility: true
        }
    );

    map.addLayer(BaseMapLayer);
    //添加变化图层
    vectorLayers = createLayers(layerData);
    map.addLayers(vectorLayers);

    //异步获取样式
	LMWebGIS.Request.GET({
        url: "SLD/Map.sld.xml",
        success:function (req) {
                    analyzeSLD(req.responseText);
                    map.zoomToExtent(new LMWebGIS.Bounds(112.06,35.20,120.46,43.45));
                }
    });
	
    document.getElementById("LMWebGIS_Control_Zoom_81").hidden = true;

    //其他控件
    map.addControl(new LMWebGIS.Control.PanZoomBar({
        position: new LMWebGIS.Pixel(2, 15)
    }));
    map.addControl(new LMWebGIS.Control.Navigation());
}



/* //
//创建图层
function createLayers(layerData) {
    //创建StyleMap类型的图层
    var vecLayers = [];
    for (var i = 0, ii = layerData.length; i < ii; ++i) {
        vecLayers.push(new LMWebGIS.Layer.Vector(
            layerData[i].name,
			{
			    protocol: new LMWebGIS.Protocol.HTTP({
			        url: layerData[i].gml,
			        format: new LMWebGIS.Format.GML.v2()
			    }),
			    strategies: [new LMWebGIS.Strategy.Fixed()],
			    styleMap: new LMWebGIS.StyleMap()
			}
        ));
    }
    return vecLayers;
} */

//重新设置图层样式
function resetLayerSLD() {
    var SLDurl;
    if (window.isWarn) {
        SLDurl = "SLD/Map_warn.sld.xml";
    }else{
        SLDurl = "SLD/Map.sld.xml";
    }
    LMWebGIS.Request.GET({
        url: SLDurl,
        success:function (req) {
            analyzeSLD(req.responseText);
            map.zoomToExtent(new LMWebGIS.Bounds(112.06,35.20,120.46,43.45));
        }
    });
}

//设置台站样式
function setStationStyle(warnStations) {
    for (var k = 0, n = warnStations.length; k < n; k++) {
        var itemId = warnStations[k];
        for (var i = 0, l =map.layers.length; i < l; i++) {
            if (map.layers[i].name != "地震前兆台站") {
                continue;
            };
            for (var j = 0, m = map.layers[i].features.length; j < m; j++) {
                var tempFeature = map.layers[i].features[j];
                if(tempFeature.attributes.id != itemId){
                    continue;
                }
                tempFeature.renderIntent = "select";
                break;
            };
        };
    };
    map.zoomTo(3);
}

function clearStationStyle() {
    for (var i = 0, l =map.layers.length; i < l; i++) {
        if (map.layers[i].name != "地震前兆台站") {
            continue;
        };
        for (var j = 0, m = map.layers[i].features.length; j < m; j++) {
            map.layers[i].features[j].renderIntent = "default";
        };
    };
    map.zoomTo(2);
}

//设置图层风格
function setLayerStyles() {
    //为每一个图层设置默认的风格
    for (var l in sld.namedLayers) {
        var styles = sld.namedLayers[l].userStyles, style;
        for (var i = 0; i < styles.length; i++) {
            style = styles[i];
            var layers = map.getLayersByName(l);
            for (var layer in layers) {
                if (layers[layer].styleMap) {
                    if (style.isDefault) {
                        layers[layer].styleMap.styles["default"] = style;
                    }
                    else {
                        layers[layer].styleMap.styles["select"] = style;
                    }
                }
            }
        }
    }
}
//解析样式
function analyzeSLD(sldText) {
    sld = format.read(sldText);
    setLayerStyles();
}

//

//隐藏提示框
function hideToolTips() {
    var toolTipEle = document.getElementById('toolTips');
    if (toolTipEle) {
        toolTipEle.style.display = 'none';
    }
}



