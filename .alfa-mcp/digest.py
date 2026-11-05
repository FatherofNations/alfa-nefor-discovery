#!/usr/bin/env python3
"""Сжимает выдачу FIGMA_GET_FILE_NODES до читаемого дерева:
имя, тип, bbox (относительно корня), автолейаут, заливки, текст со стилем."""
import json, sys

def color(c):
    if c is None: return None
    r = round(c.get('r',0)*255); g = round(c.get('g',0)*255); b = round(c.get('b',0)*255)
    a = c.get('a',1)
    return f"#{r:02X}{g:02X}{b:02X}" + (f"@{a:.2f}" if a < 1 else "")

def fill_desc(fills):
    out = []
    for f in fills or []:
        if f.get('visible') is False: continue
        t = f.get('type')
        if t == 'SOLID':
            out.append(f"solid:{color(f.get('color'))}" + (f" op={f.get('opacity'):.2f}" if f.get('opacity',1)<1 else ""))
        elif t and t.startswith('GRADIENT'):
            stops = ",".join(f"{color(s.get('color'))}@{s.get('position')}" for s in f.get('gradientStops',[]))
            out.append(f"{t}:{stops}")
        elif t == 'IMAGE':
            out.append(f"IMAGE:{f.get('imageRef')} scale={f.get('scaleMode')}")
        else:
            out.append(str(t))
    return out

def walk(n, ox, oy, depth, lines):
    bb = n.get('absoluteBoundingBox') or {}
    x = round(bb.get('x',0)-ox); y = round(bb.get('y',0)-oy)
    w = bb.get('width'); h = bb.get('height')
    wh = f"{round(w)}x{round(h)}" if w is not None else "?"
    parts = [f"{'  '*depth}{n.get('type')} «{n.get('name')}» [{x},{y} {wh}] id={n.get('id')}"]
    if n.get('visible') is False: parts.append("HIDDEN")
    lm = n.get('layoutMode')
    if lm:
        al = f"layout:{lm} gap={n.get('itemSpacing')}"
        pad = [n.get(f'padding{k}') for k in ('Left','Top','Right','Bottom')]
        if any(p for p in pad): al += f" pad={pad}"
        al += f" prim={n.get('primaryAxisAlignItems','?')}/{n.get('primaryAxisSizingMode','?')} counter={n.get('counterAxisAlignItems','?')}/{n.get('counterAxisSizingMode','?')}"
        if n.get('layoutAlign') not in (None,'INHERIT'): al += f" alignSelf={n.get('layoutAlign')}"
        if n.get('layoutGrow'): al += f" grow={n.get('layoutGrow')}"
        parts.append(al)
    for k in ('layoutSizingHorizontal','layoutSizingVertical'):
        if n.get(k): parts.append(f"{k}={n.get(k)}")
    cr = n.get('cornerRadius')
    if cr is not None: parts.append(f"r={cr}")
    if n.get('rectangleCornerRadii'): parts.append(f"radii={n.get('rectangleCornerRadii')}")
    fills = fill_desc(n.get('fills'))
    if fills: parts.append("fill=" + "|".join(fills))
    st = fill_desc(n.get('strokes'))
    if st: parts.append("stroke=" + "|".join(st) + f" w={n.get('strokeWeight')}" + (f" wInd={n.get('individualStrokeWeights')}" if n.get('individualStrokeWeights') else ""))
    for e in n.get('effects') or []:
        if e.get('visible',True): parts.append(f"effect:{e.get('type')} r={e.get('radius')} off={e.get('offset')} c={color(e.get('color'))}")
    if n.get('clipsContent'): parts.append("clip")
    if n.get('opacity',1) != 1: parts.append(f"opacity={n.get('opacity')}")
    stl = n.get('style') or {}
    if n.get('type') == 'TEXT':
        parts.append(f"TEXT=\"{n.get('characters')}\"")
        parts.append(f"font={stl.get('fontFamily')}/{stl.get('fontWeight')} size={stl.get('fontSize')} lh={stl.get('lineHeightPx')} ls={stl.get('letterSpacing')} align={stl.get('textAlignHorizontal')}")
        fills2 = fill_desc(n.get('fills'))
        if fills2: parts.append("tfill="+"|".join(fills2))
    cp = n.get('componentProperties')
    if cp:
        props = {k: v.get('value') for k,v in cp.items()}
        parts.append(f"props={json.dumps(props, ensure_ascii=False)}")
    lines.append(" ".join(str(p) for p in parts))
    if n.get('type') == 'INSTANCE':
        # инстанс: не разворачиваем внутренности, собираем только тексты и картинки
        texts, images = [], []
        def deep(m):
            if m.get('type') == 'TEXT' and m.get('visible', True):
                mb = m.get('absoluteBoundingBox') or {}
                ms = m.get('style') or {}
                texts.append(f"{'  '*(depth+1)}↳TEXT[{round(mb.get('x',0)-ox)},{round(mb.get('y',0)-oy)} {round(mb.get('width',0))}x{round(mb.get('height',0))}] \"{m.get('characters')}\" font={ms.get('fontFamily')}/{ms.get('fontWeight')} size={ms.get('fontSize')} lh={ms.get('lineHeightPx')} ls={ms.get('letterSpacing')} fill={'|'.join(fill_desc(m.get('fills')))}")
            for f in m.get('fills') or []:
                if f.get('type') == 'IMAGE' and m.get('visible', True):
                    mb = m.get('absoluteBoundingBox') or {}
                    images.append(f"{'  '*(depth+1)}↳IMG[{round(mb.get('x',0)-ox)},{round(mb.get('y',0)-oy)} {round(mb.get('width',0))}x{round(mb.get('height',0))}] {m.get('type')} «{m.get('name')}» ref={f.get('imageRef')} {f.get('scaleMode')}")
            for c in m.get('children') or []:
                deep(c)
        for c in n.get('children') or []:
            deep(c)
        lines.extend(texts)
        lines.extend(images)
        return
    for c in n.get('children') or []:
        walk(c, ox, oy, depth+1, lines)

def main(path):
    data = json.load(open(path))
    nodes = data['data']['nodes']
    for nid, node in nodes.items():
        doc = node['document']
        bb = doc.get('absoluteBoundingBox') or {}
        lines = []
        walk(doc, bb.get('x',0), bb.get('y',0), 0, lines)
        print("\n".join(lines))

if __name__ == '__main__':
    main(sys.argv[1])
