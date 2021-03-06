/**
 * PhyloCanvas - A JavaScript and HTML5 Canvas Phylogenetic tree drawing tool.
 *
 * @author Chris Powell (c.powell@imperial.ac.uk)
 * @modified 14/01/14
 */
var PhyloCanvas = (function(){
        /**
         * Get the y coordinate of oElement
         *
         * @param oElement - The element to get the Y position of.
         *
         */
        function getY( oElement )
        {
         var iReturnValue = 0;
         while( oElement != null ) {
            iReturnValue += oElement.offsetTop;
            oElement = oElement.offsetParent;
         }
         return iReturnValue;
        }

        /**
         * Get the x coordinate of oElement
         *
         * @param oElement - The element to get the X position of.
         *
         */
        function getX( oElement )
        {
         var iReturnValue = 0;
         while( oElement != null ) {
            iReturnValue += oElement.offsetLeft;
            oElement = oElement.offsetParent;
         }
         return iReturnValue;
        }

        /**
         * Return backing store pixel ratio of context.
         *
         * @param context - The rendering context of HTMl5 canvas.
         *
         */
        function getBackingStorePixelRatio(context) {
            return (context.backingStorePixelRatio ||
                context.webkitBackingStorePixelRatio ||
                context.mozBackingStorePixelRatio ||
                context.msBackingStorePixelRatio ||
                context.oBackingStorePixelRatio ||
                context.backingStorePixelRatio || 1);
        }


        function fireEvent(element, type, params)
        {
            var event; // The custom event that will be created

              if (document.createEvent) {
                event = document.createEvent("HTMLEvents");
                event.initEvent(type, true, true);
              } else {
                event = document.createEventObject();
                event.eventType = type;
              }

              event.eventName = type;
              event.bubbles = false;
                if(params)
                {
                    for( var param in params )
                    {
                        event[param] = params[param];
                    }
                }

              if (document.createEvent) {
                element.dispatchEvent(event);
              } else {
                element.fireEvent("on" + event.eventType, event);
              }
        }

        function addEvent(elem, event, fn) {
            if (elem.addEventListener) {
                elem.addEventListener(event, fn, false);
            } else {
                elem.attachEvent("on" + event, function() {
                    // set the this pointer same as addEventListener when fn is called
                    return(fn.call(elem, window.event));
                });
            }
        }

        function addClass(element, className)
        {
            var classes = element.className.split(' ');
            if( classes.indexOf(className) === -1 )
            {
                classes.push(className);
                element.className = classes.join(' ');
            }
        }

        function removeClass(element, className)
        {
            var classes = element.className.split(' '),
                idx = classes.indexOf(className);
            if( idx !== -1 )
            {
                classes.splice(idx, 1);
                element.className = classes.join(' ');
            }
        }

        function hasClass(element, className)
        {
            var classes = element.className.split(' '),
                idx = classes.indexOf(className);
            return idx !== -1;
        }

        /**
         * @namespace PhyloCanvas
         */



        /**
         * An enumeration of certain pre-defined angles to enable faster drawing of trees. There are FORTYFIVE, QUARTER, HALF and FULL. Values are all radians.
         * @enum
         * @memberof PhyloCanvas
         * @constant
         */
        var Angles={
            /**
             * @constant
             * @type double
             * @description PI / 4
             */
            FORTYFIVE : Math.PI / 4,
            /**
             * @constant
             * @type double
             * @description PI / 2
             */
            QUARTER : Math.PI / 2,
            /**
             * @constant
             * @type double
             * @description PI
             */
            HALF : Math.PI,
            /**
             * @constant
             * @type double
             * @description PI * 2
             */
            FULL : 2 * Math.PI
        };

        /**
         * Creates a function which can be called from an event handler independent of scope
         *
         * @param {Object} obj the object the function will be called on
         * @param {String} func the name of the function to be called
         * @retuns {function}
         */
        function createHandler(obj, func)
        {

            if(typeof func == typeof "aaa")
            {
                return (function(e){return obj[func](e);});
            }
            else
            {
                return function(e){return func(obj);};
            }
        };

        /**
         * dictionary to translate annotations in NWK to branch renderer ids
         * @enum
         * @memberof PhyloCanvas
         */
        var Shapes = {
            "x" : "star",
            "s" : "square",
            "o" : "circle",
            "t" : "triangle"
        };

        /**
         * Creates a branch
         *
         * @constructor
         * @memberof PhyloCanvas
         * @public
         *
         */
        var Branch = function()
        {

            /**
             * The angle clockwise from horizontal the branch is (Used paricularly for Circular and Radial Trees)
             * @public
             *
             */
            this.angle = 0;

            /**
             * The Length of the branch
             */
            this.branchLength = false;

            /**
             * The Canvas DOM object the parent tree is drawn on
             */
            this.canvas;

            /**
             * The center of the end of the node on the x axis
             */
            this.centerx = 0;
            /**
             * The center of the end of the node on the y axis
             */
            this.centery = 0;
            /**
             * the branches that stem from this branch
             */
            this.children = [];
            //this.childNo = 0;
            /**
             * true if the node has been collapsed
             * @type Boolean
             */
            this.collapsed = false;
            /**
             * The colour of the terminal of this node
             */
            this.colour =  "rgba(0,0,0,1)";
            /**
             * an object to hold custom data for this node
             */
            this.data = {};
            /**
             * This node's unique ID
             */
            this.id = "";
            /**
             * when the branch drawing algorithm needs to switch. For example: where the Circular algorithm needs to change the colour of the branch.
             */
            this.interx = 0;
            /**
             * when the branch drawing algorithm needs to switch. For example: where the Circular algorithm needs to change the colour of the branch.
             */
            this.intery = 0;
            /**
             * The text lable for this node
             */
            this.label = null;
            /**
             * If true, this node have no children
             */
            this.leaf = true;
            /**
             * the angle that the last child of this brach 'splays' at, used for circular and radial trees
             */
            this.maxChildAngle = 0;
            /**
             * the angle that the last child of this brach 'splays' at, used for circular and radial trees
             */
            this.minChildAngle = Angles.FULL;

            /**
             * What kind of teminal should be drawn on this node
             */
            this.nodeShape = "circle";

            /**
             * The parent branch of this branch
             */
            this.parent = null;
            /**
             * The relative size of the terminal of this node
             */
            this.radius =  1.0;
            /**
             * true if this branch is currently selected
             */
            this.selected = false;

            /**
             * the x position of the start of the branch
             * @type double
             */
            this.startx = 0;
            /**
             * the y position of the start of the branch
             * @type double
             */
            this.starty = 0;
            /**
             * The length from the root of the tree to the tip of this branch
             */
            this.totalBranchLength = 0;
            /**
             * The tree object that this branch is part of
             * @type Tree
             */
            this.tree = {};
        };


        /**
         * The menu that is shown when the PhyloCanvas widget is right-clicked
         *
         * @constructor
         * @memberOf PhyloCanvas
         *
         */
        var ContextMenu = function(tree)
        {
         /**
          * The Tree object that this context menu influences
          */
          this.tree = tree;
          /**
           * The div of the menu
           */
          this.div = document.createElement('div');
          this.div.style.display = 'none';
          this.div.style.position = 'fixed';
          this.div.style.border = '1px solid #CCCCCC';
          this.div.style.background = '#FFFFFF';
          this.div.className = 'contextMenu';
          /**
           * The options in this menu
           */
          this.elements = [
          {
              text:'Redraw Subtree',handler: 'redrawTreeFromBranch', internal: true, leaf:false
          },
          {
              text:'Show Labels',handler: 'displayLabels', internal: false, leaf:false
          },
          {
              text:'Hide Labels',handler: 'hideLabels', internal: false, leaf:false
          },
          {
              text:'Collapse/Expand branch',handler: 'toggleCollapsed', internal: true, leaf:false
          },
          {
              text:'Rotate Branch',handler: 'rotate', internal: true, leaf:false
          }];

          this.tree.canvasEl.appendChild(this.div);
        };

        /**
         * @constructor
         * @memberof PhyloCanvas
         */
        var Loader = function(div)
        {
            this.div = div;
            this.cl = document.createElement('canvas');
            this.cl.id = div.id + 'Loader';
            this.cl.style.position = 'absolute';
            this.cl.style.backgroundColour = '#FFFFFF';
            this.cl.style.top = (div.offsetHeight/4) + "px";
            this.cl.style.left = (div.offsetWidth/4) + "px";
            this.cl.height = div.offsetHeight/2;
            this.cl.width = div.offsetWidth/2;
            this.cl.style.zIndex = '1000';
            div.appendChild(this.cl);

    //        this.ctx = this.cl.getContext('2d');
            this.ctx = document.getElementById(div.id + 'Loader').getContext('2d');
            this.drawer = null;
            this.loader_radius;
            this.loader_step = (2 * Math.PI) / 360;

            this.message = "Loading ...";
        };

        /**
         * @constructor
         * @memberof PhyloCanvas
         */
        var Navigator = function(tree)
        {
            this.tree = tree;
            this.cel = document.createElement('canvas');
            this.cel.id = this.tree.canvasEl.id + 'Navi';
            this.cel.style.zIndex = '100';
            this.cel.style.backgroundColour = '#FFFFFF';
            this.cel.width = this.tree.canvas.canvas.width / 3;
            this.cel.height = this.tree.canvas.canvas.height / 3;
            this.cel.style.position = 'absolute';
            this.cel.style.bottom = '0px';
            this.cel.style.right = '0px';
            this.cel.style.border = '1px solid #CCCCCC';
            this.tree.canvasEl.appendChild(this.cel);

            this.ctx = this.cel.getContext('2d');
            this.ctx.translate(this.cel.width / 2, this.cel.height / 2);
            this.ctx.save();

        };

        /**
         * The instance of a PhyloCanvas Widget
         *
         * @constructor
         * @memberof PhyloCanvas
         * @param div {string|HTMLDivElement} the div or id of a div that phylocanvas will be drawn in
         *
         * {@link PhyoCanvas.Tree}
         *
         * @example
         *  new PhyloCanvas.Tree('div_id');
         *
         * @example
         *  new PhyloCanvas.Tree(div);
         */
        var Tree = function(div, conf)
        {
            if(!conf) conf = {}
            // if the ID is provided get the element, if not assume div
            if(typeof div == 'string') div = document.getElementById(div);

            /**
             *
             * Dictionary of all branches indexed by Id
             */
            this.branches = {};
            /**
             *
             * List of leaves
             */
            this.leaves = [];
            /**
             * Loading dialog displayed while waiting for the tree
             */
            //this.loader = new Loader(div);
            /**
             * The root node of the tree (not neccesarily a root in the Phylogenetic sense)
             */
            this.root = false;

            /**
             *
             * used for auto ids for internal nodes
             * @private
             */
            this.lastId = 0;

            /**
             * backColour colour the branches of the tree based on the colour of the tips
             */
            this.backColour = false

            this.origBL = {};
            this.origP = {};

            this.canvasEl = div;

            addClass(this.canvasEl, 'pc-container');

            //Set up the div and canvas element
            if(window.getComputedStyle(this.canvasEl).position === 'static' )this.canvasEl.style.position = 'relative';
            this.canvasEl.style.boxSizing = 'border-box';
            var cl = document.createElement('canvas');
            cl.id = div.id + 'pCanvas';
            cl.className = 'phylocanvas';
            cl.style.position = 'relative';
            cl.style.backgroundColour = '#FFFFFF';
            cl.height = div.clientHeight || 400;
            cl.width = div.clientWidth || 400;
            cl.style.zIndex = '1';
            this.canvasEl.appendChild(cl);

            /***
             * Right click menu
             */
            this.contextMenu = new ContextMenu(this);
            this.drawn = false;

             this.selectedNodes = [];

             this.zoom = 1;
             this.pickedup = false;
             this.dragging = false;
             this.startx; this.starty;
             this.pickedup = false;
             this.baseNodeSize = 1;
             this.curx;
             this.cury;
             this.origx;
             this.origy;

             this.canvas = cl.getContext('2d');

             this.canvas.canvas.onselectstart = function () { return false; };
             this.canvas.fillStyle = "#000000";
             this.canvas.strokeStyle = "#000000";
             this.canvas.save();

             this.offsetx = this.canvas.canvas.width/2;
             this.offsety = this.canvas.canvas.height/2;
             this.selectedColour = "rgba(49,151,245,1)";
             this.highlightColour = "rgba(49,151,245,1)";
             this.highlightWidth = 5.0;
             this.selectedNodeSizeIncrease = 0;
             this.branchColour = "rgba(0,0,0,1)";
             this.branchScalar = 1.0;

             this.hoverLabel = false;

             this.internalNodesSelectable = true;

             this.showLabels = true;
             this.showBootstraps = false;

             this.treeType = 'radial';
             this.maxBranchLength = 0;
             this.lineWidth = 1.0;
             this.textSize = 10;
             this.font = "sans-serif";


             this.unselectOnClickAway = true;
             this.rightClickZoom = true;

             if(this.use_navigator){
                 this.navigator = new Navigator(this);
             }

            this.history_collapsed = conf.history_collapsed;
            this.history = new History(this);
            if(this.history_collapsed) this.history.collapse();

            addEvent(document.querySelector('.pc-history .toggle'), 'click', this.history.toggle.bind(this.history));

            this.adjustForPixelRatio();

            //if(this.showControls) this.drawControls();
            //window.onresize = createHandler(this, "autoSize");
            this.addListener('contextmenu', this.clicked.bind(this));
            this.addListener('click', this.clicked.bind(this));
            //this.canvas.canvas.ondblclick =  createHandler(this, "dblclicked");
            this.addListener('mousedown', this.pickup.bind(this));
            this.addListener('mouseup', this.drop.bind(this));// =  createHandler(this, "drop");
            this.addListener('mouseout', this.drop.bind(this));// =  createHandler(this, "drop");

            addEvent(this.canvas.canvas, 'mousemove', this.drag.bind(this)); //=  createHandler(this, "drag");
            addEvent(this.canvas.canvas,'mousewheel', this.scroll.bind(this));// = createHandler(this, "scroll");
            addEvent(this.canvas.canvas,'DOMMouseScroll', this.scroll.bind(this));//createHandler(this, "scroll"));
            addEvent(window,'resize', function(evt) {
                this.resizeToContainer();
            }.bind(this));

            this.addListener('loaded', function(evt){
                    this.origBranches = this.branches;
                    this.origLeaves = this.leaves;
                    this.origRoot = this.root;
            }.bind(this))


        };


    //static members
    ContextMenu.prototype = {
            close : function()
            {
                this.div.style.display = 'none';
            },
            mouseover : function(d){d.style.backgroundColour = "#E2E3DF";},
            mouseout : function(d){d.style.backgroundColour = "transparent";},
            open: function(x,y)
            {
                while(this.div.hasChildNodes()){this.div.removeChild(this.div.firstChild);}
                for(var i = 0; i < this.elements.length; i++)
                {
                    var nd = this.tree.root.clicked(this.tree.translateClickX(x), this.tree.translateClickY(y));
                    if((nd && ((nd.leaf && !this.elements[i].leaf && this.elements[i].internal) ||(!nd.leaf && !this.elements[i].internal && this.elements[i].leaf))) || (!nd && (this.elements[i].leaf || this.elements[i].internal)))
                    {
                        continue;
                    }
                    d = document.createElement('div');
                    d.appendChild(document.createTextNode(this.elements[i].text));
                    if(this.elements[i].leaf || this.elements[i].internal)
                    {
                        d.addEventListener('click', createHandler(nd, this.elements[i].handler));
                    }
                    else
                    {
                        d.addEventListener('click', createHandler(this.tree, this.elements[i].handler));
                    }
                    d.style.cursor = 'pointer';
                    d.style.padding = '0.3em 0.5em 0.3em 0.5em';
                    d.style.fontFamily = this.tree.font;
                    d.style.fontSize = '12pt';
                    d.addEventListener('click', createHandler(this, 'close'));
                    document.body.addEventListener('click', createHandler(this, 'close'));
                    d.addEventListener('contextmenu', function(e){e.preventDefault();});
                    d.addEventListener('mouseover', createHandler(d, this.mouseover));
                    d.addEventListener('mouseout', createHandler(d, this.mouseout));
                    this.div.appendChild(d);
                }
                if(x && y)
                {

                    this.div.style.top = y + 'px';
                    this.div.style.left = x + 'px';
                }
                else
                {
                    this.div.style.top = '100px';
                    this.div.style.left = '100px';
                }

                this.div.style.zIndex = 2000;
                this.div.style.display = 'block';

                this.div.style.backgroundColour = '#FFFFFF';
            }
    };
    /**
     * Prototype for the loading spinner.
     */
    Loader.prototype = {
             run : function()
             {
                 var i = 0;
                 this.cl.style.diangle = "block";
                 this.initLoader();
                 var loader = this;
                 this.drawer = setInterval(function(){
                     loader.drawLoader(i);
                     i++;
                 }, 10);

             },
             resize : function()
             {
                this.cl.style.top = "2px";
                this.cl.style.left = "2px";
                this.cl.height = this.div.offsetHeight * .75;
                this.cl.width = this.div.offsetWidth  * .75;

                this.ctx.strokeStyle = 'rgba(180,180,255,1)';
                this.ctx.fillStyle = 'rgba(180,180,255,1)';
                this.ctx.lineWidth = 10.0;

                this.ctx.font = "24px sans-serif";

                this.ctx.shadowOffsetX = 2.0;
                this.ctx.shadowOffsetY = 2.0;

             },
             initLoader : function()
             {
                 this.ctx.strokeStyle = 'rgba(180,180,255,1)';
                 this.ctx.fillStyle = 'rgba(180,180,255,1)';
                 this.ctx.lineWidth = 10.0;

                 this.ctx.font = "24px sans-serif";

                 this.ctx.shadowOffsetX = 2.0;
                 this.ctx.shadowOffsetY = 2.0;
             },
             drawLoader : function (t)
             {
                 this.ctx.restore();

                 this.ctx.translate(0,0);
                 this.loader_radius = Math.min(this.ctx.canvas.width/4, this.ctx.canvas.height/4);

                 this.ctx.save();
                 this.ctx.clearRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height);
                 this.ctx.translate(this.ctx.canvas.width/2, this.ctx.canvas.height/2);

                 this.ctx.beginPath();
                 this.ctx.arc(0,0, this.loader_radius, this.loader_step * t, this.loader_step * t + 2);
                 this.ctx.stroke();

                 this.ctx.beginPath();
                 this.ctx.arc(0,0, this.loader_radius, this.loader_step * t + 3, this.loader_step * t + 5);
                 this.ctx.stroke();
                 var txt = this.message;
                 this.ctx.fillText(txt, -(this.ctx.measureText(txt).width / 2), this.loader_radius + 50, this.cl.width);

             },
             stop : function(){
                clearInterval(this.drawer);
                this.cl.style.display = "none";
             },
             fail : function(message)
             {

                clearInterval(this.drawer);
                this.loader_radius = Math.min(this.ctx.canvas.width/4, this.ctx.canvas.height/4);
                 this.ctx.restore();

                 this.ctx.translate(0,0);
                 this.ctx.clearRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height);
                //    this.ctx.translate(this.ctx.canvas.width/2, this.ctx.canvas.height/2);

                 this.ctx.beginPath();

                this.ctx.strokeStyle = 'rgba(255,180,180,1)';
                this.ctx.fillStyle = 'rgba(255,180,180,1)';

                this.ctx.translate(this.ctx.canvas.width/2, this.ctx.canvas.height/2);

                this.ctx.beginPath();

                this.ctx.moveTo(0,0);
                this.ctx.lineTo(this.loader_radius, this.loader_radius);
                this.ctx.moveTo(0,0);
                this.ctx.lineTo(-this.loader_radius, this.loader_radius);
                this.ctx.moveTo(0,0);
                this.ctx.lineTo(-this.loader_radius, -this.loader_radius);
                this.ctx.moveTo(0,0);
                this.ctx.lineTo(this.loader_radius, -this.loader_radius);
                this.ctx.stroke();


                this.ctx.fillText(message, -(this.ctx.measureText(message).width / 2), this.loader_radius + 50, this.loader_radius * 2);
             }
    };

    /**
     *  Overview window
     */
    Navigator.prototype = {
            //
            drawFrame : function()
            {
                this.ctx.restore();
                this.ctx.save();

                var w = this.cel.width;
                var h = this.cel.height;
                var hw = w/2;
                var hh = h/2;

                this.ctx.clearRect(-hw, -hh, w, h);

                this.ctx.strokeStyle = 'rgba(180,180,255,1)';

                if(!this.tree.drawn)
                {
                    var url = this.tree.canvas.canvas.toDataURL();

                    this.img = document.createElement('img');
                    this.img.src = url;

                    var evtctx = this;

                    this.img.onload = function(){
                        evtctx.ctx.drawImage(evtctx.img, -hw, -hh, evtctx.cel.width, evtctx.cel.height);
                    };

                    this.baseOffsetx = this.tree.offsetx;
                    this.baseOffsety = this.tree.offsety;
                    this.baseZoom = this.tree.zoom;
                }
                else
                {
                    this.ctx.drawImage(this.img,-hw, -hh, this.cel.width, this.cel.height);
                }

                var z = 1 / (this.tree.zoom / this.baseZoom);

                this.ctx.lineWidth = this.ctx.lineWidth / z;

                this.ctx.translate((this.baseOffsetx - (this.tree.offsetx * z)) * z, (this.baseOffsety - (this.tree.offsety * z)) * z);
                this.ctx.scale(z, z);
                this.ctx.strokeRect(-hw, -hh, w, h);
            },

            /**
             *
             */
            resize : function(){
                this.cel.width = this.tree.canvas.canvas.width / 3;
                this.cel.height = this.tree.canvas.canvas.height / 3;
                this.ctx.translate(this.cel.width / 2, this.cel.height / 2);
                this.drawFrame();


            }
    };


    Branch.prototype = {
        clicked : function(x,y)
        {
            if(this.dragging) return;
            if(x < (this.maxx ) && x > (this.minx ))
            {
                if(y < (this.maxy ) && y > (this.miny ))
                {
                    return this;
                }
            }

            for(var i = this.children.length - 1; i >= 0; i--)
            {
                cld = this.children[i].clicked(x,y);
                if(cld) return cld;
            }

        },
        drawLabel : function()
        {
           // var  h = (/this.tree.zoom) ;

            var f_size = this.tree.textSize;
            this.canvas.font = f_size + "pt " + this.tree.font;
            var dim = this.canvas.measureText(lbl);

            var lbl = this.getLabel();

            var tx = this.getNodeSize() + 15
            var ty = f_size / 3;

            if(this.angle > Angles.QUARTER && this.angle < (Angles.HALF + Angles.QUARTER))
            {
               this.canvas.rotate(Angles.HALF);
               tx = -tx - (dim.width * 1.1);
            }

            this.canvas.beginPath();
            this.canvas.fillStyle = this.getTextColour();
            this.canvas.fillText(lbl, tx ,ty);
            this.canvas.closePath();
        },
        drawNode : function()
        {
            var  r = this.getNodeSize(); //r = node radius
            var theta = r; //theta = translation to center of node... ensures that the node edge is at the end of the branch so the branches don't look shorter than  they should

             var cx = this.leaf ? (theta * Math.cos(this.angle)) + this.centerx : this.centerx;
             var cy = this.leaf ? (theta * Math.sin(this.angle)) + this.centery : this.centery;

            this.canvas.beginPath();
            this.canvas.fillStyle = this.selected ? this.tree.selectedColour:this.colour ;
            if((r * this.tree.zoom) < 5)
            {
               var e =  (5 / this.tree.zoom);
               this.minx = cx - e;
               this.maxx = cx + e;
               this.miny = cy - e;
               this.maxy = cy + e;
            }
            else
            {
               this.minx =  cx - r;
               this.maxx = cx + r;
               this.miny= cy - r;
               this.maxy = cy + r;
            }
            if(this.collapsed)
            {
                var x1 = ((this.getNodeSize() * 10) /this.tree.zoom) * Math.cos(this.angle - Angles.QUARTER);
                var y1 = ((this.getNodeSize() * 10) /this.tree.zoom) * Math.sin(this.angle - Angles.QUARTER);
                var x2 = ((this.getNodeSize() * 10) /this.tree.zoom) * Math.cos(this.angle);
                var y2 = ((this.getNodeSize() * 10) /this.tree.zoom) * Math.sin(this.angle);
                this.canvas.beginPath();
                this.canvas.moveTo((this.centerx - x1), (this.centery - y1));
                this.canvas.lineTo((this.centerx + x1), (this.centery + y1));
                this.canvas.lineTo((this.centerx + x2), (this.centery + y2));
                this.canvas.lineTo((this.centerx - x1), (this.centery - y1));
                this.canvas.closePath();
                this.canvas.fill();
            }
            else if(this.leaf)
            {
                this.canvas.save();
                this.canvas.translate(this.centerx, this.centery);
                this.canvas.rotate(this.angle);
                this.tree.nodeRenderers[this.nodeShape](this);
                if(this.tree.showLabels || (this.tree.hoverLabel && this.highlighted)) this.drawLabel();
                this.canvas.restore();

            }

            this.canvas.closePath();


             if(this.highlighted)
             {
                 this.canvas.beginPath();
                 var l = this.canvas.lineWidth;
                 this.canvas.strokeStyle = this.tree.highlightColour;
                 this.canvas.lineWidth = this.tree.highlightWidth / this.tree.zoom;
                 this.canvas.arc(cx, cy, (this.leaf? this.getNodeSize() : 0)+ ((5 + ( this.tree.highlightWidth/ 2)) / this.tree.zoom), 0, Angles.FULL, false);
                 this.canvas.stroke();
                 this.canvas.lineWidth = l;
                 this.canvas.strokeStyle = this.tree.branchColour;
                 this.canvas.beginPath();
             }
        },
        getChildIds : function()
        {
            if(this.leaf)
            {
                return this.id;
            }
            else
            {
                var children = [];
                for(var x = 0; x < this.children.length; x++)
                {
                    children = children.concat(this.children[x].getChildIds());
                }
                return children;
            }
        },
        getChildCount : function()
        {
            if(this.leaf) return 1;
            var children = 0;
            for(var x = 0; x < this.children.length; x++)
            {
                children += this.children[x].getChildCount();
            }
            return children;
        },
        getChildYTotal : function()
        {
         if(this.leaf) return this.centery;

         var y = 0;
         for(var i = 0; i < this.children.length; i++)
         {
            y += this.children[i].getChildYTotal();
         }
         return y;
        },
        setSelected : function(selected, applyToChildren)
        {
            var ids = this.id;
            this.selected = selected;
            if(applyToChildren){
                for(var i = 0; i < this.children.length; i++)
                {
                  ids = ids + "," + this.children[i].setSelected(selected, applyToChildren);
                }
            }
            return ids;
        },
        setHighlighted : function(highlighted)
        {
            //var ids = this.id;
            this.highlighted = highlighted;
            if(!highlighted){
                for(var i = 0; i < this.children.length; i++)
                {
                  this.children[i].setHighlighted(highlighted);
                }
            }
            //return ids;
        },
        reset : function()
        {
            this.startx = 0;
            this.starty = 0;
            this.centerx = 0;
            this.centery = 0;
            this.angle = null;
            //this.totalBranchLength = 0;
            this.minChildAngle = Angles.FULL;
            this.maxChildAngle = 0;
            for(cld in this.children)
            {
                try{
                    this.children[cld].pcReset();
                }catch(e){}
            }
        },
        parseNwk :function(nwk, idx)
        {
            idx = this.parseLabel(nwk,idx);
            if(nwk[idx] == ":")
            {
                idx = this.parseNodeLength(nwk, idx + 1);
            }
            else
            {
                this.branchLength = 0;
            }
            if(!this.id || this.id == "") this.id = this.tree.genId();
            return idx;
        },
        parseLabel : function(nwk, idx)
        {
            var lbl = "";
            for(idx; nwk[idx] != ":" && nwk[idx] != "," && nwk[idx] != ")" && idx < nwk.length; idx++)
            {
               lbl += nwk[idx];
            }
            //idx--;
            if(!lbl) return idx;
            if(lbl.match(/\*/))
            {
                var bits = lbl.split("**");
                this.id = bits[0];
                if(bits.length == 1 ) return idx;
                // if(pcdebug && Ext) Ext.get(pcdebug).update(pcdebug.innerText + '\nNode Colour is : ' + bits[b+1]); && Ext) Ext.get(pcdebug).update(pcdebug.innerHtml + '<br />label is : ' + bits[0]);
                bits = bits[1].split("*");

                for(var b = 0; b < bits.length; b += 2)
                {
                   switch (bits[b])
                   {
                      case "nsz" :
                          // if(pcdebug && Ext) Ext.get(pcdebug).update(pcdebug.innerText + '\nNode Colour is : ' + bits[b+1]); && Ext) Ext.get(pcdebug).update(pcdebug.innerHtml + '<br />Node Size is : ' + bits[b+1]);
                         this.radius = parseInt(bits[b+1]);
                         break;
                      case "nsh" :

                        if(Shapes[bits[b+1]]) this.nodeShape = Shapes[bits[b+1]];
                        else if(this.nodeRenderers[bits[b+1]]) this.nodeShape = bits[b+1];
                        else this.nodeShape = "circle";
                         // if(pcdebug && Ext) Ext.get(pcdebug).update(pcdebug.innerText + '\nNode Colour is : ' + bits[b+1]); && Ext) Ext.get(pcdebug).update(pcdebug.innerHtml + '<br />Node shape is : ' + bits[b+1]);
                         break;
                      case "ncol" : this.colour = bits[b+1];
                         var hexRed = '0x' + this.colour.substring(0,2);
                         var hexGreen = '0x' + this.colour.substring(2,4);
                         var hexBlue = '0x' + this.colour.substring(4,6);
                         this.colour = 'rgba('+parseInt(hexRed, 16).toString()+','+parseInt(hexGreen, 16).toString()+','+parseInt(hexBlue, 16).toString()+',1)';
                         // if(pcdebug && Ext) Ext.get(pcdebug).update(pcdebug.innerText + '\nNode Colour is : ' + bits[b+1]); && Ext) Ext.get(pcdebug).update(pcdebug.innerHtml + '<br />Node Colour is : ' + bits[b+1]);
                         break;
                   }
                }
            }
            else
            {
                this.id = lbl;
            }
            return idx;
        },
        parseNodeLength : function(nwk, idx)
        {
            var str = "";
            for(idx; nwk[idx] != ")" && nwk[idx] != ","; idx++)
            {
               str += nwk[idx];
            }

            this.branchLength = parseFloat(str);
            if(this.branchLength < 0) this.branchLength = 0;
            return idx;
        },
        redrawTreeFromBranch : function()
        {
            this.tree.redrawFromBranch(this);
        },
        saveChildren : function()
        {
            for(var i = 0; i < this.children.length; i ++)
            {
                this.tree.saveNode(this.children[i]);
                this.children[i].saveChildren();
            }
        },
        collapse : function()
       {
           this.collapsed = this.leaf === false; // don't collapse the node if it is a leaf... that would be silly!
       },
       expand : function()
       {
           this.collapsed = false;
       },
       toggleCollapsed : function()
       {
           this.collapsed ? this.expand() : this.collapse();
       },
        setTotalLength : function()
        {

            if(this.parent)
            {
                this.totalBranchLength = this.parent.totalBranchLength +  this.branchLength;
                if(this.totalBranchLength > this.tree.maxBranchLength) this.tree.maxBranchLength = this.totalBranchLength;
            }
            else
            {
                 this.totalBranchLength = this.branchLength;
                 this.tree.maxBranchLength = this.totalBranchLength;
            }
            for(var c = 0; c < this.children.length ; c++)
            {
                this.children[c].setTotalLength();
            }
        }
    };

    /**
     *
     * add a child branch to this branch
     * @param node {Branch} the node to add as a child
     * @memberof Branch
     */
    Branch.prototype.addChild = function(node)
    {
        node.parent = this;
        //node.childNo = this.children.length;
        node.canvas = this.canvas;
        node.tree = this.tree;
        this.leaf = false;
        this.children.push(node);
    };

    /**
     * Return the node colour of all the nodes that are children of this one.
     */
    Branch.prototype.getChildColours = function()
    {
        var colours = [];

        this.children.forEach(function(branch, n)
        {
            var colour = branch.children.length === 0 ? branch.colour : branch.getColour();

            if (colours.indexOf(colour) === -1 ) //only add each colour once.
            {
                colours.push(colour);
            }
        });

        return colours;
    }

    /**
     * Get the colour(s) of the branch itself.
     */
    Branch.prototype.getColour = function()
    {
        if(this.selected)
        {
            return this.tree.selectedColour;
        }
        else if(this.tree.backColour === true)
        {
            if(this.children.length)
            {
                var c_cols = this.getChildColours();

                if(c_cols.length === 1)
                {
                    return c_cols[0]
                }
                else
                {
                    return this.tree.branchColour;
                }
            }
            else
            {
                return this.colour;
            }
        }
        else if(typeof this.tree.backColour === 'function')
        {
            return this.tree.backColour(this);
        }
        else
        {
            return this.tree.branchColour;
        }
    };

    Branch.prototype.getNwk = function(){
        if(this.leaf)
        {
            return this.id + ':' + this.branchLength;
        }
        else
        {
            var children= [];
            for( var i = 0; i < this.children.length; i++ )
            {
                children.push(this.children[i].getNwk())
            }
            nwk = '(' + children.join(',') + '):' + this.branchLength;
            return nwk;
        }

    }

    Branch.prototype.getTextColour = function()
    {
        if(this.selected)
        {
            return this.tree.selectedColour;
        }
        if(this.highlighted)
        {
                return this.tree.highlightColour;
        }
        else if(this.tree.backColour)
        {
            if(this.children.length)
            {
                var c_cols = this.getChildColours();

                if(c_cols.length === 1)
                {
                    return c_cols[0]
                }
                else
                {
                    return this.tree.branchColour;
                }
            }
            else
            {
                return this.colour;
            }
        }
        else
        {
            return this.tree.branchColour;
        }
    };

    Branch.prototype.getLabel = function()
    {
        return (this.label !== undefined && this.label !== null) ? this.label : this.id;
    };

    Branch.prototype.getLabelSize = function()
    {
        return this.tree.canvas.measureText(this.getLabel()).width;
    }

    Branch.prototype.getNodeSize = function()
    {
        return Math.max(0, this.tree.baseNodeSize * this.radius);
    };

    Branch.prototype.rotate = function(evt)
    {
        var newChildren = [];
        for( var i = this.children.length; i-- ; )
        {
            newChildren.push(this.children[i]);
        }

        this.children = newChildren;

        if( ! evt.preventredraw )
        {
            this.tree.buildLeaves();
            this.tree.draw(true);
        }
    }

    Branch.prototype.getChildNo = function(){
        return this.parent.children.indexOf(this);
    }

    Tree.prototype = {
        // Included
        AJAX : function(url, method, params, callback, callbackPars, scope, errorCallback)
        {
          var xmlhttp;
          if (window.XMLHttpRequest)
          {// code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp=new XMLHttpRequest();
          }
          else
          {// code for IE6, IE5
            xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
          }

          xmlhttp.onreadystatechange=function()
          {
            if (xmlhttp.readyState==4)
            {
                if(xmlhttp.status==200)
                {
                    callback(xmlhttp, callbackPars, scope);
                }
                else
                {
                    if(errorCallback) errorCallback(xmlhttp, callbackPars, scope);
                }
            }
          };
          xmlhttp.open(method,url,true);
          if(method == "GET")
          {
            xmlhttp.send();
          }
          else
          {
            xmlhttp.send(params);
          }
        },
        /**
         * A dictionary of functions. Each function  draws a different tree structure
         */
        branchRenderers :
        {
            rectangular : function (tree, node, collapse){
                var  bl = node.branchLength * tree.branchScalar ;
                node.angle = 0;
                if(node.parent){
                    node.centerx = node.startx +  bl;
                }
                if(node.selected)
                {
                    //this.parent && this.parent.selected ? this.tree.selectedColour : this.tree.branchColour;
                    node.canvas.fillStyle = tree.selectedColour;
                }
                else
                {
                    node.canvas.fillStyle = node.colour;
                }

                node.canvas.strokeStyle = node.getColour();
                node.canvas.beginPath();

                if(!collapse){
                    node.canvas.moveTo(node.startx , node.starty);
                    node.canvas.lineTo(node.startx, node.centery);
                    node.canvas.lineTo(node.centerx, node.centery);
                    node.canvas.stroke();
                    node.canvas.closePath();
                    node.drawNode();
                }

                node.canvas.closePath();

                for(var i = 0 ; i < node.children.length && !collapse ;i++)
                {
                    node.children[i].startx = node.centerx;
                    node.children[i].starty = node.centery;
                    if(node.children[i].selected && !node.collapsed)
                    {
                     tree.selectedNodes.push(node.children[i]);
                    }
                    else
                    {
                      tree.branchRenderers.rectangular(tree, node.children[i], node.collapsed || collapse);
                    }
                }
            },
            circular : function(tree, node, collapse){
                var  bl = node.totalBranchLength * tree.branchScalar;
                node.canvas.strokeStyle = node.getColour();

                if(node.selected){
                    //this.parent && this.parent.selected ? this.tree.selectedColour : this.tree.branchColour;
                    node.canvas.fillStyle = node.tree.selectedColour;
                }
                else
                {
                    node.canvas.fillStyle = node.colour;
                }

                if(!collapse){
                    node.canvas.beginPath();
                    node.canvas.moveTo(node.startx, node.starty);
                    if(node.leaf)
                    {
                        node.canvas.lineTo(node.interx, node.intery);
                        node.canvas.stroke();
                        var ss = node.getColour();
                        node.canvas.strokeStyle = node.selected ? node.tree.selectedColour :  "rgba(0,0,0,0.5)";
                        node.canvas.lineTo(node.centerx, node.centery);
                        node.canvas.stroke();
                        node.canvas.strokeStyle = ss;
                    }
                    else
                    {
                        node.canvas.lineTo(node.centerx, node.centery);
                        node.canvas.stroke();
                    }


                    node.canvas.strokeStyle = node.getColour();


                    if(node.children.length > 1 && !node.collapsed )
                    {
                        node.canvas.beginPath();
                        node.canvas.arc(0, 0, (bl) , node.minChildAngle, node.maxChildAngle,node.maxChildAngle < node.minChildAngle);
                        node.canvas.stroke();
                        node.canvas.closePath();
                    }
                    node.drawNode();
                }

                for(var i = 0 ; i < node.children.length && !collapse; i++)
                {
                    tree.branchRenderers.circular(tree, node.children[i], node.collapsed || collapse);
                }
            },
            radial : function(tree, node, collapse){
                node.canvas.strokeStyle = node.getColour();

                if(node.selected){
                    node.canvas.fillStyle = node.tree.selectedColour;
                }
                else
                {
                    node.canvas.fillStyle = node.colour;
                }


                if(node.parent && !collapse){

                    node.canvas.beginPath();
                    node.canvas.moveTo(node.startx , node.starty );
                    node.canvas.lineTo(node.centerx ,  node.centery);
                    node.canvas.stroke();
                    node.canvas.closePath();
                    node.drawNode();
                }
                for(var i = 0 ; i < node.children.length && !collapse; i++)
                {
                    if(node.children[i].selected && !node.collapsed)
                    {
                      node.tree.selectedNodes.push(node.children[i]);
                    }
                    else
                    {
                      tree.branchRenderers.radial(tree, node.children[i], node.collapsed || collapse);
                    }
                }
            },
            diagonal: function(tree, node, collapse){
                node.angle = 0;
                node.canvas.strokeStyle = node.getColour();

                if(node.selected)
                {
                    node.canvas.fillStyle = node.tree.selectedColour;
                }
                else
                {
                    node.canvas.fillStyle = node.colour;
                }

                node.canvas.beginPath();
                //alert(node.starty);

                if(!collapse){
                    node.canvas.moveTo(node.startx , node.starty);
                    node.canvas.lineTo(node.centerx, node.centery);
                    node.canvas.stroke();
                    node.canvas.closePath();
                    node.drawNode();
                }

                node.canvas.closePath();

                for(var i = 0 ; i < node.children.length && !collapse ;i++)
                {
                    node.children[i].startx = node.centerx;
                    node.children[i].starty = node.centery;
                    if(node.children[i].selected && !node.collapsed)
                    {
                      node.tree.selectedNodes.push(node.children[i]);
                    }
                    else
                    {
                      tree.branchRenderers.diagonal(tree, node.children[i], node.collapsed || collapse);
                    }
                }
            },
            hierarchy : function(tree,node,collapse) {
                node.canvas.strokeStyle = node.getColour();

                if(node.selected)
                {
                    node.canvas.fillStyle = node.tree.selectedColour;
                }
                else
                {
                    node.canvas.fillStyle = node.colour;
                }


                //alert(node.starty);

                if(!collapse){
                    node.canvas.beginPath();
                    if(node != node.tree.root)
                    {
                        node.canvas.moveTo(node.startx , node.starty);
                        node.canvas.lineTo(node.centerx, node.starty);
                    }

                    node.canvas.lineTo(node.centerx, node.centery);
                    node.canvas.stroke();

                    node.drawNode();
                }
                node.canvas.closePath();

                for(var i = 0 ; i < node.children.length  && !collapse; i++)
                {
                    if(node.children[i].selected && !(collapse ||node.collapsed ))
                    {
                      node.tree.selectedNodes.push(node.children[i]);
                    }
                    else
                    {
                      tree.branchRenderers.hierarchy(tree, node.children[i], node.collapsed || collapse);
                    }
                }
            }
        },
        clicked : function(e)
        {
          //this.contextMenu.close();
          //this.canvas.fill();

          if(e.button == 0)
          {
              var nids = [];

                //if this is triggered by the release after a drag then the click shouldn't be triggered.
                if(this.dragging)
                {
                    this.dragging = false;
                    return;
                }

                if(!this.root) return false;
                var nd = this.root.clicked(this.translateClickX(e.clientX), this.translateClickY(e.clientY));

                if(nd)
                {
                   this.root.setSelected(false, true);
                   if(this.internalNodesSelectable || nd.leaf)
                   {
                      nd.setSelected(true, true);
                       nids = nd.getChildIds();
                   }
                   this.draw();


                }
                else if(this.unselectOnClickAway && !this.dragging)
                {
                   this.root.setSelected(false, true);
                   this.draw();

                }

                if(!this.pickedup){
                   this.dragging = false;
                }

                this.nodesSelected(nids);
          }
          else if(e.button == 2)
          {
              e.preventDefault();
              this.contextMenu.open(e.clientX, e.clientY);
          }
        },
        dblclicked : function(e)
        {
            if(!this.root) return false;
            var nd = this.root.clicked(this.translateClickX(e.clientX * 1.0), this.translateClickY(e.clientY * 1.0));
            if(nd) {
               nd.setSelected(false, true);
               nd.toggleCollapsed();
            }

            if(!this.pickedup){
                this.dragging = false;
            }
            this.draw();
        },
        displayLabels : function()
        {
          this.showLabels = true;
          this.draw();
        },
        drag : function(event)
        {
            //get window ratio
            var ratio = (window.devicePixelRatio || 1) / getBackingStorePixelRatio(this.canvas);

            if(!this.drawn) return false;

            if(this.pickedup)
            {
                var xmove = (event.clientX - this.startx) * ratio;
                var ymove = (event.clientY - this.starty) * ratio;
                if(Math.abs(xmove) + Math.abs(ymove) > 5)
                {
                    this.dragging = true;

                    this.offsetx = this.origx + xmove;
                    this.offsety = this.origy + ymove;
                    this.draw();
                }
            }
            else if(this.zoomPickedUp)
            {
                //right click and drag
               this.d = ((this.starty - event.clientY) / 100);
               x = this.translateClickX(this.startx);
               this.setZoom(this.origZoom + this.d);
               this.draw();
            }
            else
            {
                //hover
               var e = event;

               var nd = this.root.clicked(this.translateClickX(e.clientX * 1.0), this.translateClickY(e.clientY * 1.0));
               if(nd && (this.internalNodesSelectable || nd.leaf))
               {
                  this.root.setHighlighted(false);
                  nd.setHighlighted(true);
               }
               else
               {
                   this.root.setHighlighted(false);
               }
               this.draw();
            }
        },
        /**
         * Draw the frame
         */
        draw : function(forceRedraw)
        {
            this.selectedNodes = [];

            if(this.maxBranchLength == 0)
            {
                this.loadError("All branches in the tree are identical.");
                return;
            }

            this.canvas.restore();

            this.canvas.clearRect(0,0,this.canvas.canvas.width,this.canvas.canvas.height);
            this.canvas.lineCap = "round";
            this.canvas.lineJoin = "round";

            this.canvas.strokeStyle = this.branchColour;
            this.canvas.save();

            this.canvas.translate(this.canvas.canvas.width / 2 / getBackingStorePixelRatio(this.canvas), this.canvas.canvas.height / 2 / getBackingStorePixelRatio(this.canvas));

            if(!this.drawn || forceRedraw)
            {
                this.prerenderers[this.treeType](this);
                if(! forceRedraw) { this.fitInPanel(); }
            }

            this.canvas.lineWidth = this.lineWidth / this.zoom;

            this.canvas.translate(this.offsetx, this.offsety);
            this.canvas.scale(this.zoom, this.zoom);

            this.branchRenderers[this.treeType](this, this.root);

            for(var i = 0; i < this.selectedNodes.length; i++)
            {
                this.branchRenderers[this.treeType](this, this.selectedNodes[i]);
            }


            //if( this.navigator ) this.navigator.drawFrame();
            this.drawn = true;
        },
        drop : function()
        {

          if(!this.drawn) return false;
          this.pickedup = false;
          this.zoomPickedUp = false;
          //this.dragging = false;
        },
        findBranch : function(patt)
        {
            this.root.setSelected(false, true);
            for(var i = 0; i < this.leaves.length; i++)
            {
                if(this.leaves[i].id.match(new RegExp(patt, 'i')))
                {
                    this.leaves[i].setSelected(true, true);
                }
            }
            this.draw();
        },
        genId : function()
        {
            return "pcn" + this.lastId++;
        },
        getPngUrl : function()
        {
            return this.canvas.canvas.toDataURL();
        },
        hideLabels : function()
        {
          this.showLabels = false;
          this.draw();
        },
        load : function(tree, name, format)
        {
            if(format)
            {
                if(format.match(/nexus/i))
                {
                    if(tree.match(/\.\w+$/)){this.AJAX(tree, 'GET', '', this.loadFileCallback, {format:'nexus', name:name}, this);}
                    else{this.parseNexus(tree, name);}
                }
                else if(format.match(/newick/i))
                {
                    if(tree.match(/\.\w+$/)){this.AJAX(tree, 'GET', '', this.loadFileCallback, {format:'newick'}, this);}
                    else{this.parseNwk(tree, name);}
                }
            }
            else
            {

                if(tree.match(/\.n(ex|xs)$/))
                {

                    this.AJAX(tree, 'GET', '', this.loadFileCallback, {format:'nexus', name:name}, this);
                }
                else if(tree.match(/\.nwk$/))
                {

                    this.AJAX(tree, 'GET', '', this.loadFileCallback, {format:'newick'}, this);
                }
                else if(tree.match(/^#NEXUS[\s\n;\w\.\*\:(\),-=\[\]\/&]+$/i))
                {
                    this.parseNexus(tree, name);
                    this.draw();
                    this.loadCompleted();
                }
                else if(tree.match(/^[\w\.\*\:(\),-\/]+;\s?$/gi))
                {
                    this.parseNwk(tree, name);
                    this.draw();
                    this.loadCompleted();
                }
                else
                {
                    this.loadError('PhyloCanvas did not recognise the string as a file or a newick or Nexus format string');
                }
            }
        },
        loadFileCallback : function(response, opts, scope)
        {
            if(opts.format.match(/nexus/i))
            {
                scope.parseNexus(reponse.responseText, opts.name);
            }
            else if(opts.format.match(/newick/i))
            {
                scope.parseNwk(response.responseText);
            }
            else
            {
                throw "file type not recognised by PhyloCanvas";
            }
            scope.draw();
            scope.loadCompleted();
        },
        nodePrerenderers :
        {
            radial : function(tree, node)
            {
                if(node.parent)
                {
                    node.startx = node.parent.centerx;
                    node.starty = node.parent.centery;
                }
                else
                {
                    node.startx = 0;
                    node.starty = 0;
                }
                node.centerx = node.startx + (node.branchLength * tree.branchScalar * Math.cos(node.angle));
                node.centery = node.starty + (node.branchLength * tree.branchScalar * Math.sin(node.angle));

                for(var i = 0; i < node.children.length; i++)
                {
                    this.radial(tree, node.children[i]);
                }
            }
        },
        nodeRenderers : {
            circle : function (node) {
                var r = node.getNodeSize();
                node.canvas.arc(r, 0, r, 0, Angles.FULL, false);
                node.canvas.stroke();
                node.canvas.fill();
            },
            square : function (node)
            {
                var r = node.getNodeSize();
                var x1 = 0;
                var x2 = r * 2;
                var y1 = -r;
                var y2 = r ;
                node.canvas.moveTo(x1, y1);
                node.canvas.lineTo(x1, y2);
                node.canvas.lineTo(x2, y2);
                node.canvas.lineTo(x2, y1);
                node.canvas.lineTo(x1, y1);
                node.canvas.stroke();
                node.canvas.fill();
            },
            star: function (node)
            {
                var r = node.getNodeSize();
                var cx =  r ;
                var cy = 0;

                node.canvas.moveTo(cx, cy);
                var alpha = (2 * Math.PI) / 10;
                var rb = r * 1.75;
                for(var i = 11; i != 0; i--)
                {
                    var ra = i % 2 == 1 ? rb: r;
                    var omega = alpha * i;
                    node.canvas.lineTo(cx + (ra * Math.sin(omega)), cy + (ra * Math.cos(omega)));
                }
                node.canvas.stroke();
                node.canvas.fill();
            },
            triangle : function (node)
            {
                var r = node.getNodeSize();
                var cx = r;
                var cy = 0;
                var x1 = cx - r;
                var x2 = cx + r;
                var y1 = cy - r;
                var y2 = cy + r;
                node.canvas.moveTo(cx, y1);
                node.canvas.lineTo(x2, y2);
                node.canvas.lineTo(x1, y2);
                node.canvas.lineTo(cx, y1);
                node.canvas.stroke();
                node.canvas.fill();
            }
        },
        parseNexus : function(str, name)
        {
            if(!str.match(/^#NEXUS[\s\n;\w\.\*\/\:(\),-=\[\]&]+$/i))
            {
                 throw "the string provided was not a nexus string";
            }
            else if(!str.match(/BEGIN TREES/gi))
            {
                throw "The nexus file does not contain a tree block";
            }

            //Get everything between BEGIN TREES and next END;
            var treeSection = str.match(/BEGIN TREES;[\S\s]+END;/i)[0].replace(/BEGIN TREES;\n/i,'').replace(/END;/i,'');
            //get translate section
            var translateSection = treeSection.match(/TRANSLATE[^;]+;/i)[0];

            //remove translate section from tree section
            treeSection = treeSection.replace(translateSection, '');
            //parse translate section into kv pairs
            translateSection = translateSection.replace(/translate|;/gi, '');

            var tIntArr = translateSection.split(',');
            var rObj = {};
            var ia;
            for(var i = 0; i < tIntArr.length; i++)
            {
                ia = tIntArr[i].replace('\n', '').split(" ");
                rObj[ia[0].trim()] = ia[1].trim();
            }

            //find each line starting with tree.
            var tArr = treeSection.split('\n');
            var trees = {};
            //id name is '' or does not exist, ask user to choose which tree.
            for(var i = 0; i < tArr.length; i++)
            {
                if(tArr[i].trim() == "") continue;
                var str = tArr[i].replace(/tree\s/i,'');
                trees[str.match(/^\w+/)[0]] = str.match(/ [\S]*$/)[0];
            }
            if(!trees[name]) throw "tree " + name + " does not exist in this NEXUS file";

            this.parseNwk(trees[name].trim());
            //translate in accordance with translate block
            for(var n in rObj)
            {
                var b = this.branches[n];
                delete this.branches[n];
                b.id = rObj[n];
                this.branches[b.id] = b;
            }
        },
        parseNwk : function(nwk)
        {

            this.origBranches = false;
            this.origLeaves = false;
            this.origRoot = false;
            this.origBL = {};
            this.origP = {};

            this.root = false;
            this.leaves = [];
            this.branches = {};
            this.drawn = false;
            var curNode = new Branch();
            curNode.id = "root";
            this.branches.root = curNode;
            this.setRoot(curNode);

            for(var i = 0; i < nwk.length; i++)
            {
                switch(nwk[i])
                {
                    case '(': //new Child
                        var nd = new Branch();
                        curNode.addChild(nd);
                        curNode = nd;
                        break;
                    case ')': //return to parent
                        curNode = curNode.parent;
                        break;
                    case ',': //new sibiling
                        var nd = new Branch();
                        curNode.parent.addChild(nd);
                        curNode = nd;
                        break;
                    case ';':
                        for (var l = 0; l < this.leaves.length; l++)
                        {
                            if(this.leaves[l].totalBranchLength > this.maxBranchLength)
                            {
                                this.maxBranchLength = this.leaves[l].totalBranchLength;
                            }
                        }
                        break;
                    default:
                        try
                        {
                            i = curNode.parseNwk(nwk, i);
                            i--;
                        }
                        catch(e)
                        {
                            this.loadError( "Error parsing nwk file" + e );
                            return;
                        }
                        break;
                    }
            }



            this.saveNode(this.root);
            this.root.saveChildren();

            this.root.branchLength = 0;
            this.maxBranchLength = 0;
            this.root.setTotalLength();

            if(this.maxBranchLength == 0)
            {
                this.loadError("All branches in the tree are identical.");
                return;
            }

            this.buildLeaves();

            this.loadCompleted();
        },
        pickup : function(event)
        {

             if(!this.drawn) return false;
             this.origx = this.offsetx;
             this.origy = this.offsety;

             if(event.button == 0){
                this.pickedup = true;
             }

             if(event.button ==2 && this.rightClickZoom){
                this.zoomPickedUp = true;
                this.origZoom = Math.log(this.zoom)/Math.log(10);
                this.oz = this.zoom;
                // position in the diagram on which you clicked
             }
             this.startx = event.clientX ;
             this.starty = event.clientY;

        },
        prerenderers :
        {
            rectangular : function(tree, forcedDraw)
            {
                tree.root.startx = 0;
                tree.root.starty = 0;
                tree.root.centerx = 0;
                tree.root.centery = 0;
                tree.branchScalar = tree.canvas.canvas.width / tree.maxBranchLength;
                var ystep = Math.max(tree.canvas.canvas.height / (tree.leaves.length + 2), (tree.leaves[0].getNodeSize() + 2) * 2);

                //set initial positons of the branches
                for(var i = 0; i < tree.leaves.length; i++)
                {
                    tree.leaves[i].angle = 0;
                    tree.leaves[i].centery = (i > 0 ? tree.leaves[i-1].centery  + ystep : 0);
                    tree.leaves[i].centerx = tree.leaves[i].totalBranchLength * tree.branchScalar;

                    for(var nd = tree.leaves[i]; nd.parent; nd = nd.parent)
                    {
                        var cn = nd.parent.children
                        nd.parent.centery = (cn[0].centery + cn[cn.length-1].centery) / 2;
                    }
                }

                tree.root.startx = tree.root.centerx;
                tree.root.starty = tree.root.centery;

            },
            circular : function(tree)
            {
                tree.root.startx = 0;
                tree.root.starty = 0;
                tree.root.centerx = 0;
                tree.root.centery = 0;
                tree.branchScalar = Math.min(tree.canvas.canvas.width, tree.canvas.canvas.height)/tree.maxBranchLength;
                // work out radius of tree and the make branch scalar proportinal to the
                var r = (tree.leaves.length * tree.leaves[0].getNodeSize() * 2)/Angles.FULL;
                if(tree.branchScalar * tree.maxBranchLength > r)
                {
                    r = tree.branchScalar * tree.maxBranchLength;
                }
                else
                {
                    tree.branchScalar = r / tree.maxBranchLength;
                }

                var step = Angles.FULL / tree.leaves.length;

                for(var i = 0; i < tree.leaves.length; i++)
                {
                    tree.leaves[i].angle = step * i;
                    tree.leaves[i].centery = r * Math.sin(tree.leaves[i].angle);
                    tree.leaves[i].centerx = r * Math.cos(tree.leaves[i].angle);
                    tree.leaves[i].starty = ((tree.leaves[i].parent.totalBranchLength * tree.branchScalar)) * Math.sin(tree.leaves[i].angle);
                    tree.leaves[i].startx = ((tree.leaves[i].parent.totalBranchLength * tree.branchScalar)) * Math.cos(tree.leaves[i].angle);
                    tree.leaves[i].intery = ((tree.leaves[i].totalBranchLength * tree.branchScalar)) * Math.sin(tree.leaves[i].angle);
                    tree.leaves[i].interx = ((tree.leaves[i].totalBranchLength * tree.branchScalar)) * Math.cos(tree.leaves[i].angle);
                    for(var nd = tree.leaves[i]; nd.parent; nd = nd.parent)
                    {
                        if(nd.getChildNo() == 0)
                        {
                            nd.parent.angle = nd.angle;
                            nd.parent.minChildAngle = nd.angle;
                        }
                        if(nd.getChildNo() == nd.parent.children.length - 1)
                        {
                            nd.parent.maxChildAngle = nd.angle;
                            nd.parent.angle = (nd.parent.minChildAngle + nd.parent.maxChildAngle) / 2;
                            nd.parent.centery = (nd.parent.totalBranchLength * tree.branchScalar) * Math.sin(nd.parent.angle);
                            nd.parent.centerx = (nd.parent.totalBranchLength * tree.branchScalar) * Math.cos(nd.parent.angle);
                            nd.parent.starty = ((nd.parent.totalBranchLength - nd.parent.branchLength) * tree.branchScalar) * Math.sin(nd.parent.angle);
                            nd.parent.startx = ((nd.parent.totalBranchLength - nd.parent.branchLength) * tree.branchScalar) * Math.cos(nd.parent.angle);
                        }
                        else
                        {
                            break;
                        }

                    }
                }
            },
            radial : function(tree, forcedDraw)
            {
                tree.branchScalar = Math.min(tree.canvas.canvas.width, tree.canvas.canvas.height) / tree.maxBranchLength;
                //tree.root.setTotalLength();

                var step = Angles.FULL / tree.leaves.length;
                tree.root.startx = 0;
                tree.root.starty = 0;
                tree.root.centerx = 0;
                tree.root.centery = 0;

                for(var i = 0.0; i < tree.leaves.length; i += 1.0)
                {
                    tree.leaves[i].angle = step * i;
                    tree.leaves[i].centerx = tree.leaves[i].totalBranchLength * tree.branchScalar * Math.cos(tree.leaves[i].angle);
                    tree.leaves[i].centery = tree.leaves[i].totalBranchLength * tree.branchScalar * Math.sin(tree.leaves[i].angle);

                    for(var nd = tree.leaves[i]; nd.parent; nd = nd.parent)
                    {
                        if(nd.getChildNo() == 0)
                        {
                            nd.parent.angle = 0;
                        }
                        nd.parent.angle += (nd.angle * nd.getChildCount());
                        if(nd.getChildNo() == nd.parent.children.length - 1)
                        {
                            nd.parent.angle = nd.parent.angle / nd.parent.getChildCount();
                        }
                        else
                        {
                            break;
                        }
                    }
                }

                tree.nodePrerenderers.radial(tree, tree.root);


            },
            diagonal : function(tree, forceRender)
            {

                var ystep = Math.max(tree.canvas.canvas.height / (tree.leaves.length + 2), (tree.leaves[0].getNodeSize() + 2) * 2);

                for(var i = 0; i < tree.leaves.length; i++)
                {
                    tree.leaves[i].centerx = 0;
                    tree.leaves[i].centery = (i > 0 ? tree.leaves[i-1].centery + ystep : 0);
                    tree.leaves[i].angle = 0;

                    for(var nd = tree.leaves[i]; nd.parent; nd = nd.parent)
                    {
                        if(nd.getChildNo() == nd.parent.children.length - 1)
                        {
                            nd.parent.centery = nd.parent.getChildYTotal() / nd.parent.getChildCount(); // (nd.parent.children.length - 1);
                            nd.parent.centerx = nd.parent.children[0].centerx + ((nd.parent.children[0].centery - nd.parent.centery) * Math.tan(Angles.FORTYFIVE));
                            for(var j = 0; j < nd.parent.children.length; j++)
                            {
                                nd.parent.children[j].startx = nd.parent.centerx;
                                nd.parent.children[j].starty = nd.parent.centery;
                            }
                        }
                        else
                        {
                            break;
                        }
                    }
                }

            },
            hierarchy : function(tree)
            {
                tree.root.startx = 0;
                tree.root.starty = 0;
                tree.root.centerx = 0;
                tree.root.centery = 0;
                tree.branchScalar = tree.canvas.canvas.height/tree.maxBranchLength;
                var xstep = Math.max(tree.canvas.canvas.width / (tree.leaves.length + 2), (tree.leaves[0].getNodeSize() +2) * 2);

                for(var i = 0; i < tree.leaves.length; i++)
                {
                    tree.leaves[i].angle = Angles.QUARTER;
                    tree.leaves[i].centerx = (i > 0 ?tree.leaves[i-1].centerx + xstep : 0);
                    tree.leaves[i].centery = tree.leaves[i].totalBranchLength * tree.branchScalar;

                    for(var nd = tree.leaves[i]; nd.parent; nd = nd.parent)
                    {
                        if(nd.getChildNo() == 0)
                        {
                            nd.parent.centerx = nd.centerx;
                        }

                        if(nd.getChildNo() == nd.parent.children.length - 1)
                        {
                            nd.parent.angle = Angles.QUARTER;
                            nd.parent.centerx = (nd.parent.centerx + nd.centerx )/2;
                            nd.parent.centery = nd.parent.totalBranchLength * tree.branchScalar;
                            for(var j = 0; j < nd.parent.children.length; j++)
                            {
                                nd.parent.children[j].startx = nd.parent.centerx;
                                nd.parent.children[j].starty = nd.parent.centery;
                            }

                        }
                        else
                        {
                            break;
                        }
                    }
                }
            }
        },
        redrawGetNodes: function(node, leafIds)
        {
            for(var i = 0; i < node.children.length; i++)
            {
                this.branches[node.children[i].id] = node.children[i];
                if(node.children[i].leaf)
                {
                    leafIds.push(node.children[i].id);
                    this.leaves.push(node.children[i]);
                }
                else
                {
                    this.redrawGetNodes(node.children[i], leafIds);
                }
            }
        },
        redrawFromBranch: function(node)
        {
            this.drawn = false;
            this.totalBranchLength = 0;

            this.resetTree();

            this.origBL[node.id] = node.branchLength;
            this.origP[node.id] = node.parent;

            this.root = node;
            this.root.branchLength = 0;
            this.root.parent = false;

            this.branches = {};
            this.leaves = [];
            var leafIds = [];

            for(var i = 0; i < this.root.children.length; i++)
            {
                this.branches[this.root.children[i].id] = this.root.children[i];
                if(this.root.children[i].leaf)
                {
                    this.leaves.push(this.root.children[i]);
                    leafIds.push(this.root.children[i].id);
                }
                else
                {
                    this.redrawGetNodes(this.root.children[i], leafIds);
                }
            }

            this.root.setTotalLength();
            this.prerenderers[this.treeType](this);
            this.draw();

            this.subtreeDrawn(node.id);
        },
        redrawOriginalTree : function()
        {
            this.resetTree();

            this.root.setTotalLength();
            this.prerenderers[this.treeType](this);
            this.draw();

            this.subtreeDrawn(this.root.id);
        },
        saveNode : function(node)
        {
          if(!node.id || node.id == "") node.id=node.tree.genId();
          if(this.branches[node.id])
          {
              if(node != this.branches[node.id])
              {
                if(!this.leaf)
                {
                    node.id = this.genId();
                    this.branches[node.id] = node;
                }
                else
                {
                    throw "Two nodes on this tree share the id " + node.id;
                }
            }
          }
          else
          {
            this.branches[node.id] = node;
          }
        },
        scroll : function(e)
        {
            //this.contextMenu.close();
            var z = Math.log(this.zoom) /Math.log(10);
            this.setZoom(z + (e.wheelDelta ? e.wheelDelta / 1000: e.detail / -100) );
            e.preventDefault();

        },
        selectNodes : function(nIds)
        {
            this.root.setSelected(false, true);
            var ns = nIds;

            if( typeof nIds == 'string') ns = ns.split(",");

            for(var i = 0; i < this.leaves.length; i++ )
            {
                for(var j = 0; j < ns.length; j++)
                {
                    this.leaves[i].setSelected(ns[j] == this.leaves[i].id, false);
                }

            }


            this.draw();
        },
        setFont : function(font)
        {
          this.font = font;
          this.draw();
        },
        setNodeColourAndShape: function(nids, colour, shape, size, waiting)
        {
            if(!nids) return;

            if(this.drawn)
            {
                var arr = [];
                if(typeof nids == 'string')
                {
                    arr = nids.split(",");
                }else{
                    arr = nids;
                }

                if(nids != "")
                {
                    for(var i = 0; i <  arr.length; i++)
                    {
                        if(this.branches[arr[i]])
                        {
                            if(colour)this.branches[arr[i]].colour = colour;
                            if(shape)this.branches[arr[i]].nodeShape = Shapes[shape] ? Shapes[shape] : shape;
                            if(size) this.branches[arr[i]].radius = size;
                        }
                    }
                    this.draw();
                }
            }
            else if(!waiting)
            {
                var ctx = this;
                var to = setInterval(function(){
                   if(this.drawn)
                   {
                        ctx.setNodeColourAndShape(nids, colour, shape, size, true);
                        clearInterval(to);
                   }
                });
            }

        },
        setNodeSize : function(size)
        {
          this.baseNodeSize = Number(size);
          this.draw();
        },
        setRoot : function(node)
        {
            node.canvas = this.canvas;
            node.tree = this;
            this.root =node;
        },
        setTextSize : function(size)
        {
          this.textSize = Number(size);
          this.draw();
        },
        setTreeType : function(type)
        {
            var oldType = this.treeType;
            this.treeType = type;
            if(this.drawn)
            {
                this.drawn = false;
                this.draw();
            }

            this.treeTypeChanged(oldType, type);
        },
        setSize: function(width, height)
        {
            this.canvas.canvas.width = width;
            this.canvas.canvas.height = height;
            if(this.drawn){
            //    this.drawn = false;
                this.draw();
            }
            if(this.navigator)this.navigator.resize();
            this.adjustForPixelRatio();
        },
        setZoom : function(z)
        {
            if(z > -2 && z < 2){
                var oz = this.zoom;
                this.zoom = Math.pow(10, z);

                this.offsetx = (this.offsetx/oz) * this.zoom ;
                this.offsety = (this.offsety / oz) * this.zoom;

                this.draw();
            }
        },
        toggleLabels : function()
        {
          this.showLabels = !this.showLabels;
          this.draw();
        },
        translateClickX : function(x)
        {
            var ratio = (window.devicePixelRatio || 1) / getBackingStorePixelRatio(this.canvas);

            x = (x - getX(this.canvas.canvas)  + window.pageXOffset);
            x *= ratio;
            x -= this.canvas.canvas.width/2;
            x -= this.offsetx;
            x = x / this.zoom;

            return x;
        },
        translateClickY : function(y)
        {
            var ratio = (window.devicePixelRatio || 1) / getBackingStorePixelRatio(this.canvas);

            y = (y - getY(this.canvas.canvas)  + window.pageYOffset) ; // account for positioning and scroll
            y *= ratio;
            y -= this.canvas.canvas.height/2;
            y -= this.offsety;
            y = y /this.zoom;

            return y;
        }
    }

    Tree.prototype.loadCompleted = function(){
        fireEvent(this.canvasEl, 'loaded');
    }

    Tree.prototype.loadStarted = function(){
        fireEvent(this.canvasEl, 'loading');
    }

    Tree.prototype.loadError = function(message){
        fireEvent(this.canvasEl, 'error', { message: message });
    }

    Tree.prototype.subtreeDrawn = function(node){
        fireEvent(this.canvasEl, 'subtree', { node: node });
    }

    Tree.prototype.nodesSelected = function(nids)
    {
         fireEvent(this.canvasEl, 'selected', { nodeIds: nids });
    }

    Tree.prototype.addListener = function(event, listener)
    {
        addEvent(this.canvasEl, event, listener);
    }

    Tree.prototype.getBounds = function()
    {
        var minx = this.root.startx,
            maxx = this.root.startx,
            miny = this.root.starty,
            maxy = this.root.starty;

        for( var i = this.leaves.length; i--; )
        {
            var x = this.leaves[i].centerx,
                y = this.leaves[i].centery,
                theta = this.leaves[i].angle,
                pad = this.leaves[i].getNodeSize() + (this.showLabels ? this.leaves[i].getLabelSize() : 0) ;

            x = x + (pad * Math.cos(theta));
            y = y + (pad * Math.sin(theta));

            minx = Math.min(minx, x);
            maxx = Math.max(maxx, x);
            miny = Math.min(miny, y);
            maxy = Math.max(maxy, y);
        }

        return [[minx, miny], [maxx, maxy]];
    }

    Tree.prototype.fitInPanel = function()
    {
        var bounds = this.getBounds(),
            minx = bounds[0][0],
            maxx = bounds[1][0],
            miny = bounds[0][1],
            maxy = bounds[1][1],
            padding = 50,
            canvasSize = [this.canvas.canvas.width - padding, this.canvas.canvas.height - padding];

        this.zoom = Math.min(canvasSize[0] / (maxx - minx), canvasSize[1] / (maxy - miny));
        this.offsety = (maxy + miny) * this.zoom / -2;
        this.offsetx = (maxx + minx)* this.zoom / -2;

    }

    Tree.prototype.on = Tree.prototype.addListener;

    Tree.prototype.adjustForPixelRatio = function()
    {
        // Adjust canvas size for Retina screen
        var ratio = (window.devicePixelRatio || 1) / getBackingStorePixelRatio(this.canvas);

        this.canvas.canvas.style.height = this.canvas.canvas.height + 'px';
        this.canvas.canvas.style.width = this.canvas.canvas.width + 'px';

        if (ratio > 1) {
            this.canvas.canvas.width *= ratio;
            this.canvas.canvas.height *= ratio;
        }
    }

    Tree.prototype.treeTypeChanged = function(oldType, newType)
    {
        fireEvent(this.canvasEl, 'typechanged', { oldType: oldType, newType : newType });
    }

    Tree.prototype.resetTree = function()
    {
        if(!this.origBranches) return;

        this.branches = this.origBranches;
        for(var n in this.origBL)
        {
            this.branches[n].branchLength = this.origBL[n];
            this.branches[n].parent = this.origP[n];
        }

        this.leaves = this.origLeaves;
        this.root = this.origRoot;
    }

    Tree.prototype.rotateBranch = function(branch)
    {
        this.branches[branch.id].rotate();
    }

    Tree.prototype.buildLeaves = function()
    {
        this.leaves = [];

        var leafIds = this.root.getChildIds();

        for( var i = 0; i < leafIds.length; i++ )
        {
            this.leaves.push(this.branches[leafIds[i]]);
        }
    }

    Tree.prototype.exportNwk = function()
    {
        var nwk = this.root.getNwk();
        return nwk.substr(0, nwk.lastIndexOf(')') + 1) + ';';
    }

    Tree.prototype.resizeToContainer = function()
    {
        this.setSize(this.canvasEl.offsetWidth, this.canvasEl.offsetHeight)
        this.draw();
        this.history.resizeTree();
    }

    function History(tree)
    {
        this.tree = tree;

        this.div = this.createDiv(tree.canvasEl);

        this.resizeTree(tree);

        this.tree.addListener('subtree', function(evt)
        {
            this.addSnapshot(evt.node);
        }.bind(this));

        this.tree.addListener('loaded', this.reset.bind(this));
        this.tree.addListener('typechanged', function(evt)
        {
            this.addSnapshot(this.tree.root);
        }.bind(this));
    }

    History.prototype.reset = function()
    {
        this.clear();
        this.addSnapshot('root');
    }

    History.prototype.collapse = function()
    {
        addClass(this.div, 'collapsed');
        this.toggle_div.firstChild.data = '>';
        this.resizeTree();
    }

    History.prototype.expand = function()
    {
        removeClass(this.div, 'collapsed');
        this.toggle_div.firstChild.data = '<';
        this.resizeTree();
    }

    History.prototype.isCollapsed = function()
    {
        return hasClass(this.div, 'collapsed');
    }

    History.prototype.toggle = function()
    {
        if(this.isCollapsed())
        {
            this.expand();
        }
        else
        {
            this.collapse();
        }
    }

    History.prototype.createDiv = function(parentDiv)
    {
        var div = document.createElement('div');
        addClass(div, 'pc-history');

        parentDiv.appendChild(div);

        var tabDiv = document.createElement('div');
        tabDiv.appendChild(document.createTextNode('<'));
        addClass(tabDiv,'toggle');
        div.appendChild(tabDiv);

        this.toggle_div = tabDiv;

        return div
    }

    History.prototype.resizeTree = function()
    {
        var tree = this.tree;
        this.width = this.div.offsetWidth;
        tree.setSize(tree.canvasEl.offsetWidth - this.width, tree.canvasEl.offsetHeight);
        if(this.isCollapsed())
        {
            tree.canvasEl.getElementsByTagName('canvas')[0].style.marginLeft = this.width + 'px';
        }
        else
        {
            tree.canvasEl.getElementsByTagName('canvas')[0].style.marginLeft = '20%';
        }
    }

    /**
     * Add a snapshot of the tree to the history
     * 1.0.6-1 (08/04/2014) - put the new snapshot at the top of the list github issue #17
     */
    History.prototype.addSnapshot = function(id)
    {
        var url = this.tree.getPngUrl(), thumbnail = document.createElement('img');

        thumbnail.width = this.width;
        thumbnail.src = url;
        thumbnail.id = "phylocanvas-history-" + id;

        // altered 1.0.6-1 : issue #17
        //this.div.appendChild(thumbnail);
        var firstThumb = this.div.querySelector('img')

        if(firstThumb)
        {
            this.div.insertBefore(thumbnail, firstThumb);
        }
        else
        {
            this.div.appendChild(thumbnail);
        }

        addEvent(thumbnail, 'click', this.goBackTo.bind(this));
    }

    History.prototype.clear = function()
    {
        var thumbs = this.div.getElementsByTagName('img');

        for ( var i = thumbs.length; i-- ; )
        {
            this.div.removeChild(thumbs[0]);
        };
    }

    History.prototype.goBackTo = function(evt)
    {
        var ele = evt.target;

        while(ele.previousSibling)
        {
            if(ele.previousSibling.tagName == 'IMG')
            {
                this.div.removeChild(ele.previousSibling);
            }
            else
            {
                break;
            }
        }

        this.div.removeChild(ele);

        this.tree.redrawFromBranch(this.tree.origBranches[ele.id.replace("phylocanvas-history-", '')]);
    }

    return { /*lends PhyloCanvas*/
        Tree: Tree,
        Branch:Branch,
        Loader:Loader,
        ContextMenu : ContextMenu,
        History : History
    };
})();
