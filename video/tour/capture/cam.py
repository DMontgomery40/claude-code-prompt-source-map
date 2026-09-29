"""Camera paths: Catmull-Rom through keyframes, with eased time."""
import math
def _cr(p0, p1, p2, p3, t):
    t2, t3 = t*t, t*t*t
    return [0.5*((2*b) + (-a+c)*t + (2*a-5*b+4*c-d)*t2 + (-a+3*b-3*c+d)*t3) for a,b,c,d in zip(p0,p1,p2,p3)]
def ease_io(t): return t*t*(3-2*t)
def ease_out(t): return 1-(1-t)**3
def ease_in_out_cubic(t): return 4*t*t*t if t < .5 else 1-(-2*t+2)**3/2
def path(keys, u):
    """keys: list of (pos, target); u in [0,1] across the whole path (uniform per segment)."""
    n = len(keys)-1
    x = min(max(u,0),1)*n
    i = min(int(x), n-1); t = x-i
    P = lambda k: keys[max(0,min(n,k))]
    pos = _cr(P(i-1)[0], P(i)[0], P(i+1)[0], P(i+2)[0], t)
    tgt = _cr(P(i-1)[1], P(i)[1], P(i+1)[1], P(i+2)[1], t)
    return pos, tgt
def orbit(p, t, a, dy=0.0, zoom=1.0):
    dx, dz = p[0]-t[0], p[2]-t[2]
    c, s = math.cos(a), math.sin(a)
    return [t[0]+(dx*c-dz*s)*zoom, t[1]+(p[1]-t[1])*zoom+dy, t[2]+(dx*s+dz*c)*zoom], list(t)
