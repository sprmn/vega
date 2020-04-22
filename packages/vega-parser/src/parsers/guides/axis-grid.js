import {Bottom, Left, Top, Value, one, zero} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {RuleMark} from '../marks/marktypes';
import {AxisGridRole} from '../marks/roles';
import {addEncoders} from '../encode/encode-util';
import {extend, isObject} from 'vega-util';
import { isSignal } from '../../util';
import { ifTopOrLeftAxisExpr, xAxisExpr, xAxisConditionalEncoding } from './axis-util';

export default function(spec, config, userEncode, dataRef, band) {
  var _ = lookup(spec, config),
      orient = spec.orient,
      vscale = spec.gridScale,
      sign = isSignal(orient) ? ifTopOrLeftAxisExpr(orient.signal, 1, -1) : (orient === Left || orient === Top) ? 1 : -1,
      offset = offsetValue(spec.offset, sign),
      encode, enter, exit, update, tickPos, u, v, v2, s;

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

  if (!isSignal(orient)) {
    if (orient === Top || orient === Bottom) {
      u = 'x';
      v = 'y';
      s = 'height';
    } else {
      u = 'y';
      v = 'x';
      s = 'width';
    }
    v2 = v + '2';
  
    update[u] = enter[u] = exit[u] = tickPos;
  
    if (vscale) {
      update[v] = enter[v] = {scale: vscale, range: 0, mult: sign, offset: offset};
      update[v2] = enter[v2] = {scale: vscale, range: 1, mult: sign, offset: offset};
    } else {
      update[v] = enter[v] = {value: 0, offset: offset};
      update[v2] = enter[v2] = {signal: s, mult: sign, offset: offset};
    }
  } else {
    update.x = enter.x = xAxisConditionalEncoding(orient.signal, tickPos, vscale ? { scale: vscale, range: 0, mult: sign, offset: offset} : { value: 0, offset: offset});
    update.y = enter.y = xAxisConditionalEncoding(orient.signal, tickPos, vscale ? { scale: vscale, range: 0, mult: sign, offset: offset} : { value: 0, offset: offset}, false);
    exit.x = xAxisConditionalEncoding(orient.signal, tickPos, null);
    exit.y = xAxisConditionalEncoding(orient.signal, tickPos, null, false);
    update.y2 = enter.y2 = xAxisConditionalEncoding(orient.signal, vscale ? {scale: vscale, range: 1, mult: sign, offset: offset} : {signal: xAxisExpr(orient.signal, 'height', 'width', false, false).signal, mult: sign, offset: offset}, null);
    update.x2 = enter.x2 = xAxisConditionalEncoding(orient.signal, vscale ? {scale: vscale, range: 1, mult: sign, offset: offset} : {signal: xAxisExpr(orient.signal, 'height', 'width', false, false).signal, mult: sign, offset: offset}, null, false);
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
  if (!isSignal(sign)) {
    if (sign === 1) {
      // do nothing!
    } else if (!isObject(offset)) {
      offset = sign * (offset || 0);
    } else {
        entry = offset = extend({}, offset);
  
        while (entry.mult != null) {
          if (!isObject(entry.mult)) {
            entry.mult *= sign;
            return offset;
          } else {
            entry = entry.mult = extend({}, entry.mult);
          }
        }
    
        entry.mult = sign;
    }
    return offset;
  } else {
    if (!isObject(offset)) {
      return {
        signal: `(${sign.signal}) === 1 ? 0 : (${sign.signal}) * (${offset || 0})`
      }
    } else {
      entry = offset = extend({}, offset);
  
      while (entry.mult != null) {
        if (!isObject(entry.mult)) {
          // no offset if sign === 1
          entry.mult = { signal: `(${sign.signal}) === 1 ? 0 : -${entry.mult}` };
          return offset;
        } else {
          entry = entry.mult = extend({}, entry.mult);
        }
      }
  
      entry.mult = sign;
    }
  }
}
