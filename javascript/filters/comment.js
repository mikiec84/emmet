/**
 * Comment important tags (with 'id' and 'class' attributes)
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * @constructor
 * @memberOf __commentFilterDefine
 * @param {Function} require
 * @param {Underscore} _
 */
zen_coding.exec(function(require, _) {
	// define some preferences
	/** @type zen_coding.preferences */
	var prefs = require('preferences');
	
	prefs.set('filter.commentAfter', 
			'\n<%= padding %><!-- /<%= attr("id", "#") %><%= attr("class", ".") %> -->',
			'A definition of comment that should be placed <i>after</i> matched '
			+ 'element when <code>comment</code> filter is applied. This definition '
			+ 'is an ERB-style template passed to <code>_.template()</code> '
			+ 'function (see Underscore.js docs for details). In template context, '
			+ 'the following properties and functions are availabe:\n'
			+ '<ul>'
			
			+ '<li><code>attr(name, before, after)</code> – a function that outputs' 
			+ 'specified attribute value concatenated with <code>before</code> ' 
			+ 'and <code>after</code> strings. If attribute doesn\'t exists, the ' 
			+ 'empty string will be returned.</li>'
			
			+ '<li><code>node</code> – current node (instance of <code>ZenNode</code>)</li>'
			
			+ '<li><code>name</code> – name of current tag</li>'
			
			+ '<li><code>padding</code> – current string padding, can be used ' 
			+ 'for formatting</li>'
			
			+'</ul>');
	
	prefs.set('filter.commentBefore', 
			'',
			'A definition of comment that should be placed <i>before</i> matched '
			+ 'element when <code>comment</code> filter is applied. '
			+ 'For more info, read description of <code>filter.commentAfter</code> '
			+ 'property');
	
	prefs.set('filter.commentTrigger', 'id, class',
			'A comma-separated list of attribute names that should exist on tag '
			+ 'where comment should be added. If you wish to add comment for '
			+ 'every element, set this option to <code>*</code>');
	
	/**
	 * Add comments to tag
	 * @param {ZenNode} node
	 */
	function addComments(node, templateBefore, templateAfter) {
		var utils = require('utils');
		
		// check if comments should be added
		var trigger = prefs.get('filter.commentTrigger');
		if (trigger != '*') {
			var shouldAdd = _.find(trigger.split(','), function(name) {
				return !!node.getAttribute(utils.trim(name));
			});
			if (!shouldAdd) return;
		}
		
		var ctx = {
			node: node,
			name: node.name,
			padding: node.parent ? node.parent.padding : '',
			attr: function(name, before, after) {
				if (node.getAttribute(name)) {
					return (before || '') + node.getAttribute(name) + (after || '');
				}
				
				return '';
			}
		};
		
		var nodeBefore = utils.normalizeNewline(templateBefore ? templateBefore(ctx) : '');
		var nodeAfter = utils.normalizeNewline(templateAfter ? templateAfter(ctx) : '');
		
		node.start = node.start.replace(/</, nodeBefore + '<');
		node.end = node.end.replace(/>/, '>' + nodeAfter);
	}
	
	function process(tree, before, after) {
		var elements = require('elements');
		_.each(tree.children, function(item) {
			if (item.isBlock() && elements.is(item.source, 'parsedElement'))
				addComments(item, before, after);
			
			process(item, before, after);
		});
			
		return tree;
	}
	
	require('filters').add('c', function(tree) {
		var templateBefore = _.template(prefs.get('filter.commentBefore'));
		var templateAfter = _.template(prefs.get('filter.commentAfter'));
		
		return process(tree, templateBefore, templateAfter);
	});
});
