/*global console: false, require: false, module: false */

var sys = require('sys');
var _ = require('underscore');

var honors = [
    'East',
	'South',
	'West',
	'North',
	'White',
	'Green',
	'Red',
	'One',
	'Nine'
],
    colors = [
	    'Pin',
	    'Sou',
	    'Honor'
    ],
    vals = {
	    // id = value + (9 * color);
	    // name	    id	    buffered
	    // pin		00-08	02-10
	    // sou		09-17	13-21
	    // honors	18-26	24-32
        id_min: 0,
	    color_beg: 0,
        pin_beg: 0,
        pin_end: 8,
        sou_beg: 9,
        sou_end: 17,
        color_end: 17,
        honor_beg: 18,
	    honor_end: 26,
	    id_max: 26,
        count: 26 + 1,
        buf_begin: 2,
        buf_end_no_honors: 21,
        buf_end: 32
    },

    getColor = function (tile) {
	    tile = tile - (tile % 9);
	    tile /= 9;
	    return colors[tile];
        },
getValue =  function (tile) {
	return tile % 9;
    },
getHonor =  function (tile) {
	return honors[getValue(tile)];
    },
toString = function (tile) {
    
    if (is_honor(tile)) {
        return getHonor(tile);
	} else {
		return (getValue(tile) + 1) + getColor(tile);
	}
},

isHonor = function (tile) {
	return tile >= vals.honor_beg;
},

toTileSetString = function (tiles)
{
	// var conv = tiles.Select (x => new {
		// Color = TileInfo.GetColor (x),
		// Honor = TileInfo.GetHonor (x),
		// Value = TileInfo.GetValue (x),
	// });
	// var first = conv.First ();

	// if (conv.Any (x => x.Color != first.Color)) {
		// return string.Join (", ", tiles.Select (x => ToString (x)));
	// }
	// else if (first.Color != Color.Honor) {
		// // xxx
		// // return string.Join ("", conv.Select (x => x.Value)) + first.Color.ToString ().Substring (0, 1);
	// }
	// else {
		// // xxx
		// return string.Join ("", conv.Select (x => x.Honor.ToString ().Substring (0, 1)));
	// }
},
checkRegularMahjongNoPairHonor = function (hist, beg, end) {
	/*
			 * for honors, check triplets only
			 */
	for (var i = beg; i <= end; i++) {
		if ((hist[i] % 3) !== 0) {
			return false;
		}
	}
	return true;
},
sum = function (arr){
    for(var s = 0, i = arr.length; i; s += arr[--i]);
    return s;
},
    checkRegularMahjongNoPairColor = function (init_hist, init_beg, init_end) {
        var queue = [],
        process = function (hist, beg, end) {
            if (sum(hist.slice(beg, end+1)) === 0) {
				return true;
			}
            for (var i = beg; i <= end; i++) {
                    var count = hist[i],
                    copy;
			    if (count > 0) {
				    if (i + 2 <= end) {
					    if (hist[i+1] > 0 && hist[i+2] > 0) {
						    copy = hist.slice(0);
						    copy[i] -= 1;
						    copy[i+1] -= 1;
						    copy[i+2] -= 1;
                            queue.push([copy, i, end]);
					    }
				    }
			    }
                if (count >= 3) {
				    copy = hist.slice(0);
				    copy[i] -= 3;
                    queue.push([copy, i, end]);
			    }
            }
            return false;
        };
        queue.push([init_hist, init_beg, init_end]);
        while (queue.length > 0) {
            var cur_item = queue[0],
                hist = cur_item[0],
                beg = cur_item[1],
                end = cur_item[2];
            // console.log(hist.join(','));
            // console.log(sum(hist.slice(beg, end+1)));
            var worked = process(hist, beg, end);
            if (worked) {
				return true;
			}
            queue.shift();
        }
		return false;
		},
    checkRegularMahjongNoPair = function (hist) {
		return checkRegularMahjongNoPairHonor(hist, vals.honor_beg, vals.honor_end) &&
            checkRegularMahjongNoPairColor(hist, vals.pin_beg, vals.pin_end) &&
            checkRegularMahjongNoPairColor(hist, vals.sou_beg, vals.sou_end);
		},
    checkRegularMahjong = function (hist) {
        if (sum(hist) !== 14) {
            throw "not enough tiles in hand";
        }
			/*
			 * enumerate through all possible pairs
			 */
			for (var i = 0; i < vals.count; i++) {
				if (hist[i] >= 2) {
					hist[i] -= 2;
					var pass = checkRegularMahjongNoPair(hist);
					hist[i] += 2;

					if (pass) {
						return true;
					}
				}
			}
			return false;
		},

    findRegularMahjongAcc = function (hist, beg, end) {
        var mjs = [],
            queue = [],
            valid = false;
        var process = function(hist, sets, index, beg, end) {
            console.log(hist.join(','));
            var copy;
            if (sum(hist.slice(beg, end+1)) === 0) {
				mjs.push(sets);
				return true;
			}
			for (var i = beg; i <= end; i++) {
				if (sum(hist.slice(index, i)) > 0) {
					return false;
			    }
				var count = hist[i];
				if (count > 0) {
					if (i + 2 <= end) {
						if (hist[i+1] > 0 &&
							hist[i+2] > 0) {
							copy = hist.slice(0);
							copy[i] -= 1;
							copy[i+1] -= 1;
							copy[i+2] -= 1;
							var new_sets = sets.slice(0);
							new_sets.push([i, i+1, i+2]);
                            queue.push([copy, new_sets, i, beg, end]);
						}
					}
				}
				if (count >= 3) {
                    copy = hist.slice(0);
					copy[i] -= 3;
                    sets.push([i, i, i]);
                    queue.push([copy, sets, i, beg, end]);
				}
			}
			return false;
		};
        queue.push([hist, [], beg, beg, end]);
        while (queue.length > 0) {
            var cur_item = queue[0],
            sets = cur_item[1],
            index = cur_item[2];
            hist = cur_item[0];
            beg = cur_item[3];
            end = cur_item[4];
            if (process(hist, sets, index, beg, end)) {
                valid = true;
            }
            queue.shift();
        }
        return [mjs, valid];
    },
    findHonors = function (hist) {
        var sets = [];
		for (var i = vals.honor_beg; i <= vals.honor_end; i++) {
			if (hist[i] >= 3) {
				sets.push([i, i, i]);
				hist[i] -= 3;
			}
		}
        if (sum(hist.slice(vals.honor_beg, vals.honor_end + 1)) === 0) {
            return [sets, true];
		}
		return [sets, false];
		},
    findRegularMahjong = function (hist) {
			/*
			 * try all pairs
			 */
			for (var i = vals.id_min; i <= vals.id_max; i++) {
				if (hist[i] < 2) {
					continue;
				}

				hist[i] -= 2;
				var honor_result = findHonors(hist);
				var pin_result = findRegularMahjongAcc(hist, vals.pin_beg, vals.pin_end);
				var sou_result = findRegularMahjongAcc(hist, vals.sou_beg, vals.sou_end);
                if (honor_result[1] && pin_result[1] && sou_result[1]) {
                    var hand = [];
                    if (honor_result[0].length) {
                        for (i=0; i<honor_result[0][0].length; i++) {
                            hand.push(honor_result[0][0][i]);
                        }
                    }
                    if (pin_result[0].length) {
                        for (i=0; i<pin_result[0][0].length; i++) {
                            hand.push(pin_result[0][0][i]);
                        }
                    }
                    if (sou_result[0].length) {
                        for (i=0; i<sou_result[0][0].length; i++) {
                            hand.push(sou_result[0][0][i]);
                        }
                    }
                    hand.push([i, i]);
                    return [hand, true];
                }
				hist[i] += 2;
			}
        return [[], false];
		},
    calcHonors = function (hist)
{
	var singles = 0,
	pairs = 0;

			for (var i = vals.honor_beg; i <= vals.honor_end; i++) {
				// always remove triplets
				if (hist[i] >= 3) {
					hist[i] -= 3;
				}

				// extract pairs
				if (hist[i] === 2) {
					hist[i] = 0;
					pairs += 1;
				}

				// remove singles
				else if (hist[i] === 1) {
					hist[i] = 0;
					singles += 1;
				}
			}
    return [pairs, singles];
		},
    getRange = function (base) {
        var lower = parseInt(base / 9, 10) * 9,
            upper = lower + 8;
        return [lower, upper];
    },
inRange = function (number, base, lower, upper) {
    if (number < lower || number > upper) {
        return false;
    }
    var result = getRange(base);
    lower = result[0];
    upper = result[1];
    if (number < lower || number > upper) {
        return false;
    }
    return true;
},
    removeSingles = function (hist, beg, end) {
			var count = 0;

			for (var i = beg; i <= end; i++) {
				if (hist[i] !== 1) {
					continue;
				}

				if (inRange(i-1, i, beg, end) && hist[i - 1] > 0) {
					continue;
				}

				if (inRange(i-2, i, beg, end) && hist[i - 2] > 0) {
					continue;
				}

				if (inRange(i+1, i, beg, end) && hist[i + 1] > 0) {
					continue;
				}

				if (inRange(i+2, i, beg, end) && hist[i + 2] > 0) {
					continue;
				}
                console.log([hist.join(','), i, beg, end]);
				hist[i]--;
				count++;
			}

			return count;
		},
shantenSimulation = function (depth, shanten, hist, singles, pairs) {
    var mjs = [],
    queue = [],
    valid = false;
    var process = function(depth, hist, singles, pairs) {
        console.log(hist.join(','));
        if (depth >= shanten) {
			return false;
		}
        for (var i = vals.color_beg; i <= vals.color_end; i++) {
			if (hist[i] >= 3) {
				var copy = hist.slice(0);
				copy[i] -= 3;
                var range = getRange(i),
                    min = range[0],
                    max = range[1];
				var csingles = removeSingles(copy, _.max(min, i - 2), _.min(max, i + 2));
                console.log("first " + csingles);
                queue.push([depth + 0, copy, singles + csingles, pairs]);
                var im2r = inRange(i-2, i, vals.color_beg, vals.color_end),
                    im1r = inRange(i-1, i, vals.color_beg, vals.color_end),
                    ip1r = inRange(i+1, i, vals.color_beg, vals.color_end),
                    ip2r = inRange(i+2, i, vals.color_beg, vals.color_end);
				if ((!im2r || (im2r && copy[i - 2] === 0)) &&
					(!im1r || (im1r && copy[i - 1] === 0)) &&
					(copy[i + 0] === 0) &&
                    (!ip1r || (ip1r && copy[i + 1] === 0)) &&
                    (!ip2r || (ip2r && copy[i + 2] === 0))) {
					return false;
				}
			}
            
			if ((hist[i + 0] >= 1) &&
                (inRange(i+1, i, vals.color_beg, vals.color_end) && hist[i + 1] >= 1) &&
                (inRange(i+2, i, vals.color_beg, vals.color_end) && hist[i + 2] >= 1)) {
                
				var copy = hist.slice(0);
				copy[i + 0] -= 1;
				copy[i + 1] -= 1;
				copy[i + 2] -= 1;
                var range = getRange(i),
                    min = range[0],
                    max = range[1];
				var csingles = removeSingles(copy, _.max(min, i - 2), _.min(max, i + 4));
                console.log("second " + csingles);
                queue.push([depth + 0, copy, singles + csingles, pairs]);
                
                var im2r = inRange(i-2, i, vals.color_beg, vals.color_end),
                    im1r = inRange(i-1, i, vals.color_beg, vals.color_end),
                    ip1r = inRange(i+1, i, vals.color_beg, vals.color_end),
                    ip2r = inRange(i+2, i, vals.color_beg, vals.color_end),
                    ip3r = inRange(i+3, i, vals.color_beg, vals.color_end),
                    ip4r = inRange(i+4, i, vals.color_beg, vals.color_end);
				if ((!im2r || (im2r && copy[i - 2] === 0)) &&
					(!im1r || (im1r && copy[i - 1] === 0)) &&
					(copy[i + 0] === 0) &&
                    (!ip1r || (ip1r && copy[i + 1] === 0)) &&
                    (!ip2r || (ip2r && copy[i + 2] === 0)) &&
                    (!ip3r || (ip3r && copy[i + 3] === 0)) &&
                    (!ip4r || (ip4r && copy[i + 4] === 0))) {
                    console.log("returning FALSE");
					return false;
				}
			}
            var singles_left = sum(hist) + singles;
			depth += (singles_left - 1) * 2 / 3;
            
			if (depth < shanten) {
				shanten = depth;
			}
        }
        
	};
    queue.push([depth, hist, singles, pairs]);
    while (queue.length > 0) {
        var cur_item = queue[0];
        process(cur_item[0], cur_item[1], cur_item[2], cur_item[3]);
        queue.shift();
    }
    return shanten;
},
shantenGeneralized = function (hist) {
	var shanten = sum(hist) * 2 / 3,
        honors_result = calcHonors(hist),
        pairs = honors_result[0],
        singles = honors_result[1];
    console.log([singles, pairs]);
	singles += removeSingles(hist, vals.pin_beg, vals.pin_end);
    singles += removeSingles(hist, vals.sou_beg, vals.sou_end);
    singles += removeSingles(hist, vals.honor_beg, vals.honor_end);
	return shantenSimulation(0, shanten, hist, singles, pairs);
};

module.exports = {
    honors: honors,
    colors: colors,
    vals: vals,
    getColor: getColor,
    getHonor: getHonor,
    getValue: getValue,
    checkRegularMahjong: checkRegularMahjong,
    findRegularMahjong: findRegularMahjong,
    findRegularMahjongAcc: findRegularMahjongAcc,
    shantenGeneralized: shantenGeneralized,
    inRange: inRange
};