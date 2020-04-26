import {Bottom, Left, Top, Value, one, zero} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {RuleMark} from '../marks/marktypes';
import {AxisGridRole} from '../marks/roles';
import {addEncoders} from '../encode/encode-util';
import {extend, isObject} from 'vega-util';
import { isSignal } from '../../util';
import { ifTopOrLeftAxisSignalRef, xyAxisConditionalEncoding, xyAxisSignalRef } from './axis-util';

export default function(spec, config, userEncode, dataRef, band) {
  var _ = lookup(spec, config),
      orient = spec.orient,
      vscale = spec.gridScale,
      sign = isSignal(orient)
        ? ifTopOrLeftAxisSignalRef(orient.signal, 1, -1)
        : (orient === Left || orient === Top) ? 1 : -1,
      offset = offsetValue(spec.offset, sign),
      encode, enter, exit, update,
      tickPos, gridLineStart, gridLineEnd,
      u, v, v2, s, isXAxis;

  encode = {
    enter: enter = {opacity: zero},
    update: update = {opacity: one},
    exit: exit = {opacity: zero}
  };

  addEncoders(encode, {
    stroke:           _('gridColor'),
    strokeCap:        _('gridCap'),
    strokeDash:       _('gridDash'),
    strokeDashOffset: _('gridDashOffset'),
    strokeOpacity:    _('gridOpacity'),
    strokeWidth:      _('gridWidth')
  });

  tickPos = {
    scale:  spec.scale,
    field:  Value,
    band:   band.band,
    extra:  band.extra,
    offset: band.offset,
    round:  _('tickRound')
  };

  isXAxis = orient === Top || orient === Bottom;
  s = isSignal(orient)
    ? xyAxisSignalRef('x', orient.signal, { signal: 'height' }, { signal: 'width' }).signal
    : isXAxis ? 'height' : 'width';
  
  gridLineStart = vscale
    ? {scale: vscale, range: 0, mult: sign, offset: offset}
    : {value: 0, offset: offset};

  gridLineEnd = vscale
    ? {scale: vscale, range: 1, mult: sign, offset: offset}
    : {signal: s, mult: sign, offset: offset};

  if (isSignal(orient)) {
    for (u of ['x', 'y']) {
      v = u === 'x' ? 'y' : 'x';
      v2 = v + '2';
      
      update[u] = enter[u] = xyAxisConditionalEncoding(u, orient.signal, tickPos, gridLineStart);
      exit[u] = xyAxisConditionalEncoding(u, orient.signal, tickPos, null);
      update[v2] = enter[v2] = xyAxisConditionalEncoding(u, orient.signal, gridLineEnd, null);
    }
  } else {
    if (isXAxis) {
      u = 'x';
      v = 'y';
    } else {
      u = 'y';
      v = 'x';
    }
    v2 = v + '2';
  
    update[u] = enter[u] = exit[u] = tickPos;
    update[v] = enter[v] = gridLineStart;
    update[v2] = enter[v2] = gridLineEnd;
  }
  

  return guideMark({
    type: RuleMark,
    role: AxisGridRole,
    key:  Value,
    from: dataRef,
    encode
   }, userEncode);
}

function offsetValue(offset, sign)  {
  var entry;

  if (sign === 1) {
    // do nothing!
  } else if (!isObject(offset)) {
    offset = isSignal(sign) ? {
      signal: `(${sign.signal}) === 1 ? 0 : (${sign.signal}) * (${offset || 0})`
    } : sign * (offset || 0);
  } else {
    entry = offset = extend({}, offset);
    
    while (entry.mult != null) {
      if (!isObject(entry.mult)) {
        if (isSignal(sign)) {
          // no offset if sign === 1
          entry.mult = { signal: `(${sign.signal}) === 1 ? 0 : -${entry.mult}` };
        } else {
          entry.mult *= sign;
        }
        return offset;
      } else {
        entry = entry.mult = extend({}, entry.mult);
      }
    }

    entry.mult = sign;
  }

  return offset;
}
