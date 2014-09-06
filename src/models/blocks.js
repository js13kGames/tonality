define(['data/constants', 'models/physics'], function(constants, physics) {
    var scaleDegrees = [1, 1.5, 2, 2.5, 3, 4, 4.5, 5, 5.5, 6, 6.5, 7];

    var left = constants.BLOCK.MARGIN.X + (constants.BLOCK.SPACING.X - constants.BLOCK.SIZE.X) / 2;
    var top = constants.BLOCK.MARGIN.Y;

    var columnLeft = function (col) {
        return left + col * constants.BLOCK.SPACING.X;
    };

    var rowTop = function(row) {
        return top + row * constants.BLOCK.SPACING.Y;
    };

    function createPlanes(blocks) {
        var planes = [];

        var getColumn = function(x) {
            var withinBlock = ((x - left) % constants.BLOCK.SPACING.X) <= constants.BLOCK.SIZE.X;
            if (withinBlock) {
                var columnIndex = Math.floor((x - left) / constants.BLOCK.SPACING.X);
                if (columnIndex >= 0 && columnIndex < blocks[0].length) {
                    return columnIndex;
                }
            }
            return null;
        };

        var getRow = function(y) {
            var withinBlock = ((y - top) % constants.BLOCK.SPACING.Y) <= constants.BLOCK.SIZE.Y;
            if (withinBlock) {
                var rowIndex = Math.floor((y - top) / constants.BLOCK.SPACING.Y);
                if (rowIndex >= 0 && rowIndex < blocks.length) {
                    return rowIndex;
                }
            }
            return null;
        };

        var createHorizontalPlane = function (row, normalY) {
            return physics.createPlane(
                [0, normalY],
                rowTop(row) + constants.BLOCK.SIZE.Y * (normalY + 1) / 2,
                function (x, y) {
                    var col = getColumn(x);
                    if (col && !blocks[row][col].hit) {
                        blocks[row][col].hit = true;
                        return [0, normalY];
                    }
                    return null;
                }
            );
        };

        var createVerticalPlane = function (col, normalX) {
            return physics.createPlane(
                [normalX, 0],
                columnLeft(col) + constants.BLOCK.SIZE.X * (normalX + 1) / 2,
                function (x, y) {
                    var row = getRow(y);
                    if (row && !blocks[row][col].hit) {
                        blocks[row][col].hit = true;
                        return [normalX, 0];
                    }
                    return null;
                }
            );
        };

        for (var row = 0; row < blocks.length; ++row) {
            planes.push(createHorizontalPlane(row, -1));
            planes.push(createHorizontalPlane(row, 1));
        }

        for (var col = 0; col < blocks[0].length; ++col) {
            planes.push(createVerticalPlane(col, -1));
            planes.push(createVerticalPlane(col, 1));
        }
        return planes;
    }
    
    var createPoints = function(blocks) {
        var points = [];
        
        var createPointsForBlock = function(block) {
            var collide = function() {
                if (block.hit) {
                    return false;
                }
                return block.hit = true;
            };
            points.push(physics.createPoint(
                block.x, block.y, collide));
            points.push(physics.createPoint(
                block.x + constants.BLOCK.SIZE.X, block.y, collide));
            points.push(physics.createPoint(
                block.x, block.y + constants.BLOCK.SIZE.Y, collide));
            points.push(physics.createPoint(
                block.x + constants.BLOCK.SIZE.X, block.y + constants.BLOCK.SIZE.Y, collide));
        };
        
        for (var row = 0; row < blocks.length; ++row) {
            for (var col = 0; col < blocks[row].length; ++col) {
                createPointsForBlock(blocks[row][col]);
            }
        }
        
        return points;
    };

    var loadLevel = function(data, baseNote) {

        var blockForNote = function(note) {
            return {
                note: note,
                midiNote: baseNote + scaleDegrees.indexOf(note)
            }
        };

        var adjustNotes = function(blocks) {
            var octaveAdjust = true, prevNote, col, row;

            while (octaveAdjust) {
                octaveAdjust = false;
                for (col = 0; col < blocks[0].length; ++col) {
                    prevNote = 0;
                    for (row = blocks.length - 1; row >= 0; --row) {
                        if (blocks[row][col].midiNote < prevNote) {
                            blocks[row][col].midiNote += 12;
                            octaveAdjust = true;
                        }
                        prevNote = blocks[row][col].midiNote;
                    }
                }
            }

            return blocks;
        };

        var addIndices = function(blocks) {
            for (var col = 0; col < blocks[0].length; ++col) {
                for (var row = blocks.length - 1; row >= 0; --row) {
                    blocks[row][col].x = columnLeft(col);
                    blocks[row][col].y = rowTop(row);
                }
            }
            return blocks;
        };

        var all = addIndices(adjustNotes(data.map(function(line) {
            return line.map(blockForNote);
        })));

        var planes = createPlanes(all);
        var points = createPoints(all);

        return {
            all: all,
            getCollisionObjects: function() { return planes.concat(points); },
            getCollisionPlanes: function() { return planes; },
            getCollisionPoints: function() { return points; }
        };
    };

    return {
        init: loadLevel
    }
});
