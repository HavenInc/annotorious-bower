annotorious.plugin.dotSelector = function(config_opts) {
  if (config_opts) this._activate = config_opts.activate
};

annotorious.plugin.dotSelector.prototype.onInitAnnotator = function(annotator) {
  annotator.addSelector(new annotorious.plugin.dotSelector.Selector);
  if (this._activate) annotator.setCurrentSelector("dotSelector");
};

annotorious.plugin.dotSelector.Selector = function() {};

annotorious.plugin.dotSelector.Selector.prototype.init = function(annotator, canvas) {

  console.log(annotator);

  var that = this;
  this.overAnnot    = false;
  this.clickedAnnot = false;
  this._canvas = canvas;
  this._annotator = annotator;
  this._g2d = canvas.getContext("2d");
  this._g2d.lineWidth = 1;
  this._anchor;
  this._opposite;
  this._enabled = false;
  this._mouseMoveListener;
  this._mouseUpListener;
  this.desiredWidth  = 24;
  this.desiredHeight = 24;

  anno.addHandler('onMouseOverItem', function(ev) {
    console.log('nb',annotator);
    anno.showAnnotations();
    annotator.c.style.cursor = "text";
  });

  anno.addHandler('onMouseOutOfItem', function(ev) {
    anno.hideAnnotations();
  });

  anno.addHandler('onMouseoverAnnotation', function(ev) {

    console.log(ev);

    if(ev.C){
      that.overAnnot = true;
      that._annotator.c.style.cursor  = "pointer";
    }

  });

  anno.addHandler('onMouseOutOfAnnotation', function(ev) {

    if(ev.C){
      that.overAnnot = false;
      annotator.c.style.cursor = "text";
    }

  });

  // anno.setProperties({
  //   outline    : 'rgba(55,55,255,1)',
  //   stroke     : 'blue',
  //   fill       : 'blue',
  //   hi_stroke  : 'blue',
  //   hi_fill    : 'blue'
  // });

  anno.setProperties({
    outline    : '#3db787',
    stroke     : '#3db787',
    fill       : '#3db787',
    hi_stroke  : '#3db787',
    hi_fill    : '#3db787'
  });

};

annotorious.plugin.dotSelector.Selector.prototype._attachListeners = function() {
  var self = this;

  this._mouseMoveListener = this._canvas.addEventListener("mousemove", function(event) {
    if (self._enabled) {

      self._opposite = event.offsetX == undefined ? { x: event.layerX, y: event.layerY} : {x: event.offsetX, y: event.offsetY};

      self._g2d.clearRect(0, 0, self._canvas.width, self._canvas.height);
      var top, left, bottom, right;
      if (self._opposite.y > self._anchor.y) {
          top = self._anchor.y;
          bottom = self._opposite.y
      } else {
          top = self._opposite.y;
          bottom = self._anchor.y
      }
      if (self._opposite.x > self._anchor.x) {
          right = self._opposite.x;
          left = self._anchor.x
      } else {
          right = self._anchor.x;
          left = self._opposite.x
      }
      var width = right - left;
      var height = bottom - top;
      if( width > self.desiredWidth || height > self.desiredHeight ){
        top    = self._anchor.y;
        bottom = top + self.desiredHeight;

        left  = self._anchor.x
        right = left + self.desiredWidth;
      }

    }

  });

  this._mouseUpListener = this._canvas.addEventListener("mouseup", function(event) {

    if( self.overAnnot === true ){
      self._annotator.popup.R.firstChild.click();
      self.overAnnot = false;
      return false;
    }

    if (self._enabled) {
      self._opposite = event.offsetX == undefined ? { x: self._anchor.x + self.desiredWidth, y: self._anchor.y + self.desiredHeight } : { x:  self._anchor.x + self.desiredWidth,y:  self._anchor.y + self.desiredHeight };

      self._g2d.clearRect(0, 0, self._canvas.width, self._canvas.height);

      var top, left, bottom, right;

      if (self._opposite.y > self._anchor.y) {
        top = self._anchor.y;
        bottom = self._opposite.y;
      } else {
        top = self._opposite.y;
        bottom = self._anchor.y;
      }
      if (self._opposite.x > self._anchor.x) {
        right = self._opposite.x;
        left = self._anchor.x;
      } else {
        right = self._anchor.x;
        left = self._opposite.x;
      }

    }

    self._enabled = false;

    var shape = self.getShape();

    if (shape) {
      self._annotator.fireEvent("onSelectionCompleted", {
        mouseEvent: event,
        shape: shape,
        viewportBounds: self.getViewportBounds()
      });
    } else {
        self._annotator.fireEvent("onSelectionCanceled");
    }

  });


};  // Selector.prototype._attachListeners

annotorious.plugin.dotSelector.Selector.prototype._detachListeners = function() {
  if (this._mouseMoveListener) delete this._mouseMoveListener;
  if (this._mouseUpListener) delete this._UpListener
};

annotorious.plugin.dotSelector.Selector.prototype.getName = function() {
  return "dotSelector"
};

annotorious.plugin.dotSelector.Selector.prototype.getSupportedShapeType = function() {
  return "rect"
};

annotorious.plugin.dotSelector.Selector.prototype.startSelection = function(x, y) {

  if( this.overAnnot === true ){
    return;
  }

  this._enabled = true;
  this._attachListeners();
  this._anchor = {
    x: x,
    y: y
  };
  this._annotator.fireEvent("onSelectionStarted", {
    offsetX: x,
    offsetY: y
  });
  document.body.style.webkitUserSelect = "none";

};

annotorious.plugin.dotSelector.Selector.prototype.stopSelection = function() {
  this._detachListeners();
  this._g2d.clearRect(0, 0, this._canvas.width, this._canvas.height);
  document.body.style.webkitUserSelect = "auto";
  delete this._opposite
};

annotorious.plugin.dotSelector.Selector.prototype.getShape = function() {

  if (this._opposite && Math.abs(this._opposite.x - this._anchor.x) > 3 && Math.abs(this._opposite.y - this._anchor.y) > 3) {

    var viewportBounds = this.getViewportBounds();

    var item_anchor = this._annotator.toItemCoordinates({
        x: viewportBounds.left,
        y: viewportBounds.top
    });
    var item_opposite = this._annotator.toItemCoordinates({
        x: viewportBounds.right - 1,
        y: viewportBounds.bottom - 1
    });

    return {
      type: "rect",
      geometry: {
        x: item_anchor.x,
        y: item_anchor.y,
        width  : item_opposite.x - item_anchor.x,
        height : item_opposite.y - item_anchor.y
      }
    }

  } else {
    return undefined
  }

};

annotorious.plugin.dotSelector.Selector.prototype.getViewportBounds = function() {
  var right, left;

  if (this._opposite.x > this._anchor.x) {
    right = this._opposite.x;
    left = this._anchor.x
  } else {
    right = this._anchor.x;
    left = this._opposite.x
  }

  var top, bottom;

  if (this._opposite.y > this._anchor.y) {
    top = this._anchor.y;
    bottom = this._opposite.y
  } else {
    top = this._opposite.y;
    bottom = this._anchor.y
  }

  return {
    top: top,
    right: right,
    bottom: bottom,
    left: left
  }
};

// annotorious.plugin.dotSelector.Selector.prototype.drawShape = function(g2d, shape, highlight) {

//   console.log('HERE');

//   if (shape.type == "rect") {

//     var color, lineWidth;

//     if (highlight) {
//       color = "#ffffff";
//       lineWidth = 3;
//     } else {
//       color = "#da2a54";
//       lineWidth = 3;
//     }

//     var geom = shape.geometry;
//     g2d.strokeStyle = "#000000";
//     g2d.lineWidth = lineWidth;
//     // g2d.strokeRect(geom.x + .5, geom.y + .5, geom.width + 1, geom.height + 1);
//     g2d.strokeStyle = color;
//     g2d.strokeRect(geom.x + 3, geom.y + 3, geom.width + 3, geom.height + 3)

//   }

// };


anno.addPlugin('dotSelector', { activate: true });