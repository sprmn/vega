import {ifTopOrLeftAxisSignalRef, xyAxisConditionalEncoding} from './axis-util';
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
      sign = isSignal(orient) ? ifTopOrLeftAxisSignalRef(orient.signal, -1, 1) : (orient === Left || orient === Top) ? -1 : 1,
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

  if (isSignal(orient)) {
    update.x = xyAxisConditionalEncoding('x', orient.signal, titlePos, null);
    update.y = xyAxisConditionalEncoding('y', orient.signal, titlePos, null);
    enter.angle = update.angle = 
      xyAxisConditionalEncoding('x',
        orient.signal,
        zero,
        { signal: `(${sign.signal}) * 90` }
      );
    enter.baseline = update.baseline =
      xyAxisConditionalEncoding('x', 
        orient.signal,
        {signal: `(${orient.signal}) === "${Top}" ? "bottom" : "top"`},
        { value: 'bottom' }
      );
  } else {
    if (horizontal) {
      update.x = titlePos;
      enter.angle = {value: 0};
      enter.baseline = {value: orient === Top ? 'bottom' : 'top'};
    } else {
      update.y = titlePos;
      enter.angle = {value: sign * 90};
      enter.baseline = {value: 'bottom'};
    }
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

  if (isSignal(orient)) {
    if (_('titleX') != null) {
      delete encode.update['x'][0].signal;
      encode.update['x'][0] = {
        ...encode.update['x'][0],
        ..._('titleX')
      };
    } else {
      if (!has('x', userEncode)) {
        encode.enter.auto = xyAxisConditionalEncoding('y', orient.signal, { value: true }, null);
      }
    }

    if (_('titleY') != null) {
      delete encode.update['y'][0].signal;
      encode.update['y'][0] = {
        ...encode.update['y'][0],
        ..._('titleY')
      };
    } else {
      if (!has('y', userEncode)) {
        if (!encode.enter.auto) {
          encode.enter.auto = [];
        }

        encode.enter.auto.push(xyAxisConditionalEncoding('x', orient.signal, { value: true }, null)[0]);
      }
    }
  } else {   
    if (!addEncode(encode, 'x', _('titleX'), 'update')) {
      !horizontal && !has('x', userEncode)
      && (encode.enter.auto = {value: true});
    }
  
    if (!addEncode(encode, 'y', _('titleY'), 'update')) {
      horizontal && !has('y', userEncode)
      && (encode.enter.auto = {value: true});
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
