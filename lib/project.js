var caz_json, cod_json, le_json, ph_json, se_json, map_json, color_json;

var _gObjs = {};
_gObjs.curNodeCache = null;
_gObjs.track = [];
_gObjs.count = 0;
_gObjs.communityArea = "Community-Area";
_gObjs.communityAreaNumber = "Community-Area-Number";
_gObjs.mapNodes = [];
_gObjs.curMapCommunity = null;
_gObjs.selectedElementStrokeColor = "red";
_gObjs.selectedElementStrokeWidth = "6";


loadData();

$(function () {
    
    $("table.accordion").on("click", function () {

        var chevron = $(this).find("img.chevron");
        
        if (chevron.attr("src") == "./graphics/chevron-u.png") {
            chevron.attr("src", "./graphics/chevron-d.png");
        }
        else {
            chevron.attr("src", "./graphics/chevron-u.png");
        }

        var panel = $(this).next()
        panel.fadeToggle(1000);

        return false;
    })
});

function main() {
    // colorChart();

    generateMap(map_json);

    generateOptionList();
}

function generateOptionList() {
    var cod_json_fields = Object.keys(cod_json[0]);
    cod_json_fields.shift(); //remove the first key
    cod_json_fields.shift(); //remove the first key

    var le_json_fields = Object.keys(le_json[0]);
    le_json_fields.shift(); //remove the first key
    le_json_fields.shift(); //remove the first key

    var ph_json_fields = Object.keys(ph_json[0]);
    ph_json_fields.shift(); //remove the first key
    ph_json_fields.shift(); //remove the first key

    var se_json_fields = Object.keys(se_json[0]);
    se_json_fields.shift(); //remove the first key
    se_json_fields.shift(); //remove the first key

    buildCbxList(cod_json_fields, 'cod');
    // buildCbxList(le_json_fields, 'le');
    buildCbxList(ph_json_fields, 'ph');
    buildCbxList(se_json_fields, 'se');

}

function cleanField(field) {
    var text = field.replace(/-/g, " ");
    text = text.replace(/\s+/g, " ");
    return text;
}

function buildCbxList(fields, id) {

    var field_names = [];
    var texts = [];

    for (field in fields) {
        var field = fields[field];
        field_names.push(field);
        texts.push(cleanField(field))
    }

    var odd = (fields.length % 2 == 1);
    var numFields = fields.length;
    if (odd) {
        numFields = fields.length - 1;
    }

    html = "<table>"

    for (var i = 0; i < numFields; i = i + 2) {
        var tr = '<tr>';
        tr += '<td><label><input type="checkbox" name="' + id + '_cbxstats[]" value="' + field_names[i] + '"> ' + texts[i] + '</label></td>';
        tr += '<td><label><input type="checkbox" name="' + id + '_cbxstats[]" value="' + field_names[i + 1] + '"> ' + texts[i + 1] + '</label></td>';
        tr += '</tr>';
        html += tr;
    }

    if (odd) {
        i = numFields;
        var tr = '<tr>';
        tr += '<td><label><input type="checkbox" name="' + id + '_cbxstats[]" value="' + field_names[i] + '"> ' + texts[i] + '</label></td>';
        tr += '<td></td>';
        tr += '</tr>';
        html += tr;
    }

    html += "</table>";

    $("div#" + id).html(html);

    $("input[name='" + id + "_cbxstats[]']").on('click', function () {
        statsCheckBox($(this));
    });
}

function statsCheckBox(cbx) {

    var field = cbx.val();
    var id = (cbx.attr("name")).split("_")[0];
    var data_json = id + "_json";
    var dataset = eval(data_json);
    var conId = id + "_dc";
    var elementId = id + "_" + field;
    var chartElement = $("div#" + elementId);

    if (cbx.is(":checked")) {

        if (chartElement.length == 0) {

            var text = cleanField(field)
            var chartData = getDataCommunityAreaVsKeyForChart(dataset, field);
            var title = cleanField(_gObjs.communityArea) + " vs. " + text;

            //not found chart
            var conElement = $("div#" + conId);

            conElement.append($('<div id="' + elementId + '" width="1000" height="400"></div>'));
            generateChart(chartData, elementId, title, true);
        }
        else {
            $("div#" + elementId).show();
        }
    }
    else {
        if (chartElement.length > 0) {
            chartElement.hide();

        }
    }

}

function loadData() {
    se_json = "./download_data/Census_Data_-_Selected_socioeconomic_indicators_in_Chicago_2008_2012.csv";
    le_json = "./download_data/Public_Health_Statistics-_Life_Expectancy_By_Community_Area.csv";
    ph_json = "./download_data/Public_Health_Statistics-_Selected_public_health_indicators.csv";
    cod_json = "./download_data/Public_Health_Statistics-_Selected_underlying_causes_of_death_2006_2010.csv";
    caz_json = "./download_data/Community_area_zipcode.csv";
    color_json = "./download_data/color.csv";
    $.when(
        $.ajax({
            url: se_json,
            success: function (data) {
                se_json = JSON.parse(JSON.stringify($.csv.toObjects(data)));
            }
        }),
        $.ajax({
            url: le_json,
            success: function (data) {
                le_json = JSON.parse(JSON.stringify($.csv.toObjects(data)));
            }
        }),
        $.ajax({
            url: ph_json,
            success: function (data) {
                ph_json = JSON.parse(JSON.stringify($.csv.toObjects(data)));
            }
        }),
        $.ajax({
            url: cod_json,
            success: function (data) {
                cod_json = JSON.parse(JSON.stringify($.csv.toObjects(data)));
            }
        }),
        $.ajax({
            url: caz_json,
            success: function (data) {
                caz_json = JSON.parse(JSON.stringify($.csv.toObjects(data)));
            }
        }),
        $.ajax({
            url: color_json,
            success: function (data) {
                color_json = JSON.parse(JSON.stringify($.csv.toObjects(data)));
            }
        }),
        $.getJSON("./download_data//chicago_zctas.json", function (data) { map_json = data; })

    ).then(function () {
        if (caz_json && cod_json && le_json && ph_json && se_json && map_json && color_json) {
            main();
        }
    }).fail(function () {
        alert("could not load all needed data.")
    });
}

function generateChart(data, svgId, title, border = false) {
    var div = d3.select("div#" + svgId);
    var style = "width: " + div.attr("width") + "px; margin-left: auto; margin-right:auto;";
    if (border) {
        style += "border: .1px dashed #d0d0d0;"
    }
    div.attr("style", style);
    div.append("h3")
        .html(title)
        .attr("class", "chartTitle")

    var svg = div.append("svg");
    svg.attr("id", "svg_" + svgId);
    svg.attr("width", div.attr("width") - 2);
    svg.attr("height", div.attr("height") - 2);

    var margin = { top: 50, right: 50, bottom: 150, left: 50 },
        width = svg.attr("width") - margin.left - margin.right,
        height = svg.attr("height") - margin.top - margin.bottom,
        padding = 0.2;

    data.sort(function (a, b) {
        return d3.descending(a.value, b.value)
    })

    var x = d3.scaleBand()
        .range([0, width])
        .padding(padding)

    var y = d3.scaleLinear().range([height, 0]);

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    var yScaleMax = d3.max(data, function (d) { return d.value; });
    var tickMarkValues = generateTickMarkValues(yScaleMax);
    yScaleMax = tickMarkValues[0];

    x.domain(data.map(function (d) { return d.key; }));
    y.domain([0, yScaleMax]);

    var xAxis = d3.axisBottom(x)
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");

    var yAxis = d3.axisLeft(y)
        .ticks(5, "d")
        .tickValues(tickMarkValues);

    g.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis)
        .append("text")
        .attr("y", 6)
        .attr("x", 9)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("Frequency");


    var bars = g.selectAll(".bar")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "bar");

    bars.append("rect")
        .attr("x", function (d) { return x(d.key); })
        .attr("y", function (d) { return y(d.value); })
        .attr("fill", function (d) { return d.color })
        .attr("id", function (d) {
            return d.can
        })
        .attr("stroke", function (d) {
            if (_gObjs.curMapCommunity != null) {
                if (_gObjs.curMapCommunity.can == d.can) {
                    d3.select(this).attr("stroke-width", _gObjs.selectedElementStrokeWidth)
                    return _gObjs.selectedElementStrokeColor;
                }
                return "";
            }
        })
        .attr("width", x.bandwidth())
        //.attr("height", function (d) { return height - y(d.value) })        
        .attr("height", function (d) { return height - y(0) })
        .on("mouseover", function (d, i) {
            d3.select(this).attr("fill", function () {
                return d.color + "75";
            });

        })
        .on("mouseout", function (d, i) {
            d3.select(this).attr("fill", function () {
                return d.color;
            });
        })


    // bars.selectAll("rect")
    //     .transition()
    //     .duration(1000)
    //     .attr("width", x.bandwidth())
    //     .delay(function(d,i){return(i+1)*200})

    bars.selectAll("rect")
        .transition()
        .duration(1000)
        .attr("height", function (d) { return height - y(d.value); })
        .delay(function (d, i) { return (i + 1) * 250 })

    bars.append("text")
        .text(function (d) { return d3.format(".1f")(d.value); })
        .attr('transform', 'rotate(-90)')
        .attr("y", function (d) { return x(d.key) + x.bandwidth() / 2 + 2; })
        .attr("x", function (d) { return -y(d.value) + 6; })
        .attr("class", "barinfo")
        .attr("fill", function (d) { return d.color })
}

function generateTickMarkValues(max) {
    var marks = []
    var offset = 5;

    if (max <= 100) {
        offset = 5;
    }
    else {
        offset = max / 20;
        var h = parseInt(max / 100);
        var d = max % 100;
        var t = (d > 50) ? 100 : 50;
        offset = h * 10 + t;
        // offset = (offset > 50) ? 100 : 50;
    }

    while (max > 1) {
        marks.push(Math.ceil(max / offset) * offset);
        max = max - offset;
    }
    return marks;
}

function getDataCommunityAreaVsKeyForChart(le_json, key) {
    return getDataForChart(le_json, _gObjs.communityArea, key, _gObjs.communityAreaNumber);
}

function getDataForChart(records, kname, kvalue, can) {

    var json = [];

    mapNodes = _gObjs.mapNodes;

    for (var i = 0; i < mapNodes.length; i++) {
        var node = mapNodes[i];
        if (node.can != null) {
            var can = parseInt(node.can)

            var record = getRecordByCan(records, can);

            var value = (!record[kvalue] || isNaN(record[kvalue])) ? 0 : parseFloat(record[kvalue]);

            json.push({ "key": record[kname], "value": value, "can": can, "color": node.color });
        }
    }

    return json;
}

function generateMap(map_json) {

    var svg = d3.select("svg#map")
    var width = svg.attr("width");
    var height = svg.attr("height");

    var center = d3.geoCentroid(map_json)

    var scale = 150;
    var projection = d3.geoMercator().scale(scale).center(center);

    var path = d3.geoPath().projection(projection);

    var bounds = path.bounds(map_json);

    var hscale = scale * width / (bounds[1][0] - bounds[0][0]);
    var vscale = scale * height / (bounds[1][1] - bounds[0][1]);
    var scale = (hscale < vscale) ? hscale : vscale;
    var offset = [width - (bounds[0][0] + bounds[1][0]) / 2,
    height - (bounds[0][1] + bounds[1][1]) / 2 - 40];
    projection = d3.geoMercator().center(center).scale(scale * 0.9).translate(offset);
    path = path.projection(projection);

    var paths = svg.selectAll("path")
        .data(map_json.features)
        .enter()
        .append("g")

    paths.append("path")
        .attr("d", function (d) {
            return path(d)
        })
        .attr('fill', function (d, i) {
            var node = getNodeInfoByZip(d.properties.ZCTA5CE10);
            _gObjs.mapNodes.push(node)
            return node.color;
        })
        .attr('id', function (d, i) {
            return zipCodeToCan(d.properties.ZCTA5CE10);
        })
        .on("mouseover", function (d) {
            showInfoR(d.properties.ZCTA5CE10, true);
        })
        .on("mouseout", function (d) {
            showInfoR("", false);
        })
        .on("click", function (d, i) {

            svg.selectAll("path")
                .attr("stroke", "")
                .attr("stroke-width", "")

            var mapMarker = d3.select(this);

            mapMarker.attr("stroke", "gold").attr("stroke-width", "2");

            // var node = getNodeInfo(mapMarker.attr("id"))

            // _gObjs.curMapCommunity = node;
            // setHighLightAllCharts(_gObjs.curMapCommunity);

            // $(document).scrollTop($("div#timeline").offset().top - 10);

            // $("div#usage").hide();

            // $("div#details").show(1500);

            mapClicked(this);

        })


    paths.append("svg:text")
        .attr("x", function (d) {
            return path.centroid(d)[0];
        })
        .attr("y", function (d) {
            return path.centroid(d)[1];
        })
        .attr('fill', "gold")
        .attr("text-anchor", "middle")
        .text(function (d) {

            var node = d3.select(this);
            var x = node.attr("x");
            var y = node.attr("y");
            var color = getNodeInfoByZip(d.properties.ZCTA5CE10).color;
            var zip = d.properties.ZCTA5CE10;
            var can = zipCodeToCan(zip);
            var name = canToComName(can);

            var label = can;
            if (_gObjs.track[label] == undefined) {
                _gObjs.track[label] = true;
            }
            else {
                label = "";
            }

            if (label == null) {
                label = "";
            }

            if (can == 9 || can == 10 || can == 23 || can == 28) {
                if (zip == 60631 || zip == "60630" || zip == "60624" || zip == "60608") {
                    label = can;
                }
                else {
                    label = ""
                    _gObjs.track[label] = undefined;
                }
            }

            if (label != "") {
                _gObjs.count = _gObjs.count + 1;
                var legend = $("div#legend");
                var html = legend.html();
                html += "<div class='legend'><div class='legsquare' style='background-color: " + color + "'></div><div class='legtext'>" + _gObjs.count + ": " + name + "</div></div>"
                legend.html(html);

                return _gObjs.count;
            }

            return "";
        })
        // .on("mouseover", function (d) {
        //     showInfoR(d.properties.ZCTA5CE10, true);
        // })
        // .on("mouseout", function (d) {
        //     showInfoR("", false);
        // })
        // .on("click", function (d, i) {
        //     // mapClicked(this);
        // })
}

function mapClicked(obj) {

    
    var mapMarker = d3.select(obj);

    var node = getNodeInfo(mapMarker.attr("id"))
    var record = getRecordByCan(le_json, node.can);

    _gObjs.curMapCommunity = node;
    setHighLightAllCharts(_gObjs.curMapCommunity);

    $(document).scrollTop($("div#timeline").offset().top - 10);

    $("div#usage").hide();

    $("div#details").show(1500);

    var html = getLiExpectancyInfo(record, node);

    $("p#summary").html(html)

    showChartByField(le_json, "2000-Life-Expectancy", "p", "c2000")
    showChartByField(le_json, "2010-Life-Expectancy", "p", "c2010")
    showChartByField(le_json, "1990-Life-Expectancy", "p", "c1990")
}

function showChartByField(dataset, field, element, id){
    //1990-Life-Expectancy
    var text = cleanField(field)
    var chartData = getDataCommunityAreaVsKeyForChart(dataset, field);
    var title = cleanField(_gObjs.communityArea) + " vs. " + text;

    var elementId = id + "_" + field
    //not found chart
    var conElement = $(element + "#" + id);

    conElement.append($('<div id="' + elementId + '" width="1000" height="400"></div>'));
    $("div#" + elementId).html("");

    generateChart(chartData, elementId, title, true);

}

function setHighLightAllCharts(curMC) {

    var svgs = d3.selectAll("svg")._groups[0];
    svgs.forEach(function (e) {
        var svg = d3.select(e)
        var svg_id = svg.attr("id");

        if (svg_id != "map") {
            var rects = d3.select("svg#" + svg_id).selectAll("rect");
            rects.attr("stroke", "").attr("stroke-width", "2")
            rects._groups[0].forEach(function (n) {
                var rect = d3.select(n)
                if (rect.attr("id") == curMC.can) {
                    rect.attr("stroke", _gObjs.selectedElementStrokeColor).attr("stroke-width", _gObjs.selectedElementStrokeWidth)
                    return;
                }
            });
        }
    });


}

function showPopupChart(record, node) {
    var json = []
    json.push({ "key": cleanField("1990-Life-Expectancy"), "value": record["1990-Life-Expectancy"], "can": node.can, "color": node.color + "75" });
    json.push({ "key": cleanField("2000-Life-Expectancy"), "value": record["2000-Life-Expectancy"], "can": node.can, "color": node.color + "85" });
    json.push({ "key": cleanField("2010-Life-Expectancy"), "value": record["2010-Life-Expectancy"], "can": node.can, "color": node.color });

    generateChart(json, "popchart", node.name + " vs. Life Expectancy");
}

function showInfoR(zip, flag) {

    if (flag) {

        var can = zipCodeToCan(zip)

        if (can != null) {

            var node = getNodeInfoByZip(zip);

            var record = getRecordByCan(le_json, can);

            showInfo(record, node, "infor", true);
            showPopupChart(record, node)
        }
    }
    else {
        showInfo(null, null, "infor", false);
    }
}

function showInfoL(d, flag) {
    //showInfo(record, node, "infol", flag);
}

function showInfo(record, node, cid, flag) {
    var legend = $("div#legend");
    var d = $("#" + cid);
    if (flag) {
        
        var html = getLiExpectancyInfo(record, node, "header");
        d.html(html);
        d.css("color", node.color);
        legend.hide();
        d.show()
    }
    else {
        legend.show();
        d.hide();
    }
}

function getLiExpectancyInfo(record, node, header=""){
    var html = "<div>";
    html += "<h2 class='" + header + "'>Selected: <u>" + record[_gObjs.communityArea] + " Community</u></h2>";
    html += "<ul type='square'>";
    html += "<li>Zip Codes: <strong>" + node.zips.join(", ") + "</strong></li>";

    var fields = Object.keys(record);
    for (var i = 2; i < fields.length; i++) {
        var field = fields[i];
        var data = record[field];
        html += "<li>" + cleanField(field) + ": <strong>" + data + "</strong></li>";
    }

    html += "</ul>"

    html += "<div id='popchart' width='300' height='350'></div>"
    html += "</div>";

    return html;
}

function getRecordByCan(records, can) {

    for (var record in records) {
        if (records[record][_gObjs.communityAreaNumber] == can) {
            return records[record];
        }
    }

    return null;
}

function getNodeInfoByZip(zipcode) {
    var can = zipCodeToCan(zipcode);
    var node = getNodeInfo(can, zipcode);

    return node;
}

function getNodeInfo(can, szip = "") {

    if (_gObjs.curNodeCache != null && _gObjs.curNodeCache.can == can) {
        return _gObjs.curNodeCache;
    }

    var commName = "";
    var arr = [];
    var color = "";
    if (can != null) {
        commName = canToComName(can);
        arr = canToZipCode(can);
        color = getColor(can);
    }
    else {
        color = "black"
    }
    _gObjs.curNodeCache = { 'can': can, 'name': commName, szip: szip, 'zips': arr, 'color': color };
    return _gObjs.curNodeCache;
}

function zipCodeToCan(zipcode) {
    for (var obj in caz_json) {
        if (caz_json[obj].ZipCode == zipcode) {
            return caz_json[obj][_gObjs.communityAreaNumber];
        }
    }

    return null;
}

function zCTA5CE10ToCanZipCode(ZCTA5CE10) {
    for (var obj in caz_json) {
        if (caz_json[obj].ZipCode == ZCTA5CE10) {
            return ZCTA5CE10;
        }
    }

    return "";
}

function canToZipCode(can) {
    var zips = [];
    for (var obj in caz_json) {
        if (caz_json[obj][_gObjs.communityAreaNumber] == can) {
            zips.push(caz_json[obj].ZipCode)
        }
    }

    return zips;
}

function canToComName(can) {
    for (var obj in le_json) {
        if (le_json[obj][_gObjs.communityAreaNumber] == can) {
            return le_json[obj][_gObjs.communityArea]
        }
    }
    return "";
}

function getColor(can) {
    return color_json[can].color;
}

function debug(obj, tag = "") {
    if (tag != "") {
        console.log(tag);
    }
    console.log(obj);
}

function randomColor() {
    var hex = "0123456789abcdef";
    var color = "#"
    for (var i = 0; i < 6; i++) {
        color += hex[Math.floor(Math.random() * hex.length)]
    }

    return color;
}

function showAllCharts() {
    var el = $("#shchart");
    if (el.html() === "Show") {
        el.html("Hide");
        $('input:checkbox').trigger("click");
        $('h2.accordion').trigger("click");
    }
    else {
        el.html("Show")
        $('input:checkbox').prop('checked', false);
        $('div.panel').attr("style", "display:none;")
    }
}

function colorChart() {
    var html = "<table style='width: 400px'>";
    for (var i = 0; i < color_json.length; i++) {
        var c = color_json[i];
        var tr = "<tr>";
        tr += "<td bgcolor='" + c.color + "'>" + c.index + " - " + c.color + "</td>";
        tr += "</tr>";
        html += tr;
    }
    html += "</table>"
    $("#colorchart").html(html);
}