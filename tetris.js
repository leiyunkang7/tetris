$(function() {

    var factory = {
            block: function() {
                var className = "block",
                    colorArray = ["red", "green", "blue", "purple", "#EEC900"],
                    cssObj = {
                        width: 20,
                        height: 20,
                        "background": colorArray[Math.floor(Math.random() * colorArray.length)]
                    };
                return {
                    create: function() {
                        var el = $("<div class=" + className + "></div>");
                        el.css(cssObj);
                        return el;
                    }
                };
            },
            shape: function() {
                var shapeArray = [lineShape, squareShape, left7Shape, right7Shape, left2Shape, right2Shape, tuShape],
                    random = Math.floor(Math.random() * shapeArray.length),
                    shape = shapeArray[random]();
                return shape;
            }
        },
        map = {
            currenShape: null,
            viewShape: null,
            isAction: false,
            timer: -1,
            score: 0,
            speed: 1000,
            speeds: [1000, 900, 800, 700, 600, 500, 400, 300, 200, 100],
            level: 1,
            levels: [10, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240],
            $content: $(".left"),
            $view: $(".view"),
            $score: $(".score span"),
            $level: $(".level span"),
            viewAnchor: {
                left: -100,
                top: 80
            },
            bodys: [],
            scope: {
                left: 260,
                top: 380
            },
            defaultColor: "gray",
            checkScope: function(targetPoint) {
                return this.bodys.some(function($block, index) {
                    var top = parseInt($block.css("top")),
                        left = parseInt($block.css("left"));
                    return (top == targetPoint.top) && (left == targetPoint.left);
                });
            },
            nextShape: function() {
                var self = this;
                self.isOver(self.currenShape);
                self.currenShape.blocks.forEach(function($block, index) {
                    $block.css("background", self.defaultColor);
                });
                self.currenShape = Object.create(self.viewShape);
                self.viewShape = factory.shape();
                self.setView(self.viewShape);
                self.setCurren(self.currenShape);
            },
            setView: function(shape) {
                var self = this;
                self.$view.empty();
                shape.blocks.forEach(function($block, index) {
                    var $clone = $block.clone();
                    self.$view.append($clone.css({
                        left: parseInt($clone.css("left")) + self.viewAnchor.left,
                        top: parseInt($clone.css("top")) + self.viewAnchor.top,
                    }));
                });
            },
            setCurren: function(shape) {
                var self = this;
                shape.blocks.forEach(function($block, index) {
                    self.$content.append($block);
                });
            },
            init: function() {
                var self = this;
                self.currenShape = factory.shape();
                self.viewShape = factory.shape();
                self.setCurren(self.currenShape);
                self.setView(self.viewShape);
                self.$level.html(self.level);
                self.$score.html(self.score);
            },
            start: function() {
                var self = this;
                self.isAction = true;
                self.timer = setInterval(function() {
                    if (!self.currenShape) {
                        self.init();
                    }
                    self.down();
                }, self.speed);
            },
            stop: function() {
                this.isAction = false;
                clearInterval(this.timer);
            },
            isOver: function(shape) {
                if (shape.blocks.some(function($block, index) {
                        return parseInt($block.css("top")) < 0;
                    })) {
                    alert("游戏结束，您的得分是：" + this.score);
                    location.reload();
                }
            },
            down: function() {
                var self = this;
                var bool = self.currenShape.down(function(targetPoint) {
                    return (targetPoint.top <= self.scope.top) && (!self.checkScope(targetPoint));
                });
                if (!bool) {
                    self.bodys = self.bodys.concat(self.currenShape.blocks);
                    self.checkClear();
                    self.nextShape();
                }
            },
            checkClear: function() {
                var self = this,
                    topKeyBlocks = {},
                    topArray = [],
                    minTop;

                self.bodys.forEach(function($block, index) {
                    var top = parseInt($block.css("top"));
                    if (!topKeyBlocks[top]) {
                        topKeyBlocks[top] = [];
                    }
                    topKeyBlocks[top].push($block);
                });

                for (var top in topKeyBlocks) {
                    if (topKeyBlocks[top].length == 14) {
                        topArray.push(top);
                    }
                }

                minTop = topArray.sort()[0];

                topArray.forEach(function(t, i) {
                    var index = 0,
                        $block;
                    for (index = 0; index < self.bodys.length; index++) {
                        $block = self.bodys[index],
                            top = parseInt($block.css("top"));
                        if (t == top) {
                            $block.remove();
                            self.bodys.splice(index, 1);
                            index--;
                        } else if (top < minTop && i == topArray.length - 1) {
                            $block.css("top", top + $block.width() * topArray.length);
                        }
                    }
                });

                self.calcScore(topArray.length);
            },
            calcScore: function(rowNumber) {
                if (rowNumber == 0) {
                    return
                }
                var self = this;
                self.score += rowNumber * self.level;
                self.levels.some(function(score, index) {
                    if (self.score < score) {
                        self.level = index + 1;
                        return true;
                    }
                });
                self.$level.html(self.level);
                self.$score.html(self.score);
            }
        };

    function baseShape() {
        var shape = {
            change: function(checkFun) {
                var self = this,
                    temp = (self.state + 1 == self.status.length) ? 0 : self.state + 1,
                    bool = self.status[temp].every(function(obj, index) {
                        var $block = self.blocks[index],
                            width = $block.width();

                        return checkFun({
                            top: self.leftTopPoint.top + obj.y * width,
                            left: self.leftTopPoint.left + obj.x * width
                        });
                    });

                if (bool) {
                    self.state = temp;
                    self.status[self.state].forEach(function(obj, index) {
                        var $block = self.blocks[index],
                            width = $block.width();

                        $block.css({
                            top: self.leftTopPoint.top + obj.y * width,
                            left: self.leftTopPoint.left + obj.x * width
                        });
                    });
                }
                return bool;
            },
            state: 0,
            blocks: [],
            status: [],
            leftTopPoint: {
                top: -80,
                left: 100
            },
            left: function(checkFun) {
                var bool = false;
                if (this.blocks.every(function(block, index) {
                        return checkFun({
                            left: parseInt(block.css("left")) - block.width(),
                            top: parseInt(block.css("top"))
                        });
                    })) {
                    this.blocks.forEach(function(block, index) {
                        block.css("left", parseInt(block.css("left")) - block.width());
                    });
                    this.leftTopPoint.left -= this.blocks[0].width();
                    bool = true;
                }
                return bool;
            },
            right: function(checkFun) {
                var bool = false;
                if (this.blocks.every(function(block, index) {
                        return checkFun({
                            left: parseInt(block.css("left")) + block.width(),
                            top: parseInt(block.css("top"))
                        });
                    })) {
                    this.blocks.forEach(function(block, index) {
                        block.css("left", parseInt(block.css("left")) + block.width());
                    });
                    this.leftTopPoint.left += this.blocks[0].width();
                    bool = true;
                }
                return bool;
            },
            down: function(checkFun) {
                var bool = false;
                if (this.blocks.every(function(block, index) {
                        return checkFun({
                            left: parseInt(block.css("left")),
                            top: parseInt(block.css("top")) + block.width()
                        });
                    })) {
                    this.blocks.forEach(function(block, index) {
                        block.css("top", parseInt(block.css("top")) + block.width());
                    });
                    this.leftTopPoint.top += this.blocks[0].width();
                    bool = true;
                }
                return bool;
            }
        };
        return shape;
    }

    function createShape(status) {
        var fb = factory.block(),
            base = Object.create(baseShape()),
            shape = $.extend(base, {
                status: status
            }),
            state = Math.floor(Math.random() * status.length),
            randomStatus = status[state];

        shape.state = state;
        shape.blocks = randomStatus.map(function(obj, index) {
            var $block = fb.create();
            return $block.css({
                top: base.leftTopPoint.top + obj.y * $block.width(),
                left: base.leftTopPoint.left + obj.x * $block.width()
            });
        });
        return shape;
    }

    function lineShape() {
        return createShape([
            [{
                x: 0,
                y: 1
            }, {
                x: 1,
                y: 1
            }, {
                x: 2,
                y: 1
            }, {
                x: 3,
                y: 1
            }],
            [{
                x: 2,
                y: 0
            }, {
                x: 2,
                y: 1
            }, {
                x: 2,
                y: 2
            }, {
                x: 2,
                y: 3
            }]
        ]);
    }

    function squareShape() {
        return createShape([
            [{
                x: 1,
                y: 1
            }, {
                x: 2,
                y: 1
            }, {
                x: 1,
                y: 2
            }, {
                x: 2,
                y: 2
            }]
        ]);
    }

    function left7Shape() {
        return createShape([
            [{
                x: 1,
                y: 1
            }, {
                x: 2,
                y: 1
            }, {
                x: 2,
                y: 2
            }, {
                x: 2,
                y: 3
            }],
            [{
                x: 2,
                y: 1
            }, {
                x: 2,
                y: 2
            }, {
                x: 1,
                y: 2
            }, {
                x: 0,
                y: 2
            }],
            [{
                x: 1,
                y: 1
            }, {
                x: 1,
                y: 2
            }, {
                x: 1,
                y: 3
            }, {
                x: 2,
                y: 3
            }],
            [{
                x: 1,
                y: 1
            }, {
                x: 2,
                y: 1
            }, {
                x: 3,
                y: 1
            }, {
                x: 1,
                y: 2
            }]
        ]);
    }

    function right7Shape() {
        return createShape([
            [{
                x: 1,
                y: 1
            }, {
                x: 2,
                y: 1
            }, {
                x: 1,
                y: 2
            }, {
                x: 1,
                y: 3
            }],
            [{
                x: 0,
                y: 1
            }, {
                x: 1,
                y: 1
            }, {
                x: 2,
                y: 1
            }, {
                x: 2,
                y: 2
            }],
            [{
                x: 2,
                y: 1
            }, {
                x: 2,
                y: 2
            }, {
                x: 2,
                y: 3
            }, {
                x: 1,
                y: 3
            }],
            [{
                x: 1,
                y: 1
            }, {
                x: 1,
                y: 2
            }, {
                x: 2,
                y: 2
            }, {
                x: 3,
                y: 2
            }]
        ]);
    }

    function left2Shape() {
        return createShape([
            [{
                x: 1,
                y: 1
            }, {
                x: 2,
                y: 1
            }, {
                x: 2,
                y: 2
            }, {
                x: 3,
                y: 2
            }],
            [{
                x: 2,
                y: 1
            }, {
                x: 1,
                y: 2
            }, {
                x: 2,
                y: 2
            }, {
                x: 1,
                y: 3
            }]
        ]);
    }

    function right2Shape() {
        return createShape([
            [{
                x: 1,
                y: 1
            }, {
                x: 2,
                y: 1
            }, {
                x: 0,
                y: 2
            }, {
                x: 1,
                y: 2
            }],
            [{
                x: 1,
                y: 1
            }, {
                x: 1,
                y: 2
            }, {
                x: 2,
                y: 2
            }, {
                x: 2,
                y: 3
            }]
        ]);
    }

    function tuShape() {
        return createShape([
            [{
                x: 1,
                y: 1
            }, {
                x: 0,
                y: 2
            }, {
                x: 1,
                y: 2
            }, {
                x: 2,
                y: 2
            }],
            [{
                x: 1,
                y: 1
            }, {
                x: 1,
                y: 2
            }, {
                x: 2,
                y: 2
            }, {
                x: 1,
                y: 3
            }],
            [{
                x: 0,
                y: 2
            }, {
                x: 1,
                y: 2
            }, {
                x: 2,
                y: 2
            }, {
                x: 1,
                y: 3
            }],
            [{
                x: 1,
                y: 1
            }, {
                x: 1,
                y: 2
            }, {
                x: 0,
                y: 2
            }, {
                x: 1,
                y: 3
            }]
        ]);
    }

    $("#startBtn").click(function() {
        map.start();
        $(this).remove();
    });

    $(document).keydown(function(event) {
        if (!map.isAction && event.keyCode != 32) return;
        switch (event.keyCode) {
            //上
            case 38:
                map.currenShape.change(function(targetPoint) {
                    return targetPoint.top <= map.scope.top && targetPoint.left >= 0 && targetPoint.left <= map.scope.left && !map.checkScope(targetPoint);
                });
                break;
                //右
            case 39:
                map.currenShape.right(function(targetPoint) {
                    return targetPoint.left <= map.scope.left && !map.checkScope(targetPoint);
                });
                break;
                //下
            case 40:
                map.down();
                break;
                //左
            case 37:
                map.currenShape.left(function(targetPoint) {
                    return targetPoint.left >= 0 && !map.checkScope(targetPoint);
                });
                break;
                //空格
            case 32:
                if (map.isAction) {
                    map.stop();
                } else {
                    map.start();
                }
                break;
        }
    });
});
