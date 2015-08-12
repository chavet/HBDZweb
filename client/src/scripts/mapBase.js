//
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
}

//设置图层风格
function setLayerStyles() {
    //为每一个图层设置默认的风格
    for (var l in sld.namedLayers) {
        var styles = sld.namedLayers[l].userStyles, style;
        for (var i = 0; i < styles.length; i++) {
            style = styles[i];
            if (style.isDefault) {
                if (map.getLayersByName(l)[0].styleMap) {
                    map.getLayersByName(l)[0].styleMap.styles["default"] = style;
                }

            }
            else {
                if (map.getLayersByName(l)[0].styleMap) {
                    map.getLayersByName(l)[0].styleMap.styles["select"] = style;
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

//隐藏提示框
function hideToolTips() {
    var toolTipEle = document.getElementById('toolTips');
    if (toolTipEle) {
        toolTipEle.style.display = 'none';
    }
}