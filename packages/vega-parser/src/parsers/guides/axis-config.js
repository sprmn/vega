import {Bottom, Top} from './constants';
import {extend} from 'vega-util';
import { isSignal } from '../../util';
import { xAxisExpr, axisOrientExpr } from './axis-util';

export default function(spec, scope) {
  var config = scope.config,
      orient = spec.orient,
      xy,
      or,
      band;

  if (!isSignal(spec.orient)) {
    xy = (orient === Top || orient === Bottom) ? config.axisX : config.axisY;
    or = config['axis' + orient[0].toUpperCase() + orient.slice(1)];
  } else {
    var axisXYConfigKeys = new Set(Object.keys(config.axisX || {}).concat(Object.keys(config.axisY || {}))),
    axisOrientConfigKeys = new Set(Object.keys(config.axisTop || {}).concat(Object.keys(config.axisBottom || {}).concat(Object.keys(config.axisLeft || {}).concat(Object.keys(config.axisRight ||{})))));


    xy = {};
    for (var prop of axisXYConfigKeys) {
      xy[prop] = xAxisExpr(spec.orient.signal, config.axisX ? config.axisX[prop] : undefined, config.axisY ? config.axisY[prop] : undefined);
    }

    or = {};
    for (prop of axisOrientConfigKeys) {
      or[prop] = axisOrientExpr(spec.orient.signal, config.axisTop ? config.axisTop[prop] : undefined, config.axisBottom ? config.axisBottom[prop] : undefined, config.axisLeft ? config.axisLeft[prop] : undefined, config.axisRight ? config.axisRight[prop] : undefined);
    }
  }

  band = scope.scaleType(spec.scale) === 'band' && config.axisBand;

  return (xy || or || band)
    ? extend({}, config.axis, xy, or, band)
    : config.axis;
}