import { stringValue } from 'vega-util';
import { Bottom, Left, Top } from './constants';
import { isSignal } from '../../util';

export function xyAxisSignalRef(xy, axisOrientExpr, yes, no) {
  var yesStr = isSignal(yes) ? yes.signal : stringValue(cleanValue(yes));
  var noStr = isSignal(no) ? no.signal : stringValue(cleanValue(no));
  return {
    signal: `${xyAxisBooleanExpr(xy, axisOrientExpr)} ? (${yesStr}) : (${noStr})`
  };
}
  
export function xyAxisBooleanExpr(xy, axisOrientExpr) {
  return `${xy === 'x' ? '' : '!'}((${axisOrientExpr}) === "${Top}" || (${axisOrientExpr}) === "${Bottom}")`;
}

export function axisOrientSignalRef(axisOrientExpr, top, bottom, left, right) {
  var topStr = isSignal(top) ? top.signal : stringValue(cleanValue(top));
  var bottomStr = isSignal(bottom) ? bottom.signal : stringValue(cleanValue(bottom));
  var leftStr = isSignal(left) ? left.signal : stringValue(cleanValue(left));
  var rightStr = isSignal(right) ? right.signal : stringValue(cleanValue(right));

  return {
    signal: `(${axisOrientExpr}) === "${Top}" ? (${topStr}) : (${axisOrientExpr}) === "${Bottom}" ? (${bottomStr}) : (${axisOrientExpr}) === "${Left}" ? (${leftStr}) : (${rightStr})`
  };
}

export function ifTopOrLeftAxisSignalRef(axisOrientExpr, ifTopOrLeft, otherwise) {
  var ifTopOrLeftStr = isSignal(ifTopOrLeft) ? ifTopOrLeft.signal : stringValue(cleanValue(ifTopOrLeft));
  var otherwiseStr = isSignal(otherwise) ? otherwise.signal : stringValue(cleanValue(otherwise));
  return {
    signal: `(${axisOrientExpr}) === "${Top}" || (${axisOrientExpr}) === "${Left}" ? (${ifTopOrLeftStr}) : (${otherwiseStr})`
  };
}
 
export function xyAxisConditionalEncoding(xy, axisOrientExpr, yes, no) {
  return [
    {
      test: xyAxisBooleanExpr(xy, axisOrientExpr),
      ...yes
    }
  ].concat(no || []);
}

function cleanValue(val) {
  return val === undefined ? null : val;
}