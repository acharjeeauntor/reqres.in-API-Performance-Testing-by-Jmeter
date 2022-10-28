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

    var data = {"OkPercent": 92.8, "KoPercent": 7.2};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.6903, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.28, 500, 1500, "Single User GET Request"], "isController": false}, {"data": [0.791, 500, 1500, "Single <Resource> GET Request"], "isController": false}, {"data": [0.99, 500, 1500, "Delete User by DELETE Request"], "isController": false}, {"data": [0.991, 500, 1500, "Update User Info PATCH Request"], "isController": false}, {"data": [0.978, 500, 1500, "Login Successful POST Request"], "isController": false}, {"data": [0.993, 500, 1500, "Register Successful POST Request"], "isController": false}, {"data": [0.0, 500, 1500, "List Users GET Request"], "isController": false}, {"data": [0.369, 500, 1500, "Create User POST Request"], "isController": false}, {"data": [0.634, 500, 1500, "List <Resource> GET Request"], "isController": false}, {"data": [0.877, 500, 1500, "Update User Info PUT Request"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 5000, 360, 7.2, 3486.598199999995, 60, 23607, 448.0, 15384.0, 18998.849999999995, 23216.869999999995, 96.58849437854963, 98.74905826217982, 16.8905356556427], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Single User GET Request", 500, 0, 0.0, 10372.12600000001, 98, 16329, 13904.0, 14988.800000000003, 15416.5, 16223.87, 30.268176039711847, 45.430936062261644, 3.8804747563411834], "isController": false}, {"data": ["Single <Resource> GET Request", 500, 0, 0.0, 625.1320000000003, 60, 2067, 313.5, 1414.0, 1470.8, 1566.98, 22.220247089147634, 20.559717608434806, 2.9077276464314283], "isController": false}, {"data": ["Delete User by DELETE Request", 500, 0, 0.0, 430.0339999999999, 398, 764, 425.0, 451.90000000000003, 471.0, 525.0, 26.59433008882506, 15.988906008988884, 4.648813560448913], "isController": false}, {"data": ["Update User Info PATCH Request", 500, 0, 0.0, 437.38199999999955, 395, 525, 433.0, 473.0, 485.95, 511.95000000000005, 26.526606186004564, 19.073976901957664, 6.113553769430739], "isController": false}, {"data": ["Login Successful POST Request", 500, 0, 0.0, 457.36400000000003, 397, 4012, 426.5, 455.0, 471.95, 1154.7600000000002, 26.81684097613301, 17.95764615178332, 6.442327031375704], "isController": false}, {"data": ["Register Successful POST Request", 500, 0, 0.0, 433.1759999999998, 394, 1237, 426.0, 450.0, 460.95, 842.7600000000011, 26.945462384134512, 18.223447772957535, 6.394284530610045], "isController": false}, {"data": ["List Users GET Request", 500, 360, 72.0, 19154.496, 15310, 23607, 18988.5, 23215.7, 23375.6, 23580.98, 20.41316240712011, 46.86547119957949, 0.7256241324405978], "isController": false}, {"data": ["Create User POST Request", 500, 0, 0.0, 1563.4360000000008, 409, 3608, 1273.5, 2691.0, 2733.9, 2860.98, 23.365577830739753, 17.011099014556756, 5.156856044674985], "isController": false}, {"data": ["List <Resource> GET Request", 500, 0, 0.0, 849.5919999999993, 61, 5826, 804.5, 1405.6000000000001, 1588.8499999999997, 3225.260000000006, 21.868439468159554, 30.3583912619183, 2.6694872397655702], "isController": false}, {"data": ["Update User Info PUT Request", 500, 0, 0.0, 543.244, 399, 1494, 448.0, 884.9000000000001, 945.6499999999994, 1487.99, 26.435444644178915, 19.010802183567726, 6.0409121550174465], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: org.apache.http.NoHttpResponseException/Non HTTP response message: reqres.in:443 failed to respond", 190, 52.77777777777778, 3.8], "isController": false}, {"data": ["Non HTTP response code: java.net.SocketException/Non HTTP response message: Broken pipe (Write failed)", 170, 47.22222222222222, 3.4], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 5000, 360, "Non HTTP response code: org.apache.http.NoHttpResponseException/Non HTTP response message: reqres.in:443 failed to respond", 190, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Broken pipe (Write failed)", 170, "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["List Users GET Request", 500, 360, "Non HTTP response code: org.apache.http.NoHttpResponseException/Non HTTP response message: reqres.in:443 failed to respond", 190, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Broken pipe (Write failed)", 170, "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
