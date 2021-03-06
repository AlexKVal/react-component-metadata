'use strict';

var _require = require('babel-core');

var t = _require.types;
var resolveToValue = require('./resolveToValue');

var isWindow = function isWindow(node) {
  return t.isMemberExpression(node) && (node.object.name === 'window' || node.object.name === 'global');
};

var isModule = function isModule(node) {
  return t.isImportDeclaration(node) || isWindow(node) || t.isCallExpression(node) && node.callee.name === 'require';
};

var resolve = function resolve(node) {
  return isModule(node) || isWindow(node);
};

function resolveToModule(node, scope) {
  return resolveToValue(node, scope, resolve);
}

resolveToModule.isModule = isModule;

module.exports = resolveToModule;