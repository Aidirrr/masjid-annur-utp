"""Interior of the domed prayer hall, following reference photographs."""
import furnishings
from math import cos, pi, sin, sqrt, tau


def build(s):
    box, beam, tri = s.box, s.beam, s.tri
    floor = 1.53
    cz = 6.0
    pearl, ivory, gold = '#ece8df', '#f5f0e3', '#bda66b'

    def quad(name, a, b, c, d, color):
        tri(name, a, b, c, color)
        tri(name, a, c, d, color)

    def polar(angle, radius, y):
        return (radius*cos(angle), y, cz+radius*sin(angle))

    def strip(name, r0, y0, r1, y1, color, n=80):
        for i in range(n):
            a, b = tau*i/n, tau*(i+1)/n
            quad(name, polar(a,r0,y0), polar(a,r1,y1),
                 polar(b,r1,y1), polar(b,r0,y0), color)

    def room_radius(a, hx, hz, cut):
        # Ray intersection with a rectangle with diagonally clipped corners.
        x,z = abs(cos(a)),abs(sin(a))
        return min(hx/max(x,1.e-8), hz/max(z,1.e-8), (hx+hz-cut)/(x+z))

    # The soffit outside the dome follows the chamfered footprint. Its circular
    # opening continues uninterrupted through the decorative drum to the apex.
    n = 80
    for i in range(n):
        a,b=tau*i/n,tau*(i+1)/n
        ra,rb=room_radius(a,13.02,10.85,2.4),room_radius(b,13.02,10.85,2.4)
        quad('Main hall ceiling',polar(a,ra,9.84),polar(a,8.98,9.84),
             polar(b,8.98,9.84),polar(b,rb,9.84),ivory)
    for r0,y0,r1,y1,col in [
        (8.98,9.84,8.94,10.02,pearl),(8.94,10.02,8.84,10.14,'#c7bfa8'),
        (8.84,10.14,8.82,10.62,'#ece4d5'),(8.82,10.62,8.69,10.72,ivory),
        (8.69,10.72,8.69,10.79,gold),(8.69,10.79,8.66,11.01,pearl),
        (8.66,11.01,8.66,12.08,'#e3d1a1'),(8.66,12.08,8.65,12.14,gold),
        (8.65,12.14,8.65,12.26,ivory),(8.65,12.26,8.44,12.62,pearl),
        (8.44,12.62,8.28,12.78,'#e9e8df'),(8.28,12.78,8.28,13.25,'#f5f6ef'),
        (8.28,13.25,8.12,13.35,ivory)
    ]:
        strip('Inner dome drum',r0,y0,r1,y1,col)

    # Map the photographed segment around the drum, with its central medallion
    # facing the qibla at the middle of a repeat.
    for i in range(96):
        a,b=tau*(i-12)/96,tau*(i-11)/96
        u,v=(i%24)/24,((i%24)+1)/24
        corners=[polar(a,8.636,12.07),polar(b,8.636,12.07),
                 polar(b,8.636,11.02),polar(a,8.636,11.02)]
        coords=[(u,0),(v,0),(v,1),(u,1)]
        for ids in ((0,1,2),(0,2,3)):
            s.textured_tri('Inscribed drum frieze','drum-frieze.jpg',
                           [corners[j] for j in ids],[coords[j] for j in ids])
    for i in range(72):
        a=tau*i/72
        quad('Clerestory reveals',polar(a-.011,8.25,12.76),polar(a-.011,8.25,13.27),
             polar(a+.011,8.25,13.27),polar(a+.011,8.25,12.76),ivory)
        if i%2==0:
            # Set a small framed circular grille in the vertical face of the drum.
            r=8.80
            for k in range(12):
                t,u=tau*k/12,tau*(k+1)/12
                outer_a=polar(a+.014*cos(t),r,10.38+.13*sin(t))
                outer_b=polar(a+.014*cos(u),r,10.38+.13*sin(u))
                inner_a=polar(a+.010*cos(t),r-.005,10.38+.095*sin(t))
                inner_b=polar(a+.010*cos(u),r-.005,10.38+.095*sin(u))
                quad('Drum ventilation grilles',outer_a,outer_b,inner_b,inner_a,'#a49780')
                tri('Drum ventilation grilles',polar(a,r-.006,10.38),inner_a,inner_b,'#707370')

    for i in range(48):
        a=tau*i/48
        for j in range(16):
            t,u=tau*j/16,tau*(j+1)/16
            def relief(v, scale):
                r=(.78+.22*cos(4*v))*scale
                return polar(a+.057*r*cos(v),8.785,10.35+.21*r*sin(v))
            quad('Drum plaster tracery',relief(t,1),relief(u,1),relief(u,.72),relief(t,.72),'#fcf9ed')

    # Inner shell has interpolated normals, separate from the external diamond skin.
    def dome_point(a, t):
        return polar(a,8.12*cos(t),13.35+4.25*sin(t))
    def dome_normal(a,t):
        x,y,z=-cos(t)*cos(a)/8.12,-sin(t)/4.25,-cos(t)*sin(a)/8.12
        length=sqrt(x*x+y*y+z*z)
        return (x/length,y/length,z/length)
    for band in range(12):
        lo,hi=band*pi/24,(band+1)*pi/24
        for i in range(n):
            a,b=tau*i/n,tau*(i+1)/n
            points=[dome_point(a,lo),dome_point(b,lo),dome_point(b,hi),dome_point(a,hi)]
            normals=[dome_normal(a,lo),dome_normal(b,lo),dome_normal(b,hi),dome_normal(a,hi)]
            for j,k,l in ((0,1,2),(0,2,3)):
                tri('Domed hall vault',points[j],points[k],points[l],'#e4e3dc',
                    (normals[j],normals[k],normals[l]))

    for i in range(48):
        a=tau*i/48
        for j in range(8):
            lo,hi=j*pi/18,(j+1)*pi/18
            ra,rb=8.109*cos(lo),8.109*cos(hi)
            ya,yb=13.341+4.25*sin(lo),13.341+4.25*sin(hi)
            quad('Vault panel joints',polar(a-.0013,ra,ya),polar(a+.0013,ra,ya),
                 polar(a+.0013,rb,yb),polar(a-.0013,rb,yb),'#c9c8c0')

    # Continuous prayer rows taper where they meet the beveled external corners.
    def half_width(z):
        return min(12.82, 12.82+10.62-2.12-abs(z-cz))
    def carpet(z0,z1,col):
        # Split at the corner break to preserve the footprint.
        stops=[z0]+[z for z in (cz-8.5,cz+8.5) if z0<z<z1]+[z1]
        for a,b in zip(stops,stops[1:]):
            wa,wb=half_width(a),half_width(b)
            quad('Main hall prayer carpet',(-wa,floor,a),(-wb,floor,b),(wb,floor,b),(wa,floor,a),col)
    z0=-4.62
    for row in range(12):
        z=-3.85+row*1.72
        carpet(z0,z,'#a4c0b9')
        carpet(z,z+.125,'#446575')
        carpet(z+.125,z+.153,'#c2b89a')
        for i in range(-20,21):
            x=.61*i
            if abs(x)+.10>half_width(z):continue
            quad('Carpet woven borders',(x-.094,floor+.003,z+.061),
                 (x,floor+.003,z+.098),(x+.094,floor+.003,z+.061),
                 (x,floor+.003,z+.024),'#b6baa3')
        z0=z+.153
    carpet(z0,16.62,'#a4c0b9')

    # The rear balcony spans the entrance lobby. Each post carries a framed,
    # open geometric screen above a continuous linear return-air grille.
    front=-1.1
    box('Mezzanine balcony deck',(0,5.27,-2.80),(24.55,.54,3.4),pearl)
    for j in range(14):
        x=-12.25+j*1.75
        box('Mezzanine fascia vents',(x+.875,5.29,front+.016),(1.65,.17,.035),'#767a75')
        for h in (5.26,5.30,5.34):
            box('Mezzanine vent blades',(x+.875,h,front+.041),(1.65,.014,.02),'#b9b9ad')
        if j == 12:  # Upper stair landing
            continue
        beam('Mezzanine gallery balustrade',(x,5.54,front),(x,6.58,front),.044,'#8e938d')
        for y in (5.61,6.44,6.54):
            beam('Mezzanine gallery balustrade',(x,y,front),(x+1.75,y,front),.026,'#a8a99e')
        # Interlocking diamonds form a perforated infill within each rail bay.
        for k in range(7):
            mid=x+.125+.25*k
            for row in range(3):
                y=5.765+.22*row
                for dx in (-.125,.125):
                    for dy in (-.11,.11):
                        quad('Gallery pierced screens',(mid,y+dy-.015,front),
                             (mid+dx,y-.015,front),(mid+dx,y+.015,front),
                             (mid,y+dy+.015,front),'#b7b9af')
    for x in (-9.6,-3.55,3.55,9.6):
        box('Mezzanine columns',(x,3.27,-2.40),(.54,3.48,.54),ivory)
    for sign in (-1,1):
        # Open bookshelves flank the glazed doors beneath the gallery.
        x=sign*8.8
        box('Bookcase backs',(x,2.55,-4.48),(2.6,2.08,.12),'#c6c7bc')
        for j in range(5):
            box('Bookcase shelves',(x,1.56+j*.50,-4.30),(2.60,.06,.38),pearl)
        for dx in (-1.3,0,1.3):
            box('Bookcase stiles',(x+dx,2.56,-4.30),(.06,2.06,.38),pearl)
        for level in range(3):
            for k in range(12):
                if (k+level)%5==0:continue
                h=.28+.028*((k+level)%4)
                box('Shelved books',(x-1.18+k*.20,1.60+.5*level+h/2,-4.24),
                    (.115,h,.17),('#435a55','#705748','#536775')[(k+level)%3])
    # The ceiling downlights line the central opening and the projecting galleries.
    for i in range(48):
        a=tau*i/48; x,z=9.55*cos(a),cz+9.55*sin(a)
        s.lathe('Main hall downlights',x,z,[(9.817,.092),(9.833,.114)],'#fff3d5',8)

    qibla_wall(s)
    furnishings.build(s)


def qibla_wall(s):
    # Coordinates on the rectified elevation, measured against its 896 x 288
    # reference grid. Positive X is left when standing in the hall facing qibla.
    face=14.95
    def world(u,v,z):
        return ((448-u)*.024,1.53+(288-v)*.0245,z)
    def panel(points):
        for k in range(1,len(points)-1):
            corners=[points[i] for i in (0,k,k+1)]
            s.textured_tri('Qibla marble elevation','qibla.jpg',
                           [world(*c) for c in corners],[(u/896,v/288) for u,v,z in corners])
    def bay(a,b,top_a,top_b,base_a,base_b,z=face):
        panel([(a,top_a,z),(b,top_b,z),(b,base_b,z),(a,base_a,z)])
    for a,b,ta,tb in [(0,61,61,0),(61,410,0,0),(489,598,0,0),
                      (716,831,0,0),(831,896,0,61)]:
        bay(a,b,ta,tb,288,288)
    # Return each pilaster to the back plane so its marble edge also casts a
    # shadow when seen obliquely from the gallery or from a side entrance.
    for a,b,top,bottom,depth in [(132,178,1,286,.14),(307,365,1,286,.23),
                                  (536,591,1,286,.23),(717,756,1,286,.14),
                                  (187,302,6,78,.10),(594,710,6,82,.10),
                                  (369,533,52,115,.15)]:
        z=face-depth
        bay(a,b,top,top,bottom,bottom,z)
        for u in (a,b):
            s.quad('Marble moulding returns',world(u,top,z),world(u,bottom,z),
                   world(u,bottom,face),world(u,top,face),'#b2a593')
        for v in (top,bottom):
            s.quad('Marble moulding returns',world(a,v,z),world(b,v,z),
                   world(b,v,face),world(a,v,face),'#c8bbaa')
    outline=[(410,288),(410,187),(414,170),(424,151),(437,138),(449,130),
             (462,139),(475,154),(485,171),(489,188),(489,288)]
    niche_back=16.18
    for (a,va),(b,vb) in zip(outline,outline[1:]):
        if a!=b:bay(a,b,0,0,va,vb)
        ua,ub=449+(a-449)*.82,449+(b-449)*.82
        panel([(a,va,face),(b,vb,face),(ub,vb,niche_back),(ua,va,niche_back)])
        if a!=b:bay(ua,ub,va,vb,288,288,niche_back)
    # Upper minbar doorway is actually open behind the projecting pulpit.
    bay(598,716,0,0,96,96)
    s.box('Minbar stairwell wall',(-5.016,3.88,16.46),(2.84,4.71,.10),'#aeb8b5')
    s.quad('Minbar doorway soffit',world(598,96,face),world(716,96,face),
           world(716,96,16.46),world(598,96,16.46),'#b7b5a7')
    for u in (598,716):
        s.quad('Minbar doorway jambs',world(u,96,face),world(u,96,16.46),
               world(u,288,16.46),world(u,288,face),'#c4b9a7')
    # A marble base and three-sided parapet project into the room.
    for a,b,za,zb in [(632,646,face,14.03),(646,702,14.03,14.03),(702,718,14.03,face)]:
        panel([(a,153,za),(b,153,zb),(b,202,zb),(a,202,za)])
        panel([(a,202,za+.08),(b,202,zb+.08),(b,288,zb+.08),(a,288,za+.08)])
    s.box('Minbar landing',(-5.25,3.74,14.88),(1.48,.17,1.68),'#c8bbb0')
    # Stairs return behind the qibla screen with access through the pulpit bay.
    for j in range(10):
        h=(j+1)*.2295
        s.box('Minbar steps',(-3.76,1.53+h/2,13.0+j*.28),(.63,h,.28),'#d7d2c8')
    s.box('Minbar upper landing',(-4.48,3.74,15.52),(1.60,.17,.55),'#d2cbc1')
    s.box('Reading lectern',(-1.43,1.88,14.48),(.84,.70,.48),'#987044')
    s.box('Reading lectern',(-1.43,2.27,14.48),(.90,.09,.53),'#a47f52')
