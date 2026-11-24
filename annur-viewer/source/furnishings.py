"""Human-scale fixtures in viewer coordinates (+Z faces the mihrab)."""
from math import cos, pi, sin


def label(s, name, row, center, width, height, right=(-1, 0)):
    x,y,z = center
    dx,dz = right[0]*width/2,right[1]*width/2
    points = [(x-dx,y+height/2,z-dz),(x+dx,y+height/2,z+dz),
              (x+dx,y-height/2,z+dz),(x-dx,y-height/2,z-dz)]
    uv = [(0,(row+.01)/9),(1,(row+.01)/9),(1,(row+.99)/9),(0,(row+.99)/9)]
    for ids in ((0,1,2),(0,2,3)):
        s.textured_tri(name,'signage.jpg',[points[i] for i in ids],[uv[i] for i in ids])


def shoe_rack(s, x, y, z):
    for dx in (-.75,.75):
        s.box('Rak kasut uprights',(x+dx,y+.36,z),(.055,.72,.42),'#906a49')
    for h in (.08,.35,.65):
        for dz in (-.155,-.052,.052,.155):
            s.box('Rak kasut timber slats',(x,y+h,z+dz),(1.5,.043,.075),'#ad845d')


def community(s):
    for x,y,z,prefix in [(3.6,1.53,-18.9,'Foyer tabung'),(7.1,1.15,22.7,'Terrace tabung')]:
        s.box(prefix+' plinth',(x,y+.05,z),(.68,.10,.62),'#4a514a')
        s.box(prefix+' cabinet',(x,y+.56,z),(.61,.95,.55),'#946b43')
        s.box(prefix+' brass lid',(x,y+1.06,z),(.66,.07,.60),'#bcaa77')
        s.box(prefix+' deposit slot',(x,y+1.099,z),(.31,.008,.05),'#272d2b')
        for dx in (-.27,.27):
            s.box(prefix+' brass corners',(x+dx,y+.56,z-.282),(.035,.92,.022),'#c4ad75')
        label(s,prefix+' inscription',0,(x,y+.72,z-.278),.49,.16)
    x,z=-4.35,-18.94
    for dx in (-.80,.80):
        s.box('RMUTP board posts',(x+dx,2.25,z),(.065,1.44,.085),'#596763')
    s.box('RMUTP board frame',(x,2.82,z),(2.25,.94,.11),'#343d39')
    label(s,'RMUTP board display',1,(x,2.82,z-.057),2.14,.78)
    x,z=4.8,-34.7
    s.box('Contributors plaque footing',(x,1.26,z),(2.52,.22,1.04),'#8b897b')
    s.box('Contributors plaque monument',(x,1.89,z),(2.26,1.08,.70),'#706e61')
    s.box('Contributors plaque coping',(x,2.47,z),(2.38,.11,.81),'#beb5a1')
    label(s,'Contributors plaque inscription',2,(x,2.0,z-.352),1.87,.54)
    shoe_rack(s,-8,1.15,-18.95)


def mezzanine(s):
    y=5.55
    s.box('Muslimat prayer carpet',(0,y,-2.8),(24.5,.016,3.4),'#829e94')
    for z in (-3.56,-2.01):
        s.box('Muslimat row borders',(0,y+.012,z),(24.47,.009,.10),'#456466')
        s.box('Muslimat row borders',(0,y+.014,z+.055),(24.47,.01,.014),'#ceb680')
    # Rise from the side aisle into the open bay in the gallery rail.
    for i in range(23):
        top=1.53+(i+1)*(5.54-1.53)/23
        z=5.8-(i+.5)*.3
        s.box('Muslimat stair treads',(9.25,top-.095,z),(1.50,.19,.30),'#d5c8ac')
        if i%3==1:
            for x in (8.51,9.99):
                s.beam('Muslimat stair rail posts',(x,top,z),(x,top+.88,z),.025,'#777d73')
    for x in (8.51,9.99):
        for lift,radius in ((.96,.043),(-.17,.090)):
            s.beam('Muslimat stair rails',(x,1.53+lift,5.8),(x,5.54+lift,-1.1),radius,'#8b7964')
    label(s,'Muslimat gallery sign',3,(9.2,4.89,-1.07),1.50,.35,(1,0))
    # Freestanding privacy screens flank the entrance landing.
    for z in (-2.96,-1.84):
        for end in (-.56,.56):
            s.box('Muslimat partition posts',(8.32,y+.78,z+end),(.07,1.56,.07),'#987a52')
        for h in (.12,1.47):
            s.box('Muslimat partition rails',(8.32,y+h,z),(.07,.06,1.15),'#987a52')
        for col in range(4):
            for row in range(4):
                u=z-.42+.28*col
                v=y+.30+.33*row
                for sign in (-1,1):
                    s.beam('Muslimat lattice',(8.32,v-.16,u),(8.32,v,u+sign*.14),.014,'#b09868',4)
                    s.beam('Muslimat lattice',(8.32,v,u+sign*.14),(8.32,v+.16,u),.014,'#b09868',4)
    shoe_rack(s,10.9,y,-3.92)
    for dx in (-1,1):
        s.box('Telekung rack feet',(-10+dx,y+.04,-3.54),(.11,.08,.67),'#8d8071')
        s.beam('Telekung rack',(-10+dx,y,-3.54),(-10+dx,y+1.53,-3.54),.035,'#9ba59c')
    s.beam('Telekung rack',(-11,y+1.53,-3.54),(-9,y+1.53,-3.54),.036,'#9ba59c')
    for i,col in enumerate(('#f3ebdd','#c5ccc0','#efdee1','#dae3df','#e7decb')):
        x=-10.72+i*.35
        s.lathe('Hanging telekung',x,-3.54,[(y+.39,.159),(y+.57,.162),(y+1.34,.10),(y+1.52,.028)],col,9)
    # Kneeling figures with pooled hems, shoulder-length veil and inset face.
    for x,z,cloth in ((-6,-2.7,'#ede8df'),(-4.45,-2.82,'#bbcac6'),(-2.8,-2.65,'#c4b3bc')):
        s.lathe('Seated Muslimat prayer garments',x,z,[(y+.018,.27),(y+.18,.29),(y+.30,.23),(y+.62,.17)],cloth,12)
        s.lathe('Seated Muslimat veils',x,z+.02,[(y+.37,.242),(y+.62,.21),(y+.79,.14),(y+.88,.075),(y+.89,.024)],cloth,12)
        s.lathe('Seated Muslimat faces',x,z+.12,[(y+.65,.035),(y+.71,.076),(y+.78,.072),(y+.8,.04)],'#a8775a',10)


def service_rooms(s):
    # Shallow private rooms occupy the space between the marble screen and rear facade.
    for x,role,sign,row in ((7.45,'Imam',1,6),(-7.45,'Khatib',-1,7)):
        z=15.80
        s.box('Bilik '+role+' ceiling',(x,4.62,z),(5.72,.15,1.60),'#eee6d9')
        s.box('Bilik '+role+' partition wall',(x-sign*2.86,3.05,z),(.11,3.04,1.60),'#e4d9ca')
        door_x=x+sign*2.86
        s.box('Private door header',(door_x,4.09,z),(.14,.96,1.60),'#ded3c0')
        for dz in (-.71,.71):
            s.box('Private door jambs',(door_x,2.58,z+dz),(.16,2.10,.15),'#805d40')
        # Door is open inward, leaving the side passage unobstructed.
        s.box('Private teak doors',(door_x-sign*.54,2.55,z+.62),(1.09,2.04,.08),'#966e48')
        s.box('Bilik '+role+' desk',(x,2.28,z+.28),(1.22,.08,.54),'#a5825b')
        for dx in (-.50,.50):
            s.box('Desk legs',(x+dx,1.92,z+.28),(.07,.78,.42),'#795a41')
        label(s,'Bilik '+role+' door plate',row,(door_x+sign*.084,3.87,z),1.17,.29,(0,-sign))
    for i in range(10):
        top=1.53+(i+1)*.2295
        z=13+i*.28
        # Carved eight-petal rosette in each timber riser, below the nosing.
        face=z-.142
        points=[(-4.08,top,face),(-3.44,top,face),(-3.44,top-.215,face),(-4.08,top-.215,face)]
        uv=[(0,0),(1,0),(1,1),(0,1)]
        for ids in ((0,1,2),(0,2,3)):
            s.textured_tri('Minbar teak risers','teak.jpg',[points[k] for k in ids],[uv[k] for k in ids])
        for k in range(32):
            a,b=k*pi/16,(k+1)*pi/16
            def petal(t,r):
                w=r*(.66+.34*cos(8*t))
                return (-3.76+w*cos(t),top-.106+w*sin(t),face-.002)
            s.quad('Carved teak rosettes',petal(a,.085),petal(b,.085),petal(b,.063),petal(a,.063),'#6e492e')
        s.box('Minbar teak tread',(-3.76,top+.012,z),(.66,.024,.282),'#9a6941')
        for sign in (-1,1):
            s.beam('Carved minbar balusters',(-3.76+sign*.32,top,z),(-3.76+sign*.32,top+.60,z),.035,'#795438',8)
            s.lathe('Turned teak beading',-3.76+sign*.32,z,[(top+.12,.04),(top+.21,.063),(top+.31,.035),(top+.44,.052)],'#a6774b',8)
    for sign in (-1,1):
        s.beam('Minbar teak handrail',(-3.76+sign*.32,2.37,13),(-3.76+sign*.32,4.45,15.52),.05,'#745034')
    s.lathe('Minbar microphone base',-5.08,14.60,[(3.83,.19),(3.88,.16),(3.91,.04)],'#414747',12)
    s.beam('Minbar microphone stand',(-5.08,3.9,14.6),(-5.08,5.04,14.6),.019,'#666c65')
    s.beam('Minbar microphone boom',(-5.08,5.04,14.6),(-5.36,5.13,14.74),.015,'#666c65')
    s.beam('Minbar microphone',(-5.36,5.13,14.74),(-5.46,5.16,14.79),.034,'#363c37')


def build(s):
    community(s)
    mezzanine(s)
    service_rooms(s)
    for z,row in ((-19.3,4),(-44.3,5)):
        label(s,'Wudu wing signs',row,(-30.14,3.99,z),1.72,.40,(0,-1))
        shoe_rack(s,-29.25,1.15,z+2.05)
    for x in (-12.54,12.54):
        label(s,'Emergency exit signs',8,(x,4.59,6.96),1.05,.26,(0,1 if x<0 else -1))
