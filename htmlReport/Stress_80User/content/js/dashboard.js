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

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.838125, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "Single User GET Request"], "isController": false}, {"data": [0.95625, 500, 1500, "Single <Resource> GET Request"], "isController": false}, {"data": [1.0, 500, 1500, "Delete User by DELETE Request"], "isController": false}, {"data": [0.9875, 500, 1500, "Update User Info PATCH Request"], "isController": false}, {"data": [0.85, 500, 1500, "Login Successful POST Request"], "isController": false}, {"data": [0.99375, 500, 1500, "Register Successful POST Request"], "isController": false}, {"data": [0.0, 500, 1500, "List Users GET Request"], "isController": false}, {"data": [0.59375, 500, 1500, "Create User POST Request"], "isController": false}, {"data": [1.0, 500, 1500, "List <Resource> GET Request"], "isController": false}, {"data": [1.0, 500, 1500, "Update User Info PUT Request"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 800, 0, 0.0, 1031.4724999999994, 64, 6840, 426.0, 6257.799999999927, 6742.0, 6804.0, 54.006615810436784, 49.22440645463444, 9.941647539323567], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Single User GET Request", 80, 0, 0.0, 272.65, 134, 451, 292.5, 327.20000000000005, 382.70000000000005, 451.0, 174.67248908296943, 170.86432177947597, 22.516375545851528], "isController": false}, {"data": ["Single <Resource> GET Request", 80, 0, 0.0, 375.85, 139, 702, 378.0, 495.2000000000001, 516.95, 702.0, 102.69576379974326, 95.14401476251604, 13.438703465982028], "isController": false}, {"data": ["Delete User by DELETE Request", 80, 0, 0.0, 429.1000000000001, 402, 491, 429.0, 453.8, 462.95, 491.0, 21.447721179624665, 12.882770609919572, 3.7491621983914207], "isController": false}, {"data": ["Update User Info PATCH Request", 80, 0, 0.0, 469.175, 405, 3385, 432.0, 459.9, 485.20000000000005, 3385.0, 21.95992314026901, 15.783694757068352, 5.061076036233874], "isController": false}, {"data": ["Login Successful POST Request", 80, 0, 0.0, 457.0875, 401, 561, 436.0, 534.0, 551.85, 561.0, 20.434227330779056, 13.677861590038313, 4.909003831417625], "isController": false}, {"data": ["Register Successful POST Request", 80, 0, 0.0, 430.9125000000001, 397, 503, 430.5, 455.8, 470.9, 503.0, 20.964360587002098, 14.190865762578618, 4.974941037735849], "isController": false}, {"data": ["List Users GET Request", 80, 0, 0.0, 6739.325, 6577, 6840, 6742.0, 6804.0, 6829.8, 6840.0, 11.6941967548604, 19.974350423914633, 1.4846148223943867], "isController": false}, {"data": ["Create User POST Request", 80, 0, 0.0, 559.2375000000002, 473, 839, 542.0, 657.6000000000001, 805.5, 839.0, 69.56521739130434, 50.58848505434783, 15.353260869565219], "isController": false}, {"data": ["List <Resource> GET Request", 80, 0, 0.0, 153.83749999999995, 64, 329, 118.0, 306.40000000000003, 314.9, 329.0, 147.32965009208104, 204.6788674033149, 17.984576427255984], "isController": false}, {"data": ["Update User Info PUT Request", 80, 0, 0.0, 427.55, 401, 478, 423.0, 454.8, 462.9, 478.0, 102.69576379974326, 73.90534740051348, 23.467586649550704], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 800, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
