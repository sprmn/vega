import {ifTopOrLeftAxisExpr, xAxisConditionalEncoding, xAxisExpr} from './axis-util';
import {Bottom, GuideTitleStyle, Left, Top, one, zero} from './constants';
import guideMark from './guide-mark';
import {alignExpr, anchorExpr, lookup} from './guide-util';
import {encoder, has} from '../encode/encode-util';
import {TextMark} from '../marks/marktypes';
import {AxisTitleRole} from '../marks/roles';
import {addEncode, addEncoders} from '../encode/encode-util';
import {extend} from 'vega-util';
import { isSignal } from '../../util';

export default function(spec, config, userEncode, dataRef) {
  var _ = lookup(spec, config),
      orient = spec.orient,
      sign = isSignal(orient) ? ifTopOrLeftAxisExpr(orient.signal, -1, 1) : (orient === Left || orient === Top) ? -1 : 1,
      horizontal = (orient === Top || orient === Bottom),
      encode, enter, update, titlePos;

  encode = {
    enter: enter = {
      opacity: zero,
      anchor: encoder(_('titleAnchor')),
      align: {signal: alignExpr}
    },
    update: update = extend({}, enter, {
      opacity: one,
      text: encoder(spec.title)
    }),
    exit: {
      opacity: zero
    }
  };

  titlePos = {
    signal: `lerp(range("${spec.scale}"), ${anchorExpr(0, 1, 0.5)})`
  };

  if (!isSignal(orient)) {
    if (horizontal) {
      update.x = titlePos;
      enter.angle = {value: 0};
      enter.baseline = {value: orient === Top ? 'bottom' : 'top'};
    } else {
      update.y = titlePos;
      enter.angle = {value: sign * 90};
      enter.baseline = {value: 'bottom'};
    }
  } else {
    update.x = xAxisConditionalEncoding(orient.signal, titlePos, null);
    update.y = xAxisConditionalEncoding(orient.signal, titlePos, null, false);
    enter.angle = xAxisConditionalEncoding(orient.signal, zero, { signal: sign, mult: 90});
    enter.baseline = xAxisConditionalEncoding(orient.signal, {signal: `(${orient.signal}) === "${Top}" ? "bottom" : "top"`}, { value: 'bottom' });
  }

  addEncoders(encode, {
    angle:       _('titleAngle'),
    baseline:    _('titleBaseline'),
    fill:        _('titleColor'),
    fillOpacity: _('titleOpacity'),
    font:        _('titleFont'),
    fontSize:    _('titleFontSize'),
    fontStyle:   _('titleFontStyle'),
    fontWeight:  _('titleFontWeight'),
    limit:       _('titleLimit'),
    lineHeight:  _('titleLineHeight')
  }, { // require update
    align:       _('titleAlign')
  });

  if (!isSignal(orient)) {
    if (!addEncode(encode, 'x', _('titleX'), 'update')) {
      !horizontal && !has('x', userEncode)
      && (encode.enter.auto = {value: true});
    }
  
    if (!addEncode(encode, 'y', _('titleY'), 'update')) {
      horizontal && !has('y', userEncode)
      && (encode.enter.auto = {value: true});
    }
  } else {
    if (_('titleX') != null) {
      encode.update['x'][0] = {
        ...encode.update['x'][0],
        signal: undefined,
        ..._('titleX')
      };

      encode.enter.auto = [
        {
          test: xAxisExpr(orient.signal, false),
          value: !has('x', userEncode) ? true : undefined
        }
      ];
    }

    if (_('titleY') != null) {
      encode.update['y'][0] = {
        ...encode.update['y'][0],
        signal: undefined,
        ..._('titleY')
      };

      encode.enter.auto = [
        {
          test: xAxisExpr(orient.signal, false),
          value: !has('x', userEncode) ? true : undefined
        }
      ];
    }
  }

  return guideMark({
    type:  TextMark,
    role:  AxisTitleRole,
    style: GuideTitleStyle,
    from:  dataRef,
    encode
  }, userEncode);
}
