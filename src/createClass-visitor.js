let { types: t } = require('babel-core')
  , {
    parsePropTypes
  , parseDefaultProps } = require('./parseProps')
  , resolveToValue = require('./util/resolveToValue')
  , resolveToName = require('./util/resolveToName')
  , isReactClass = require('./util/isReactCreateClass')
  , find = require('lodash/collection/find')
  , uuid = require('lodash/utility/uniqueId')
  , doc = require('./util/comments')
  , path = require('path');

let isResolvable = resolveToValue.isResolvable

function getCreatClassName(spec, visitor, scope, comment){
  var parent = visitor.parentPath.node
    , displayName = find(spec || [], node => t.isProperty(node) && node.key.name === 'displayName')
    , literal = displayName && resolveToValue(displayName.value, scope)
    , doclets = doc.getDoclets(comment);

  if ( doclets.alias || doclets.name )
    return doclets.alias || doclets.name

  else if ( literal )
    return literal.value

  else if ( t.isVariableDeclarator(parent))
    return parent.id.name

  else if ( t.isProperty(parent) )
    return parent.key.name

  return uuid('AnonymousComponent')
}

module.exports = function(state, opts){
  var json = state.result
    , components = state.seen

  return {
    enter(node, parent, scope) {

      if (isReactClass(node.callee, scope)) {
        var spec = resolveToValue(node.arguments[0], scope).properties
          , comment = doc.parseCommentBlock(doc.findLeadingCommentNode(this))
          , component = getCreatClassName(spec, this, scope, comment)
          , propTypes = find(spec, node => t.isProperty(node) && node.key.name === 'propTypes')
          , getDefaultProps = find(spec, node => t.isProperty(node) && node.key.name === 'getDefaultProps')

        components.push(component)

        json[component] = {
          props: {},
          composes: [],
          desc: comment || ''
        }

        if ( opts.mixins ){
          var mixins = find(spec, node => t.isProperty(node) && node.key.name === 'mixins');

          if ( mixins ){
            json[component].mixins = []
            parseMixins(mixins.value.elements, scope, json[component].mixins)
          }
        }

        propTypes && parsePropTypes(resolveToValue(propTypes.value, scope), json[component], scope)

        if ( getDefaultProps ){

          let defaultProps = find(getDefaultProps.value.body.body,
            node => t.isReturnStatement(node) && (isResolvable(node.argument) || t.isIdentifier(node.argument)) )

          if ( defaultProps )
            parseDefaultProps(resolveToValue(defaultProps.argument, scope), json[component].props, state.file)
        }
      }
    }
  }
}

function parseMixins(mixins = [], scope, composes){
  mixins.forEach( mixin => {
    var name = resolveToName(mixin, scope)

    if ( name && composes.indexOf(name) === -1)
      composes.push(name)
  })
}