import json
import sys

path = sys.argv[1]
payload = json.load(open(path))
root_key = next(iter(payload['data']['nodes']))
root = payload['data']['nodes'][root_key]['document']
origin = root['absoluteBoundingBox']

def walk(node, depth=0):
    box = node.get('absoluteBoundingBox')
    pos = ''
    if box:
        pos = f" @ {box['x']-origin['x']:.1f},{box['y']-origin['y']:.1f} {box['width']:.1f}×{box['height']:.1f}"
    text = f" «{node['characters']}»" if node.get('characters') else ''
    style = node.get('style', {})
    font = f" [{style.get('fontFamily')} {style.get('fontSize')}px/{style.get('lineHeightPx')}px {style.get('fontWeight')}]" if style else ''
    transition = f" → {node['transitionNodeID']}" if node.get('transitionNodeID') else ''
    print('  '*depth + f"{node['id']} {node['type']} {node.get('name','')}{pos}{text}{font}{transition}")
    for child in node.get('children', []):
        walk(child, depth+1)

walk(root)
