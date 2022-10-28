/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 90.0, "KoPercent": 10.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.4377857142857143, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, "Single User GET Request"], "isController": false}, {"data": [0.73, 500, 1500, "Single <Resource> GET Request"], "isController": false}, {"data": [0.505, 500, 1500, "Delete User by DELETE Request"], "isController": false}, {"data": [0.5564285714285714, 500, 1500, "Update User Info PATCH Request"], "isController": false}, {"data": [0.6128571428571429, 500, 1500, "Login Successful POST Request"], "isController": false}, {"data": [0.5607142857142857, 500, 1500, "Register Successful POST Request"], "isController": false}, {"data": [0.0, 500, 1500, "List Users GET Request"], "isController": false}, {"data": [0.4685714285714286, 500, 1500, "Create User POST Request"], "isController": false}, {"data": [0.3942857142857143, 500, 1500, "List <Resource> GET Request"], "isController": false}, {"data": [0.55, 500, 1500, "Update User Info PUT Request"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 7000, 700, 10.0, 4091.3788571428604, 60, 32654, 812.0, 18785.9, 25752.0, 29835.96, 109.92807563051603, 119.14534847199975, 18.82947701718019], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Single User GET Request", 700, 0, 0.0, 9594.211428571423, 2286, 19034, 6049.5, 19003.0, 19012.0, 19018.0, 21.090689966857486, 35.997170646279, 2.6981253766194637], "isController": false}, {"data": ["Single <Resource> GET Request", 700, 0, 0.0, 724.3385714285715, 60, 3367, 437.0, 2020.9, 2502.3499999999976, 3242.9300000000003, 57.259713701431494, 53.0428808793456, 7.492970347648262], "isController": false}, {"data": ["Delete User by DELETE Request", 700, 0, 0.0, 928.5128571428585, 407, 15809, 764.5, 1439.9999999999998, 1700.0, 2740.98, 41.89609767775915, 25.188742855219058, 7.323634262030166], "isController": false}, {"data": ["Update User Info PATCH Request", 700, 0, 0.0, 808.107142857143, 398, 3040, 678.0, 1391.9, 1582.6499999999996, 2723.6500000000005, 66.23769871309614, 47.639764501324755, 15.265719625283877], "isController": false}, {"data": ["Login Successful POST Request", 700, 0, 0.0, 751.8371428571435, 400, 3151, 640.0, 1345.8, 1430.6499999999996, 2972.5600000000013, 43.58926458683604, 29.191793737156733, 10.471639734728189], "isController": false}, {"data": ["Register Successful POST Request", 700, 0, 0.0, 844.2614285714285, 402, 3325, 706.5, 1398.8, 1530.299999999999, 2982.2800000000025, 43.491767629698664, 29.422714740602675, 10.320800326188259], "isController": false}, {"data": ["List Users GET Request", 700, 700, 100.0, 23973.44571428572, 15169, 32654, 25752.0, 29835.6, 30184.199999999997, 31700.170000000006, 19.24557351809084, 52.01006161161058, 0.0], "isController": false}, {"data": ["Create User POST Request", 700, 0, 0.0, 956.0414285714282, 399, 3330, 815.5, 1602.6, 1657.8999999999999, 2599.88, 57.082280029356596, 41.54655072677974, 12.598237584604094], "isController": false}, {"data": ["List <Resource> GET Request", 700, 0, 0.0, 1511.3200000000015, 63, 5095, 1088.0, 3051.7999999999997, 4357.549999999994, 5058.99, 51.878751945453196, 72.06152611539316, 6.332855462091454], "isController": false}, {"data": ["Update User Info PUT Request", 700, 0, 0.0, 821.7128571428574, 399, 4761, 775.0, 1284.8, 1476.8499999999972, 2616.96, 58.93744211501221, 42.39795797549886, 13.468126420813336], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 43, 6.142857142857143, 0.6142857142857143], "isController": false}, {"data": ["Non HTTP response code: java.net.SocketException/Non HTTP response message: Broken pipe (Write failed)", 470, 67.14285714285714, 6.714285714285714], "isController": false}, {"data": ["Non HTTP response code: javax.net.ssl.SSLHandshakeException/Non HTTP response message: Remote host terminated the handshake", 187, 26.714285714285715, 2.6714285714285713], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 7000, 700, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Broken pipe (Write failed)", 470, "Non HTTP response code: javax.net.ssl.SSLHandshakeException/Non HTTP response message: Remote host terminated the handshake", 187, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 43, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["List Users GET Request", 700, 700, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Broken pipe (Write failed)", 470, "Non HTTP response code: javax.net.ssl.SSLHandshakeException/Non HTTP response message: Remote host terminated the handshake", 187, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 43, "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
