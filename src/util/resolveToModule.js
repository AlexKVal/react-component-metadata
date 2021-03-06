let { types: t } = require('babel-core')
  , resolveToValue = require('./resolveToValue')

let isWindow = node => t.isMemberExpression(node) && (node.object.name === 'window' || node.object.name === 'global')

let isModule = node => t.isImportDeclaration(node) || isWindow(node) || (t.isCallExpression(node) && node.callee.name === 'require')

let resolve = node => isModule(node) || isWindow(node)

function resolveToModule(node, scope){
  return resolveToValue(node, scope, resolve)
}

resolveToModule.isModule = isModule;

module.exports = resolveToModule