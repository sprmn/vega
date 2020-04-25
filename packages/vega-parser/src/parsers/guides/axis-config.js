import {Bottom, Top} from './constants';
import {extend} from 'vega-util';
import { isSignal } from '../../util';
import { axisOrientSignalRef, xyAxisSignalRef } from './axis-util';

export default function(spec, scope) {
  var config = scope.config,
      orient = spec.orient,
      band = scope.scaleType(spec.scale) === 'band' && config.axisBand,
      xy,
      or;

  if (!isSignal(spec.orient)) {
    xy = (orient === Top || orient === Bottom) ? config.axisX : config.axisY;
    or = config['axis' + orient[0].toUpperCase() + orient.slice(1)];
  } else {
    var axisX = config.axisX || {},
        axisY = config.axisY || {},
        axisTop = config.axisTop || {},
        axisBottom = config.axisBottom || {},
        axisLeft = config.axisLeft || {},
        axisRight = config.axisRight || {},
        axisXYConfigKeys = new Set(
          Object.keys(config.axisX || {})
            .concat(Object.keys(config.axisY || {}))
        ),
        axisOrientConfigKeys = new Set(
          Object.keys(config.axisTop || {})
            .concat(Object.keys(config.axisBottom || {})
            .concat(Object.keys(config.axisLeft || {})
            .concat(Object.keys(config.axisRight ||{}))))
        );


    xy = {};
    for (var prop of axisXYConfigKeys) {
      xy[prop] = xyAxisSignalRef('x', spec.orient.signal, axisX[prop], axisY[prop]);
    }

    or = {};
    for (prop of axisOrientConfigKeys) {
      or[prop] = axisOrientSignalRef(
        spec.orient.signal,
        axisTop[prop],
        axisBottom[prop],
        axisLeft[prop],
        axisRight[prop]
      );
    }
  }

  var result = (xy || or || band)
    ? extend({}, config.axis, xy, or, band)
    : config.axis;
  
  return result;
}