/**
 * Cross-Browser selection method, alowing for unified API for all browsers.
 * The code is not browser dependable, but feuter besed.
 *
 * @method
 * @public
 *
 * @param   {Object} editor
 * @param   {Window} win   (Optional)
 *
 * @return  {Object} GetSelection
 */
var GetSelection = (function ( win, doc ) {

   /**
    * Creating 'Function.bind' Polyfill, for older browsers.
    * This polyfill is created base on https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
    *
    * @method  bind
    * @public
    *
    * @param   {Object}
    *
    * @return  {Function}
    */
    if (!Function.prototype.bind) {
      Function.prototype.bind = function( bind ) {
         if (typeof this !== 'function') {
            // closest thing possible to the ECMAScript 5
            // internal IsCallable function
            throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
         }

         var args     = Array.prototype.slice.call(arguments, 1),
            f_to_bind = this,
            fNOP      = function() {},
            bound     = function() {
               return f_to_bind.apply(this instanceof fNOP && bind
                     ? this
                     : bind,
                     args.concat(Array.prototype.slice.call(arguments)));
            };

         fNOP.prototype = this.prototype;
         bound.prototype = new fNOP();

         return bound;
      };
   }

   /**
    * DOM Elements manipulators
    *
    * @type {Object}
    */
   var DOM = {
      /**
       * Get single element for given container
       *
       * @method  getElement
       * @private
       *
       * @param   {Object} container
       * @param   {String} search
       *
       * @return  {Object}
       */
      getElement : function ( container, search ) {
         var is_string = typeof search == 'string';
         if ( is_string && (container || {}).getElementsByTagName ) {
            return (container.getElementById && container.getElementById( search )) || DOM.getElements(container, search)[0];
         }
         return !is_string && search;
      },

      /**
       * Get array of elements from given container
       *
       * @method  getElements
       * @private
       *
       * @param   {Object} container
       * @param   {String} search
       *
       * @return  {Object}
       */
      getElements : function ( container, search ) {
         return container.getElementsByTagName( search ) || container.getElementsByClassName( search ) || ( container.querySelectorAll && container.querySelectorAll( search )) || [];
      },

      /**
       * Get DOMElement innerText
       *
       * @method  getText
       * @private
       *
       * @param   {Object} element
       *
       * @return  {String}
       */
      getText : function ( element ) {
         return element.textContent || element.innerText || '';
      },

      /**
       * Add DOM event
       *
       * @method  addEvent
       * @private
       *
       * @param   {Object}    element
       * @param   {String}    event_name
       * @param   {Function}  callback
       */
      addEvent : function ( element, event_name, callback ) {},

      /**
       * [removeEvent description]
       *
       * @method  removeEvent
       * @private
       *
       * @param   {Object}    element
       * @param   {String}    event_name
       * @param   {Function}  callback
       */
      removeEvent : function ( element, event_name, callback ) {},

      /**
       * Add multiple events to given DOM element
       *
       * @method  addEvents
       * @private
       *
       * @param   {Object} element
       * @param   {Object} events
       */
      addEvents : function ( element, events ) {
         for ( var i in events ) {
            DOM.addEvent( element, i, events[i] );
         }
      },

      /**
       * Remove multiple events to given DOM element
       *
       * @method  removeEvents
       * @private
       *
       * @param   {Object} element
       * @param   {Object} events
       */
      removeEvents : function ( element, events ) {
         for ( var i in events ) {
            DOM.removeEvent( element, i, events[i] );
         }
      }
   };

   if (typeof addEventListener !== "undefined") {
      /**
       * @method  addEvent
       * @private
       *
       * @param   {Object}    element
       * @param   {String}    event_name
       * @param   {Function}  callback
       *
       * @see     {DOM.addEvent}
       */
      DOM.addEvent = function( element, event_name, callback ) {
         element.addEventListener( event_name, callback, false );
      };

      /**
       * @method  removeEvent
       * @private
       *
       * @param   {Object}    element
       * @param   {String}    event_name
       * @param   {Function}  callback
       *
       * @see     {DOM.removeEvent}
       */
      DOM.removeEvent = function( element, event_name, callback ) {
         element.removeEventListener( event_name, callback, false );
      };
   } else if (typeof attachEvent !== "undefined") {

      /**
       * @method  addEvent
       * @private
       *
       * @param   {Object}    element
       * @param   {String}    event_name
       * @param   {Function}  callback
       *
       * @see     {DOM.addEvent}
       */
      DOM.addEvent = function( element, event_name, callback ) {
         var hash_name = "e_" + event_name + callback;

         element[hash_name] = function( event ) {
            var event         = event || window.event;
            var type          = event.type;
            var relatedTarget = null;

            if (type === "mouseover" || type === "mouseout") {
               relatedTarget = (type === "mouseover") ? event.fromElement : event.toElement;
            }

            callback.call(element, {
               target        : event.srcElement,
               type          : type,
               relatedTarget : relatedTarget,
               _event        : event,
               preventDefault : function() {
                  this._event.returnValue = false;
               },
               stopPropagation : function() {
                  this._event.cancelBubble = true;
               }
            });
         };

         element.attachEvent("on" + event_name, element[hash_name]);
      };

      /**
       * @method  removeEvent
       * @private
       *
       * @param   {Object}    element
       * @param   {String}    event_name
       * @param   {Function}  callback
       *
       * @see     {DOM.removeEvent}
       */
      DOM.removeEvent = function( element, event_name, callback ) {
         var hash_name = "e_" + event_name + callback;

         if (typeof element[hash_name] !== "undefined") {
            element.detachEvent("on" + event_name, element[hash_name]);
            delete element[hash_name];
         }
      };
   } else {

      /**
       * @method  addEvent
       * @private
       *
       * @param   {Object}    element
       * @param   {String}    event_name
       * @param   {Function}  callback
       *
       * @see     {DOM.addEvent}
       */
      DOM.addEvent = function( element, event_name, callback ) {
         element["on" + event_name] = callback;
      };

      /**
       * @method  removeEvent
       * @private
       *
       * @param   {Object}    element
       * @param   {String}    event_name
       * @param   {Function}  callback
       *
       * @see     {DOM.removeEvent}
       */
      DOM.removeEvent = function( element, event_name, callback ) {
         element["on" + event_name] = null;
      };
   }


   /**
    * Private static object
    *
    * @type {Object}
    */
   var static_options = {

      /**
       * List of tags that will be checked upon saving the selection.
       * This is required, since some browsers selection won't recognize when the selection is upon images for example,
       * or other self closing tags
       *
       * @type {Array}
       */
      tags_list : [ 'IMG', 'CANVAS' ],

      /**
       * Append one object properties
       *
       * @method  append
       * @private
       *
       * @param   {Object} obj
       * @param   {Object} append
       *
       * @return  {Object}
       */
      append : function ( obj, append ) {
         for (var i in append) {
            obj[i] = append[i];
         }
         return obj;
      },

      /**
       * Range method for webkit browsers.
       *
       * @method  getRangeAt
       * @private
       *
       * @param   {Object}    range
       * @param   {Boolean}   collapsed
       *
       * @return  {Object}
       */
      getRangeAt : function ( range, collapsed ) {
         // get range as item
         if ( range.item ) {
            return { node : range.item(0) };
         }

         var range_element, range_node, offset;
         var range_a = range.duplicate();
         var range_b = range.duplicate();
         var i       = -1;         

         range_b.collapse(!!collapsed);

         // get the closest available element node
         range_element = range_b.parentElement();

         // read between the element and the selection
         range_a.moveToElementText( range_element );
         range_a.setEndPoint( 'EndToStart', range_b );

         // get the offset despite a failure to read \r\n
         offset = range_a.text.replace( /\r\n/gm, '\n' ).length;

         // get the offset between the textnodes
         while ( offset > -1 && i + 1 < range_element.childNodes.length ) {
            offset -= ( range_element.childNodes[++i].nodeValue || range_element.childNodes[i].innerHTML ).length;
         }
         range_node = range_element.childNodes[i] || range_element;

         return {
            node   : range_node,
            offset : String( range_node.nodeValue || range_node.innerHTML || range_node.value || '' ).length + offset
         };
      },

      /**
       * Helper method to determine if the node is of type text
       *
       * @method  isNodeTextType
       * @private
       *
       * @param   {Object}    node
       *
       * @return  {Boolean}
       */
      isNodeTextType : function ( node ) { 
         return /[348]/.test( (node || {}).nodeType ); 
      },

      /**
       * Create range method
       *
       * @method  createRange
       * @private
       *
       * @return  {Object}
       */
      createRange : function () {},

      /**
       * Restore given selection
       *
       * @method  selectRange
       * @private
       *
       * @param   {Object} obj
       * 
       * @return  {undefined}
       */
      selectRange : function ( obj ) {},

      /**
       * Get the html for the selected element
       *
       * @method  innerHtml
       * @private
       *
       * @param   {Object} obj
       * @param   {Object} option
       *
       * @return  {String}
       */
      innerHtml : function ( obj, option ) {},

      /**
       * Insert HTML ober the selection
       *
       * @method  insertHtml
       * @private
       *
       * @param   {Object}    range
       * @param   {String}    html
       *
       * @return  {undefined}
       */
      insertHtml : function ( range, html ) {},

      /**
       * Select given node and focus it
       *
       * @method  selectNode
       * @private
       *
       * @param   {Object} 
       * @param   {String}
       *
       * @return  {undefined}
       */
      selectNode : function ( range, html ) {},

      /**
       * Extend start selection point, before the element.
       *
       * @method  extendSelectionToStart
       * @private
       *
       * @param   {Object} node
       * @param   {Object} search
       */
      extendSelectionToStart : function ( node, search ) {},

      /**
       * Extend end selection point, after the element.
       *
       * @method  extendSelectionToEnd
       * @private
       *
       * @param   {Object} node
       * @param   {Object} search
       */
      extendSelectionToEnd : function ( node, search ) {},

      /**
       * Collapse selection on
       *
       * @method  collapse
       * @private
       *
       * @param   {Object}  obj
       * @param   {Boolean} collapsed
       *
       * @return  {undefined}
       */
      collapse : function ( obj, collapsed ) {},

      /**
       * Move the end point by number of characters.
       * If passed negative value, it will move it in opposite direction.
       *
       * @method  setEndAt
       * @private
       *
       * @param   {Object} obj
       * @param   {Number} characters
       */
      setEndAt : function ( obj, characters ) {},

      /**
       * Move the start point by number of characters.
       * If passed negative value, it will move it in opposite direction.
       *
       * @method  setStartAt
       * @private
       *
       * @param   {Object} obj
       * @param   {Number} characters
       */
      setStartAt : function ( obj, characters ) {}
   };

   /**
    * Override methods, based on browser support, for 'window.getSelection' or 'document.selection' here,
    * so it will perform it once per file read, not every time when the method is called.
    *
    * Perform first document.selection, since browsers as IE9 support both getSelection and selection, but getSelection is not completely implemented
    *
    */
   if ( 'selection' in doc ) {

      /**
       * @method  createRange
       * @private
       *
       * @see     {static_options.createRange}
       * @return  {Object}
       */
      static_options.createRange = function () {
         var range       = this.options.doc.selection.createRange();
         var range_start = static_options.getRangeAt( range, true );
         var range_end   = static_options.getRangeAt( range, false );

         return {
            selection : this.options.doc.selection,
            range     : range,
            node      : range_start.node === range_end.node ? range_start.node : range.parentElement(),
            start     : {
               node     : range_start.node,
               offset   : range_start.offset
            },
            end       : {
               node     : range_end.node,
               offset   : range_end.offset
            }
         };
      };

      /**
       * @method  selectRange
       * @private
       *
       * @param   {Object} obj
       *
       * @see     {static_options.selectRange}
       * @return  {undefined}
       */
      static_options.selectRange = function ( obj ) {
         try {
            obj.range.select();
         } catch (e) {}
      };

      /**
       * @method  insertHtml
       * @private
       *
       * @param   {Object}    range
       * @param   {String}    html
       *
       * @see     {static_options.insertHtml}
       * @return  {undefined}
       */
      static_options.insertHtml = function ( range, html ) {
         // we got "Unspecified error" on some kind of selection - for example table multirow.
         try {
            range.pasteHTML( html );
         } catch ( e ) {
            range.collapse();
            range.pasteHTML( html );
         }
      };

      /**
       * @method  innerHtml
       * @private
       *
       * @param   {Object} obj
       * @param   {Object} option
       *
       * @see     {static_options.innerHtml}
       * @return  {String}
       */
      static_options.innerHtml = function ( obj, option ) {
         return (obj.range || {}).htmlText || '';
      };

      /**
       * @method  selectNode
       * @private
       *
       * @param   {Object} obj
       * @param   {Object} node
       * @param   {Object} options
       *
       * @see     {static_options.selectNode}
       * @return  {undefined}
       */
      static_options.selectNode = function ( obj, node, options ) {
         var range = options.body.createTextRange();
         range.collapse();

         range.moveToElementText( node );
         static_options.selectRange( Object.append(obj, {range:range}) );
      };

      /**
       * @method  collapse
       * @private
       *
       * @param   {Object}  obj
       * @param   {Boolean} collapsed
       *
       * @see     {static_options.collapse}
       * @return  {undefined}
       */
      static_options.collapse = function ( obj, collapsed ) {
         if ( !(obj || {}).range ) {
            return;
         }

         obj.range.collapse( !!collapsed );
         static_options.selectRange( obj );
      };

      /**
       * @method  extendSelectionToStart
       * @private
       *
       * @param   {Object} node
       * @param   {Object} search
       *
       * @see     {static_options.extendSelectionToStart}
       */
      static_options.extendSelectionToStart = function ( node, search ) {
         var container       = this.options.doc.createElement( 'div' );
         container.innerHTML = static_options.innerHtml( this.get(), this.options );
         var length          = DOM.getText( node ).length - DOM.getText( DOM.getElement( container, search ) ).length;

         this.get().range.moveStart( 'character', -length );
         static_options.selectRange( this.get() );
      };

      /**
       * @method  extendSelectionToEnd
       * @private
       *
       * @param   {Object} node
       * @param   {Object} search
       *
       * @see     {static_options.extendSelectionToEnd}
       */
      static_options.extendSelectionToEnd = function ( node, search ) {
         var container       = this.options.doc.createElement('div');
         container.innerHTML = static_options.innerHtml( this.get(), this.options );
         var length          = DOM.getText( node ).length - DOM.getText( DOM.getElements( container, search )[0] ).length;

         obj.range.moveEnd( 'character', length );
         static_options.selectRange( this.get() );
      };

      /**
       * @method  setEndAt
       * @private
       *
       * @param   {Object} obj
       * @param   {Number} characters
       *
       * @see     {static_options.setEndAt}
       */
      static_options.setEndAt = function ( obj, characters ) {
         if ( obj.range ) {
            obj.range.moveEnd( 'character', characters );
         }
      };

      /**
       * @method  setStartAt
       * @private
       *
       * @param   {Object} obj
       * @param   {Number} characters
       *
       * @see     {static_options.setStartAt}
       */
      static_options.setStartAt = function ( obj, characters ) {
         if ( obj.range ) {
            obj.range.moveStart( 'character', characters );
         }
      };

   } else if ( 'getSelection' in win ) {

      /**
       * @method  createRange
       * @private
       *
       * @see     {static_options.createRange}
       * @return  {Object}
       */
      static_options.createRange = function () {
         var win_selection = this.options.win.getSelection();

         if ( !win_selection.rangeCount ) {
            return;
         }

         var range = win_selection.getRangeAt(0);
         var node  = range.commonAncestorContainer;
         var start = {
            node   : range.startContainer,
            offset : range.startOffset
         };
         var end   = {
            node   : range.endContainer,
            offset : range.endOffset
         };

         //  correct misguided offsets
         if ( !static_options.isNodeTextType( start.node ) && start.offset > start.node.childNodes.length - 1 ) start.offset = start.node.innerHTML.length;
         if ( !static_options.isNodeTextType( end.node ) && end.offset > end.node.childNodes.length - 1 ) end.offset = end.node.innerHTML.length;

         return { 
            selection : win_selection,
            range     : range,
            node      : node,
            start     : start,
            end       : end
         };
      };

      /**
       * @method  selectRange
       * @private
       *
       * @param   {Object} obj
       *
       * @see     {static_options.selectRange}
       * @return  {undefined}
       */
      static_options.selectRange = function ( obj ) {
         obj.selection.removeAllRanges();
         obj.selection.addRange( obj.range );
      };

      /**
       * @method  insertHtml
       * @private
       *
       * @param   {Object}    range
       * @param   {String}    html
       *
       * @see     {static_options.insertHtml}
       * @return  {undefined}
       */
      static_options.insertHtml = function ( range, html ) {
         range.insertNode(range.createContextualFragment( html ));
      };

      /**
       * @method  innerHtml
       * @private
       *
       * @param   {Object} obj
       * @param   {Object} option
       *
       * @see     {static_options.innerHtml}
       * @return  {String}
       */
      static_options.innerHtml = function ( obj, option ) {
         var container = option.doc.createElement('div');

         for (var i = 0, l = (obj.selection.rangeCount || 0); i < l; i++ ) { 
            container.appendChild( obj.selection.getRangeAt(i).cloneContents() );
         }

         return container.innerHTML;
      };

      /**
       * @method  selectNode
       * @private
       *
       * @param   {Object} obj
       * @param   {Object} node
       *
       * @see     {static_options.selectNode}
       * @return  {undefined}
       */
      static_options.selectNode = function ( obj, node ) {
         obj.range.selectNode( node );
         static_options.selectRange( obj );
      };

      /**
       * @method  collapse
       * @private
       *
       * @param   {Object}  obj
       * @param   {Boolean} collapsed
       *
       * @see     {static_options.collapse}
       * @return  {undefined}
       */
      static_options.collapse = function ( obj, collapsed ) {
         if ( !(obj || {}).range && !(obj || {}).selection ) {
            return;
         }

         obj.range.collapse( !!collapsed );

         if ( !!collapsed ) {
            obj.selection.collapseToStart();
         } else {
            obj.selection.collapseToEnd();
         }

         static_options.selectRange( obj );
      };

      /**
       * @method  extendSelectionToStart
       * @private
       *
       * @param   {Object} node
       * @param   {Object} search
       *
       * @see     {static_options.extendSelectionToStart}
       */
      static_options.extendSelectionToStart = function ( node, search ) {
         this.get().range.setStartBefore( node );
         static_options.selectRange( this.get() );
      };

      /**
       * @method  extendSelectionToEnd
       * @private
       *
       * @param   {Object} node
       * @param   {Object} search
       *
       * @see     {static_options.extendSelectionToEnd}
       */
      static_options.extendSelectionToEnd = function ( node, search ) {
         this.get().range.setEndAfter( node );
         static_options.selectRange( this.get() );
      };

      /**
       * @method  setEndAt
       * @private
       *
       * @param   {Object} obj
       * @param   {Number} characters
       *
       * @see     {static_options.setEndAt}
       */
      static_options.setEndAt = function ( obj, characters ) {
         if ( obj.range && obj.end ) {
            obj.range.setEnd( obj.end.node, obj.end.offset + characters );
         }
      };

      /**
       * @method  setStartAt
       * @private
       *
       * @param   {Object} obj
       * @param   {Number} characters
       *
       * @see     {static_options.setStartAt}
       */
      static_options.setStartAt = function ( obj, characters ) {
         if ( obj.range && obj.start ) {
            obj.range.setStart( obj.start.node, obj.start.offset + characters );
         }
      };
   }

   /**
    * @method  constructor
    * @public
    *
    * @param   {Object}    editor
    * @param   {Window}    win
    *
    * @return  {Object}
    */
   return function ( static_options, editor, win ) {
      /**
       * Public methods
       *
       * @type  {Object}
       */
      static_options.append( this,
         {

            /**
             * Public options
             *
             * @type {Object}
             */
            options : {},

            /**
             * DOM manipulator methods and events
             *
             * @type {[type]}
             */
            DOM : DOM,

            /**
             * Public method for geting range
             *
             * @type {Object}
             */
            createRange : static_options.createRange.bind( this ),

            /**
             * Get current selection from the observed element
             *
             * @method  get
             * @public
             *
             * @return  {Object}
             */
            get : function () {
               return options.range || {};
            },

            /**
             * Set internal range flag to given range
             *
             * @method  set
             * @public
             *
             * @param   {undefined}
             */
            set : function ( range ) {
               options.range = range;
            },

            /**
             * Save current selection to the internal flag
             *
             * @method  save
             * @public
             *
             * @return  {undefined}
             */
            save : function ( event ) {
               var target = (event || {}).target;
               options.range = this.createRange();

               // Fix selection.
               // @see {static_options.tags_list}
               if ( options.range && static_options.tags_list.indexOf( (target || {}).tagName )  >= 0 ) {
                  options.range.node = target;
                  this.selectNode( target );
               }
            },

            /**
             * Restore selection from the internal flag
             *
             * @method  restore
             * @public
             *
             * @return  {undefined}
             */
            restore : function () {
               var selection = this.get();
               selection.range && static_options.selectRange( selection );
            },

            /**
             * Collapse selction
             *
             * @method  collapse
             * @private
             *
             * @param   {Boolean} start
             *
             * @return  {undefined}
             */
            collapse : function ( start ) {
               static_options.collapse( this.get(), !!start );
            },

            /**
             * Is current selection collapsed
             *
             * @method  isCollapsed
             * @private
             *
             * @return  {Boolean}
             */
            isCollapsed : function () {
               return !!(this.get().range || {}).collapsed;
            },

            /**
             * Move to the end of the selection
             *
             * @method  moveToEnd
             * @public
             *
             * @return  {undefined}
             */
            moveToEnd   : function () {
               this.collapse( false );
            },

            /**
             * Move to the beginign of the selection
             *
             * @method  moveToStart
             * @public
             *
             * @return  {undefined}
             */
            moveToStart : function () {
               this.collapse( true );
            },

            /**
             * Gets the parent element of all selected elements
             *
             * @method  element
             * @public
             *
             * @return  {Object}
             */
            getElement : function ( position ) {
               var node = (this.get()[position] || this.get() || {}).node;

               if ( node && (node || {}).parentNode && static_options.isNodeTextType(node) ) {
                  node = node.parentNode;
               }

               // If trying to get surrounding nodes, but they are the same as the selected node, do not return anything
               if (position && node == this.getElement()) {
                  return null;
               }

               return node;
            },

            /**
             * Teturn selectent text as String
             *
             * @method  selectText
             * @private
             *
             * @return  {String}
             */
            getText : function ( position ) {
               var range = (this.get()[position] || {}).node || this.get().range || {};

               if ( range.textContent ) {
                  return range.textContent;
               }
               if ( range.toString ) {
                  return range.toString();
               }
               return range.text || '';
            },

            /**
             * Insert HTML ober the selection
             *
             * @method  insertHtml
             * @public
             *
             * @param   {String}    html
             *
             * @return  {undefined}
             */
            insertHtml : function ( html ) {
               var range = this.get().range;
               range && static_options.insertHtml( range , html );
            },

            /**
             * Get the html for the selected elements
             *
             * @method  innerHtml
             * @private
             *
             * @return  {String}
             */
            innerHtml : function () {
               return static_options.innerHtml( this.get(), this.options );
            },

            /**
             * Select given node and focus it
             *
             * @method  selectNode
             * @public
             *
             * @param   {Object}    node
             *
             * @return  {undefined}
             */
            selectNode : function ( node ) {
               var content = this.get();

               if ( content.range && DOM.getElement(this.options.editor, node) ) {
                  static_options.selectNode( content, node, this.options );
                  content.node = node;
               }
            },

            /**
             * Extend selection before start node, or after end node, if it maches given search query
             *
             * @method  extendSelectionTo
             * @private
             *
             * @param   {String}
             *
             * @return  {Object} Return the found elements
             */
            extendSelectionTo : function ( search ) {
               var start = this.getElement('start');
               var end   = this.getElement('end');
               var items = {
                  start : (start || {}),
                  end   : (end || {})
               };

               // Extend to the start if the searched parameter matches the container before the selection
               if ( (items.start.className || '').indexOf( search ) > 0 || items.start.tagName == (search || '').toUpperCase() ) {
                  static_options.extendSelectionToStart.call( this, start, search );
               }

               // Extend to the end if the searched parameter matches the container after the selection
               if ( (items.end.className || '').indexOf( search ) > 0 || items.end.tagName == (search || '').toUpperCase() ) {
                  static_options.extendSelectionToEnd.call( this, end, search );
               }

               return items;
            },

            /**
             * Move end point by given position
             *
             * @method  setEndAt
             * @private
             *
             * @param   {Number}  characters
             */
            setEndAt : function ( characters ) {
               static_options.setEndAt( this.get(), characters );
            },

            /**
             * Move end point by given position
             *
             * @method  setStartAt
             * @private
             *
             * @param   {Number}  characters
             */
            setStartAt : function ( characters ) {
               static_options.setStartAt( this.get(), characters );
            },

            /**
             * @method  isTextSelected
             * @public
             *
             * @return  {Boolean}
             */
            isTextSelected : function () {
               return static_options.isNodeTextType( (this.get() || {}).node );
            },

            /**
             * Set element which to be observed for selection change and save it.
             *
             * @method  observe
             * @public
             *
             * @param   {Object}    editor
             * @param   {Object}    win
             *
             * @return  {undefined}
             */
            observe : function ( editor, win ) {
               this.options.win    = win || this.options.win || window;
               this.options.doc    = this.options.win.document;
               this.options.body   = this.options.win.document.body || this.options.win.document.getElementsByTagName("body")[0];
               this.options.editor = DOM.getElement( this.options.doc, editor );

               // Add events to the editor
               DOM.addEvents( this.options.editor, options.observe_events );

               // Init selection over container
               this.set( this.createRange() );
            },

            /**
             * Unobserve last given editor.
             *
             * @method  unobserve
             * @public
             *
             * @return  {undefined}
             */
            unobserve : function () {
               DOM.removeEvents( this.options.editor, options.observe_events );
            }
         }
      );

      /**
       * Private properties
       *
       * @type {Object}
       */
      var options = {

         /**
          * Reference to the last saved selection
          *
          * @type {Object}
          */
         range          : null,

         /**
          * Observer events, for attach and detach events
          *
          * @type {Object}
          */
         observe_events : {
            mouseup   : this.save.bind(this),
            keyup     : this.save.bind(this)
         }
      };

      this.observe( editor, win );
      return this;
   }
   // Binding to resolve closure issue in IE
   .bind({}, static_options);
})( window, document );