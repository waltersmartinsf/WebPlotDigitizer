/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2014 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

// calibration info
wpd.Calibration = (function () {

    var Calib = function(dim) {
        // Pixel information
        var px = [],
            py = [],

            // Data information
            dimensions = dim == null ? 2 : dim,
            dp = [],
            selections = [];

        this.labels = [];

        this.getCount = function () { return px.length; };
        this.getDimensions = function() { return dimensions; };
        this.addPoint = function(pxi, pyi, dxi, dyi, dzi) {
            var plen = px.length, dlen = dp.length;
            px[plen] = pxi;
            py[plen] = pyi;
            dp[dlen] = dxi; dp[dlen+1] = dyi;
            if(dimensions === 3) {
                dp[dlen+2] = dzi;
            }
        };

        this.getPoint = function(index) {
            if(index < 0 || index >= px.length) return null;

            return {
                px: px[index],
                py: py[index],
                dx: dp[dimensions*index],
                dy: dp[dimensions*index+1],
                dz: dimensions === 2 ? null : dp[dimensions*index + 2]
            };
        };

        this.changePointPx = function(index, npx, npy) {
            if(index < 0 || index >= px.length) {
                return;
            }
            px[index] = npx;
            py[index] = npy;
        };

        this.setDataAt = function(index, dxi, dyi, dzi) {
            if(index < 0 || index >= px.length) return;
            dp[dimensions*index] = dxi;
            dp[dimensions*index + 1] = dyi;
            if(dimensions === 3) {
                dp[dimensions*index + 2] = dzi;
            }
        };

        this.findNearestPoint = function(x, y, threshold) {
            threshold = (threshold == null) ? 50 : parseFloat(threshold);
            var minDist, minIndex = -1, 
                i, dist;
            for(i = 0; i < px.length; i++) {
                dist = Math.sqrt((x - px[i])*(x - px[i]) + (y - py[i])*(y - py[i]));
                if((minIndex < 0 && dist <= threshold) || (minIndex >= 0 && dist < minDist)) {
                    minIndex = i;
                    minDist = dist;
                }
            }
            return minIndex;
        };


        this.selectPoint = function(index) {
            if(selections.indexOf(index) < 0) {
                selections[selections.length] = index;
            }
        };

        this.selectNearestPoint = function (x, y, threshold) {
            var minIndex = this.findNearestPoint(x, y, threshold);
            if (minIndex >= 0) {
                this.selectPoint(minIndex);
            }
        };

        this.getSelectedPoints = function () {
            return selections;
        };

        this.unselectAll = function() {
            selections = [];
        };

        this.isPointSelected = function(index) {
            return selections.indexOf(index) >= 0;
        };

        this.dump = function() {
            console.log(px);
            console.log(py);
            console.log(dp);
        };
    };
    return Calib;
})();

// Data from a series
wpd.DataSeries = (function () {
    return function (dim) {
        var pixels = [], // flat array to store (x,y) pixel info.
            connections = [],
            selections = [];

        this.name = "Data Series";

        this.variableNames = ['x', 'y'];

        this.addPixel = function(pxi, pyi) {
            var plen = pixels.length;
            pixels[plen] = pxi;
            pixels[plen+1] = pyi;
        };

        this.getPixel = function(index) {
            return {
                x: pixels[2*index],
                y: pixels[2*index + 1]
            };
        };

        this.setPixelAt = function(index, pxi, pyi) {
            if(2*index < pixels.length) {
                pixels[2*index] = pxi;
                pixels[2*index + 1] = pyi;
            }
        };

        this.insertPixel = function(index, pxi, pyi) {
            pixels.splice(2*index, 0, pxi);
            pixels.splice(2*index + 1, 0, pyi); 
        };

        this.removePixelAtIndex = function(index) {
            if(2*index < pixels.length) {
                pixels.splice(2*index, 2);
            }
        };

        this.removeLastPixel = function() {
            var pIndex = pixels.length/2 - 1;
            this.removePixelAtIndex(pIndex);
        };

        this.findNearestPixel = function(x, y, threshold) {
            threshold = (threshold == null) ? 50 : parseFloat(threshold);
            var minDist, minIndex = -1, 
                i, dist;
            for(i = 0; i < pixels.length; i+= 2) {
                dist = Math.sqrt((x - pixels[i])*(x - pixels[i]) + (y - pixels[i+1])*(y - pixels[i+1]));
                if((minIndex < 0 && dist <= threshold) || (minIndex >= 0 && dist < minDist)) {
                    minIndex = i/2;
                    minDist = dist;
                }
            }
            return minIndex;
        };

        this.removeNearestPixel = function(x, y, threshold) {
            var minIndex = this.findNearestPixel(x, y, threshold);
            if(minIndex >= 0) {
                this.removePixelAtIndex(minIndex);
            }
        };

        this.clearAll = function() { pixels = []; };
        this.getCount = function() { return pixels.length/2; }
 
        this.selectPixel = function(index) {
            if(selections.indexOf(index) >= 0) {
                return;
            }
            selections[selections.length] = index;
        };

        this.unselectAll = function () {
            selections = [];
        };

        this.selectNearestPixel = function(x, y, threshold) {
            var minIndex = this.findNearestPixel(x, y, threshold);
            if(minIndex >= 0) {
                this.selectPixel(minIndex);
            }
        };

        this.getSelectedPixels = function () {
            return selections;
        };

    };
})();


// Plot information
wpd.PlotData = (function () {
    var PlotData = function() {

        var activeSeriesIndex = 0,
            autoDetector = new wpd.AutoDetector();

        this.axes = null;
        this.dataSeriesColl = [];

        this.getActiveDataSeries = function() {
            if (this.dataSeriesColl[activeSeriesIndex] == null) {
                this.dataSeriesColl[activeSeriesIndex] = new wpd.DataSeries();
            }
            return this.dataSeriesColl[activeSeriesIndex];
        };

        this.getDataSeriesCount = function() {
            return this.dataSeriesColl.length;
        };

        this.setActiveDataSeriesIndex = function(index) {
            activeSeriesIndex = index;
        };

        this.getAutoDetector = function() {
            return autoDetector;
        };

        this.getDataFromActiveSeries = function() {
            if(this.dataSeriesColl[activeSeriesIndex] == null || this.axes == null) {
                return null;
            }
            var i, pt, ptData, rtnData = [], dimi;
            for(i = 0; i < this.dataSeriesColl[activeSeriesIndex].getCount(); i++) {
                pt = this.dataSeriesColl[activeSeriesIndex].getPixel(i);
                ptData = [];
                ptData = this.axes.pixelToData(pt.x, pt.y);
                rtnData[i] = [];
                for(dimi = 0; dimi < ptData.length; dimi++) {
                    rtnData[i][dimi] = ptData[dimi];
                }
            }
            return rtnData;
        };

        this.reset = function() {
            this.axes = null;
            this.dataSeriesColl = [];
            activeSeriesIndex = 0;
            autoDetector = new wpd.AutoDetector();
        };
    };

    return PlotData;
})();


wpd.ConnectedPoints = (function () {
    var CPoints = function (connectivity) {

        var connections = [],
            selectedConnections;

        this.addConnection = function (plist) {
            connections[connections.length] = plist;
        };

        this.clearAll = function () {
            connections = [];
        };

        this.getConnectionAt = function (index) {
            if(index < connections.length) {
                return connections[index];
            }   
        };

        this.replaceConnectionAt = function (index, plist) {
            if(index < connections.length) {
                connections[index] = plist;
            }
        };

        this.deleteConnectionAt = function (index) {
            if(index < connections.length) {
                connections.splice(index, 1);
            }
        };

        this.connectionCount = function () {
            return connections.length;
        };

        this.getDistance = function(index) {
            if(index < connections.length && connectivity === 2) {
                var dist = Math.sqrt((connections[index][0] - connections[index][2])*(connections[index][0] - connections[index][2])
                    + (connections[index][1] - connections[index][3])*(connections[index][1] - connections[index][3]));
                return dist; // this is in pixels!
            }
        };

        this.getAngle = function(index, isDegrees) {
            if(index < connections.length && connectivity === 3) {
                var ang = wpd.taninverse(connections[index][3] - connections[index][1], connections[index][2] - connections[index][0]);

                if(isDegrees) {
                    ang = 180.0*ang/Math.PI;
                }

                return ang;
            }
        };
    };
    return CPoints;
})();
