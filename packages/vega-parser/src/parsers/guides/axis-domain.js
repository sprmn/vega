import { xAxisConditionalEncoding } from './axis-util';
import {Bottom, Top, one, zero} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {RuleMark} from '../marks/marktypes';
import {AxisDomainRole} from '../marks/roles';
import {addEncoders} from '../encode/encode-util';
import { isSignal } from '../../util';

export default function(spec, config, userEncode, dataRef) {
  var _ = lookup(spec, config),
      orient = spec.orient,
      encode, enter, update, u, u2, v;

  encode = {
    enter: enter = {opacity: zero},
    update: update = {opacity: one},
    exit: {opacity: zero}
  };

  addEncoders(encode, {
    stroke:           _('domainColor'),
    strokeCap:        _('domainCap'),
    strokeDash:       _('domainDash'),
    strokeDashOffset: _('domainDashOffset'),
    strokeWidth:      _('domainWidth'),
    strokeOpacity:    _('domainOpacity')
  });

  if (!isSignal(spec.orient)) {
    if (orient === Top || orient === Bottom) {
      u = 'x';
      v = 'y';
    } else {
      u = 'y';
      v = 'x';
    }
    u2 = u + '2';

    enter[v] = zero;
    update[u] = enter[u] = position(spec, 0);
    update[u2] = enter[u2] = position(spec, 1);
  } else {
    enter.y = xAxisConditionalEncoding(orient.signal, zero, position(spec, 0));
    enter.x = xAxisConditionalEncoding(orient.signal, zero, position(spec, 0), false);
    update.x = xAxisConditionalEncoding(orient.signal, position(spec, 0), null);
    update.y = xAxisConditionalEncoding(orient.signal, position(spec, 0), null, false);
    update.x2 = enter.x2 = xAxisConditionalEncoding(orient.signal, position(spec, 1), null);
    update.y2 = enter.y2 = xAxisConditionalEncoding(orient.signal, position(spec, 1), null, false);
  }

  return guideMark({
    type: RuleMark,
    role: AxisDomainRole,
    from: dataRef,
    encode
  }, userEncode);
}

function position(spec, pos) {
  return {scale: spec.scale, range: pos};
}
